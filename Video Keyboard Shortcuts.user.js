// ==UserScript==
// @name         Add video keyboard shortcuts
// @namespace    https://github.com/buzamahmooza
// @version      0.7
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
// @updateURL
// @grant        none
// ==/UserScript==

if (typeof unsafeWindow === "undefined") unsafeWindow = window;
const alwaysFastPlayBack = false,
    timeIncr = 10,
    volIncr = 0.1
;
if (typeof unsafeWindow.vidkeysScriptLoaded !== 'undefined') {
    console.debug('detected another script instance running, terminating instance.');
    void(0);
} else {
    unsafeWindow.vidkeysScriptLoaded = true;
    console.debug('This is the first script instance');
}

let vids = document.getElementsByTagName('video');
var lastFoc, // last focused video
    isFullScreen;
if (vids.length) lastFoc = vids[0];

observeDocument(function (node) {
    go();
});


function go() {
    if (!vids.length) return;
    window.onkeydown = function (e) {
        keydown(e, lastFoc);
    };
    window.onmousewheel = function (e) {
        onMouseWheel(e);
    };

    for (const vid of vids) {
        if (alwaysFastPlayBack)
            vid.playbackRate = 1.5;

        console.debug('Found video: ' + vid.src + '\nAdding video shortcuts.');

        vid.onclick = function () {
            console.log('clicked on video');
            var vid = this;
            const pausedOld = this.paused;

            // using a timeout to debounce
            setTimeout(function () {
                const statusChanged = vid.paused ^ pausedOld;
                if (statusChanged)
                    return;

                if (pausedOld) // if didn't change
                    vid.play();
                else
                    vid.pause();
            }, 50);

            lastFoc = this;
        };
        vid.onmousewheel = onMouseWheel;
        vid.onkeydown = keydown;
        vid.ondblclick = function () {
            toggleFullScreen(this);
            lastFoc = this;
            console.debug('double click');
        };
    }
}

function toggleFullScreen(element) {
    lastFoc = this;
    if (!isFullScreen) {
        element.webkitRequestFullScreen();
        isFullScreen = true;
    } else {
        document.webkitExitFullscreen();
        isFullScreen = false;
    }
}

function keydown(e, vid) {
    vid = vid || getVisibleVideo || this;
    console.debug('keydown for video:', vid, e);
    var calcTimeIncr = () => (vid.duration < timeIncr / 3 ? vid.duration * 0.07 : timeIncr),
        calcVolIncr = () => ((vid.volume - volIncr < 0) ? 0 : (vid.volume + volIncr > 1) ? 1 : volIncr)
    ;
    if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        switch (e.keyCode) {
            case 75: // K
            case 32: //Space bar
                if (vid.paused)
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

function getVisibleVideo() {
    for (const vid of document.querySelectorAll('video')) {
        if (elementInViewPortPartial(vid)) {
            return vid;
        }
    }
}

function elementInViewPortPartial(el) {
    var top = el.offsetTop;
    var left = el.offsetLeft;
    var width = el.offsetWidth;
    var height = el.offsetHeight;

    while (el.offsetParent) {
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
function onMouseWheel(wheelEvent) {
    var elUnderMouse = elementUnderMouse(wheelEvent),
        vid = (elUnderMouse.tagName == "VIDEO") ? wheelEvent.target :
            elUnderMouse.querySelector('video');

    if (!!vid) {
        var x = getWheelDelta(wheelEvent);
        safelyIncrementVolume(vid, x * volIncr);
        if (isFullScreen || !vid.paused)
            wheelEvent.preventDefault();
    }
}

function safelyIncrementVolume(vid, incr) {
    try {
        vid.volume += incr;
    } catch (e) {
    }
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
    new MutationObserver(function (mutations) {
        for (const mutation of mutations) {
            if (!mutation.addedNodes.length) continue;
            callback(mutation.target);
        }
    }).observe(document.body, {
        childList: true, subtree: true,
        attributes: true, characterData: true
    });
}

/** Create an element by typing it's inner HTML.
 For example:   var myAnchor = createElement('<a href="https://example.com">Go to example.com</a>');
 * @param html
 * @return {Node}
 */
function createElement(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.childNodes[0];
}
