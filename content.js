'use strict';

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		//if('content' !== request.dtcMessageTarget){
		//	console.log('through receive message not target.', request.dtcMessageTarget)
		//}

		switch(request.dtcRequestKind){
			case 'collect_tags':
				const tagst = collectTagst_(request.targetKind)
				sendResponse({
					collected_tagst: tagst
				});
				break
			case 'write_clipboard':
				navigator.clipboard.writeText(request.text).then(() => {
					// clipboard successfully set
					console.log('success.')
				}).catch( (e) => {
					// clipboard write failed
					console.warn('failed.', e)
					alert('Error clipboard cant writed. :' + e.message)
				});
				break
			default:
				alert('BUG: internal invalid request. :' + request.dtcRequestKind)
		}
	}
);

