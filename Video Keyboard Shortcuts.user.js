// ==UserScript==
// @name         Video keyboard shortcuts
// @namespace    https://github.com/buzamahmooza
// @version      0.5
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
// @updateURL    https://gist.github.com/buzamahmooza/b940c84b16f0b5719fa994d54c785cab/raw/
// @grant        GM_setValue
// @grant        GM_getValue
// // @noframes
// ==/UserScript==


/**/

if (typeof unsafeWindow === 'undefined') unsafeWindow = window;
if (typeof debug === 'undefined') debug = true;
if (typeof log === 'undefined') {
    log = (...msg) => (debug) ? console.log('Log:', ...msg) : false;
}
if (typeof unsafeWindow.vidkeysScrLoaded !== 'undefined') {
    console.log('detected another script instance running, terminating instance.');
    void(0);
    // return false;
} else {
    unsafeWindow.vidkeysScrLoaded = true;
    console.log('This is the first script instance');
}
const onYoutube = /youtube.com/.test(document.location.href);
if (onYoutube)
    console.warn('We are on youtube.com! Not gonna run keyboard shortcuts, goodbye');
let isFullScreen = false;
const alwaysStartWithFastPlayBack = false;
const CLASS_TOKEN = `video-keyboard-shortcuts`;

var vids = document.getElementsByTagName('video');
/** {HTMLVideoElement} */
var lastFocusedVid;

const ytpHTML = `<div
 class="ytp-cued-thumbnail-overlay" data-layer="4" style="">
    <div class="ytp-cued-thumbnail-overlay-image"
         style="background-image: url(&quot;https://i.ytimg.com/vi_webp/JDSfqFFbNYQ/maxresdefault.webp&quot;);"></div>
    <button class="ytp-large-play-button ytp-button" aria-label="Play">
        <svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%">
            <path class="ytp-large-play-button-bg" d="" fill="#212121" fill-opacity="0.8"/>
            <path d="M 45,24 27,14 27,34" fill="#fff"/>
        </svg>
    </button>
</div>`;

window.addEventListener('load', function () {
    vids = document.getElementsByTagName('video');
    lastFocusedVid = vids[0];
    observeDocument(/** @param {mutation} mutation */ function (mutation) {
        if (mutation.type == 'childList' && mutation.tagName('video')) {
            handleVideo(mutation);
        }
        const vidNodes = mutation.querySelectorAll('video');
        if (vidNodes.length) {
            console.log('vidNodes:', vidNodes);
            Array.from(vidNodes).forEach(handleVideo);
        }
    });
});
if (vids && vids.length) {
    window.addEventListener('keyup', function (e) {
        // skip this listener for youtube
        if (!onYoutube) switch (e.keyCode) {
            case 75: // K
            case 32: //Space bar
                if (lastFocusedVid.paused)
                    lastFocusedVid.play();
                else
                    lastFocusedVid.pause();
                e.preventDefault();
                break;
        }
        const volumeIncr = 0.1;
        const timeIncr = 10;
        switch (e.keyCode) {
            case 76: // L
                if (onYoutube) break;
            case 39: // RightArrow
                lastFocusedVid.currentTime += (lastFocusedVid.duration < timeIncr ? lastFocusedVid.duration * 0.07 : timeIncr);
                e.preventDefault();
                break;
            case 74: // J
                if (onYoutube) break;
            case 37: // LeftArrow
                lastFocusedVid.currentTime -= (lastFocusedVid.duration < timeIncr ? lastFocusedVid.duration * 0.07 : timeIncr);
                e.preventDefault();
                break;
            case 38: // UpArrow
                lastFocusedVid.volume += volumeIncr;
                e.preventDefault();
                break;
            case 40: // DownArrow
                lastFocusedVid.volume -= volumeIncr;
                e.preventDefault();
                break;
        }
    });

}


function getVideo() {
    return lastFocusedVid ? lastFocusedVid : vids[0];
}

function keyUp(e) {
    let thisVideo = this;
    console.log(`Pressed "${e.key}" to video:\n${thisVideo}`);

    if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        switch (e.keyCode) {
            case 221: // (])
            case 187: // (=)
                thisVideo.playbackRate += 0.1;
                e.preventDefault();
                savePlaybackRate(thisVideo.playbackRate);
                break;
            case 219: // ([)
            case 189: // (-)
                thisVideo.playbackRate -= 0.1;
                e.preventDefault();
                savePlaybackRate(thisVideo.playbackRate);
                break;
            case 48: // Alpha 0 (zero)
                thisVideo.playbackRate = 1;
                log('reset playback speed');
                savePlaybackRate(thisVideo.playbackRate);
                break;
            case 70: // F
                //Full screen
                toggleFullScreen(getVideo());
                // getVideo().webkitEnterFullScreen();
                console.log('Full screen');
                break;
        }
    }
}

/*function observeDocument(callback, opts) {
    callback(document.body);
    const mutationsHandler =
        mutations => mutations.forEach(mutation => mutation.addedNodes.length ? callback(mutation.target) : null);
    const defaultOptions = {
        childList: true, subtree: true,
        attributes: false, characterData: false
    };
    opts.extend(defaultOptions);
    const mutationObserver = new MutationObserver(mutationsHandler);
    mutationObserver.observe(document.body, opts);

    return mutationObserver;
}*/

function observeDocument(callback) {
    callback(document.body);
    const mutationCallback =
        /**@param {mutation} mutationsList */
        function (mutationsList) {
            for (var mutation of mutationsList) {
                if (!mutation.addedNodes.length) continue;
                callback(mutation.target);
            }
        };
    new MutationObserver(mutationCallback).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });
}

function handleVideo(vid) {
    if (vid.classList.contains(CLASS_TOKEN)) {
        // console.log('Nope! Not gonna duplicate listeners on video, sorry.');
        return;
    }
    console.log(`Found video:`, vid, `\n${vid.src}\nAdding video shortcuts.`);

    if (alwaysStartWithFastPlayBack) {
        vid.playbackRate = GM_getValue('startingPlaybackRate', 1.7);
    }
    // keyboard listener
    /** @param {KeyboardEvent}e */
    vid.addEventListener('keyup', keyUp, true);
    console.log('adding eventListener to video:', vid);

    // mouse click listener
    /** @param e {Event} */
    const onClick = function (e) {
        console.log('clicked on video');
        const vid = e.target;
        lastFocusedVid = vid;

        (vid.paused) ? vid.play() : vid.pause();
        e.preventDefault();
    };
    if (!onYoutube) {
        vid.addEventListener("click", onClick, false);
        vid.addEventListener("dblclick", () => toggleFullScreen(vid), false);
    } else {
        console.log("Skipping mouse listener in video cuz it's youtube");
        // don't run on youtube (ruins the click functions)
    }
    vid.classList.add(CLASS_TOKEN);
}

function toggleFullScreen(video) {
    console.log('toggleFullScreen()');
    if (!isFullScreen) {
        video.webkitEnterFullScreen();
        isFullScreen = true;
    } else {
        video.webkitExitFullScreen();
        isFullScreen = false;
    }
}

function savePlaybackRate(newPlaybackRate) {
    if (newPlaybackRate)
        GM_setValue('startingPlaybackRate', newPlaybackRate);
}
