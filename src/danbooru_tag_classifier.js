'use strict';

// ============================================================
//
// 添付メモの「プロンプト構成ルール」に基づいて、Danbooruタグを
//   basic(基本情報) / theme(テーマ) / view(構図・視点) / face(顔・表情/頭部)
//   / pose(ポーズ・動作/身体) / clothing(服装) / background(背景・環境) / other(その他)
// の8つの「グループ」に分類するモジュール。
// 各グループ内はさらに「サブグループ」(意味のまとまり単位、出力時の1行に相当)
// に分けて返す。
//
// ---- 入力仕様 ----
// - 引数は string[] (タグ文字列の配列)
// - 配列内の順序は不問
// - 単語区切りは半角スペース (アンダースコアではない)
// - 重み付き構文("tag:1.3")・カッコによる複合タグ("(a, b:0.3)")は非対応(スコープ外)
// - 本メソッドは入力タグ文字列に対して分割・結合・変形を一切行わない
//   (グループ/サブグループへの再配置のみを行う)
//
// ---- 出力仕様 ----
// type GroupName = 'basic'|'theme'|'view'|'face'|'pose'|'clothing'|'background'|'other'
// type SortResult = {
//   [group in GroupName]?: { name: string, tags: string[] }[]
// }
// - 該当タグが0件のグループはキーごと省略する
// - グループの出現順は規定しない(呼び出し側は Object.keys() の順序に依存しないこと)
// - サブグループは配列(順序に意味がある。仮実装でテスト対象外)
// - 不変条件: 全グループのtagsをフラットにした集合は入力タグ集合と完全一致
//             (要素の保存・排他性: 1タグは1箇所にのみ属する)
// ============================================================

class DanbooruTagClassifier {

  static get STAGES() {
    return [
      // 1. 基本情報: 人数指定など
      {
        group: 'basic', lines: [
          {
            name: 'count', keywords: [
              '1girl', '2girls', '3girls', '4girls', '5girls',
              '1boy', '2boys', '3boys',
              'multiple girls', 'multiple boys', 'solo', 'duo', 'group',
            ]
          },
        ]
      },

      // 2. テーマ: 役割や全体の衣装名
      {
        group: 'theme', lines: [
          {
            name: 'role', keywords: [
              'maid', 'butler', 'nurse', 'waitress', 'idol', 'miko', 'shrine maiden',
              'samurai', 'ninja', 'knight', 'witch', 'magical girl', 'soldier',
              'police', 'teacher', 'princess', 'queen', 'king', 'office lady',
            ]
          },
          {
            name: 'costume_meta', keywords: [
              'alternate costume', 'cosplay',
            ]
          },
        ]
      },

      // 3. 構図・視点: 描画範囲、カメラ位置、フォーカス
      {
        group: 'view', lines: [
          {
            name: 'shot_range', keywords: [
              'full body', 'upper body', 'lower body', 'cowboy shot',
              'close-up', 'portrait',
            ]
          },
          {
            name: 'camera', keywords: [
              'pov', 'from side', 'from above', 'from below', 'from behind', 'dutch angle',
            ]
          },
          { name: 'focus', pattern: /focus/ },
        ]
      },

      // 4. 顔・表情(頭部): 雰囲気、視線、顔周り
      {
        group: 'face', lines: [
          {
            name: 'hair', keywords: [
              'hair', 'bald', 'sidelock', 'ponytail', 'twintail', 'afro', 'mohawk',
              'braid', 'bun', 'bang', 'ahoge', 'intake', 'comb over',
            ]
          },
          {
            name: 'expression', keywords: [
              'smile', 'grin', 'blush', 'crying', 'tears', 'angry', 'wink',
              'expressionless', 'love expression', 'gently',
            ]
          },
          {
            name: 'gaze', keywords: [
              'looking at viewer', 'looking up', 'looking away', 'looking back', 'looking down',
            ]
          },
          {
            name: 'mouth_eyes', keywords: [
              'eye', 'sclera', 'pupil', 'mouth', 'lip', 'tongue', 'fang', 'teeth', 'tusk',
              'skin fang', 'detailed eyes', 'close mouth', 'open mouth',
            ]
          },
        ]
      },

      // 5. ポーズ・動作(身体): 手や胴体の動き
      {
        group: 'pose', lines: [
          {
            name: 'hand_arm', keywords: [
              'hand on', 'arm', 'holding', 'crossed arms', 'hands clasped', 'hand behind',
            ]
          },
          {
            name: 'body_action', keywords: [
              'arched back', 'standing', 'sitting', 'kneeling', 'lying', 'squatting',
              'running', 'jumping', 'leaning', 'stretching', 'spread legs', 'bent over',
            ]
          },
        ]
      },

      // 6. 服装(装飾): 上半身から下半身へ向かってパーツごとに改行
      {
        group: 'clothing', lines: [
          {
            name: 'headwear', keywords: [
              'hat', 'cap', 'crown', 'tiara', 'veil', 'headband', 'helmet', 'beret',
            ]
          },
          {
            name: 'neckwear', keywords: [
              'neck ribbon', 'necktie', 'ascot', 'choker', 'necklace', 'scarf', 'pendant',
            ]
          },
          {
            name: 'outerwear', keywords: [
              'suit', 'coattails', 'jacket', 'coat', 'cloak', 'cape', 'vest', 'uniform',
            ]
          },
          {
            name: 'upperbody_detail', keywords: [
              'shirt', 'collared shirt', 'frill', 'blouse', 'camisole', 'corset',
              'breasts', 'chest', 'vertical line', 'center frills',
            ]
          },
          {
            name: 'handwear', keywords: [
              'glove', 'gauntlet',
            ]
          },
          {
            name: 'legwear', keywords: [
              'pants', 'skirt', 'shorts', 'thighhighs', 'pantyhose', 'stocking', 'leggings',
            ]
          },
          {
            name: 'footwear', keywords: [
              'boots', 'shoes', 'footwear', 'sandals', 'heels',
            ]
          },
          {
            name: 'accessory', keywords: [
              'ribbon', 'lace', 'earrings', 'bracelet', 'glasses', 'sunglasses', 'mask',
            ]
          },
        ]
      },

      // 7. 背景・環境: 場所、建築様式など
      {
        group: 'background', lines: [
          {
            name: 'place', keywords: [
              'indoor', 'outdoor', 'forest', 'city', 'room', 'school', 'beach', 'sky',
              'architecture', 'building',
            ]
          },
        ]
      },

      // 8. その他: 上記以外(未分類タグの受け皿。必ず最後に置く。全タグ保存の不変条件を担保する)
      {
        group: 'other', lines: [
          { name: 'misc', pattern: /.*/ },
        ]
      },
    ];
  }

  static _escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // keyword/phraseが、tag内に「単語境界つきで」出現するかを判定する。
  // 単純な部分一致(includes)だと 'king' が 'looking' に誤マッチするなど
  // 偽陽性を生みやすいため、\b(単語境界)を使う。
  static _wordBoundaryMatch(tag, phrase) {
    const pattern = new RegExp('\\b' + this._escapeRegExp(phrase) + '\\b');
    return pattern.test(tag);
  }

  static _isMatch(tag, rule) {
    const t = tag.trim().toLowerCase();
    if (rule.keywords) {
      for (const kw of rule.keywords) {
        const k = kw.toLowerCase();
        if (this._wordBoundaryMatch(t, k)) return true;
        // 単語1つのキーワードのみ、雑な複数形(s/es)にも一致させる
        // (フレーズ(スペースを含む)キーワードには適用しない)
        if (!k.includes(' ')) {
          if (this._wordBoundaryMatch(t, k + 's') || this._wordBoundaryMatch(t, k + 'es')) {
            return true;
          }
        }
      }
    }
    if (rule.pattern && rule.pattern.test(t)) {
      return true;
    }
    return false;
  }

  /**
   * @param {string[]} tags
   * @returns {Object} SortResult (グループ名をキーとする連想配列。0件のグループは省略)
   */
  static classifyTags(tags) {
    let remaining = [...tags];
    const result = {};

    for (const stage of this.STAGES) {
      const subgroups = [];
      for (const line of stage.lines) {
        const matched = [];
        const rest = [];
        for (const tag of remaining) {
          if (this._isMatch(tag, line)) {
            matched.push(tag);
          } else {
            rest.push(tag);
          }
        }
        if (matched.length > 0) {
          subgroups.push({ name: line.name, tags: matched });
        }
        remaining = rest;
      }
      if (subgroups.length > 0) {
        result[stage.group] = subgroups;
      }
    }

    return result;
  }
}

module.exports = DanbooruTagClassifier;
