// ==UserScript==
// @name         Add video keyboard shortcuts
// @namespace    https://github.com/buzamahmooza
// @version      0.6
// @description  Adds keyboard shortcuts to HTML5 videos.
//               Left Click:  Toggle Pause/Play
//               F or dblClk: Toggle Fullscreen
//               SpaceBar:    Toggle Pause/Play
//               Left/Right:  Navigate back/forward
//               -,[ / =,]:   - / + Playback speed
//               Zero (0):    Reset playback speed
// @author       Faris Hijazi
// @match        *
// @include      *
// @exclude      *youtube.com*
// @updateURL    https://github.com/buzamahmooza/Helpful-Web-Userscripts/edit/master/Video%20Keyboard%20Shortcuts.user.js
// @grant        none
// ==/UserScript==

if (typeof unsafeWindow === "undefined") unsafeWindow = window;
const alwaysFastPlayBack = true,
	  timeIncr = 10,
	  volIncr = 0.1
;
if (typeof unsafeWindow.vidkeysScrLoaded !== 'undefined') {
	console.log('detected another script instance running, terminating instance.');
	void(0);
	// return false;
} else {
	unsafeWindow.vidkeysScrLoaded = true;
	console.log('This is the first script instance');
}

let vids = document.getElementsByTagName('video');
var lastFoc; // last focused video
if(vids.length) lastFoc = vids[0];

function go(){
	if(!vids.length) return;
	window.onkeydown = function(e){
		keydown(e, lastFoc);
	};
	window.onmousewheel = function(e){
		onMouseWheel(e);
	};

	for(const vid of vids){
		if(alwaysFastPlayBack)
			vid.playbackRate = 1.5;

		console.log('Found video: '+vid.src+'\nAdding video shortcuts.');

		vid.onclick = function(){
			console.log('clicked on video');
			var vid = document.querySelector('video');
			if(this.paused)
				this.play();
			else
				this.pause();
			lastFoc = this;
		};
		vid.onmousewheel = onMouseWheel;
		// vid.onfocus = function(e){
		// 	lastFoc = this;
		// 	console.debug('video focused:', this, e);
		// };

		vid.onkeydown = keydown;

		var isFullScreen;
		vid.ondblclick = function () {
			lastFoc = this;
			console.log('double click');
			toggleFullScreen(this);
		};

		var toggleFullScreen = function(element){
			lastFoc = this;
			if(!isFullScreen) {
				element.webkitRequestFullScreen();
				isFullScreen = true;
			} else {
				document.webkitExitFullscreen();
				isFullScreen = false;
			}
		};
	}
}

function keydown(e, vid) {
	vid = vid || getVisibleVideo || this;
	console.debug('keydown for video:', vid, e);
	var calcTimeIncr = () => (vid.duration < timeIncr/3 ? vid.duration * 0.07 : timeIncr),
		calcVolIncr = () => ((vid.volume-volIncr <0) ? 0 : (vid.volume+volIncr >1) ? 1 :volIncr)
	;
	if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
		switch(e.keyCode){
			case 75: // K
			case 32: //Space bar
				if(vid.paused)
					vid.play();
				else
					vid.pause();
				e.preventDefault();
				break;
			case 76: // L
			case 39: // RightArrow
				console.debug('>');
				vid.currentTime += calcTimeIncr();
				e.preventDefault();
				break;
			case 74: // J
			case 37: // LeftArrow
				vid.currentTime -= calcTimeIncr();
				console.debug('<');
				e.preventDefault();
				break;
			case 38: // UpArrow
				safelyIncrementVolume(vid, volIncr);
				e.preventDefault();
				break;
			case 40: // DownArrow
				safelyIncrementVolume(vid, -volIncr);
				e.preventDefault();
				break;
			case 221: // (])
			case 187: // (=)
				vid.playbackRate += 0.1;
				e.preventDefault();
				break;
			case 219: // ([)
			case 189: // (-)
				vid.playbackRate -= 0.1;
				e.preventDefault();
				break;
			case 48: // Alpha 0 (zero)
				vid.playbackRate = 1;
				console.log('reset playback speed');
				break;
			case 70: // F
				//Full screen
				toggleFullScreen(vid);
				// vid.webkitEnterFullScreen();
				console.log('Full screen');
				break;
		}
	}
}

function getVisibleVideo(){
	for(const vid of document.querySelectorAll('video')){
		if(elementInViewPortPartial(vid)){
			return vid;
		}
	}
}

function partOfElementInViewport(el) {
	var top = el.offsetTop;
	var left = el.offsetLeft;
	var width = el.offsetWidth;
	var height = el.offsetHeight;

	while(el.offsetParent) {
		el = el.offsetParent;
		top += el.offsetTop;
		left += el.offsetLeft;
	}

	return (
		top < (window.pageYOffset + window.innerHeight) &&
		left < (window.pageXOffset + window.innerWidth) &&
		(top + height) > window.pageYOffset &&
		(left + width) > window.pageXOffset
	);
}

// mousewheel listener
function onMouseWheel(wheelEvent){
	var elUnderMouse = elementUnderMouse(wheelEvent),
		vid = (elUnderMouse.tagName == "VIDEO")? wheelEvent.target:
	elUnderMouse.querySelector('video');

	if(!!vid) {
		var x = getWheelDelta(wheelEvent);
		safelyIncrementVolume(vid, x*volIncr);
		wheelEvent.preventDefault();
	}
}
function safelyIncrementVolume(vid, incr){
    try{
        vid.volume += incr;
    }catch(e){}
	// incr = incr || volIncr;
	// vid.volume = (incr<0 && (vid.volume - incr <0) ? 0 : incr>0 && (vid.volume+incr >1) ? 1 : vid.volume);
}

/**
 * cross-browser wheel delta
 * Returns the mousewheel scroll delta as -1 (wheelUp) or 1 (wheelDown) (cross-browser support)
 * @param {MouseWheelEvent} wheelEvent
 * @return {number} -1 or 1
 */
function getWheelDelta(wheelEvent) {
	// cross-browser wheel delta
	wheelEvent = window.event || wheelEvent; // old IE support
	return Math.max(-1, Math.min(1, (wheelEvent.wheelDelta || -wheelEvent.detail)));
}

function elementUnderMouse(wheelEvent) {
	return document.elementFromPoint(wheelEvent.clientX, wheelEvent.clientY);
}

function observeDocument(callback) {
	callback(document.body);
	new MutationObserver(function(mutations){
		for (const mutation of mutations) {
			if (!mutation.addedNodes.length) continue;
			callback(mutation.target);
		}
	}).observe(document.body, {
		childList: true, subtree: true,
		attributes: true, characterData: true
	});
}

observeDocument(function(node){
	go();
});
