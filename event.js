'use strict';

// ******** Configure ********
let myconf = {
	'ver': '1.0',
	'targetKind': 'diffusion'
}

function getMyconf(){
	return myconf;
}
function loadMyconf(){
	chrome.storage.local.get(function(items) {
		console.log('loaded')
		if(Object.keys(items).length === 0){
			console.log('nothing save, use default.')
			return
		}
		if(! items.hasOwnProperty('targetKind')){
			console.error('invalid data, use default.')
			return
		}
		console.log(items.targetKind)
		myconf = items
	})
}
function saveTargetKind(targetKind){
	myconf.targetKind = targetKind
	chrome.storage.local.set(myconf, function() {
		console.log('saved')
	})
}

// ******** Core ********

{
chrome.runtime.onInstalled.addListener(() => {

	loadMyconf();

	const parent = chrome.contextMenus.create({
		id: 'diffusion',
		title: 'DanTagCopy:tags to clipboard',
		contexts: ["all"]
	});
});

function setClip_(text)
{
	// writeText() is good api implement,
	// but dont working in chrome (cause V2 manifest ?).
/*
	navigator.clipboard.writeText(s).then(() => {
		// clipboard successfully set
		console.log('success.')
	}, () => {
		// clipboard write failed
		console.warn('failed.')
	});
*/

	const input = document.createElement('input');
	document.body.appendChild(input);
	input.value = text;
	input.focus();
	input.select();
	const result = document.execCommand('copy');
	if (result === 'unsuccessful') {
		console.error('Failed to copy text.');
	}
}

function onSelectedTabs(tabs)
{
	console.log('call onSelectedTabs');
	for (const tab of tabs) {
		// tab.url requires the `tabs` permission or a matching host permission.
		console.log(tab.url);
	}
	if(! tabs){
		console.warn('tabs is none')
		return
	}
	if(1 != tabs.length){
		console.warn('invalid tabs lenght.' + tabs.length)
		return
	}
	const tab = tabs[0]
	onSelectedTab(tab)
}

function onSelectedTab(tab)
{
	chrome.tabs.sendMessage(tab.id, {targetKind: 'diffusion'}, (response) => {
		if (chrome.runtime.lastError) {
			onError(chrome.runtime.lastError)
			return
		}
		//console.log(response);

		const charas = response.collected_tagst.characters
		const genes = response.collected_tagst.generals
		let tags =  charas.concat(genes)

		for( let i = 0; i < tags.length; i++){
			// プロンプトでは括弧は強弱指定となるためタグの括弧をエスケープする
			tags[i] = tags[i].replaceAll('(', '\\(')
			tags[i] = tags[i].replaceAll(')', '\\)')
		}

		let s = ''
		switch(myconf.targetKind){
		case 'diffusion':
			for( let i = 0; i < tags.length; i++){
				tags[i] = tags[i].replaceAll(' ', '_')
			}
			s = tags.join(' ')
			break
		case 'novelai':
			s = tags.join(', ')
			break
		default:
			showErrorMsg('BUG invalid:' + myconf.targetKind)
		}

		setClip_(s)
	})
}

function onError(error){
	console.error('Error:', error);
	const msg = error.message
	showErrorMsg(msg)
}

function showErrorMsg(msg){
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

chrome.contextMenus.onClicked.addListener((item) => {
	console.log('onClicked MenuItem')
	//console.log(item);
	//console.log(item.menuItemId);

	// dirty switch
	// chrome.tabs.query() in firefox not working (not callback).
	if(typeof browser !== 'undefined'){
		console.log(typeof browser)
		console.log(browser)
		// firefox
		browser.tabs.query({active: true, lastFocusedWindow:true}).then(onSelectedTabs, onError);
	}else{
		// chrome
		chrome.tabs.getSelected(onSelectedTab);
	}
})

}

