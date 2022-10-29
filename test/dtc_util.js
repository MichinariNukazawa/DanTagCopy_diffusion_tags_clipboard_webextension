'use strict';
var assert = require("power-assert"); // assertモジュールのinclude

const DtcUtil = require('../event');

/**
共通化の方法は後々考えるとして、現在のテストは動作させる前に event.js の直接書き換えが必要。
*/

it ("convert", function() {
	assert('a'	=== DtcUtil.fun())
	assert(2 === DtcUtil.sortingTags('character_sort', ['tail','girl'])[0].length)
	// earが含まれるのでバグがあるとbodyに入り込む
	assert(2 === DtcUtil.sortingTags('character_sort', ['black footwear', 'torn legwear'])[1].length)
	assert(2 === DtcUtil.sortingTags('character_sort', ['vest', 'black vest'])[1].length)
	assert(2 === DtcUtil.sortingTags('character_sort', ['black', 'red', 'black background', 'background'])[3].length)
});

