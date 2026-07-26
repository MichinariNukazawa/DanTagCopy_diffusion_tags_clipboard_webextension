'use strict';

var assert = require("power-assert");

const PrompterTagSorter = require('../src/prompter_tag_sorter');

// 固定のフィクスチャ。key の挿入順をあえてプリセット順とは違う並びに
// しているが、これは Math.random() のような非決定的なシャッフルではなく、
// 「オブジェクトのキー順に結果が依存していないこと」を確認するための
// 固定データ。実行するたびに同じ入力・同じ結果になる。
const sampleTree = {
	clothing: [
		{ name: 'neckwear', tags: ['black neck ribbon'] },
		{ name: 'upperbody_detail', tags: ['collared shirt', 'hatching (texture)'] },
	],
	basic: [
		{ name: 'count', tags: ['1girl', 'solo'] },
	],
	theme: [
		{ name: 'role', tags: ['female butler'] },
	],
	background: [
		{ name: 'place', tags: ['indoor'] },
	],
};

// ---- _escapeTag ----

it("_escapeTag: isEscapeBrackets=false leaves the tag unchanged", function() {
	assert.equal(
		PrompterTagSorter._escapeTag('hatching (texture)', false),
		'hatching (texture)'
	);
});

it("_escapeTag: isEscapeBrackets=true escapes both () and []", function() {
	assert.equal(
		PrompterTagSorter._escapeTag('hatching (texture)', true),
		'hatching \\(texture\\)'
	);
	assert.equal(
		PrompterTagSorter._escapeTag('[cure] tag', true),
		'\\[cure\\] tag'
	);
});

// ---- _convertSeparator ----

it("_convertSeparator: diffusion keeps spaces as-is", function() {
	assert.equal(
		PrompterTagSorter._convertSeparator('female butler', 'diffusion'),
		'female butler'
	);
});

it("_convertSeparator: novelai converts spaces to underscores", function() {
	assert.equal(
		PrompterTagSorter._convertSeparator('female butler', 'novelai'),
		'female_butler'
	);
});

// ---- _flattenTree ----

it("_flattenTree: flattens regardless of group/subgroup structure", function() {
	// 同じタグ集合を、あえて別のグループ/サブグループ構造で表現した
	// 2つの固定フィクスチャ。構造に依存せず同じ結果になることを確認する。
	const treeA = {
		basic: [{ name: 'x', tags: ['b', 'a'] }],
		theme: [{ name: 'y', tags: ['c'] }],
	};
	const treeB = {
		theme: [{ name: 'y', tags: ['c'] }],
		basic: [
			{ name: 'z', tags: ['a'] },
			{ name: 'w', tags: ['b'] },
		],
	};

	const flatA = PrompterTagSorter._flattenTree(treeA).slice().sort();
	const flatB = PrompterTagSorter._flattenTree(treeB).slice().sort();

	assert.deepEqual(flatA, ['a', 'b', 'c']);
	assert.deepEqual(flatB, ['a', 'b', 'c']);
});

// ---- _orderGroups ----

it("_orderGroups: character_sort follows the preset order and skips missing groups", function() {
	const ordered = PrompterTagSorter._orderGroups('character_sort', sampleTree);
	assert.deepEqual(ordered.map((g) => g.group), ['basic', 'theme', 'clothing', 'background']);
});

it("_orderGroups: scene_sort follows its own preset order", function() {
	const ordered = PrompterTagSorter._orderGroups('scene_sort', sampleTree);
	assert.deepEqual(ordered.map((g) => g.group), ['background', 'clothing', 'theme', 'basic']);
});

// ---- sorting() end-to-end ----

it("sorting: character_sort assembles groups with blank lines and lines with newlines", function() {
	const result = PrompterTagSorter.sorting('character_sort', false, 'diffusion', sampleTree);

	const expected = [
		'1girl, solo,',
		'',
		'female butler,',
		'',
		'black neck ribbon,',
		'collared shirt, hatching (texture),',
		'',
		'indoor',
	].join('\n');

	assert.equal(result, expected);
});

it("sorting: scene_sort reorders groups but keeps the same line-assembly rules", function() {
	const result = PrompterTagSorter.sorting('scene_sort', false, 'diffusion', sampleTree);

	const expected = [
		'indoor,',
		'',
		'black neck ribbon,',
		'collared shirt, hatching (texture),',
		'',
		'female butler,',
		'',
		'1girl, solo',
	].join('\n');

	assert.equal(result, expected);
});

it("sorting: isEscapeBrackets + targetKind are applied per-tag before assembly", function() {
	const result = PrompterTagSorter.sorting('character_sort', true, 'novelai', sampleTree);

	// "hatching (texture)" -> escape -> "hatching \(texture\)" -> underscore化 -> "hatching_\(texture\)"
	assert.equal(result.indexOf('hatching_\\(texture\\)') !== -1, true);
	// "female butler" -> "female_butler"
	assert.equal(result.indexOf('female_butler') !== -1, true);
});

it("sorting: no_sort flattens everything into one alphabetically-sorted, comma-joined line", function() {
	// sampleTree とは別構造・別キー順の固定フィクスチャ(タグ集合は同じ)で、
	// 構造に依存しないことも合わせて確認する
	const restructuredTree = {
		background: [{ name: 'place', tags: ['indoor'] }],
		clothing: [
			{ name: 'upperbody_detail', tags: ['hatching (texture)'] },
			{ name: 'neckwear', tags: ['black neck ribbon', 'collared shirt'] },
		],
		basic: [{ name: 'count', tags: ['solo', '1girl'] }],
		theme: [{ name: 'role', tags: ['female butler'] }],
	};

	const result = PrompterTagSorter.sorting('no_sort', false, 'diffusion', restructuredTree);

	const expected = [
		'1girl', 'black neck ribbon', 'collared shirt', 'female butler',
		'hatching (texture)', 'indoor', 'solo',
	].join(', ');

	assert.equal(result, expected);
});

it("sorting: an unknown sortKind throws", function() {
	assert.throws(function() {
		PrompterTagSorter.sorting('unknown_sort', false, 'diffusion', sampleTree);
	});
});
