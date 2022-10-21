'use strict';

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		const tagst = collectTagst_(request.targetKind)
		sendResponse({collected_tagst: tagst});
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

