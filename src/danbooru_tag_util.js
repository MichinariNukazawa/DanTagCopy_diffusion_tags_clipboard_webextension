'use strict';

class DtUtil{
	static sortingTags(sortKind, tags){
		// ここで並べた順にソートしているので、順序は考慮すること
		// https://danbooru.donmai.us/wiki_pages/tag_groups
		const bodyWords = [
			// 属性 狐耳少女('fox girl')、猫耳少女等
			'girl', 'boy', 'kitsune',
			// 尾
			'tail', 'kyuubi', 'multiple tails',
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
			'tan',
			'tanlines',
			'sun tattoo',
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
			'vest',
			'tactical clothes',
			'cloth',
			'apron',
			'petticoat',
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
			//
			'Bulletproof vest',
			'Load bearing equipment',
			'Load bearing vest',
			'Plate carrier',
			'Naked plate carrier',
			'Bulletproof vest',
			'Night vision device',
			'Pouch', 'bag', // ちょっと違うが一緒に入れておく
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
			// Legware
			'legwear',
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
			// 手袋
			'glove',
			// 靴
			'boots', 'footwear',
			//
			'chief',
			'bare shoulders',
			'collar',
			'highleg',
			'leotard',
			'zipper',
			'jacket',
			'cloak', 'cape',
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
			'cum on lips',
			'licking lips',
			'lip biting',
			'open mouth',
			'lips',
			'parted lips',
			'puckered lips',
			'pursed lips',
			'spread lips',
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
			'waving', // 手をふる
			'background', // 背景色・背景グラデ等
			'flying sweatdrops',
			// 構図系
			'cowboy shot',
			'shot',
		]

		const isArrayIncludes = (target, arr) => arr.some(el => target.toLowerCase().includes(el.toLowerCase()));
		const isArrayEquals = (target, arr) => arr.some(el => target.toLowerCase() === el.toLowerCase());
		const isArrayWordEquals = (target, arr) => arr.some((el) => {
			const keyword = el.toLowerCase()
			const words = target.toLowerCase().split(' ')
			return isArrayEquals(keyword, words)
				|| isArrayEquals(keyword + 's', words)
				|| isArrayEquals(keyword + 'es', words) // 雑な複数形対応
		});

		let bodys = []
		let croths = []
		let colors = []
		let others = []
		// 完全一致
		let tmps = []
		for( let i = 0; i < tags.length; i++){
			const tag = tags[i]
			if(isArrayEquals(tag, otherWords)){
				others.push(tag)
			}else if(isArrayEquals(tag, bodyWords)){
				bodys.push(tag)
			}else if(isArrayEquals(tag, crothWords)){
				croths.push(tag)
			}else if(isArrayEquals(tag, colorWords)){
				colors.push(tag)
			}else{
				tmps.push(tag)
			}
		}
		tags = tmps
		// 単語一致
		tmps = []
		for( let i = 0; i < tags.length; i++){
			const tag = tags[i]
			if(isArrayWordEquals(tag, otherWords)){
				others.push(tag)
			}else if(isArrayWordEquals(tag, bodyWords)){
				bodys.push(tag)
			}else if(isArrayWordEquals(tag, crothWords)){
				croths.push(tag)
			}else if(isArrayWordEquals(tag, colorWords)){
				colors.push(tag)
			}else{
				tmps.push(tag)
			}
		}
		tags = tmps
		// 部分一致
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

		// Tag sort in group
		// 定義したwordsの順に並び替え(indexをとって小さいほど前順へ)
		bodys.sort((a, b) => {
			const ai = bodyWords.findIndex((elem) => { return a.includes(elem) })
			const bi = bodyWords.findIndex((elem) => { return b.includes(elem) })
			//console.log(a, ai, " - ", b , bi)
			// findIndex は該当が無ければ-1を返す
			//if(-1 === ai && -1 === bi){ return 0 }
			if(-1 === ai){ return 1 }
			return ai - bi
		})
		croths.sort((a, b) => {
			const ai = crothWords.findIndex((elem) => { a.includes(elem) })
			const bi = crothWords.findIndex((elem) => { b.includes(elem) })
			//console.log(a, ai, " - ", b , bi)
			// findIndex は該当が無ければ-1を返す
			//if(-1 === ai && -1 === bi){ return 0 }
			if(-1 === ai){ return 1 }
			return ai - bi
		})

		// Group sort
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

		//console.log('dsttags')
		//console.log(dsttags)
		return dsttags
	}
}

module.exports = DtUtil;
