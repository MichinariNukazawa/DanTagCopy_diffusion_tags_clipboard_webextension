'use strict';

window.addEventListener( 'load', function(e){
	console.log('loaded')

	let onTargetKindRadioChanged = function(e){
		console.debug("change", e.currentTarget.id);
		const targetKind = e.currentTarget.id;
		page.saveTargetKind(targetKind)
	}
	document.getElementById('diffusion').addEventListener('change', onTargetKindRadioChanged);
	document.getElementById('novelai').addEventListener('change', onTargetKindRadioChanged);

	let page = chrome.extension.getBackgroundPage();
	//console.log(page)
	if(typeof page.getMyconf !== 'function'){ // TODO not tested
		console.error('cant get backgrond')
		return
	}
	//console.log(page.getMyconf())
	switch(page.getMyconf().targetKind){
		case 'diffusion':
			document.getElementById('diffusion').checked = true;
			break
		case 'novelai':
			document.getElementById('novelai').checked = true;
			break
		default:
	}

	// 読み込み成功したのでUIのロックを解除
	document.getElementById('loading_error_message').style.display ="none"
	document.getElementById('diffusion').disabled = ''
	document.getElementById('novelai').disabled = ''

}, false);
