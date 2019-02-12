// ==UserScript==
// @name         DuckDuckGo Enhancer
// @namespace    https://github.com/buzamahmooza
// @author       Faris Hijazi
// @version      0.1
// @icon	     https://www.google.com/s2/favicons?domain=duckduckgo.com
// @match        https://duckduckgo.com*
// @include      https://duckduckgo.com*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        window.close
// @grant        window.focus
// @run-at       document-idle
// @connect      *
// @require      https://code.jquery.com/jquery-3.2.1.slim.min.js
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\Handy AF functions Faris.user.js
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\download_script.user.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// ==/UserScript==


/**abbreviation for querySelectorAll()*/
function qa(selector) { return document.querySelectorAll(selector); }
/**abbreviation for querySelector()*/
function q(selector) { return document.querySelector(selector); }


window.addEventListener('load', onLoad);
function onLoad(){
}
function navigateToJsPage(){
	location.assign(location.href.replace(/duckduckgo.com\//, 'duckduckgo.com/i.js'));
}


new MutationObserver(function(mutations, observer){
	const buttonsContainer = q('#duckbar_static');
	if(!buttonsContainer) return;
	buttonsContainer.appendChild(createElement('<li class="zcm__item"><a href='+(location.href.replace(/duckduckgo.com\//, 'duckduckgo.com/i.js?'))+'>DDG js</a></li>'));
	observer.disconnect();
}).observe(document.body, {
	childList: true, subtree: true,
	attributes: false, characterData: false
});


observeDocument(handleImgBoxes);


function handleImgBoxes(imgBox){
	var imgBoxes = qa('div.tile.tile--img');
	for(const imgBox of imgBoxes){
		const children = imgBox.childNodes;
		const anchor = document.createElement('a');
		anchor.href = imgBox.querySelector('img.tile--img__img.js-lazyload');
	}
}

(function() {
	'use strict';
	// Your code here...
})();


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