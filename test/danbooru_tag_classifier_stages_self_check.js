'use strict';

var assert = require("power-assert");

const DanbooruTagClassifier = require('../src/danbooru_tag_classifier');

function classifiedGroupOf(tag) {
	const result = DanbooruTagClassifier.classifyTags([tag]);
	const groups = Object.keys(result);
	assert.equal(
		groups.length, 1,
		`tag "${tag}" was not classified into exactly one group (result: ${JSON.stringify(result)})`
	);
	return groups[0];
}

// STAGES内の全 keyword/word/sample を、所属先(stage.group, line.name)付きで
// フラットな配列にする。各種チェックの土台として使い回す。
function collectLiterals() {
	const literals = [];
	DanbooruTagClassifier.STAGES.forEach((stage) => {
		stage.lines.forEach((line) => {
			(line.keywords || []).forEach((value) => {
				literals.push({ value, kind: 'keywords', group: stage.group, line: line.name });
			});
			(line.words || []).forEach((value) => {
				literals.push({ value, kind: 'words', group: stage.group, line: line.name });
			});
			(line.samples || []).forEach((value) => {
				literals.push({ value, kind: 'samples', group: stage.group, line: line.name });
			});
		});
	});
	return literals;
}

// ---- チェック1: keyword/wordが、前段のgroupに横取り(シャドーイング)されていないか ----
// keywordやwordをそのまま1タグとして分類にかけ、定義したgroupと実際の分類結果が
// 一致するかを確認する。不一致は「その語は自分の行まで絶対に到達しない
// (=実質的なデッドコード)」ことを意味する。
// ※ patterns(正規表現)はこの方法では検証できないので対象外(→チェック3で扱う)。
it("[shadowing] every keyword/word resolves to its own declared group", function () {
	const mismatches = [];

	collectLiterals()
		.filter((literal) => literal.kind === 'keywords' || literal.kind === 'words')
		.forEach(({ value, group, line }) => {
			const actualGroup = classifiedGroupOf(value);
			if (actualGroup !== group) {
				mismatches.push(`"${value}" (${group}.${line}) was classified as "${actualGroup}"`);
			}
		});

	assert.deepEqual(mismatches, []);
});

// ---- チェック2: 同じ文字列がSTAGES内で複数のlineに重複登録されていないか ----
// 分類器を介さない純粋な静的チェック。チェック1と違い _isMatch のロジックに
// 依存しないので、_isMatch側に将来バグが入っても検出力が落ちない。
// また、チェック1でシャドーイングが見つかった際に「原因はどの重複か」を
// 特定する助けにもなる。
// (keywords/words のみが対象。samplesは値そのものが分類対象ではなく
//  patternsの動作確認用データなので、重複していても問題ない)
it("[duplicate] no keyword/word literal is registered in more than one line", function () {
	const byValue = {};

	collectLiterals()
		.filter((literal) => literal.kind === 'keywords' || literal.kind === 'words')
		.forEach(({ value, group, line }) => {
			const key = value.toLowerCase();
			if (!byValue[key]) byValue[key] = [];
			byValue[key].push(`${group}.${line}`);
		});

	const duplicates = Object.keys(byValue)
		.filter((key) => byValue[key].length > 1)
		.map((key) => `"${key}" is registered in: ${byValue[key].join(', ')}`);

	assert.deepEqual(duplicates, []);
});

// ---- チェック3: patterns(正規表現)を持つ行には samples が必須。
//      samplesは (a) 自身のpatternに実際にマッチし、(b) 分類結果が
//      定義したgroupと一致すること(=patterns版のシャドーイングチェック) ----
it("[patterns] every line with patterns has samples that match the pattern and resolve to its own group", function () {
	const problems = [];

	DanbooruTagClassifier.STAGES.forEach((stage) => {
		stage.lines.forEach((line) => {
			if (!line.patterns) return;

			const samples = line.samples || [];
			if (samples.length === 0) {
				problems.push(`${stage.group}.${line.name} has patterns but no samples`);
				return;
			}

			samples.forEach((sample) => {
				const t = sample.trim().toLowerCase();
				const matchesOwnPattern = line.patterns.some((pattern) => pattern.test(t));
				if (!matchesOwnPattern) {
					problems.push(`sample "${sample}" (${stage.group}.${line.name}) does not match its own pattern`);
					return;
				}

				const actualGroup = classifiedGroupOf(sample);
				if (actualGroup !== stage.group) {
					problems.push(`sample "${sample}" (${stage.group}.${line.name}) was classified as "${actualGroup}"`);
				}
			});
		});
	});

	assert.deepEqual(problems, []);
});
