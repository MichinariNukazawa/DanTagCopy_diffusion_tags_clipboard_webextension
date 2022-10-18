'use strict';

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		const tags = collectTags_(request.targetKind)
		sendResponse({collected_tags: tags});
	}
);

function collectTags_(targetKind)
{
	let sidebarElement = document.getElementById("sidebar")
	if(! sidebarElement){
		console.warn('sidebar element not exist.')
		return []
	}

	let pes = []
	// character-tag-list
	// general-tag-list
	// collect tags, `posts?tags=*` 的なタグ該当画像一覧ページでの収集に対応する
	//pes = pes.concat(Array.from(document.getElementsByClassName("character-tag-list")))
	//pes = pes.concat(Array.from(document.getElementsByClassName("general-tag-list")))
	pes = pes.concat(Array.from(sidebarElement.getElementsByClassName("tag-type-4")))
	pes = pes.concat(Array.from(sidebarElement.getElementsByClassName("tag-type-0")))

	let tags = []
	for(const pe of pes){
		if(! pe){ // getElementByClassName が空の場合の処理
			console.warn("parent element is null in array.")
			continue
		}

		const es = pe.getElementsByClassName("search-tag")
		for(const e of es){
			let tag = e.innerText.replaceAll(' ', '_')
			tags.push(tag)
		}
	}

	//console.log("tags:")
	//console.log(tags)
	return tags
}

