'use strict';

let myconf;

window.addEventListener( 'load', function(e){
	console.log('loaded')

	// ** set callbacks
	let onTargetKindRadioChanged = function(e){
		console.debug("change", e.currentTarget.id);

		const targetKind = e.currentTarget.id;
		myconf.targetKind = targetKind;
		chrome.storage.local.set(myconf)
	}
	document.getElementById('diffusion').addEventListener('change', onTargetKindRadioChanged);
	document.getElementById('novelai').addEventListener('change', onTargetKindRadioChanged);

	document.getElementById('escape_brackets').addEventListener('change', (e) => {
		console.debug("change", e.currentTarget.id);

		myconf.escapeBrackets = document.getElementById('escape_brackets').checked;
		chrome.storage.local.set(myconf)
	});

	document.getElementById('with_url').addEventListener('change', (e) => {
		console.debug("change", e.currentTarget.id);

		myconf.withUrl = document.getElementById('with_url').checked;
		chrome.storage.local.set(myconf)
	});

	let onSortKindRadioChanged = function(e){
		console.debug("change", e.currentTarget.id);
		
		const sortKind = e.currentTarget.id;
		myconf.sortKind = sortKind;
		chrome.storage.local.set(myconf)
	}
	document.getElementById('character_sort').addEventListener('change', onSortKindRadioChanged);
	document.getElementById('scene_sort').addEventListener('change', onSortKindRadioChanged);
	document.getElementById('no_sort').addEventListener('change', onSortKindRadioChanged);

	// ** configure
	chrome.storage.local.get(function(items) {
		console.log('loaded', items)
		if(Object.keys(items).length === 0){
			console.warn('BUG nothing configure.')
			return
		}
		myconf = items

		// 設定値をUIに反映
		document.getElementById(myconf.targetKind).checked = true;
		document.getElementById('escape_brackets').checked = myconf.escapeBrackets
		document.getElementById('with_url').checked = myconf.withUrl
		document.getElementById(myconf.sortKind).checked = true

		// ** 読み込み成功したのでUIのロックを解除
		document.getElementById('loading_error_message').style.display ="none"
		let inputs = document.getElementsByTagName('input')
		for( let i = 0; i < inputs.length; i++){
			inputs[i].disabled = ''
		}
	})

}, false);
