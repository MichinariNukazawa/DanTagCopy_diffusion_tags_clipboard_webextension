'use strict';

{
	chrome.runtime.onInstalled.addListener(() => {
		const parent = chrome.contextMenus.create({
			id: 'diffusion',
			title: 'DanTagCopy:tags to clipboard'
		});
	});
}

function setClip_(text)
{
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

chrome.contextMenus.onClicked.addListener((item) => {
	console.log(item);
	console.log(item.menuItemId);

	chrome.tabs.getSelected((tab) => {
		chrome.tabs.sendMessage(tab.id, {targetKind: item.menuItemId}, (response) => {
			console.log(response);
			const s = response.collected_tags.join(' ')
			setClip_(s)
		})
	})
})

