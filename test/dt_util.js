'use strict';

var assert = require("power-assert"); // assertモジュールのinclude
//var assert = require("assert");

const DtUtil = require('../src/danbooru_tag_util');

const func = (a, b) => {
	return DtUtil.sortingTags(a, b);
}

it ("convert", function() {
	assert.equal(2, DtUtil.sortingTags('character_sort', ['tail','girl'])[0].length)
	// earが含まれるのでバグがあるとbodyに入り込む
	assert.equal(2, DtUtil.sortingTags('character_sort', ['black footwear', 'torn legwear'])[1].length)
	assert.equal(2, DtUtil.sortingTags('character_sort', ['vest', 'black vest'])[1].length)
	assert.equal(2, DtUtil.sortingTags('character_sort', ['black', 'red', 'black background', 'background'])[3].length)
	assert.equal(2, DtUtil.sortingTags('character_sort', ['tail','girl'])[0].length)
	//assert.equal(1, DtUtil.sortingTags('character_sort', ['waist apron'])[1].length) // TODO
	//assert.equal(1, DtUtil.sortingTags('character_sort', ['earpiece'])[2].length) // TODO
});

