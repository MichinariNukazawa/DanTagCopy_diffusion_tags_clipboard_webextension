'use strict';

window.addEventListener( 'load', function(e){
	console.log('loaded')

	// ** set callbacks
	let onTargetKindRadioChanged = function(e){
		console.debug("change", e.currentTarget.id);
		const targetKind = e.currentTarget.id;
		page.saveTargetKind(targetKind)
	}
	document.getElementById('diffusion').addEventListener('change', onTargetKindRadioChanged);
	document.getElementById('novelai').addEventListener('change', onTargetKindRadioChanged);

	document.getElementById('escape_brackets').addEventListener('change', (e) => {
		page.saveEscapeBrackets(document.getElementById('escape_brackets').checked)
	});
	
	let onSortKindRadioChanged = function(e){
		console.debug("change", e.currentTarget.id);
		const sortKind = e.currentTarget.id;
		page.saveSortKind(sortKind)
	}
	document.getElementById('character_sort').addEventListener('change', onSortKindRadioChanged);
	document.getElementById('scene_sort').addEventListener('change', onSortKindRadioChanged);
	document.getElementById('no_sort').addEventListener('change', onSortKindRadioChanged);

	let page = chrome.extension.getBackgroundPage();
	//console.log(page)
	if(typeof page.getMyconf !== 'function'){ // TODO not tested
		console.error('cant get backgrond')
		return
	}
	//console.log(page.getMyconf())

	// 設定値をUIに反映
	document.getElementById(page.getMyconf().targetKind).checked = true;
	document.getElementById('escape_brackets').checked = page.getMyconf().escapeBrackets
	document.getElementById(page.getMyconf().sortKind).checked = true

	// 読み込み成功したのでUIのロックを解除
	document.getElementById('loading_error_message').style.display ="none"
	let inputs = document.getElementsByTagName('input')
	for( let i = 0; i < inputs.length; i++){
		inputs[i].disabled = ''
	}

}, false);
