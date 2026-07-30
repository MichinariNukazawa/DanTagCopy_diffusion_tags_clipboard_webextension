'use strict';

// ******** Message ********

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log('message received', request.kind, request);

	switch (request.kind) {
		case 'request_collect_tags':
			const tagst = collectTagStruct_(request.targetKind);
			if (typeof tagst === 'undefined') {
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
			}).catch((e) => {
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

const collectTagStructFromSidebar_ = (sidebarElement) => {
	// character-tag-list
	// general-tag-list
	// collect tags, `posts?tags=*` 的なタグ該当画像一覧ページでの収集に対応する

	const collectTagsFronTagType_ = (sidebarElement, tagType) => {
		let pes = Array.from(sidebarElement.getElementsByClassName(tagType))

		let tags = []
		for (const pe of pes) {
			if (!pe) { // getElementByClassName が空の場合の処理
				console.warn("parent element is null in array.")
				continue
			}

			const es = pe.getElementsByClassName("search-tag")
			for (const element of es) {
				// dantagjaによる翻訳elementの挿入への対処としてtext部分だけを取り出す
				let tag
				for (let i = 0; i < element.childNodes.length; i++) {
					if (element.childNodes[i].nodeType === Node.TEXT_NODE) {
						tag = element.childNodes[i].textContent;
					}
				}
				if (!tag) {
					console.warn('tag not detected', element)
					tags.push(element.innerText)
					break;
				}
				tags.push(tag)
			}
		}
		return tags
	}
	let tagst = { 'characters': [], 'generals': [] };
	tagst.characters = collectTagsFronTagType_(sidebarElement, "tag-type-4")
	tagst.generals = collectTagsFronTagType_(sidebarElement, "tag-type-0")

	// URL
	tagst['url'] = window.location.href

	//console.log("tags:")
	//console.log(tags)
	return tagst
}

const collectTagStructFromTaglist_ = (taglistElement) => {
	const collectTagsFronTagType_ = (taglistElement, tagType) => {
		/**
		 * HTML要素のhref属性から `tags` パラメータを取得・変換します。
		 * @param {Element} element - 対象の要素（例: <a>タグ）
		 * @returns {string|null} 抽出・変換されたタグ文字列（判定に失敗した場合は null）
		 */
		function getTagFromAElement_(element) {
			// 1. 要素またはhref属性の存在チェック
			if (!element || typeof element.getAttribute !== 'function') return null;

			const href = element.getAttribute('href');
			if (!href) return null;

			// 2. URLSearchParams でクエリ文字列を解析
			const queryString = href.includes('?') ? href.split('?')[1] : href;
			const params = new URLSearchParams(queryString);

			// 3. `tags` パラメータがあるか判定
			if (!params.has('tags')) return null;

			// 4. 値を取得（この時点で %28 等のURLパーセントエンコードは自動的に解釈されます）
			const rawTag = params.get('tags');

			// 5. アンダースコア `_` を半角スペースに置換して返却
			return rawTag.replace(/_/g, ' ');
		}

		let pes = Array.from(taglistElement.getElementsByClassName(tagType))

		let tags = []
		for (const pe of pes) {
			if (!pe) { // getElementByClassName が空の場合の処理
				console.warn("parent element is null in array.")
				continue
			}

			let tag;
			const es = pe.getElementsByTagName("a")
			for (const element of es) {
				tag = getTagFromAElement_(element)
				if(!!tag){
					break
				}
			}
			if (!tag) {
				console.warn('tag not detected', element)
				tags.push(element.innerText)
				break;
			}

			tags.push(tag)
		}
		return tags
	}
	let tagst = { 'characters': [], 'generals': [] };
	tagst.characters = collectTagsFronTagType_(taglistElement, "tag-type-character")
	tagst.generals = collectTagsFronTagType_(taglistElement, "tag-type-general")

	// URL
	tagst['url'] = window.location.href

	//console.log("tags:")
	//console.log(tags)
	return tagst
}

const collectTagStruct_ = () => {
	let sidebarElement = document.getElementById("sidebar")
	if (!!sidebarElement) {
		// danbooruのDOM構造に対応。タグサイドバーからタグを収集する
		return collectTagStructFromSidebar_(sidebarElement)
	}

	let taglistElement = document.getElementById("tag-list")
	if (!!taglistElement) {
		// gelbooruのDOM構造に対応。タグリストからタグを収集する
		return collectTagStructFromTaglist_(taglistElement)
	}

	console.warn('sidebar element not exist.')
	return undefined


}

console.log('loaded')
