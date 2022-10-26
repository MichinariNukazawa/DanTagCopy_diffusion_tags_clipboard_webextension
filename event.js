'use strict';

// ******** Configure ********
let myconf = {
	'ver': '1.0',
	'targetKind': 'diffusion',
	'escapeBrackets': true,
	'sortKind': 'character_sort'
}

function getMyconf(){
	return myconf;
}
function loadMyconf(){
	chrome.storage.local.get(function(items) {
		console.log('loaded', items)
		if(Object.keys(items).length === 0){
			console.log('nothing save, use default.')
			return
		}
		if(! items.hasOwnProperty('targetKind')){
			console.error('invalid data, use default.')
			return
		}
		console.log(items.targetKind)
		myconf = Object.assign(myconf, items)
		// 新規設定項目を追加した後の起動では、読み込んだ設定Objに必要項目がないので、初期値で埋める
		console.log('merged', myconf)
	})
}
function saveTargetKind(targetKind){
	myconf.targetKind = targetKind
	chrome.storage.local.set(myconf, function() {
		console.log('saved')
	})
}
function saveSortKind(sortKind){
	myconf.sortKind = sortKind
	chrome.storage.local.set(myconf, function() {
		console.log('saved')
	})
}
function saveEscapeBrackets(escapeBrackets){
	myconf.escapeBrackets = escapeBrackets
	chrome.storage.local.set(myconf, function() {
		console.log('saved')
	})
}

// ******** content script ********

function writeClipboard_(text)
{
	console.log('call', text)

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
	// Fallback clipboard copy.
	// This is not working in V3 background.
	// (In page content scripting is successable.)
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

function collectTagst_()
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

// ******** Core ********

chrome.runtime.onInstalled.addListener(() => {

	loadMyconf();

	const parent = chrome.contextMenus.create({
		id: 'diffusion',
		title: 'DanTagCopy:tags to clipboard',
		contexts: ["all"]
	});
});

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if('service_worker' !== request.dtcMessageTarget){
			console.log('through receive message not target.', request.dtcMessageTarget)
			return
		}
		switch(request.dtcMessageKind){
			case 'target_kind':
				saveTargetKind(request.targetKind)
				break
			case 'sort_kind':
				saveSortKind(request.sortKind)
				break
			case 'escape_brackets':
				saveEscapeBrackets(request.escapeBrackets)
				break
			case 'get_my_conf':
				const myconf = getMyconf()
				chrome.runtime.sendMessage({
					'dtcMessageTarget': 'popup',
					'myconf': myconf
				});
				break
		}
		// 本当はsave完了のコールバックを待って応答を返したいが
	}
);

function onSelectedTabs(tabs)
{
	let onResponsedCollectTags = (collected_tagst) => {

		const charas = collected_tagst.characters
		const genes = collected_tagst.generals
		let tagarrays = sortingTags(getMyconf().sortKind, genes)
		tagarrays.unshift(charas)
		console.log(tagarrays)

		if(getMyconf().escapeBrackets){
			tagarrays.forEach((tagarr, index) => {
				const newtagarr = tagarr.map((tag) => {
					// プロンプトでは括弧は強弱指定となるためタグの括弧をエスケープする
					// '{}'は(おそらく)タグに含まれないのでしていない
					// '[]'もいまのところ見かけていないが念のため
					tag = tag.replaceAll('(', '\\(')
					tag = tag.replaceAll(')', '\\)')
					tag = tag.replaceAll('[', '\\[')
					tag = tag.replaceAll(']', '\\]')
					return tag
				})
				tagarrays[index] = newtagarr
			})
		}

		let s = ''
		switch(myconf.targetKind){
		case 'diffusion':
		{
			tagarrays = tagarrays.map((tagarr) => {
				return tagarr.map((tag) => {
					return tag.replaceAll(' ', '_')
				})
			})

			const ss = tagarrays.map((tagarr) => {
				return tagarr.join(' ')
			})
			// Tagグループ間は２つ開ける
			// 基本的にはデバッグのための挙動
			// プロンプトに空白を増やしても画像生成に副作用はないはず
			s = ss.join('  ')
		}
			break
		case 'novelai':
			let ss = tagarrays.map((tagarr) => {
				return tagarr.join(', ')
			})
			ss = ss.filter((tarray) => 0 < tarray.length)
			s = ss.join(',  ')
			break
		default:
			showErrorMsg('BUG invalid:' + myconf.targetKind)
		}

		// writeClipboard
		// lamdbaキャプチャしたタブIDをそのまま使っているが動いてる。
		chrome.scripting.executeScript({
			target: { tabId: tabs[0].id },
			args: [s],
			func: writeClipboard_,
		});
	}

	chrome.scripting.executeScript(
		{
			target: { tabId: tabs[0].id },
			func: collectTagst_,
		},
		(injectionResults) => {
			for (const frameResult of injectionResults)
				onResponsedCollectTags(frameResult.result);
		}
	);
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

	// dirty switch
	// chrome.tabs.query() in firefox not working (not callback).
	if(typeof browser !== 'undefined'){
		console.log(typeof browser)
		console.log(browser)
		// firefox
		browser.tabs.query({active: true, lastFocusedWindow:true}).then(onSelectedTabs, onError);
	}else{
		let querying = chrome.tabs.query({active: true, lastFocusedWindow:true})
		querying.then(onSelectedTabs).catch(onError);
	}
})

// ******** Ordering Structure Tags ********

function sortingTags(sortKind, tags){

	// ここで並べた順にソートとなる可能性はあるので、並び順は考えて置く
	// https://danbooru.donmai.us/wiki_pages/tag_groups
	const bodyWords = [
		// 尾
		'tail', 'kyuubi', 'multiple_tails',
		// 属性
		// 狐耳少女('fox girl')、猫耳少女等
		'girl', 'boy', 'kitsune',
		// 目系
		'eye', 'sclera', 'pupils',
		// 耳
		'ear',
		// 髪系(髪型等)
		// https://danbooru.donmai.us/wiki_pages/tag_group%3Ahair_styles
		'hair', 'bald', 'sidelock', 'cut', 'chonmage', 'top', 'okappa', 'cornrows',
		'dreadlocks', 'mullet', 'braid', 'bun',
		'side up', 'nihongami', 'mizura', 'ponytail', 'twintail', 'afro',
		'bang', 'intake', 'ahoge', 'comb over', 'mohawk', 'blunt ends',
		// 髪色個別
		'multicolored hair',
		'colored inner hair',
		'gradient hair',
		'rainbow hair',
		'split-color hair',
		'streaked hair',
		'two-tone hair',
		'colored tips',
		// ひげ(髪グループのFacial hair)
		// https://danbooru.donmai.us/wiki_pages/tag_group%3Ahair
		'beard', 'goatee', 'mustache','stubble',
		// 胸（サイズ指定として）
		// nippleは見える構図系が多いようなので入れていない
		'breast','chest',
		// 男性胸
		'pec', 'pectoral',
		// お尻（サイズ指定として）
		// やはりこれも構図系などが多い...
		'ass expansion',
		'bad ass',
		'flat ass',
		'huge ass',
		'spread ass',
		'butt crack',
		'wedgie',
		'wide hips',
		// 唇色
		//（唇の動きをキャンセルする必要がある）
		'lip',
		// 舌個別
		'long tongue',
		// 歯系
		'teeth', 'fang', 'tusk', 'skin fang',
		// 鎖骨、見える構図とかっぽいが...
		'collarbone',
		// 足
		'slim legs',
		// 腰
		'waist',
		// 翼
		'wing',
		// 肌色
		'skin',
		'Tan',
		'Tanlines',
		'Sun tattoo',
	]
	// body accessories
	// hand, mouthはポージングが多い
	// https://danbooru.donmai.us/wiki_pages/tag_group%3Aattire
	// https://danbooru.donmai.us/wiki_pages/tag_group%3Adress
	const crothWords = [
		// その他
		'ribbon',
		'lace',
		// 服
		'sweat', 'sailor', 'serafuku', 'fuku', 'school uniform', 'skirt', 'sleeve', 'pantyhose', 'pant', 'Aglove', 'frill',
		'cuffs',
		'garter', 'strap',
		'garter straps',
		// ドレス
		'dress',
		'tied dress',
		'crinoline',
		'dirndl',
		'evening gown',
		'gown',
		'negligee',
		'nightgown',
		'sundress',
		//
		'shirt',
		// 髪飾り
		// https://danbooru.donmai.us/wiki_pages/tag_group%3Ahair
		'chopsticks',
		'comb',
		'kanzashi',
		'headband',
		'scrunchie',
		'wig',
		// 頭飾り TODO バニー耳等はデフォルト衣装ではないと分別したいが...
		'headwear', 'crown', 'fake', 'hat', 'cap',
		'deerstalker', 'kepi',
		'bicorne',
		'ajirogasa',
		'fedora ',
		'gat',
		'tricorne',
		'deerstalker',
		'budenovka',
		'papakha',
		'ushanka',
		'bashlik',
		'toque blanche',
		'beret',
		'beanie',
		'papakha',
		'ushanka',
		'kippah',
		'mian guan',
		'mitre',
		'mortarboard',
		'sajkaca',
		'songkok',
		'tam o\' shanter',
		'tate eboshi',
		'tsunokakushi',
		'pelt',
		// ヘルメット
		'met',
		//王冠
		'circlet',
		'diadem',
		'mian guan',
		'mini crown',
		'saishi',
		'tiara',
		// その他 HeadWare
		'aviator cap',
		'balaclava',
		'bandana',
		'bonnet',
		'dalachi',
		'habit',
		'head scarf',
		'hijab',
		'jester cap',
		'keffiyeh',
		'okosozukin',
		'shower cap',
		'shufa guan',
		'visor cap',
		'veil',
		// Legware
		'legwear',
		// Neck,Neckware
		'neck',
		'long neck',
		'tie',
		'ascot',
		'choker',
		'pet cone',
		'feather boa',
		'jabot',
		'lanyard',
		'neckerchief',
		'necklace',
		'lei',
		'charm',
		'pendant',
		'amulet',
		'locket',
		'magatama',
		'pentacle',
		'pendant',
		'amulet',
		'locket',
		'magatama',
		'pentacle',
		'scarf',
		'stole',
		'collared shirt',
		'detached collar',
		'fur collar',
		'high collar',
		'open collar',
		'popped collar',
		'sailor collar',
		'turtleneck',
		'sleeveless turtleneck',
		'v-neck',
		'wing collar',
		// sexual
		'Lingerie',
		'Babydoll',
		'Bodystocking',
		'Bra',
		'Bustier',
		'Camisole',
		'Chemise',
		'Corset',
		'Fishnets',
		'garter straps',
		'Garter belt',
		'Lace',
		'Nightgown',
		'Panties',
		'Boyshort panties',
		'Strapless bottom',
		'Teddy',
		'Thighhighs',
		'Thong',
		'G-string',
		'Pearl thong',
		'Male Underwear',
		'Boxers',
		'Briefs',
		'Boxer briefs',
		'Bikini briefs',
		'Jockstrap',
		'Ball bra',
		'Penis sheath',
		'Blindfold',
		'Bodysuit',
		'Gimp suit',
		'bondage outfit',
		'Latex',
		'Monoglove',
		'Crotchless',
		'crotchless panties',
		'crotchless pants',
		'crotchless swimsuit',
		'crotchless pantyhose',
		'crotchless leotard',
		'crotchless bloomers',
		'crotchless buruma',
		'Ass Cutout',
		'assless swimsuit',
		'backless panties',
		'backless pants',
		'Breasts',
		'breastless clothes',
		'nippleless clothes',
		'cupless bikini',
		'cupless bra',
		'revealing clothes',
		'reverse outfit',
		'reverse bikini armor',
		'reverse bunnysuit',
		'anal ball wear',
		'Maebari',
		'Pasties',
		// 袖
		'sleeve',
		// メガネ
		'glasses',
		'monocle',
		'sunglasses',
		'goggles',
		'scouter',
		//
		'glove',
		//
		'boots', 'footwear',
		//
		'chief',
		'bare shoulders',
		'collar',
		'highleg',
		'leotard',
		'zipper',
		'jacket',
	]
	// あくまで赤髪とかで取りこぼしがあった場合に拾うため程度のもの。
	//（本当に色指定系を集めだすと、グラデなどの背景指定が入ってきてしまうため）
	const colorWords = [
		'aqua', 'black', 'brown', 'blue', 'green', 'gray', 'orange', 'pink', 'purple', 'red', 'white', 'yellow',
		'brond', 'silver', 'gold'
	]
	// 取り除く系のリスト
	const otherWords = [
		//
		'1girl', '2girls', '3girls',
		'1boy', '2boys', '3boys',
		'multiple boys', 'multiple girls',
		// ** Body系
		// close eyeなどを外見特徴から除外
		'close', 'open',
		// 顔、口等は、外見というより表情などが多い
		// 「うなじ」「肩」が見えるポーズとか
		'mouse', 'face', 'nape', 'shoulders', 'tongue',
		'neck', 'collarbone', 'nape',
		// 唇色以外の唇の動きを取り除く
		'Cum on lips',
		'Licking lips',
		'Lip biting',
		'Open mouth',
		'Parted lips',
		'Puckered lips',
		'Pursed lips',
		'Spread lips',
		// ** 服飾系
		// ドレス（エフェクト的なタグが多い）
		'dress flip',
		'dress grab',
		'dress lift',
		'dress pull',
		'dress tug',
		'open dress',
		'skirt basket',
		'torn dress',
		'wet dress',
		// スカートアクション
		'holding skirt',
		'skirt around one leg',
		'skirt basket',
		'skirt fan',
		'skirt flip',
		'skirt hold',
		'skirt lift',
		'skirt pull',
		'skirt removed',
		'skirt tied over head',
		'skirt tug',
		'teppeki skirt',
		'upskirt',
		'under skirt',
		// Neck,Neckware action
		'arm around neck',
		'arms around neck',
		'hand on another\'s neck',
		'hand on own neck',
		'neck biting',
		'necking',
		'kissing neck',
		'grab',
		'tug',
		'adjust',
		// Sleeve action
		'arm out of sleeve',
		'hands in opposite sleeves',
		'pinching sleeves',
		'pinching sleeves',
		'sleeve grab',
		// 眼鏡のその他
		// 普段眼鏡をかけていないキャラクターが眼鏡をかけている場合。
		'bespectacled',
		//
		'adjusting eyewear',
		'crooked eyewear',
		'eyewear on head',
		'eyewear on headwear',
		'eyewear removed',
		'eyewear hang',
		'eyewear in mouth',
		'holding eyewear',
		'looking for glasses',
		'eyewear strap',
		'eyewear switch',
		'eyewear view',
		'hand on eyewear',
		'looking over eyewear',
		'no eyewear',
		'removing eyewear',
		// 手袋アクション
		'adjusting gloves',
		'glove biting',
		'glove in mouth',
		'glove pull',
		'holding gloves',
		'putting on gloves',
		'removing glove',
		//
		'boots removed',
		'putting on boots',
		'single boot',
		'single thigh boot',
		'single knee boot',
		'thighhighs under boots',
		'torn boots',
		//
		'cum', 'facial',
		'heart',
		'blush',
		'alternate costume',
		'unzip',
	]

	const isArrayIncludes = (target, arr) => arr.some(el => target.includes(el));
	const isArrayEquals = (target, arr) => arr.some(el => target === el);

	let bodys = []
	let croths = []
	let colors = []
	let others = []
	let tothers = []
	for( let i = 0; i < tags.length; i++){
		const tag = tags[i]
		if(isArrayIncludes(tag, otherWords)){
			tothers.push(tag)
		}else if(isArrayIncludes(tag, bodyWords)){
			bodys.push(tag)
		}else if(isArrayIncludes(tag, crothWords)){
			croths.push(tag)
		}else if(isArrayIncludes(tag, colorWords)){
			colors.push(tag)
		}else{
			tothers.push(tag)
		}			
	}
	// その他に分類されたタグから、完全一致するタグを移動しなおして末尾に付ける
	for( let i = 0; i < tothers.length; i++){
		const tag = tothers[i]
		if(isArrayEquals(tag, otherWords)){
			others.push(tag)
		}else if(isArrayEquals(tag, bodyWords)){
			bodys.push(tag)
		}else if(isArrayEquals(tag, crothWords)){
			croths.push(tag)
		}else if(isArrayEquals(tag, colorWords)){
			colors.push(tag)
		}else{
			others.push(tag)
		}			
	}

	let dsttags = []
	switch(sortKind){
		case 'character_sort':
			dsttags.push(bodys)
			dsttags.push(croths)
			dsttags.push(colors)
			dsttags.push(others)
			break
		case 'scene_sort':
			dsttags.push(others)
			dsttags.push(colors)
			dsttags.push(croths)
			dsttags.push(bodys)
			break
		case 'no_sort':
			// わざわざここまで来てする必要もないのだが、
			// コードの見通し的にここに置く
			dsttags.push(tags)
			break
		default:
			showErrorMsg('BUG invalid sort:' + sortKind)
	}

	console.log('dsttags')
	console.log(dsttags)
	return dsttags
}
