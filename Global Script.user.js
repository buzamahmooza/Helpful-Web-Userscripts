

(function() {
	'use strict';

	// KeyboardListener for the shortcuts
	document.addEventListener('keydown', function(e) {
		if (!e.shiftKey && !e.ctrlKey && e.altKey && !e.metaKey){
			switch(e.keyCode){
				case 38: //alt+up
					var newLoc = location.href;
					try{ newLoc = location.href.substring(0, location.href.lastIndexOf('/')); } catch(exception) {}
					console.log('location after removing the last"/":', newLoc);
					location.href = newLoc;
					break;
			}
		}
		if (!e.shiftKey && e.ctrlKey && !e.altKey && !e.metaKey)
		{
			switch(e.keyCode){
				case 83: //Ctrl+S
					// https://github.com/*/edit/*.*
					if(matchSite(/github.com\/(.*)/)) { // github edit file
						e.preventDefault();
						let submitBtn = document.querySelector('div.edit.container > div.form-actions > button');
						submitBtn.click();
						// All found selectors till now:
						// form > div.js-suggester-container.js-previewable-comment-form.previewable-comment-form.write-selected > div.clearfix > div.form-actions > button.btn.btn-primary
						// #submit-file
						// div.edit.container > div.form-actions > button
					}
					break;
			}
		}

	},false);

	if(matchSite(/https:\/\/photos.google.com/)) { // google photos
		//autoclick confirmation uppon deletion
		new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (!mutation.addedNodes) return;
				for (var i = 0; i<mutation.addedNodes.length; i++) {
					var node = mutation.addedNodes[i];
					var confirmDel = node.querySelectorAll('.ZFr60d.CeoRYc')[3].nextSibling;
					confirmDel.click();
					console.log('confirmed delete button');
				}
			});
		}).observe(document.body, {
			childList: true, subtree: true,
			attributes: false, characterData: false
		});


		document.addEventListener('keydown', function(e) {
			if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey)
			{
				switch(e.keyCode){
					case 46: // Del
						e.preventDefault();
						// var selected = document.querySelectorAll('.WjVZdb .R1sU4e');
						// var threeDotsBtn = document.querySelector('#ow651 > content > span > svg');
						let delBtn = document.querySelector('[data-tooltip="Delete"]');
						if(delBtn) delBtn.click();
						let confirmationPopup = document.querySelector('div[title="Remove from Google account, synced devices, and places it\'s shared?"]');
						let confirmDelBtn = confirmationPopup.childNodes[2];
						if(confirmDelBtn) confirmDelBtn.click();
						break;
				}
			}

		},false);
	}

	// reddit.com
	if(matchSite("https://www.reddit.com/*")){
		let confirmBtn = document.querySelector('body > div.content > div > form > div > button:nth-child(2)');
		if(confirmBtn !== null) confirmBtn.click();
	}

	// NEEDS WORK!!!
	if(matchSite("https://blackboard.kfupm.edu.sa|login.kfupm.edu.sa")){
		setInterval(function(){
			var confirmBtn = document.getElementById('entry-login')|
				document.querySelector('#lognbtn > input')
			;
			if(confirmBtn) {
				confirmBtn.click();
				console.log('clicking submit button');
			} else {
				return;
			}
		},500);


		// observeDocument(function(node){if(node.querySelector('#entry-login')!==null)node.click();});
		// clickWhenBtnAppears('#entry-login');
		// if(confirmBtn!==null) confirmBtn.click();
	}


	// Google.com (images) delocalize (removes .sa or .ne etc)
	let hostname = urlToAnchor(location.href).hostname;
	if( matchSite(/google\.(.*)&source=hp/)){
		if(hostname!=='www.google.com'){
			location.href = (document.location.href.replace(hostname, 'www.google.com'));
			// location = (document.location.href.replace(/\.(sa|ne|nl)/, '.com'));
		}
	}
	if(matchSite(/pcworld.com*/)){
		new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (!mutation.addedNodes) return;
				for (var i = 0; i < mutation.addedNodes.length; i++) {
					var node = mutation.addedNodes[i];
					if(node.tag==='vid')
						node.style.remove();
				}
			});
		}).observe(document.body, {
			childList: true, subtree: true,
			attributes: false, characterData: false
		});
	}
})();

function on(hostname){ if(!!hostname) return (location.hostname).match(new RegExp(hostname));}

// if the current location matches this website
function matchSite(siteRegex){
	let result = (location.href).match(siteRegex);
	if(result && result.length) console.log("Site matched regex: "+siteRegex);
	return result;
}

// when you're done with the link, be sure to clean it for garbage collection (link=null;)
function urlToAnchor(url){
	var link = document.createElement('a'); // Create an anchor element
	link.setAttribute('href', url);

	// Get any piece of the url you're interested in
	// in the url = 'http://example.com:12345/blog/foo/bar?startIndex=1&pageSize=10' :
	let hostname = link.hostname,  //  'example.com'
		port = link.port,          //  12345
		search = link.search,      //  '?startIndex=1&pageSize=10'
		pathname = link.pathname,  //  '/blog/foo/bar'
		protocall = link.protocol; //  'http:'
	return link;
}

function observeDocument(callback) {
	callback(document.body);
	new MutationObserver(function(mutations){
		for (var i = 0; i < mutations.length; i++) {
			if (!mutations[i].addedNodes.length) continue;
			callback(mutations[i].target);
		}
	}).observe(document.body, {
		childList: true, subtree: true,
		attributes: false, characterData: false
	});
}
function clickWhenBtnAppears(selector) {
	observeDocument(function(node){
		var btns = node.querySelectorAll(selector);
		for(var i=0;i<btns.length;i++)
			btns[i].click();
	});
}
function clickBtn(node) {
	node.click();
	console.log('pushed the button');
}