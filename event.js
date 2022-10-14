'use strict';

{
chrome.runtime.onInstalled.addListener(() => {
	const parent = chrome.contextMenus.create({
		id: 'diffusion',
		title: 'DanTagCopy:tags to clipboard'
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
		console.log(response);
		const s = response.collected_tags.join(' ')
		setClip_(s)
	})
}

function onError(error) {
	console.error(`Error: ${error}`);
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

