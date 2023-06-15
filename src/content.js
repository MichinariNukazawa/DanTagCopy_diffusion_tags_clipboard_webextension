'use strict';

// ******** Message ********

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log('message received', request.kind, request);

	switch(request.kind){
	case 'request_collect_tags':
		const tagst = collectTagStruct_(request.targetKind);
		if(typeof tagst === 'undefined'){
			alert('Error: tag not detected.');
			return;
		}
		chrome.runtime.sendMessage({
			'kind': 'response_collect_tags',
			'collected_tag_struct': tagst,
			'srcTabId': request.srcTabId,
			'configure': request.configure,
		});
		break;
	case 'request_write_clipboard':
		navigator.clipboard.writeText(request.text).then(() => {
			// clipboard successfully set
			console.log('success clipboard.');
		}).catch( (e) => {
			// clipboard write failed
			console.warn('failed.', e);
			alert('Error clipboard cant writed. :' + e.message)
		});
		break
	default:
		alert('BUG: internal invalid request. :' + request.dtcRequestKind)
	}
});

// ******** Util ********

const collectTagStruct_ = () =>{
	let sidebarElement = document.getElementById("sidebar")
	if(! sidebarElement){
		console.warn('sidebar element not exist.')
		return undefined
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
			for(const element of es){
				// dantagjaによる翻訳elementの挿入への対処としてtext部分だけを取り出す
				let tag
				for (let i = 0; i < element.childNodes.length; i++){
					if (element.childNodes[i].nodeType === Node.TEXT_NODE){
						tag = element.childNodes[i].textContent;
					}
				}
				if(!tag){
					console.warn('tag not detected', element)
					tags.push(element.innerText)
					break;
				}
				tags.push(tag)
			}
		}
		return tags
	}
	let tagst = { 'characters':[], 'generals':[] };
	tagst.characters = collectTagsFronTagType_("tag-type-4")
	tagst.generals = collectTagsFronTagType_("tag-type-0")

	// URL
	tagst['url'] = window.location.href

	//console.log("tags:")
	//console.log(tags)
	return tagst
}

console.log('loaded')
