'use strict';

// ============================================================
//
// 添付メモの「プロンプト構成ルール」に基づいて、Danbooruタグを
//   basic(基本情報) / theme(画像全体のテーマ。役割・衣装・行為なども含む)
//   / view(構図・視点) / character(人物・キャラクターの見た目: 顔・髪・体型)
//   / face(表情・感情) / pose(ポーズ・動作/身体) / clothing(服装)
//   / background(背景・環境) / other(その他)
// の9つの「グループ」に分類するモジュール。
// 各グループ内はさらに「サブグループ」(意味のまとまり単位、出力時の1行に相当)
// に分けて返す。
//
// キーワード・パターンの一部は以下を参考にしている:
//   https://danbooru.donmai.us/wiki_pages/tag_groups
//   https://github.com/MichinariNukazawa/DanTagCopy_diffusion_tags_clipboard_webextension
//     の bodyWords / crothWords (単語一覧の参考。並び順・カテゴリ分けは
//     本メモのグループ構造を優先している)
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
// type GroupName = 'basic'|'theme'|'view'|'character'|'face'|'pose'|'clothing'|'background'|'other'
// type SortResult = {
//   [group in GroupName]?: { name: string, tags: string[] }[]
// }
// - 該当タグが0件のグループはキーごと省略する
// - グループの出現順は規定しない(呼び出し側は Object.keys() の順序に依存しないこと)
// - サブグループは配列(順序に意味がある。仮実装でテスト対象外)
// - 不変条件: 全グループのtagsをフラットにした集合は入力タグ集合と完全一致
//             (要素の保存・排他性: 1タグは1箇所にのみ属する)
//
// ---- ルールの記法 ----
// 各サブグループ(line)は以下を任意の組み合わせで持てる:
//   keywords: string[]  -- 単語境界つきの部分一致(単数/複数の簡易対応あり)
//   words:    string[]  -- タグ全文との完全一致(部分一致しない)
//   patterns: RegExp[]  -- 正規表現(必ず /.../ のRegExpリテラルにすること。
//                          文字列を渡すと .test() が無く実行時エラーになる)
// ============================================================

class DanbooruTagClassifier {
  static get STAGES() {
    return [
      // 基本情報: 人数指定など
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

      // テーマ: 画像全体の主題(役割・衣装名に限らず、行為・シチュエーションも含む)
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
              'alternate costume', 'cosplay', 'age up', 'age down', 'obese',
            ]
          },
          {
            name: 'work_act', keywords: [
              'sports', 'swimming', 'bathing', 'cooking', 'cleaning', 'fishing',
              'gardening', 'shopping', 'driving', 'traveling', 'camping', 'skiing',
              'dancing', 'singing', 'playing', 'reading', 'writing', 'drawing', 'painting',
              'hug', 'kiss',
              'sex', 'penetration', 'ejaculation', 'invitation',
            ],
            'words': [
              'yukadon', 'kabedon', 'mizudon',
              'come hither', 'under covers',
              'masturbation',
              'orgy', 'anal', 'oral', 'vaginal',
              'handjob', 'blowjob', 'facejob', 'facial',
            ]
          },
        ]
      },

      // 構図・視点: 描画範囲、カメラ位置、フォーカス
      {
        group: 'view', lines: [
          {
            name: 'shot_range', keywords: [
              'full body', 'upper body', 'lower body', 'cowboy shot',
              'close-up', 'portrait', 'profile', 'cropped', 'out of frame',
              // 'frame': framed_breasts などがあるので避けた
            ]
          },
          // 被写体・構図
          { name: 'subject', word: ['trefoil'] },
          {
            name: 'camera', keywords: [
              'pov', 'from side', 'from above', 'from below', 'from behind', 'dutch angle',
            ]
          },
          { name: 'focus', patterns: [/focus/] },
          { name: 'detailed', patterns: [/detail/] },
        ]
      },

      // 人物・キャラクターの見た目(顔・髪・体型)
      {
        group: 'character', lines: [
          {
            name: 'kind', patterns: [
              / girl$/, // ex.'cat girl', 'daemon girl',
            ]
          },
          {
            name: 'body', keywords: [
              'usuhoso', 'skinny', 'loli', 'shota', 'lolibaba', 'mesugaki', 'oppai loli', 'petite',
              'shortstacks', 'pear-shaped figure',
              'curvy',
              'thick', 'chubby', 'fat', 'obese', 'belly',
              'child', 'old', 'mature', 'male', 'female',
              'futanari', 'futa on female',
            ]
          },
          {
            name: 'body_features', keywords: [
              'wide hips', 'hip dips', 'narrow waist', 'plump',
              'pectoral', 'slim legs', 'wide hips',
              'flat ass', 'huge ass', 'muscular',
            ],
          },
          {
            name: 'hair', keywords: [
              // 髪型
              // https://danbooru.donmai.us/wiki_pages/tag_group%3Ahair_styles
              'hair', 'bald', 'sidelock', 'cut', 'chonmage', 'okappa', 'cornrows',
              'dreadlocks', 'mullet', 'braid', 'bun', 'side up', 'nihongami', 'mizura',
              'ponytail', 'twintail', 'afro', 'bang', 'intake', 'ahoge', 'comb over',
              'mohawk', 'blunt ends',
              // 髪色個別
              'multicolored hair', 'colored inner hair', 'gradient hair', 'rainbow hair',
              'split-color hair', 'streaked hair', 'two-tone hair', 'colored tips',
            ]
          },
          {
            name: 'facial_hair', keywords: [
              'beard', 'goatee', 'mustache', 'stubble',
            ]
          },
          {
            name: 'ear', patterns: [
              /ears?$/, // ex. 'cat ears', 'elf ears', 'dog ear'
            ]
          },
          {
            name: 'eye', keywords: [
              'eye', 'sclera', 'pupil', 'heterochromia',
            ]
          },
          {
            name: 'mouth', patterns: [
              /fangs?$/, // ex. 'fang', 'skin fangs', 'vampire fangs'
            ]
          },
          {
            name: 'breasts_size', keywords: [
              'flat chest', 'small breasts', 'medium breasts', 'large breasts',
              'huge breasts', 'gigantic breasts',
            ]
          },
          {
            name: 'body_parts', keywords: [
              'halo', 'wing', 'horn', 'tail', 'tentacle', 'scales', 'claws', 'spikes', 'fins',
              'nail',
            ]
          },
          {
            name: 'skin', keywords: [
              'skin', 'tan', 'tanlines', 'sun tattoo',
            ]
          },
        ]
      },

      // 表情・感情: 雰囲気、視線、口元の動き
      {
        group: 'face', lines: [
          {
            name: 'expression', keywords: [
              'smile', 'grin', 'blush', 'crying', 'tears', 'angry', 'wink',
              'expressionless', 'expression', 'gently',
            ]
          },
          // https://danbooru.donmai.us/wiki_pages/tag_group:face_tags
          {
            name: 'emotion', keywords: [
              'angry', 'anger vein', 'annoyed', 'clenched teeth', 'glaring', 'scowl',
              'annoyed', 'blush', 'blush stickers', 'embarrassed', 'full-face blush', 'nose blush',
              'bored', 'closed eyes', 'confident', 'confused', 'crazy', 'despair', 'determined', 'disappointed',
              'disdain', 'disgust', 'distress', 'drunk', 'ecstasy', 'envy', 'excited', 'exhausted', 'expressionless',
              'facepalm', 'flustered', 'frustrated', 'furrowed brow', 'grimace', 'guilt', 'happy', 'kubrick stare', 'lonely',
              'nervous', 'nosebleed', 'one eye closed (winking)', 'round mouth', 'open mouth', 'parted lips', 'pain', 'pout',
              'puffy cheeks', 'raised eyebrow', 'raised eyebrows', 'raised inner eyebrows', 'rape face', 'rolling eyes', 'sad',
              'depressed', 'frown', 'gloom (expression)', 'tears', 'scared', 'panicking', 'worried', 'serious', 'shaded face', 'shy',
              'sigh', 'skeptical', 'sleepy', 'squinting', 'sulking', 'surprised', 'thinking', 'pensive', 'unamused', 'v-shaped eyebrows',
              'wince', 'struggling',
              'afterglow', 'ahegao', 'silly', 'ecstasy', 'aroused', 'fucked silly', 'naughty face',
              'ohhoai', 'ohogao', 'seductive smile', 'torogao', 'mind break',
              'doyagao', 'smirk', 'smug', 'troll face',
              '^^^', 'color drain', 'depressed', 'despair', 'gloom (expression)', 'horrified', 'screaming',
              'sobbing', 'traumatized', 'turn pale', 'wavy mouth',
            ]
          },
          {
            name: 'gaze', keywords: [
              'looking', 'staring', 'awe'
            ]
          },
          {
            name: 'emote', words: ['x mouth', '>:)', '>:(', ':>=', '\\(^o^)/', '<o>_<o>', '<|>_<|>',],
            patterns: [
              /^[:;Xx]\w+$/, // ex.':p'
              /^\w_\w$/, // ex. 'T_T','>_@'
            ]
          },
          {
            // 目そのものの見た目(character.face_parts)ではなく、口まわりの状態・動き
            name: 'mouth_eyes_act', keywords: [
              'completely unamused', 'empty eyes', 'wide-eyed',
              'mouth', 'lip', 'tongue', 'teeth', 'tusk',
              'close mouth', 'open mouth',
            ]
          },
          {
            name: 'face_parts_act', keywords: [
              'droll', 'saliva', 'sweat', 'snot', 'nosebleed', 'spit', 'vomit',
              'tear',
            ]
          },
          {
            name: 'emotion_exterior', keywords: [
              'squiggle', 'sweatdrop', 'anger vein', 'sparkle', 'tear drop',
              'spoken', 'spoken heart'
            ]
          }
        ]
      },

      // ポーズ・動作(身体): 手や胴体の動き
      {
        group: 'pose', lines: [
          {
            name: 'body_action', words: [
              'on back', 'on stomach', 'on side',
              'on one knees', 'all fours',
            ]
          },
          {
            name: 'body_action', keywords: [
              'arched back', 'standing', 'sitting', 'kneeling', 'lying', 'squatting',
              'running', 'jumping', 'leaning', 'stretching', 'spread legs', 'bent over',
              'relax', 'tense', 'twist', 'turn', 'bend', 'crouch',
              'reach', 'grab', 'hold', 'push', 'pull', 'lift', 'drop',
              // 装飾品に対する動作(手袋・眼鏡・袖・靴など)
              // https://github.com/MichinariNukazawa/DanTagCopy_diffusion_tags_clipboard_webextension 参考
              'adjusting', 'removing', 'putting on', 'biting', 'licking', 'kissing',
            ],
          },
          {
            name: 'hand_arm', keywords: [
              'hand on', 'hands on', 'arm', 'holding', 'crossed arms', 'hands clasped', 'hand behind',
              'fist', 'pointing', 'touching', 'grabbing', 'pushing', 'pulling',
              'beckoning', 'clapping', 'praying', 'saluting', 'waving',
            ],
            patterns: [/(arm|hand)s? up$/, /(arm|hand)s? down$/,]
          },
        ]
      },

      // 服装(装飾): 上半身から下半身へ向かってパーツごとに改行
      {
        group: 'clothing', lines: [
          {
            name: 'headwear', keywords: [
              'hat', 'cap', 'crown', 'tiara', 'veil', 'headband', 'helmet', 'beret', 'nun',
              'kanzashi', 'scrunchie', 'wig', 'circlet', 'diadem', 'mini crown', 'saishi',
              'fedora', 'gat', 'tricorne', 'deerstalker', 'kepi', 'bicorne', 'ajirogasa',
              'budenovka', 'papakha', 'ushanka', 'bashlik', 'toque blanche', 'beanie',
              'kippah', 'mian guan', 'mitre', 'mortarboard', 'sajkaca', 'songkok',
              'aviator cap', 'balaclava', 'bandana', 'bonnet', 'dalachi', 'habit',
              'head scarf', 'hijab', 'jester cap', 'keffiyeh', 'okosozukin', 'shower cap',
              'shufa guan', 'visor cap', 'chopsticks', 'comb',
              'hairband', 'hair bow', 'hair ornament', 'hairpin',
            ]
          },
          {
            name: 'neckwear', keywords: [
              'neck ribbon', 'bowtie', 'necktie', 'ascot', 'choker', 'necklace', 'scarf', 'pendant',
              'pet cone', 'feather boa', 'jabot', 'lanyard', 'neckerchief', 'lei', 'charm',
              'amulet', 'locket', 'magatama', 'pentacle', 'stole', 'collar',
              'detached collar', 'fur collar', 'high collar', 'open collar', 'popped collar',
              'sailor collar', 'wing collar',
            ]
          },
          {
            name: 'outerwear', keywords: [
              'suit', 'coattails', 'jacket', 'coat', 'cloak', 'cape', 'vest', 'uniform',
              'sailor', 'serafuku', 'fuku', 'school uniform', 'tactical clothes',
              'bulletproof vest', 'load bearing equipment', 'load bearing vest',
              'plate carrier', 'night vision device',
              'turtleneck', 'sleeveless turtleneck', 'v-neck', 'halterneck', 'halter',
            ]
          },
          {
            name: 'dress', keywords: [
              'dress', 'tied dress', 'crinoline', 'dirndl', 'evening gown', 'gown',
              'negligee', 'nightgown', 'sundress',
              'cheongsam', 'qipao', 'kimono', 'yukata', 'hakama', 'obi',
              'hanbok', 'ao dai', 'sari',
              'playboy bunny', 'bunny suit', 'bunnysuit',
              'leotard', 'unitard', 'bodysuit', 'catsuit', 'bikini', 'armor',
              'bodystocking', 'swimsuit',
              'sweater', 'pajamas', 'hoodie', 'cardigan', 'blazer', 'blouse', 'shirt', 't-shirt',
            ]
          },
          {
            name: 'upperbody_detail', keywords: [
              'shirt', 'collared shirt', 'frill', 'blouse', 'camisole', 'corset',
              'breasts', 'chest', 'vertical line', 'center frills', 'cloth', 'apron', 'petticoat',
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
              'legwear', 'garter', 'garter straps', 'thigh strap',
            ]
          },
          {
            name: 'footwear', keywords: [
              'boots', 'shoes', 'footwear', 'sandals', 'heels',
            ]
          },
          {
            name: 'underwear', keywords: [
              'lingerie', 'babydoll', 'bodystocking', 'bra', 'bustier', 'chemise',
              'fishnets', 'garter belt', 'panties', 'boyshort panties', 'strapless bottom',
              'teddy', 'thong', 'g-string', 'pearl thong', 'male underwear', 'boxers',
              'briefs', 'boxer briefs', 'bikini briefs', 'jockstrap', 'ball bra',
              'penis sheath', 'blindfold', 'bodysuit', 'gimp suit', 'bondage outfit',
              'latex', 'monoglove', 'crotchless', 'ass cutout',
              'backless panties', 'backless pants', 'breastless clothes', 'nippleless clothes',
              'bikini', 'cupless bra', 'revealing clothes', 'reverse outfit',
              'anal ball wear', 'maebari', 'pasties',
            ]
          },
          {
            name: 'accessory', keywords: [
              'ribbon', 'bow', 'lace', 'earrings', 'earclip', 'bracelet', 'glasses', 'sunglasses', 'mask',
              'monocle', 'goggles', 'scouter', 'bag', 'pouch', 'zipper', 'highleg',
              'bare shoulders', 'cuffs', 'sleeve', 'belt', 'o-ring',
            ]
          },
          {
            name: 'cloth_details',
            words: [
              // ボディーパーツ名のみのタグは、その箇所が露出/透過して見えている服装表現
              'collarbone', 'naval', 'nipple', 'nipples', 'breasts', 'underboob', 'stomach',
              'hips', 'ass', 'anus', 'underbutt', 'pussy', 'vagina',
            ],
            keywords: [
              // 露出のある衣装
              'midriff', 'crop top', 'tank top',
              'cropped shirt', 'cropped jacket',
              'halterneck', 'halter',
              'butt crack',
              'wedgie',
              'tight', 'see-through',              // 布が締まっている衣装, 透けている衣装
              'denim', 'leather', 'fabric',
              'layered',
            ],
            patterns: [
              /^covered /,      // 布が吸着してボディパーツの形が見える服 ex.'covered naval',
              /^impossible /,   // 肌に吸い付いている服
              /^taut /,         // 布が締まっている服
              /^naked /,
            ],
          },
          {
            name: 'nude_nudelike',
            keywords: [
              'nude', 'topless', 'bare'
            ]
          }
        ]
      },

      // 背景・環境: 場所、建築様式など
      {
        group: 'background', lines: [
          {
            name: 'place', keywords: [
              'indoor', 'outdoor', 'forest', 'city', 'room', 'school', 'beach', 'sky',
              'architecture', 'building', 'background', 'landscape', 'nature', 'street', 'garden', 'temple',
              'floor', 'table', 'wall', 'window', 'door', 'ceil',
              'room', 'corridor', 'hallway', 'staircase', 'balcony', 'porch', 'patio', 'roof', 'rooftop',
              'cave', 'tunnel', 'bridge', 'tower', 'castle', 'palace', 'shrine', 
              'dark', 'bright', 'sunny', 'cloud', 'rain', 'snow', 'fogg',
              'evening', 'night', 'dawn', 'dusk', 'sunset', 'sunrise',
              'atmosphere', 'lighting', 'shadow', 'reflection', 'refraction', 'lens flare',
              'lamp', 'candle', 'fireplace', 'chandelier', 'lantern', 'light',
            ]
          },
        ]
      },

      // その他: 上記以外(未分類タグの受け皿。必ず最後に置く。全タグ保存の不変条件を担保する)
      {
        group: 'other', lines: [
          { name: 'misc', patterns: [/.*/] },
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

    // words: タグ全文との完全一致(部分一致はしない)
    if (rule.words && rule.words.some((w) => t === w.toLowerCase())) {
      return true;
    }

    // keywords: 単語境界つきの部分一致(単語1つのみ、雑な複数形(s/es)にも対応)
    if (rule.keywords) {
      for (const kw of rule.keywords) {
        const k = kw.toLowerCase();
        if (this._wordBoundaryMatch(t, k)) return true;
        if (!k.includes(' ')) {
          if (this._wordBoundaryMatch(t, k + 's') || this._wordBoundaryMatch(t, k + 'es')) {
            return true;
          }
        }
      }
    }

    // patterns: 正規表現(RegExpリテラルであること。文字列は不可)
    if (rule.patterns) {
      for (const pattern of rule.patterns) {
        if (pattern.test(t)) {
          return true;
        }
      }
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
