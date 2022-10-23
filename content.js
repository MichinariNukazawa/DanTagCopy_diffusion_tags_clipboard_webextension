'use strict';

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		//if('content' !== request.dtcMessageTarget){
		//	console.log('through receive message not target.', request.dtcMessageTarget)
		//}

		switch(request.dtcRequestKind){
			case 'collect_tags':
				const tagst = collectTagst_(request.targetKind)
				sendResponse({
					collected_tagst: tagst
				});
				break
			case 'write_clipboard':
				navigator.clipboard.writeText(request.text).then(() => {
					// clipboard successfully set
					console.log('success.')
				}).catch( (e) => {
					// clipboard write failed
					console.warn('failed.', e)
					alert('Error clipboard cant writed. :' + e.message)
				});
				break
			default:
				alert('BUG: internal invalid request. :' + request.dtcRequestKind)
		}
	}
);

function collectTagst_(targetKind)
{
	let sidebarElement = document.getElementById("sidebar")
	if(! sidebarElement){
		console.warn('sidebar element not exist.')
		return []
	}

	// character-tag-list
	// general-tag-list
	// collect tags, `posts?tags=*` 的なタグ該当画像一覧ページでの収集に対応する

	const collectTagsFronTagType_ = (tagType) => {
		let pes = Array.from(sidebarElement.getElementsByClassName(tagType))
	
		let tags = []
		for(const pe of pes){
			if(! pe){ // getElementByClassName が空の場合の処理
				console.warn("parent element is null in array.")
				continue
			}
	
			const es = pe.getElementsByClassName("search-tag")
			for(const e of es){
				let tag = e.innerText
				tags.push(tag)
			}
		}
		return tags
	}
	let tagst = { 'characters':[], 'generals':[] };
	tagst.characters = collectTagsFronTagType_("tag-type-4")
	tagst.generals = collectTagsFronTagType_("tag-type-0")

	//console.log("tags:")
	//console.log(tags)
	return tagst
}

function writeClipboard_(text)
{
	// writeText() is good api implement,
	// but dont working in chrome (cause V2 manifest ?).
	navigator.clipboard.writeText(text)
	/*
	navigator.clipboard.writeText(s).then(() => {
		// clipboard successfully set
		console.log('success.')
	}).catch( (e) => {
		// clipboard write failed
		console.warn('failed.', e)
		onError(e)
	});
	*/

/*
	const input = document.createElement('input');
	document.body.appendChild(input);
	input.value = text;
	input.focus();
	input.select();
	const result = document.execCommand('copy');
	if (result === 'unsuccessful') {
		console.error('Failed to copy text.');
	}
*/
}