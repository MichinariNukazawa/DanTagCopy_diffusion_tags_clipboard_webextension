'use strict';

const DanbooruTagClassifier = require('./danbooru_tag_classifier.js');
const PromptTagSorter = require('./prompter_tag_sorter.js');

// ******** Configure ********
const myconfDefault = {
	'ver': '1.0',
	'targetKind': 'diffusion',
	'escapeBrackets': true,
	'withUrl': false,
	'sortKind': 'character_sort'
}

function loadMyconf(func) {
	chrome.storage.local.get(function (items) {
		console.log('loaded', items)
		if (Object.keys(items).length === 0) {
			// 新規設定項目を追加した後の起動では、読み込んだ設定Objに必要項目がないので、初期値で埋める
			console.log('nothing save, use default.')
			chrome.storage.local.set(myconfDefault)
			//const promise = chrome.storage.local.set(myconfDefault)
			//promise.then(() => {console.log('saved')}).catch((e) => {console.warn('save error', e)});
		}
		const myconf = Object.assign(myconfDefault, items)

		func(myconf)
	})
}

// ******** Genaral ********

function onError(error) {
	console.error('Error:', error);
	const msg = error.message
	showErrorMsg(msg)
}

function showErrorMsg(msg) {
	chrome.notifications.create(
		"ErrorInDanTagsCopy",
		{
			type: "basic",
			iconUrl: "icon128.png",
			title: 'DanTagsCopy',
			message: `Error: Please try reload page.\n ${msg}`
			//message: `Error: Please try reload page.`
		}
	);
}

// ******** Core ********

chrome.runtime.onInstalled.addListener(() => {
	console.log('onInstalled');

	loadMyconf((t) => { });

	const parent = chrome.contextMenus.create({
		id: 'diffusion',
		title: 'DanTagCopy:tags to clipboard',
		contexts: ["all"]
	});
});

chrome.contextMenus.onClicked.addListener((item) => {
	console.log('onClicked MenuItem')

	const onSelectedTabs = (tabs) => {
		loadMyconf((myconf) => {
			const sending = chrome.tabs.sendMessage(
				tabs[0].id,
				{
					'kind': 'request_collect_tags',
					'configure': myconf,
					'srcTabId': tabs[0].id
				}
			);
			sending.then(() => { console.log('sended') }).catch((e) => { console.warn('send error', e) });
		});
	}

	// dirty switch
	// chrome.tabs.query() in firefox not working (not callback).
	if (typeof browser !== 'undefined') {
		// firefox
		let querying = browser.tabs.query({ active: true, lastFocusedWindow: true })
		querying.then(onSelectedTabs).catch(onError);
	} else {
		// chrome
		let querying = chrome.tabs.query({ active: true, lastFocusedWindow: true })
		querying.then(onSelectedTabs).catch(onError);
	}
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.kind) {
		case 'response_collect_tags':
			const text = onResponsedCollectTags(request.configure, request.collected_tag_struct);
			chrome.tabs.sendMessage(
				request.srcTabId,
				{
					'kind': 'request_write_clipboard',
					'text': text,
				}
			);
			break;
		default:
			console.error('invalid', request);
	}
});

// ******** Ordering Structure Tags ********

const onResponsedCollectTags = (myconf, collected_tag_struct) => {
	const genes = collected_tag_struct.generals

	let classifiedDanbooruTagTree = DanbooruTagClassifier.classifyTags(genes)

	const charas = collected_tag_struct.characters
	classifiedDanbooruTagTree['character'] = [{ name: 'character', tags: charas }]
	console.debug('classifiedDanbooruTagTree:', classifiedDanbooruTagTree)

	let prompt = PromptTagSorter.sorting(
		myconf.sortKind, myconf.escapeBrackets, myconf.targetKind,
		classifiedDanbooruTagTree)

	if (myconf.withUrl) {
		// 念のため、取り除き忘れ対策として重みを消しておく
		// StableDiffusionの記法ではこれで重みゼロになる（はず。未確認）だが、
		// NovelAIで重みゼロにする方法は不明。
		prompt = `\n( ${collected_tag_struct.url} :0.0)\n` + prompt
	}

	return prompt;
}

console.log('loaded');
