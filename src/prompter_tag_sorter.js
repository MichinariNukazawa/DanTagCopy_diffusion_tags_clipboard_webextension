'use strict';

// ============================================================
// PrompterTagSorter
//
// DanbooruTagClassifier.classifyTags() が返す SortResult(グループ木)を
// 受け取り、並び替え・エスケープ・単語区切り変換を行った上で、
// 最終的な1つの文字列に組み立てるクラス。
//
//   PrompterTagSorter.sorting(sortKind, isEscapeBrackets, targetKind, classifiedDanbooruTagTree): string
//
// - sortKind: 'character_sort' | 'scene_sort' | 'no_sort'
//     character_sort / scene_sort:
//       グループ出現順のプリセット(GROUP_ORDER_PRESETS、仮置き。厳密な並びは
//       後で手作業調整する前提)を適用し、
//       グループ間は空行、グループ内のサブグループ(行)間は改行、
//       行内はカンマ区切りで組み立てる。
//       tree に存在しないグループ(0件で省略されたグループ)は自然にスキップする。
//     no_sort:
//       グループ/サブグループ構造を全て解体し、全タグをフラットにして
//       アルファベット順に並べ、カンマ区切りの1行にする。
//       (空行・改行の構造は使わない)
// - isEscapeBrackets: タグ文字列中の丸カッコ・角カッコをエスケープするか
// - targetKind: 'diffusion'(単語区切り=半角スペースのまま) | 'novelai'(区切り=アンダースコアに変換)
// - classifiedDanbooruTagTree: SortResult ({ [group]: {name, tags}[] })
//
// escapeTag / convertSeparator はタグ1つ1つに対する変換なので、
// sortKindによらず(no_sortでも)常に適用する。
// ============================================================

class PrompterTagSorter {

  static get GROUP_ORDER_PRESETS() {
    return {
      // 仮置き。厳密な並びは後で手作業調整する前提
      character_sort: ['basic', 'theme', 'face', 'pose', 'clothing', 'view', 'background', 'other'],
      scene_sort: ['background', 'view', 'other', 'clothing', 'pose', 'face', 'theme', 'basic'],
    };
  }

  static sorting(sortKind, isEscapeBrackets, targetKind, classifiedDanbooruTagTree) {
    if (sortKind === 'no_sort') {
      return this._flattenTree(classifiedDanbooruTagTree)
        .map((tag) => this._convertSeparator(this._escapeTag(tag, isEscapeBrackets), targetKind))
        .sort()
        .join(', ');
    }

    const ordered = this._orderGroups(sortKind, classifiedDanbooruTagTree);
    const transformed = ordered.map((g) => ({
      group: g.group,
      lines: g.lines.map((line) =>
        line.map((tag) => this._convertSeparator(this._escapeTag(tag, isEscapeBrackets), targetKind))
      ),
    }));
    return this._assemble(transformed);
  }

  // tree(グループ/サブグループ構造)を、タグの1次元配列に戻す。
  // グループ/サブグループの並び順には一切依存しない。
  static _flattenTree(tree) {
    return Object.keys(tree).reduce((acc, group) => {
      tree[group].forEach((subgroup) => acc.push(...subgroup.tags));
      return acc;
    }, []);
  }

  // sortKind(character_sort/scene_sort)のプリセットに従い、
  // treeに実在するグループだけを出現順に並べる。
  // サブグループの並びはtree由来のまま変更しない。
  static _orderGroups(sortKind, tree) {
    const preset = this.GROUP_ORDER_PRESETS[sortKind];
    if (!preset) {
      throw new Error('unknown sortKind: ' + sortKind);
    }
    const existingGroups = Object.keys(tree);
    return preset
      .filter((group) => existingGroups.includes(group))
      .map((group) => ({
        group,
        lines: tree[group].map((subgroup) => subgroup.tags),
      }));
  }

  // タグ名自体に含まれる丸カッコ・角カッコをエスケープする
  // (例: "hatching (texture)" -> "hatching \(texture\)")
  static _escapeTag(tag, isEscapeBrackets) {
    if (!isEscapeBrackets) return tag;
    return tag.replace(/[()[\]]/g, (c) => '\\' + c);
  }

  // 単語区切りの変換 (diffusion: 半角スペースのまま / novelai: アンダースコアに変換)
  static _convertSeparator(tag, targetKind) {
    if (targetKind === 'novelai') {
      return tag.replace(/ /g, '_');
    }
    return tag;
  }

  // グループ間は空行、グループ内のサブグループ(行)間は改行、
  // 行内はカンマ区切りで最終的な文字列に組み立てる。
  static _assemble(orderedGroups) {
    return orderedGroups
      .map((g) => g.lines.map((line) => line.join(', ')).join(',\n'))
      .join(',\n\n');
  }
}

module.exports = PrompterTagSorter;
