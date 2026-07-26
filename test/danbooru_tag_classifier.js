'use strict';

var assert = require("power-assert");

const DanbooruTagClassifier = require('../src/danbooru_tag_classifier');

// 添付メモのサンプルプロンプトを、空行区切り(=グループ境界)のまま
// フラット化した正解データ。
// 複合タグ "(european architecture, gothic architecture:0.3)" は
// 本メソッドの入力仕様(重み付き・複合タグは非対応)のスコープ外なので、
// 個別タグ "european architecture" / "gothic architecture" に分解した
// 上でフィクスチャに採用している(重みの ":0.3" は落とす)。
const expectedGroups = {
	basic: ['1girl', 'solo'],
	theme: ['female butler', 'alternate costume'],
	view: ['full body', 'pov', 'focusing face'],
	face: [
		'gently smile', 'love expression',
		'looking at viewer', 'looking up',
		'close mouth', 'skin fang', 'detailed eyes',
	],
	pose: ['hand on own chest', 'arm behind back', 'arched back'],
	clothing: [
		'pant suit', 'coattails',
		'black neck ribbon',
		'open jacket', 'framed breasts',
		'impossible shirt', 'collared shirt', 'center frills', 'vertical line', 'taut shirt',
		'white gloves',
		'long pants',
	],
	background: ['indoor', 'european architecture', 'gothic architecture'],
	other: ['simple background'],
};

// フィッシャー-イェーツで配列をシャッフルする。
// 「入力の並び順は不問」という入力仕様を実際に検証するために使う。
function shuffle(array) {
	const a = array.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = a[i];
		a[i] = a[j];
		a[j] = tmp;
	}
	return a;
}

// SortResult のあるグループを、サブグループを畳んでフラットなタグ配列にする。
// 該当グループが省略されている(0件)場合は空配列を返す。
function flattenGroup(result, group) {
	if (!result[group]) return [];
	return result[group].reduce((acc, subgroup) => acc.concat(subgroup.tags), []);
}

it("sample prompt: each tag is assigned to the correct group (order-independent)", function () {
	const allTags = Object.keys(expectedGroups)
		.reduce((acc, group) => acc.concat(expectedGroups[group]), []);
	const input = shuffle(allTags);

	const result = DanbooruTagClassifier.classifyTags(input);

	Object.keys(expectedGroups).forEach((group) => {
		const actual = flattenGroup(result, group).slice().sort();
		const expected = expectedGroups[group].slice().sort();
		assert.deepEqual(actual, expected);
	});
});

it("output preserves every input tag exactly once (no loss, no duplication)", function () {
	const allTags = Object.keys(expectedGroups)
		.reduce((acc, group) => acc.concat(expectedGroups[group]), []);
	const input = shuffle(allTags);

	const result = DanbooruTagClassifier.classifyTags(input);

	const flattened = Object.keys(result)
		.reduce((acc, group) => acc.concat(flattenGroup(result, group)), []);

	assert.deepEqual(flattened.slice().sort(), input.slice().sort());
});

it("empty groups are omitted from the result (no empty-array keys)", function () {
	// basicとthemeに該当するタグを含まない入力
	const input = ['indoor', 'simple background'];

	const result = DanbooruTagClassifier.classifyTags(input);

	assert.equal(false, 'basic' in result);
	assert.equal(false, 'theme' in result);
	assert.equal(true, 'background' in result);
	assert.equal(true, 'other' in result);
});
