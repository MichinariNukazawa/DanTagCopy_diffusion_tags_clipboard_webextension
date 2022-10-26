'use strict';

window.addEventListener( 'load', function(e){
	console.log('loaded')

	// ** set callbacks
	let onTargetKindRadioChanged = function(e){
		console.debug("change", e.currentTarget.id);
		const targetKind = e.currentTarget.id;
		chrome.runtime.sendMessage({
			'dtcMessageTarget': 'service_worker',
			'dtcMessageKind': 'target_kind',
			'targetKind': targetKind
	   })
	}
	document.getElementById('diffusion').addEventListener('change', onTargetKindRadioChanged);
	document.getElementById('novelai').addEventListener('change', onTargetKindRadioChanged);

	document.getElementById('escape_brackets').addEventListener('change', (e) => {
		console.debug("change", e.currentTarget.id);
		chrome.runtime.sendMessage({
			'dtcMessageTarget': 'service_worker',
			'dtcMessageKind': 'escape_brackets',
			'escapeBrackets': document.getElementById('escape_brackets').checked
	   })
	});
	
	let onSortKindRadioChanged = function(e){
		console.debug("change", e.currentTarget.id);
		const sortKind = e.currentTarget.id;
		chrome.runtime.sendMessage({
			'dtcMessageTarget': 'service_worker',
			'dtcMessageKind': 'sort_kind',
			'sortKind': sortKind
	   })
	}
	document.getElementById('character_sort').addEventListener('change', onSortKindRadioChanged);
	document.getElementById('scene_sort').addEventListener('change', onSortKindRadioChanged);
	document.getElementById('no_sort').addEventListener('change', onSortKindRadioChanged);

	// ** configure
	chrome.runtime.onMessage.addListener((request) => {
		if('popup' !== request.dtcMessageTarget){
			console.log('through receive message not target.', request.dtcMessageTarget)
			return
		}

		const myconf = request.myconf
		console.log('received myconf', myconf)

		// 設定値をUIに反映
		document.getElementById(myconf.targetKind).checked = true;
		document.getElementById('escape_brackets').checked = myconf.escapeBrackets
		document.getElementById(myconf.sortKind).checked = true

		// ** 読み込み成功したのでUIのロックを解除
		document.getElementById('loading_error_message').style.display ="none"
		let inputs = document.getElementsByTagName('input')
		for( let i = 0; i < inputs.length; i++){
			inputs[i].disabled = ''
		}
	})
	chrome.runtime.sendMessage({
		 'dtcMessageTarget': 'service_worker',
		 'dtcMessageKind': 'get_my_conf'
	})

}, false);
