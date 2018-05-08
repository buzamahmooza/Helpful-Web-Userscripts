// ==UserScript==
// @name         Super google
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Open google images in page instead of new tab
// @author       Faris Hijazi
// @include      /https?://(www|encrypted)\.google\..*/
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @require      http://code.jquery.com/jquery-latest.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @run-at       document-end
// ==/UserScript==

// @require      https://github.com/buzamahmooza/Helpful-Web-Userscripts/raw/master/Handy%20AF%20functions%20Faris.user.js
// @require      https://greasyfork.org/scripts/38996-faris-handy-webdev-javascript-functions/code/Faris%20Handy%20Webdev%20JavaScript%20functions.user.js


// To-do list:
// [] TODO  Migrate all the buttons and extra Google stuff from the DisplayOriginalImages script
// [] TODO  Make function unionTitles(title1, title2) (has words in both but without duplicates), good for naming images using both description and title
// [] TODO  work on the saveublsites function to save data as JSON (information such as: ddgp, dimensions, #successes, #dgpSuccesses)
// [x]      Have a method that injects stuff to the imagePanels (only once at start)
// [x]      FIX "SearchByImage" button
// [x]      FIX the image downloading with a limit. Problem: When Images fail to load, they still count towards the download cap.
// [x]      Add "DownloadRelatedImages" button
// [x]      DownloadRelatedImages button doesn't get the right description for the first image
// [x]      Make it that navigating across related images, going left (pressing Up) would take you to the last relatedImage of the previous imagePanel (instead of starting at the first one (top-left))
// [x]      Mouse wheel scrolling will navigate through relatedImages (when the mouse is in a specific location like on the panel)
// [x]      Make classes for the image-panels
// [x]      Add image dimensions next to sTitle
// [] TOD


/** Just for the stupid IDE to shut up */
if (typeof GM_getValue === "undefined") GM_getValue = params => params;
if (typeof GM_setValue === "undefined") GM_setValue = params => params;


// noinspection ES6ConvertVarToLetConst
var debug = true;
var logAnnoyingNetworkErrors = false;
if (typeof debug === 'undefined') debug = false;
if (typeof log === 'undefined') log = (...msg) => (debug) ? console.log('Log:', ...msg) : false;

var AUTO_SAVE_UBL_SITES = GM_getValue('AUTO_SAVE_UBL_SITES', false);

googleBaseURL = location.protocol + "google.com";
gImgSearchURL = googleBaseURL + "/search?&hl=en&tbm=isch&q=";

const UBL_SITES_VALUE_NAME = 'unblocked sites of og images',
    UBL_SITES_MAP_VALUE_NAME = 'UBL sites map';
let ublSet = new Set();

/**
 * Contains the ubl data of a single domain name
 */
class UBLdata {
    constructor(url, successful, dataObj) {
        this.hostname = getHostname(url);
        this.scc_ddgp = 0;
        this.scc_tot = 0;
        /** contains and object with a URL and some data about it
         * @type {Map<Object>} */
        this.resultMap = new Map();

        if (url.length !== this.hostname.length) {
            this.addURL(url, successful, dataObj);
        }
    }

    /** @return {number} % of the URLs unblocked (excluding DDGP) */
    get percentUbl() {
        return 100 * this.scc_tot / this.resultMap.size;
    }
    /** @return {number} % of the URLs unblocked (including DDGP) */
    get percentUblTotal() {
        return 100 * (this.scc_tot + this.scc_ddgp) / this.resultMap.size;
    }
    /** @return {number} % of the URLs unblocked (including DDGP) */
    get percentUblDDGP() {
        return 100 * (this.scc_ddgp) / this.resultMap.size;
    }

    /**
     * @param url: the url that you want to store, and store the data of
     * @param successful: did the image/file load?
     * @param o an object containing data about the image, such as: "dimensions", "title"
     */
    addURL(url, successful, o) {
        if (successful && !this.resultMap.has(url)) {
            if (isDdgUrl(url)) {
                this.scc_ddgp++;
            } else {
                this.scc_tot++;
            }
        }
        if (o != null && o.imgEl != null) {
            if (o.dimensions == null)
                o.dimensions = o.imgEl.getAttribute('img-dim');
        }
        this.resultMap.set(url, o);
        return this;
    }
}

let ublMap = $.extend(new Map(), {
    addURL: function (url, successful, o) {
        const siteHostname = getHostname(url);
        if (this.has(siteHostname)) {
            this.set(siteHostname, this.get(siteHostname).addURL(url, successful, o));
        } else {
            this.set(siteHostname, new UBLdata(url, successful, o));
        }
    }
});

if (typeof GM === 'undefined') // PRE GM4
{
    GM = {};
    // noinspection JSUnresolvedVariable
    GM.getValue = GM_getValue;
    // noinspection JSUnresolvedVariable
    GM.setValue = GM_setValue;
}

if (typeof unsafeWindow === "undefined") {
    unsafeWindow = window;
}

// prevents duplicates
if (typeof unsafeWindow.superGoogleScript === 'undefined') {
    unsafeWindow.superGoogleScript = this;
} else {
    void(0);
}

// OPTIONS:
let LOOP_RELATED_IMAGES = GM_getValue('LOOP_RELATED_IMAGES', false);
const invertWheelRelativeImageNavigation = false,
    successColor = 'rgb(167, 99, 255)',
    DEFAULT_TARGET = "_blank",
    urlArgs = '', // '&tbs=isz:lt,islt:2mp',
    allSizesSelector = '#jHnbRc > div.O1id0e > span:nth-child(2) > a'	// The "All sizes" link from the SearchByImage page
;

let progressBar,
    zippingInProgress = false,
    zipTotal = 0,
    activeZipThreads = 0,
    totalSize = 0,
    totalLoaded = 0,
    searchModeDiv = q('#hdtb-msb-vis'),
    selectedSearchMode = !searchModeDiv ? null : searchModeDiv.querySelector('div.hdtb-msel'),
    onGoogleImages = selectedSearchMode && selectedSearchMode.innerHTML == 'Images'
;


const staticNavbar = false;
// language=CSS
addCss
(`.hover-click:hover,
.hover-click:focus {
    color: #999;
    text-decoration: none;
    cursor: pointer;
}

.sg { /*sg=SuperGoogle, this is padding for the buttons and controls*/
    margin: 8px;
}

input[type="range"] + label { /*The label elements displaying the slider readings*/
    padding: 6px;
}

a.irc_mutl, a.irc_mi {
    display: contents !important;
}

/*The right upper part of the image panel (containing description and title and stuff)*/
div.irc_hd * {
    margin-right: 3px;
    margin-bottom: 2px;
}

/*keeps the bar at a fixed position when scrolling*/
/*.rshdr, .jsrp{position:fixed; height:100%; width:100%; left:0; top:0; z-index:2;}
#rcnt{position:relative; z-index:1; margin:100% 0 0;}*/
div#extrares {
    display: none !important;
}

.irc_asc {
    display: inline-block !important;
}

/**/

[type="range"] {
    -webkit-appearance: none;
    /*width: 70%;*/
    height: 15px;
    border-radius: 5px;
    background: #d3d3d3;
    outline: none;
    opacity: 0.7;
    -webkit-transition: .2s;
    transition: opacity .2s;
}

[type="range"]:hover {
    opacity: 1;
}

[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: darkorange;
    cursor: pointer;
}

[type="range"]::-moz-range-thumb {
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background: darkorange;
    cursor: pointer;
}

.fixed-position ${staticNavbar ? ', #qbc, #rshdr :not(#sfcnt)' : ''} {
	position: fixed;
	top: 0;
	z-index: 16777271;
}

.ubl-site {
    color: ${successColor} !important;
}
/*Hide the extra content warning and policy*/
`);


/** change mouse cursor when hovering over elements for scroll navigation
 * cursor found here:   https://www.flaticon.com/free-icon/arrows_95103#
 */
/*addCss(`
 /!*
 .scroll-nav *:hover:not(.hover-click),
 .scroll-nav *:focus:not(.hover-click)
 {
 cursor:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTcuMS4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDM0Ny4yMjMgMzQ3LjIyMyIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMzQ3LjIyMyAzNDcuMjIzOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8cGF0aCBkPSJNMzQzLjcyNiwxNjYuODY1bC00NC4wMDktMzAuODMzYy0xLjQxMy0wLjk5LTIuNzI4LTEuNTEzLTQuMjUyLTEuNTEzYy0zLjMwNywwLTYuNDE3LDIuNTEyLTYuNDE3LDcuMzEzdjkuNzhoLTQ0LjA3NiAgIGMtNC45NjIsMC04LjkyNCwzLjc0My04LjkyNCw4LjcwNXYyNS44N2MwLDQuOTYyLDMuOTYyLDkuNDI1LDguOTI0LDkuNDI1aDQ0LjA3NnY5LjA2NGMwLDQuOCwzLjExMSw2LjkzNiw2LjQxOCw2LjkzNmgtMC4xMTggICBjMS41MjQsMCwzLjAxNy0wLjMzNSw0LjQzMS0xLjMyNGw0My45NzctMzAuNzM3YzIuMjEzLTEuNTUxLDMuNDY3LTMuODMzLDMuNDY3LTYuMzQ0ICAgQzM0Ny4yMjMsMTcwLjY5NiwzNDUuOTM4LDE2OC40MTQsMzQzLjcyNiwxNjYuODY1eiIgZmlsbD0iIzAwMDAwMCIvPgoJPHBhdGggZD0iTTEwMi4yMDgsMTUxLjYxMUg1OS4wNDh2LTkuNzhjMC00LjgwMS0zLjU2OS03LjMxMy02Ljg3Ni03LjMxM2MtMS41MjQsMC0zLjE4OCwwLjUyMy00LjYwMSwxLjUxM0wzLjUwOSwxNjYuODYyICAgQzEuMjk3LDE2OC40MTMsMCwxNzAuNzQyLDAsMTczLjI1MmMwLDIuNTEsMS4yNTUsNC44MzksMy40NjgsNi4zOTFsNDQuMDAyLDMwLjY0NWMxLjQxMywwLjk4OSwyLjk2MSwxLjMyNCw0LjQ4NiwxLjMyNGgtMC4wMDEgICBjMi4wODIsMCw0LjIwMy0wLjc3LDUuNDM4LTIuNDQxYzAuOTM5LTEuMjcyLDEuNjU1LTIuNzAzLDEuNjU1LTQuNDk1di05LjA2NGg0My4xNjFjNC45NjIsMCw4LjgzOS00LjQ1OSw4LjgzOS05LjQyMXYtMjUuODcgICBDMTExLjA0OCwxNTUuMzU4LDEwNy4xNzEsMTUxLjYxMSwxMDIuMjA4LDE1MS42MTF6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8cGF0aCBkPSJNMTkyLjA0OCwxNy42MTFoLTM3Yy00Ljk2MiwwLTksNC4wMzgtOSw5djI5NGMwLDQuOTYyLDQuMDM4LDksOSw5aDM3YzQuOTYyLDAsOS00LjAzOCw5LTl2LTI5NCAgIEMyMDEuMDQ4LDIxLjY0OSwxOTcuMDEsMTcuNjExLDE5Mi4wNDgsMTcuNjExeiIgZmlsbD0iIzAwMDAwMCIvPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=) 16 16, auto;
 }
 *!/

 .grey-scale,
 img[loaded="error"] {
 -webkit-filter: grayscale(1); /!* Webkit *!/
 filter: gray; /!* IE6-9 *!/
 filter: grayscale(1); /!* W3C *!/
 }

 img[loaded="error"],
 img[loaded="false"] {
 opacity: 0.5;
 filter: alpha(opacity=50); /!* For IE8 and earlier *!/
 }

 img[loaded="true"] {
 opacity: 1;
 filter: alpha(opacity=100); /!* For IE8 and earlier *!/
 }`);*/

// Modifying the URL and adding arguments, such as specifying the size
if (urlArgs && urlArgs.length) {
    var hIdx = location.href.indexOf('#');
    if (!(hIdx > -1)) hIdx = location.href.length;
    if (!new RegExp(urlArgs).test(location.href)) {
        var newLocation = location.href.substring(0, hIdx) + urlArgs + location.href.substring(hIdx, location.href.length);
        console.debug('new location:', newLocation);
        location.href = newLocation;
    }
}


const belowDivClassName = 'below-st-div';

function containsClassName(element, token) {
    return element.classList.contains(token) || element.querySelector(token);
}

/**
 * is el1 == el2 OR contains el2?
 * @param element
 * @param el2
 * @return {boolean}
 */
function isOrContains(element, el2) {
    if (element == el2) console.log('element == el2', element, el2);
    return element.contains(el2) || element == el2;
}

unsafeWindow.getImgMetaById = getImgMetaById;

function getImgMetaById(id) {
    for (const metaEl of qa('.rg_meta')) {
        if ((new RegExp(id, "im")).test(metaEl.innerText)) {
            try {
                return JSON.parse(metaEl.innerText);
            } catch (e) {
                console.warn(e);
                return false;
            }
        }
    }
    return false;
}

unsafeWindow.zipImages = zipImages;
var zip = new JSZip();
unsafeWindow.zip = zip;
unsafeWindow.genZip = genZip;

function genZip(zipName) {
    zip.generateAsync({type: "blob"}).then(function (content) {
            zipName = (zipName || document.title).replace(/site:|( - Google Search)/gi, '');
            const infoName = `info_${zipName}.txt`;
            if (!zip.files.hasOwnProperty(infoName)) {
                zip.file(infoName, new Blob([getGimgPageInfoText()], {type: 'text/plain'}));
            }
            saveAs(content, `${zipName} [${Object.keys(zip.files).length}].zip`);
            unsafeWindow.zipGenerated = true;
            window.onbeforeunload = null;
        }
    );

}

unsafeWindow.extractRarbgTorrentURL = extractRarbgTorrentURL;

//  https://rarbg.unblocker.win/download.php?id= kmvf126 &f= <TorrentName>-[rarbg.to].torrent
/**
 * @param {string} torrentName
 * @param {string} torrentPageURL
 * @returns {string}
 */
function extractRarbgTorrentURL(torrentName, torrentPageURL) {
    var torrentURL;
    torrentURL = torrentPageURL.replace(/torrent\//i, 'download.php?id=') + "&f=" + torrentName.split(/\s+/)[0] + ".torrent";
    console.debug('extracted rarbg torrent URL:', torrentURL);
    return torrentURL;
}

/**
 * This will set the style of an element by force, by manipulating the style HTML attribute.
 * This gives you more control, you can set the exact text you want in the HTML element (like giving a style priority via "!important").
 * @param {HTMLElement} el
 * @param {String} styleProperty
 * @param {String} styleValue
 * @return el
 */
function setStyleByHTML(el, styleProperty, styleValue) {
    styleProperty = styleProperty.trim();

    if (el.hasAttribute('style')) {
        const styleText = el.getAttribute('style');
        const styleArgument = `${styleProperty}: ${styleValue};`;

        let newStyle = new RegExp(styleProperty, 'i').test(styleText) ?
            styleText.replace(new RegExp(`${styleProperty}:.+?;`, 'im'), styleArgument) :
            styleText + ' ' + styleArgument;

        console.log(
            'adding to style ', `"${styleArgument}"`,
            '\nnewStyle:', `"${newStyle}"`,
            '\nelement:', el
        );
        el.setAttribute('style', newStyle);
    }
    return el;
}
unsafeWindow.setStyleByHTML = setStyleByHTML;

/*Image boxes:
 classNames:


 WITH SCRIPTS ON:

 <div jscontroller="Q7Rsec" data-ri="74" class="rg_bx rg_di rg_el ivg-i" data-ved="" data-row="14"
 <a jsname="hSRGPd"
 href="OG URL"
 jsaction="fire.ivg_o;mouseover:str.hmov;mouseout:str.hmou" class="rg_l" rel="noreferrer"
 referrerpolicy="no-referrer">
 <div class="Q98I0e" jsaction="IbE0S"></div>
 <img class="rg_ic rg_i"
 data-src="Thumbnail URL"
 name="The_ID"
 jsaction="load:str.tbn"
 onload="typeof google==='object'&amp;&amp;google.aft&amp;&amp;google.aft(this)"
 src="Thumbnail URL">
 <div class="rg_ilmbg"><a rel="noreferrer" referrerpolicy="no-referrer" href="The site URL" class="x_source_link">
 610&nbsp;×&nbsp;340 - gameinformer.com </a></div>
 </a>
 <div jsname="ik8THc" class="rg_meta notranslate"> {meta info}</div>
 </div>

 WITH SCRIPTS OF:
 <div jscontroller="Q7Rsec" data-ri="74" class="rg_bx rg_di rg_el ivg-i" data-ved="" data-row="14"
 <a jsname="hSRGPd"
 href="Takes you to some weird google images panel page for a single image"
 jsaction="fire.ivg_o;mouseover:str.hmov;mouseout:str.hmou" class="rg_l" rel="noopener"
 referrerpolicy="no-referrer">
 <div class="Q98I0e" jsaction="IbE0S"></div>
 <img class="rg_ic rg_i"
 data-src="Thumbnail URL"
 name="The_ID:" jsaction="load:str.tbn"
 onload="typeof google==='object'&amp;&amp;google.aft&amp;&amp;google.aft(this)"
 src="Thumbnail URL">
 <div class="rg_ilmbg">
 610&nbsp;×&nbsp;340 - gameinformer.com
 </div>
 </a>
 <div jsname="ik8THc" class="rg_meta notranslate"> {meta info}</div>
 </div>

 */


/*
 @info:  #irc_cb     the panel element containing the current image [data-ved], so if you observe this element, you can get pretty much get all the data you want.
 @info:  #lst-ib     search box
 */
/**
 * ImagePanel class
 * Provides functions for a partner element (one of the 3 panels)
 * Abbreviations:
 * ris: related image search
 * fc:  focused
 * sbi: search by image
 */
class IP {  // ImagePanel class
    constructor(element) {
        if (typeof element !== 'undefined') {
            this.el = element;
        }
    }

    /** @return {HTMLDivElement} */
    static get mainPanelEl() {
        return q("#irc_cc");
    }
    /** @return {IP} returns the panel that is currently in focus (there are 3 panels) */
    static get focP() {
        return this.mainPanelEl ? new IP(this.mainPanelEl.querySelector('div.irc_c[style*="translate3d(0px, 0px, 0px)"]')) : console.warn('MainPanel not found!');
        // return this.mainPanelEl ? new IP(this.mainPanelEl.querySelector('div.immersive-container')) : console.warn('MainPanel not found!');
    }

    /**
     * @return {{ clt: string, id: string,
                 isu: string, itg: string, ity: string,
                 oh: string, ou: string, ow: string,
                 pt: string,
                 rid: string, rmt: string, rt: string, ru: string,
                 s: string, st: string,
                 th: string, tu: string, tw
                 }} */
    get imageData() {
        return JSON.parse(getDataText(this.mainImage));
    }

    get isFocused() {
        return new RegExp(`translate3d(0px, 0px, 0px)`, 'i').test(this.el.getAttribute('style'));
    }

    /** @return {HTMLDivElement} */
    get titleAndDescriptionDiv() {
        if (!this.el) {
            return;
        }
        const titleAndDescrDiv = this.q('div._cjj, div.Qc8zh, div.i30053').querySelector('div.irc_it');
        if (!titleAndDescrDiv) {
            console.warn('TitleAndDescription div not found!');
        }
        return titleAndDescrDiv;
    }
    /** @return {HTMLAnchorElement} */
    get descriptionEl() {
        const titleDescrDiv = this.titleAndDescriptionDiv;
        if (titleDescrDiv) {
            return titleDescrDiv.querySelector('div.irc_hd div[dir="ltr"] font > font, div.irc_hd div[dir="ltr"]');
        } else {
            console.warn('titleAndDescriptionDiv not found for image panel:', this.el);
        }
    }
    get descriptionText() {
        const descr = this.titleAndDescriptionDiv.querySelector('.irc_asc');

        descr.innerText = (descr.innerText.length < 2) ? this.pTitle_Text : descr.innerText;
        return cleanGibberish(descr.innerText);
    }
    /** @return {HTMLAnchorElement} */
    get pTitle_Anchor() {
        return this.titleAndDescriptionDiv.querySelector('a.irc_pt');
    }
    get pTitle_Text() {
        if (!this.pTitle_Anchor) {
            console.warn('Title anchor not found!');
            return;
        }
        return cleanGibberish(this.pTitle_Anchor.outerText.replace(getHostname(this.pTitle_Anchor.href), ''));
    }
    /** Secondary title
     * @return {HTMLAnchorElement, Node} */
    get sTitle_Anchor() {
        return this.titleAndDescriptionDiv.querySelector('span a.irc_lth.irc_hol ');
    }
    get sTitle_Text() {
        const secondaryTitle = this.sTitle_Anchor;
        const siteHostName = getHostname(this.sTitle_Anchor.href);
        // console.log('siteHostName', siteHostName);
        return cleanGibberish(secondaryTitle.outerText.replace(siteHostName, ''));
    }

    get ris_fc_Url() {
        return this.ris_fc_Div ? this.ris_fc_Div.querySelector('a').href : "#";
    }
    /** Returns that small square at the bottom right (the focused one)
     * @return {HTMLDivElement} */
    get ris_fc_Div() {
        return this.q('.irc-deck > div.irc_rimask.irc_rist');
    }
    /** @return {NodeListOf<HTMLDivElement>} returns all related image divs (including the "VIEW MORE" div)*/
    get ris_DivsAll() {
        return this.qa('.irc-deck > div.irc_rimask');
    }
    /** @return {NodeListOf<HTMLDivElement>} returns only related image divs (excluding the "VIEW MORE" div)*/
    get ris_Divs() {
        return this.qa('.irc-deck > div.irc_rimask:not(.irc_rismo)');
    }
    /** @return {HTMLDivElement} returns related image container (.irc-deck)*/
    get ris_Container() {
        return this.q('.irc-deck');
    }

    /**
     * @type {NodeListOf<HTMLAnchorElement>}
     * Visit:       a.i3599.irc_vpl.irc_lth,
     * Save:        a.i15087,
     * View saved:  a.i18192.r-iXoO2jjyyEGY,
     * Share:       a.i17628
     */
    get buttons() {
        return this.qa('.irc_but_r > tbody > tr a:first-child');
    }

    //get imageUrl() {return this.mainImage.src;}

    /** @return {HTMLImageElement }
     * '#irc_mimg > a#irc_mil > img#irc_mi' should work (but it's not working for some reason)*/
    get mainImage() {
        // return this.element.querySelector('#irc_mimg > a#irc_mil > img#irc_mi');
        if (!!this.el) {
            return this.q('img.irc_mi, img.irc_mut');
        }
    }
    get bestNameFromTitle() {
        const sTitle = this.sTitle_Text,
            pTitle = this.pTitle_Text,
            description = this.descriptionText;
        var unionPTitleAndDescrAndSTitle = unionTitleAndDescr(description, unionTitleAndDescr(pTitle, sTitle));

        console.log('BestNameFromTitle:', `sTitle:${sTitle}
        pTitle:${pTitle}
        description:${description}
        unionPTitleAndDescrAndSTitle :${unionPTitleAndDescrAndSTitle}`
        );

        return unionPTitleAndDescrAndSTitle;

        /* const candidate1 = (pTitle.length > sTitle.length ? pTitle : sTitle).trim(); // choose the longer one
         if (candidate1.length > 5 && description.length > 5)
         return candidate1 + " " + description;
         return (candidate1.length > description.length ? candidate1 : description).trim().slice(0, 50);*/
    }
    get leftPart() {
        return this.q('.irc_t');
    }
    get rightPart() {
        return this.q('.irc_b.irc_mmc');
    }

    /**
     * if it does return something, then it will NOT continue to adding the new element.
     * @return {*}
     */
    get sbiUrl() {
        // if (typeof panel === 'undefined')
        const risFcDiv = this.ris_fc_Div;
        var reverseImgSearchUrl = "#";
        if (!!risFcDiv) {
            const imgURL = this.mainImage.src || risFcDiv.querySelector('a').href;
            reverseImgSearchUrl = getGImgReverseSearchURL(imgURL);
        }
        /*
         console.log(`ReverseImgSearchUrl:${reverseImgSearchUrl}
         Panel.MainImage:${panel.mainImage}
         Panel.imageUrl:${panel.imageUrl}
         Panel: ${panel}`);
         */
        // openInTab(reverseImgSearchUrl);
        return reverseImgSearchUrl;
    }
    /**Goes to the previous (Left) main mainImage*/
    static previousImage() {
        const previousImageArrow = q('#irc_la');
        var x = previousImageArrow.style.display != 'none' ? // is it there?
            !previousImageArrow.click() : // returns true
            false;
        if (!x) console.log("prev arrow doesn't exist");
        return x;
    }

    /**Goes to the next (Right) main mainImage*/
    static nextImage() {
        const nextImageArrow = q('#irc_ra');
        var x = nextImageArrow.style.display != 'none' ? // is it there?
            !nextImageArrow.click() : // returns true
            false;
        if (!x) console.log("next arrow doesn't exist");
        return x;
    }
    static modifyP(panelEl) {
        console.log('Modifying panelEl:', panelEl);
        let p = new IP(panelEl);

        const classList = p.rightPart.classList;
        if (!classList.contains('scroll-nav')) {
            classList.add('scroll-nav');
        }


        // p.makeDescriptionClickable();
        /// belowDivClassName
        p.sTitle_Anchor.parentNode.after(createElement(`<div class="${belowDivClassName} _r3" style="padding-right: 5px; text-decoration:none;"/></div>`));

        p.inject_SiteSearch();

        p.inject_ViewImage();
        p.inject_DownloadImage();

        p.inject_sbi();

        /*waitForElement(() => IP.focusedPanel.relatedImage_Container, () => {
         p.inject_DownloadRelatedImages();
         });*/
        p.inject_Download_ris();
        p.inject_ImageHost();

        const dimensionsEl = p.q('.irc_idim');
        dimensionsEl.addEventListener('click', IP.moreSizes);
        dimensionsEl.classList.add('hover-click');

        // remove "Images may be subject to copyright"
        p.sTitle_Anchor.style = "padding-right: 5px; text-decoration:none;";
        const copyrightEl = p.q('span.Af3fH.rn92ee');
        if (copyrightEl) copyrightEl.remove();

        // injecting rarbg torrent link button
        (function () {
            const rarbg_tl = createElement(`<a class="_r3 hover-click o5rIVb torrent-link" 
    style=" float: left; padding: 4px; display: inline-block; font-size: 10px; color: white;">
    <img src="https://rarbg.unblocker.win/cdn/static/20/img/16x16/download.png" alt="Rarbg torrent link" border="0" style=" width: 25px; height: 25px; ">
    <label style=" display: list-item; ">Torrent link</label></a>`);
            rarbg_tl.onclick = () => {
                if (/\/torrent\/|rarbg/i.test(p.pTitle_Anchor.href)) {
                    return anchorClick(extractRarbgTorrentURL(p.pTitle_Anchor.innerText, p.pTitle_Anchor.href), '_blank');
                }
            };
            p.pTitle_Anchor.before(rarbg_tl);
        })();
        //@info .irc_ris    class of the relatedImgsDivContainer
        //@info div#isr_mc  the main container containing all the image boxes, and the panels (only 2 children)
        panelEl.addEventListener("wheel", /**
         * @param {WheelEvent} wheelEvent
         * @return {boolean}
         */
        function (wheelEvent) {
            if (!wheelEvent.ctrlKey && !wheelEvent.metaKey && !wheelEvent.shiftKey && !wheelEvent.altKey) {
                let elUnderMouse =
                    // wheelEvent.target
                    elementUnderMouse(wheelEvent)
                ;
                if (IP.mainPanelEl.contains(elUnderMouse)) {
                    try {
                        // Listen for scroll events
                        /** @type {DOMRect} */
                            // var rect = IP.mainPanelEl.getBoundingClientRect();
                            // console.log(rect.top, rect.right, rect.bottom, rect.left);

                        const leftPart = IP.focP.leftPart;
                        const rightPart = IP.focP.rightPart; // this is NOT the entire RIGHT part
                        const irc_ris = IP.focP.q('.irc_ris');
                        const onLeftSide = isOrContains(leftPart, elUnderMouse); //containsClassName(elUnderMouse, '.irc_t');// on left half of panel
                        const onRightPart = isOrContains(rightPart, elUnderMouse); // on RIGHT half of panel
                        const delta = getWheelDelta(wheelEvent);
                        if (Math.abs(delta) < 0.1) { // Do nothing if didn't scroll
                            log("Mousewheel didn't move");
                            return false;
                        }
                        /// Wheel definetely moved at this point
                        let wheelUp = invertWheelRelativeImageNavigation ? (delta > 0.1) : (delta < 0.1);
                        if (!onLeftSide) {   // If the mouse is under the RIGHT side of the image panel
                            if (isOrContains(elUnderMouse, leftPart)) {
                                (wheelUp) ? IP.nextImage() :
                                    IP.previousImage();
                            }
                            if (onRightPart || isOrContains(irc_ris, elUnderMouse) || (elUnderMouse.classList.contains('irc_mut'))) {
                                // console.log('elUnderMouse:', elUnderMouse);
                                (wheelUp) ? nextRelImg() :
                                    prevRelImg();
                            } else {
                                console.debug('Mgouse wheel did NOT scroll while over a container element.\nelUnderMouse:', elUnderMouse);
                            }
                            wheelEvent.preventDefault();
                        }
                        return false;
                    } catch (e) {
                        console.warn(e)
                    }
                }
            }
        });

        // Underlining binded keys
        /* var keymap = new Map([ // Key: selector, Value: character
         ['.i15087', 's'],
         ['.i18192', 'v']
         ]);
         for (const [selector, char] of keymap) {
         var bindEl = q(selector);
         if (!bindEl) continue;
         bindEl.outerText = bindEl.outerText.replace(new RegExp(char, 'i'), `<u>${char}</u>`);
         }*/

        // relocating the image dimensions element
        var imgDimEl = p.q('.rn92ee.irc_msc');
        if (!!imgDimEl) {
            p.sTitle_Anchor.after(imgDimEl);
        } else {
            console.error('image dimensions element not found');
        }

        IP.updateP(p);
    }
    static updateP(panelEl) {
        // console.debug('Updating panel');
        if (!panelEl) {
            console.warn('Null panel passed');
            return false;
        }

        let p = (panelEl instanceof HTMLElement) ? new IP(panelEl) : IP.focP;
        // p.removeLink();
        // p.injectSearchByImage();
        // p.addDownloadRelatedImages();
        p.makeDescriptionClickable();
        p.addImageAttributes();
        p.update_SiteSearch();
        p.update_ViewImage();
        p.update_ImageHost();
        p.update_sbi();

        // rarbg torrent link
        let torrentLink = p.q('.torrent-link'),
            linkIsTorrent = /\/torrent\//gi.test(p.pTitle_Anchor.href);
        if (!!torrentLink) {
            torrentLink.style.display = linkIsTorrent ? 'inline-block' : 'none';
        }
    }
    static moreSizes() {
        const panel = IP.focP;
        const reverseImgSearchUrl = getGImgReverseSearchURL(panel.ris_fc_Div.querySelector('img').src);
        let z = open().document;
        //TODO:
        fetchUsingProxy(reverseImgSearchUrl, function (content) {
            console.log('content:', content);
            let doc = document.createElement('html');
            doc.innerHTML = content;
            const allSizesAnchor = doc.querySelector(allSizesSelector);
            if (allSizesAnchor && allSizesAnchor.href) {
                fetchUsingProxy(allSizesAnchor.href, function (content2) {
                        let doc2 = document.createElement('html');
                        doc2.innerHTML = content2;
                        z.write(content2);
                    }
                )
            } else {
                z.write(content);
            }
        });
    }
    static download_ris() {
        const dir = "GImgRis " + document.title.replace(/google|com/gi, '');
        const relatedImageDivs = IP.focP.ris_DivsAll;
        console.log('download related images:', relatedImageDivs);

        var metaDataStr =
            "Google images data for related images" +
            "\nTitle:     " + document.title +
            "\nURL:     " + location.href +
            "\nSearch:    " + q('#lst-ib').value
        ;
        for (const imgDiv of relatedImageDivs) {
            var img = imgDiv.querySelector('img'),
                dataText = getDataText(img),
                metaObj = JSON.parse(dataText),
                imgTitle
            ;

            if (Object.keys(metaObj).length <= 2) {
                console.debug("Found a metaObject that is too small:", metaObj);
                metaObj = getImgMetaById(metaObj.id);
                console.debug("repalcement:", metaObj);
            }

            imgTitle = metaObj["pt"];
            const href = imgDiv.querySelector('a[href]').href;
            console.log("Downloading:", href, imgTitle, dir, img);
            download(href, imgTitle, dir, img);
        }
        download(makeTextFile(metaDataStr), 'info.txt', dir);
    }
    static downloadCurrentImage() {
        try {
            const panel = IP.focP;
            const name = panel.bestNameFromTitle;
            console.log('downloadCurrentImage:', name);
            // if (!this.focusedRelatedImageDiv) return;
            const focusedRelatedImageDiv = panel.ris_fc_Div;
            var currentImageURL = panel.mainImage.src && panel.mainImage.parentNode.classList.contains("display-original-mainImage") ?
                focusedRelatedImageDiv.querySelector('img').src :
                focusedRelatedImageDiv.querySelector('[href]').href;
            console.log('Download:', name, currentImageURL);
            download(currentImageURL, name, undefined, focusedRelatedImageDiv);
            panel.q('.torrent-link').click();
        } catch (e) {
            console.warn(e);
        }
    }

    q() {
        return this.el.querySelector(...arguments);
    }
    qa() {
        return this.el.querySelectorAll(...arguments);
    }

    makeDescriptionClickable() {
        if (this.descriptionEl && !this.descriptionEl.classList.contains('hover-click')) {
            this.descriptionEl.classList.add(`hover-click`);
            this.descriptionEl.addEventListener("click", function () {
                    window.open(gImgSearchURL + encodeURIComponent(cleanSymbols(this.innerHTML)), "_blank");
                }
            );
        }
    }
    inject_Download_ris() {
        // const risContainer = this.relatedImage_Container.parentNode;
        const className = 'download-related hover-click';
        const text = 'Download&nbsp;Related&nbsp;↓';
        var dataVed = "";
        const targetEl = this.q('.irc_msc');//this.q('div.irc_ris');

        // if (risContainer && !risContainer.parentNode.classList.contains('download-related')) {
        const buttonHtml = `<a class="${className}" role="button" jsaction="" data-rtid="" jsl="" tabindex="0" data-ved="${dataVed}" 
style="padding-right: 5px; padding-left: 5px; text-decoration:none;">
<span>${text}</span></a>`;
        var button = createElement(buttonHtml);
        button.addEventListener('click', function (element) {
            IP.download_ris(element);
            return false;
        });
        targetEl.after(button);
        // } else
        //     console.log('this panel already has downlaod-related buttonParent');
    }
    inject_DownloadImage() {
        const text = 'Download&nbsp;↓';
        if (this.sTitle_Anchor) {
            const dataVed = '';
            const className = 'download-image';

            // const summaryTable = this.element.querySelector('table[summary]._FKw.irc_but_r');
            const buttonHtml = `<td><a class="${className}" role="button" jsaction="" data-rtid="" jsl="" tabindex="0" data-ved="${dataVed}">
<span>${text}</span></a></td>`;
            //             const html = `<span class="${className}" target="_blank" data-ved="${dataVed}" rel="noreferrer" data-noload="" referrerpolicy="no-referrer" tabindex="0" data-ctbtn="2"
            // <span class="irc_ho" dir="ltr" style="text-align: left;">${text}</span></span>`;
            //             const button = this.addElementAfterSTitle(html, className + " hover-click", IP.downloadCurrentImage, 'BOTTOM');
            const button = createElement(buttonHtml);
            button.addEventListener('click', function (element) {
                IP.downloadCurrentImage(element);
                return false;
            });
            var tb = this.buttons[0].parentElement.cloneNode(false);
            tb.appendChild(button);
            const saveBtn = this.q('.iv_mssc.i35661');
            return this.q('.view-image').parentNode.after(tb);
            //this.buttons[1].after(tb);
            /*if (this.buttons && this.buttons.length) {
             const lastButton = this.buttons[this.buttons.length - 1];
             const saveButton = this.buttons[0].parentNode.querySelector('a.i15087');
             ((!!saveButton) ? saveButton : lastButton).before(button);
             }*/
        }
    }

    /** Inject the SearchByImage anchor
     * @return {*} */
    inject_sbi() {
        const href = '#'; //getGImgReverseSearchURL(this.imageUrl);
        const dataVed = '';//()=>this.sTitleAnchor.getAttribute('data-ved'); // classes:    _ZR irc_hol i3724 irc_lth
        const className = `search-by-image`;
        var html = `<a class="o5rIVb ${className}" target="${DEFAULT_TARGET}" href="${href}" data-ved="${dataVed}" 
rel="noreferrer" data-noload="" referrerpolicy="no-referrer" tabindex="0" data-ctbtn="2"
<span class="irc_ho" dir="ltr" style="text-align: left;">Search&nbsp;by&nbsp;image</span></a>`;

        return this.addElementAfterSTitle(html, className, null, 'RIGHT');
    }
    update_sbi() {
        // updating ImageHost
        const sbi = this.q('a.search-by-image');
        if (sbi) {
            sbi.href = this.sbiUrl;
        } else {
            console.warn('SearchByImage element not found:', sbi);
        }
    }

    inject_ViewImage() {
        const text = 'View&nbsp;image';
        if (this.sTitle_Anchor) {
            const dataVed = '';
            const className = 'view-image';

            // const summaryTable = this.element.querySelector('table[summary]._FKw.irc_but_r');
            const buttonHtml = `<td><a href="#" target="${"_blank"}" class="${className}" role="button" jsaction="" data-rtid="" jsl="" tabindex="0" data-ved="${dataVed}">
<span>${text}</span></a></td>`;
            //             const html = `<span class="${className}" target="_blank" data-ved="${dataVed}" rel="noreferrer" data-noload="" referrerpolicy="no-referrer" tabindex="0" data-ctbtn="2"
            // <span class="irc_ho" dir="ltr" style="text-align: left;">${text}</span></span>`;
            //             const button = this.addElementAfterSTitle(html, className + " hover-click", IP.downloadCurrentImage, 'BOTTOM');
            const link = createElement(buttonHtml);
            /*button.addEventListener('click', function (element) {
             let url = IP.focP.ris_fc_Url; //IP.focusedPanel.mainImage.parentNode.href;
             openInTab(url);
             return false;
             });*/
            var globeIcon = document.querySelector('._RKw._wtf._Ptf');
            if (!globeIcon) {
                globeIcon = document.querySelector('.RL3J9c.Cws1Yc.wmCrUb');
            }
            link.firstElementChild.before(globeIcon.cloneNode(true));

            var tb = this.buttons[0].parentElement.cloneNode(false);
            tb.appendChild(link);


            var afterSaveBtn = false; // add View image button after save button?
            // 				 = const saveBtn = this.q('.iv_mssc.i35661');
            return (afterSaveBtn ? saveBtn.parentNode : this.buttons[0].parentNode).after(tb);
            /*if (this.buttons && this.buttons.length) {
             const lastButton = this.buttons[this.buttons.length - 1];
             const saveButton = this.buttons[0].parentNode.querySelector('a.i15087');
             ((!!saveButton) ? saveButton : lastButton).before(button);
             }*/
        }
    }
    update_ViewImage() {
        const viewImage = this.q('.view-image');
        if (viewImage) {
            viewImage.href = IP.focP.ris_fc_Url;
        }
        else {
            console.warn('viewImage element not found:', viewImage);
        }
    }

    inject_ImageHost() {
        console.log('this.qa(".irc_msc"):', this.qa('.irc_msc'));
        let container = this.q('.irc_msc');

        if (this.sTitle_Anchor) {
            // const summaryTable = this.element.querySelector('table[summary]._FKw.irc_but_r');
            var className = 'image-host hover-click';
            const element = createElement(`<a class="${className}" href="" target="${DEFAULT_TARGET}" rel="noreferrer" data-noload="" referrerpolicy="no-referrer" tabindex="0"  data-ved="" data-ctbtn="2" 
style="padding-right: 5px; padding-left: 5px; text-decoration:none;"
<span class="irc_ho" dir="ltr" style="text-align: center;">Image&nbsp;Host</span></a>`);
            // const button = this.addElementAfterSTitle(html, "image-host hover-click", null, 'NONE');
            container.after(element);
            return element;
        }
    }
    update_ImageHost() {
        const focusedImageDiv = IP.focP.ris_fc_Div;
        if (focusedImageDiv) {
            const url = focusedImageDiv.querySelector('a').href;
            const hostname = getHostname(isDdgUrl(url) ? reverseDdgProxy(url) : url);
            // updating ImageHost
            const ih = this.q('a.image-host');
            if (ih) {
                ih.innerText = hostname;
                ih.href = gImgSearchURL + 'site:' + hostname;

                // ih.style.color = ublSet.has(hostname) ? `${successColor} !important;` : null;
                if (ublSet.has(hostname))
                    setStyleByHTML(ih, 'color', `${successColor} !important`);
                // if (ublSet.has(hostname)) {
                //     ih.classList.add('ubl-site');
                // } else {
                //     ih.classList.remove('ubl-site');
                // }
            } else {
                console.warn('ImageHost element not found:', ih);
            }
        }
    }

    siteSearch() {
        try {
            const hostname = getHostname(this.sTitle_Anchor.href);
            console.log('Site search:', hostname);
            openInTab(siteSearchUrl(getHostname(this.sTitle_Anchor.href)));
        } catch (e) {
            console.warn(e);
        }
    }

    inject_SiteSearch() {
        const href = '#'; //getGImgReverseSearchURL(this.imageUrl);
        const dataVed = '';//()=>this.sTitleAnchor.getAttribute('data-ved'); // classes:    _ZR irc_hol i3724 irc_lth
        const hostname = getHostname(this.sTitle_Anchor.href);
        const spanClass = `site-search`;
        const html = `<a class="${spanClass} _r3 hover-click o5rIVb" target="${DEFAULT_TARGET}" rel="noreferrer" data-noload="" referrerpolicy="no-referrer" tabindex="0" href="${href}" data-ved="${dataVed}" data-ctbtn="2" <span class="irc_ho" dir="ltr" style="text-align: left;font-size: 12px;" >Site: ${hostname}</span></a>`;
        var siteSearch = createElement(html);

        let ddgSearch = siteSearch.cloneNode(false);
        ddgSearch.innerText = "[DDGP]";
        ddgSearch.id = "ddgSearch";

        siteSearch = this.addElementAfterSTitle(siteSearch, "", null, 'BOTTOM', 'div');
        // this.pTitle_Anchor.before(ddgSearch);
        siteSearch.appendChild(ddgSearch);
        return siteSearch;
    }
    update_SiteSearch() {
        const siteSearchAnchor = this.q('a.site-search');
        const hostname = getHostname(this.sTitle_Anchor.href);
        if (siteSearchAnchor) {
            siteSearchAnchor.innerText = hostname;
            siteSearchAnchor.href = (siteSearchUrl(getHostname(IP.focP.q('span a.irc_lth.irc_hol').href)));
        } else {
            console.warn('Site Search element not found:', siteSearchAnchor);
        }

        const ddgAnchor = this.q('#ddgSearch');
        if (ddgAnchor) {
            ddgAnchor.href = ddgProxy(this.pTitle_Anchor.href);
        }

        // this.sTitle_Anchor.style.color = ublSet.has(hostname) ? `${successColor} !important` : null;
        if (ublSet.has(hostname))
            setStyleByHTML(this.sTitle_Anchor, 'color', `${successColor} !important`);

        // if (ublSet.has(hostname)) {
        //     this.sTitle_Anchor.classList.add('ubl-site');
        // } else {
        //     this.sTitle_Anchor.classList.remove('ubl-site');
        // }
    }

    /** Removes the annoying image link when the panel is open */
    removeLink() {
        const image = this.mainImage;
        const anchor = image.parentNode;
        anchor.href = null;
        console.log('anchor.href', anchor.href);
        /*anchor.onclick = function () {
         return false;
         };*/
    }
    addImageAttributes() {
        createAndAddAttribute(this.mainImage, 'img-title', this.pTitle_Text);
        createAndAddAttribute(this.mainImage, 'img-subtitle', this.sTitle_Text);
        createAndAddAttribute(this.mainImage, 'description', this.descriptionText);
        createAndAddAttribute(this.mainImage, 'download-name', this.sTitle_Text);
    }
    lookupTitle() {
        console.log('lookup title:', this.bestNameFromTitle);
        openInTab(gImgSearchURL + encodeURIComponent(cleanSymbols(this.bestNameFromTitle)));
    }

    /**
     * Creates an element from the given html and appends it next to the sTitle in the image panel
     * @param html
     * @param {string} containerClassName   className attribute to add to the parent of the created element
     * @param {function} clickListener      the click listener to add to the element
     * @param position BOTTOM, LEFT, RIGHT, NONE
     * @param parentTagName
     * @return {Node}
     */
    addElementAfterSTitle(html, containerClassName, clickListener, position, parentTagName) {
        // if (!position) position = 'BOTTOM';

        const element = (typeof html === 'string') ? createElement(html) : html;
        parentTagName = parentTagName ? parentTagName : 'span';
        const containerEl = createElement(`<${parentTagName} class="_r3 ${containerClassName}" style="padding-right: 5px; text-decoration:none;"/>`);
        containerEl.appendChild(element);
        element.classList.add('o5rIVb');

        const sTitle = this.sTitle_Anchor;
        switch (position) {
            case 'BOTTOM':
                // check if the below-st-div exists, create if it doesn't, then appendChild
                let belowDiv = sTitle.parentNode.parentNode.querySelector(`.${belowDivClassName}`);
                /*if (!belowDiv) {
                 belowDiv = createElement(`<div class="${belowDivClassName}_r3 ${containerClassName}-container" style="padding-right: 5px; text-decoration:none;"/></div>`);
                 sTitle.parentNode.after(belowDiv);
                 }*/
                belowDiv.after(containerEl);
                break;
            case 'LEFT':
                sTitle.before(containerEl);
                break;
            case 'RIGHT':
                sTitle.parentNode.appendChild(containerEl);
                break;
            case 'NONE':
                break;
            default:
                console.warn('Invalid position passed:', position);
        }
        if (clickListener) {
            element.addEventListener('click', function (element) {
                clickListener(element);
                return false;
            });
        }
        return containerEl;
    }
}

unsafeWindow.IP = IP;
unsafeWindow.successfulUrlsSet = ublSet;
unsafeWindow.ublMap = ublMap;

go();

window.addEventListener("keydown", onkeydown, true);
console.log('added super google key listener');
window.addEventListener("load", function () {
    for (let a of getImgAnchors()) {
        let img = a.querySelector('img');
        createAndAddAttribute(img, 'download-name', getGimgDescription(img));
        markImageOnLoad(img, a.href);
    }
}, true);

let GIUtOST_MutOb = (window.MutationObserver) ? window.MutationObserver : window.WebKitMutationObserver;
if (GIUtOST_MutOb) {
    const GIUtOST_chgMon = new GIUtOST_MutOb(function (mutationSet) {
        mutationSet.forEach(function (mutation) {
            for (let i = 0; i < mutation.addedNodes.length; i++) { // noinspection EqualityComparisonWithCoercionJS
                if (mutation.addedNodes[i].nodeType == 1) {
                    GIUtOST_checkNode(mutation.addedNodes[i]);

                    const dlLimitSlider = q('#dlLimitSlider');
                    if (!!dlLimitSlider) {
                        var tmpValue = dlLimitSlider.getAttribute('value');
                        const numImages = qa('.rg_bx').length;
                        dlLimitSlider.setAttribute('max', numImages);
                        const newValue = tmpValue > numImages ? numImages : tmpValue;
                        dlLimitSlider.setAttribute('value', newValue);
                        q('#dlLimitSliderValue').setAttribute('value', newValue);
                    }
                }
            }
        });
    }); // attach chgMon to document.body
    const opts = {childList: true, subtree: true};
    GIUtOST_chgMon.observe(document.body, opts);
}

GIUtOST_checkNode(document.elements);

function go() {
    try {
        // iterating of the stored ubl sites
        for (const ublHostname of GM_getValue(UBL_SITES_VALUE_NAME, new Set([]))) {
            ublSet.add(ublHostname);
        }
        for (const [ublHostname, data] of new Map(GM_getValue(UBL_SITES_MAP_VALUE_NAME))) {
            ublMap.set(ublHostname, data);
        }

        var allSizesAnchor = q(allSizesSelector);
        if (!!allSizesAnchor) allSizesAnchor.click();

        const conditionSelector = '#irc_cc > div';
        waitForElement(() => {
            if (IP.mainPanelEl && IP.focP && IP.focP.mainImage && IP.focP.buttons) {
                return qa(conditionSelector);
            }
        }, function startPanelModifications(panelEl) {
            IP.modifyP(panelEl);
            const mutationObserver = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (!mutation.addedNodes.length) {
                        return;
                    }
                    try {
                        q('#dlLimitSlider').setAttribute('max', qa('.rg_bx').length);
                        if (!!IP.focP) {
                            // console.log('Mutation causing the update:', mutation);
                            IP.updateP(IP.focP);
                        }
                    } catch (e) {
                        console.warn(e, "Focused panel:", IP.focP);
                    }
                })
            });

            const target = IP.mainPanelEl;
            // console.debug('Target element to be observed:', target, 'type:', typeof target);
            mutationObserver.observe(target, {
                childList: true, subtree: true,
                attributes: false, characterData: true
            });
        });

        // const toggleEncryptedGoogleAnchor = createElement(`<a id="toggleEngrypted" href="${toggleEncryptedGoogle(true)}">${/www\.google/.test(location.hostname)?"engrypted.google&nbsp;⇌":"www.google.com"}</a>`)
        // const listElement = document.createElement('i');
        // listElement.classList.add('ab_ctl');
        // listElement.appendChild(toggleEncryptedGoogleAnchor);
        // q('#ab_ctls').appendChild(listElement);

        // const onUpdateCallback = mutations => Array.from(mutations.querySelectorAll(panelSelector)).forEach(IP.updatePanel);
        // observeDocument(onUpdateCallback);

        // addToSet(storedSuccessfulURLs, successfulUrls);
        // log('Stored successfulUrls:', storedSuccessfulURLs);
        // log('successfulUrls:', successfulUrls);

        if (AUTO_SAVE_UBL_SITES) setInterval(storeSuccessfulUrlsSet, 5000);

    } catch (e) {
        console.error(e);
    }
}

function updateSuccessfulUrlsSet() {
    for (const img of qa('.display-original-mainImage, img[loaded="true"]')) {
        const gimgRUrl = getGimgRUrl(img);
        if (img.classList.contains('display-original-mainImage-failed') || img.classList.contains('display-original-mainImage-ddg-failed'))
            continue;
        let siteUrl = "" + getHostname(gimgRUrl);
        if (/google\.com/.test(siteUrl)) siteUrl = getHostname(img.getAttribute('rg_meta_ru'));
        if (/tumblr\.com/.test(siteUrl)) siteUrl = siteUrl.replace(/^\d+?\./, "");
        ublSet.add(siteUrl);
        console.log('adding ubl site:', siteUrl);
    }
    console.log('in updateSuccessfulUrlsSet:', Array.from(ublSet));
    return ublSet; // returning just cuz it could be handy
}
function updateSuccessfulUrlsMap() {
    for (const img of qa('.display-original-mainImage, img[loaded="true"]')) {
        let url = getGimgRUrl(img),
            siteHostname = "" + getHostname(reverseDdgProxy(url));
        if (/google\.com/.test(siteHostname)) siteHostname = getHostname(img.getAttribute('rg_meta_ru'));
        if (/tumblr\.com/.test(siteHostname)) siteHostname = siteHostname.replace(/^\d+?\./, "");

        ublMap.addURL(url, img.loaded == true || img.loaded == "ddgp", {
            imgEl: img,
            dimensions: img.getAttribute('img-dim')
        });
        console.log('adding ubl site:', siteHostname, 'url:', url);
    }
    return ublMap; // returning just cuz it could be handy
}

function storeSuccessfulUrlsSet() {
    updateSuccessfulUrlsSet();
    const merged = new Set();
    const stored = GM_getValue(UBL_SITES_VALUE_NAME);
    addToSet(merged, ublSet);
    addToSet(merged, stored);

    const diff = Array.from(ublSet).filter(x => Array.from(stored).indexOf(x) < 0);
    GM_setValue(UBL_SITES_VALUE_NAME, Array.from(merged));

    console.log("Found new unblocked sites:", diff);
    // console.log('stored set:', GM_getValue('unblocked sites of og images'));
    return ublSet;
}
unsafeWindow.storeSuccessfulUrlsMap = storeSuccessfulUrlsMap;
function storeSuccessfulUrlsMap() {
    updateSuccessfulUrlsMap();
    const stored = new Map(GM_getValue(UBL_SITES_MAP_VALUE_NAME));
    for (const [k, v] of stored) {
        ublMap.addURL(k, v);
    }
    console.debug('stored map:', stored, 'new ublMap:', ublMap);

    GM_setValue(UBL_SITES_MAP_VALUE_NAME, Array.from(ublMap.entries()));
    return ublMap;
}

/**abbreviation for querySelectorAll()*/
function qa(selector) {
    let x = document.querySelectorAll(selector);
    return x ? x : null;
}
function q(selector) {
    let x = document.querySelector(selector);
    return x ? x : null;
}

// Google images
function GIUtOST_checkNode(els) {
    // click "Load more images"
    let el = q("#smb");
    if (el) {
        el.click();
    }
}

// function getImgBoxes() {return qa('.rg_bx');}


//[Google.com images]
function getMetaEl(thumbnail) {
    // return thumbnail.parentNode.closest('.rg_meta');
    return thumbnail.parentNode.parentNode.querySelector('.rg_meta');
    // return thumbnail.closest('.rg_bx').querySelector('.rg_meta');
}
function getDataText(imgN) {
    let data = "Not a main mainImage, No data text available";
    try {
        data = getMetaEl(imgN).innerText;
    } catch (e) {
        console.error('Caught:', e);
    }
    // console.log('Data text:', data);
    return data;
}
function getGimgDescription(imgN) {
    let txt = getDataText(imgN);
    let title = extractFromText(txt, "pt");
    let desc = extractFromText(txt, "s");
    return title + "_" + desc;
    // desc.length > 1 ? desc : title; // choosing one of them (prioratizing the description over the title)
}
function getGimgTitle(imgN) {
    return getGImgMetaAttribute(imgN, 'pt');
}
function getGimgRUrl(imgN) {
    const imgUrl = getGImgMetaAttribute(imgN, 'ru');
    const anchor = imgN.parentNode;
    return imgUrl ? imgUrl :
        anchor ? anchor.href : imgN.src;
}

unsafeWindow.getMeta = getMeta;
/**
 * @param imageElement image element, either <img class="rg_ic rg_i" ....> in .rg_bx
 * todo: make this function detect if the image is a thumbnail or inside the panel, also make it work by getting the "id" and finding the meta through that
 * @returns {any}
 */
function getMeta(imageElement) {
    var metaObj;
    try {
        metaObj = JSON.parse(getDataText(imageElement));
    } catch (e) {
        console.warn(e);
    }
    return metaObj;
}
/**
 * @param imgN {HTMLImageElement}
 * @param {string} key [ "clt", "id", "isu", "itg", "ity", "oh", "ou", "ow", "pt", "rid", "rmt", "rt", "ru", "s", "st", "th", "tu", "tw" ]
 * @return {string}
 */
function getGImgMetaAttribute(imgN, key) {
    if (!key) {
        console.error(`Key ${key} is null`);
        return;
    }
    const dataObj = getMeta(imgN);
    if (dataObj.hasOwnProperty(key)) {
        return dataObj[key];
    } else {
        console.error(`Key "${key}" not found in data:`, dataObj);
        return false;
    }
}

/** The fallback will be the value returned if no results were found.
 * @param txt {string}
 * @param key {string}: [ "clt", "id", "isu", "itg", "ity", "oh", "ou", "ow", "pt", "rid", "rmt", "rt", "ru", "s", "st", "th", "tu", "tw" ]
 * @return {string}
 * */
function extractFromText(txt, key) {
    if (!key) {
        console.error(`Key ${key}is null`);
        return;
    }
    const dataObj = JSON.parse(txt);
    if (dataObj.hasOwnProperty(key)) {
        return dataObj[key];
    } else {
        return false;
    }
    /*
     let data = typeof fallback === undefined ? fallback : ("No mainImage data found for key: '" + key + "'");
     let regex = new RegExp(`(?<="${key}":")(.+?)(?=")`);
     if (!txt) return data;
     let matches = txt.match(regex);
     data = (matches) ? matches[0] : data;
     return data;
     */
}

/*window.onbeforeunload = function (e) { // on tab exit
    ublSites = new Set(ublSites, GM_getValue('unblocked sites of og images'));
    console.log('ublSites:', ublSites);
    GM_setValue('unblocked sites of og images', Array.from(ublSites));
    var message = "Saving unblocked sites (confirmation).", e = e || window.event;
    // For IE and Firefox
    if(e) {
        e.returnValue = message;
    }
    // For Safari
    return message;
};*/

/*
 /!** @deprecated
 * Replaces the mainImage description link text *!/
 function replaceImgData(dataEls) {
 if (typeof dataEls === 'undefined') return;
 dataEls.querySelectorAll('.rg_meta').forEach(function (dataEl) {
 if (dataEl.classList.contains('rg_meta-modified')) return;
 try {
 let dataText = dataEl.innerHTML;
 let siteUrl = extractFromText(dataText, 'ru');
 let description = extractFromText(dataText, 's');
 let subTitle = extractFromText(dataText, 'st');

 let imageAnchor = dataEl.previousSibling;
 createAndAddAttribute(imageAnchor, 'rg_meta_st', subTitle);
 createAndAddAttribute(imageAnchor, 'rg_meta_ru', siteUrl);

 let hostname = getHostname(siteUrl).replace('www.', '');
 let siteSearchUrl = GoogleImagesSearchURL + "site:" + encodeURIComponent(hostname);

 dataEl.innerHTML = dataEl.innerHTML
 .replace(subTitle, 'site search: ' + hostname) // replace SubTitle text with site HOSTNAME
 .replace(siteUrl, siteSearchUrl) // replace title lin with site siteSearch link
 // .replace(description, HOSTNAME)
 ;

 dataEl.classList.add('rg_meta-modified');
 } catch (exception) {
 console.error("Caught exception while changin rg_meta:", exception);
 }
 });
 }
 */

unsafeWindow.extractImgData = getGImgMetaAttribute;
unsafeWindow.getGimgTitle = getGimgTitle;
unsafeWindow.getGimgRUrl = getGimgRUrl;
unsafeWindow.getGimgDescription = getGimgDescription;

unsafeWindow.geResultsData = getResultsData;
unsafeWindow.downloadImageData = downloadImageData;

//[Google.com images]
unsafeWindow.saveUblSites = saveUblSites;

function saveUblSites() {
    storeSuccessfulUrlsSet();
    console.log('Site links of unblocked images:', Array.from(ublSet));
}
/**
 * @param {Set} mainSet
 * @param {Set} otherSet
 * @return {*}
 */
function addToSet(mainSet, otherSet) {
    if (typeof mainSet === 'undefined' || typeof otherSet === 'undefined') return;
    try {
        // if(isIterable(otherSet) && isIterable(mainSet))
        otherSet.forEach(function (elt) {
            if (typeof elt === 'string') {
                mainSet.add(elt);
            }
        });
    } catch (ex) {
        console.warn(ex);
    }
    console.log('merged sets:', Array.from(mainSet));
    return mainSet;
}

/* Understanding Google Images
 ### Image Boxes:
 Image boxes are contained in one parent element with the selector: `div#rg_s`.
 Every mainImage box contains an `img`, and a `div` containing the data.


 Attributes |Selector| Notes
 --- | --- | ---
 **img** |
 *ClassName =*| **nicely**

 ### The Image Panel:
 There is one big panel containing 3 sub-panels, you only get to see one sub-panel at a time.
 Moving to the next mainImage will rotate the 3 sub-panels, and you will visit each one as they rotate.
 * Main panel selector: `#irc_cc`
 * Sub-panels contain a `data-ved` attribute, only the active one will have data, the other 2 will be `null`.
 * Active sub-panel selector:    `#irc_cc div.irc_t:not([data-ved="null"])`
 */

/*class ImageBox extends HTMLElement {}*/

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

/* hot-keys*/
let KeyEvent;
if (typeof KeyEvent === "undefined") { /* var str="KeyEvent = {\n"; for(var i=0; i<500; i++){ str+= "DOM_VK_" + String.fromCharCode(i) + ": " + i +",\n"; } str=str.substr(0, str.length-2)+"\n}" */
    KeyEvent = {
        DOM_VK_BACKSPACE: 8,
        DOM_VK_TAB: 9,
        DOM_VK_ENTER: 13,
        DOM_VK_SHIFT: 16,
        DOM_VK_CTRL: 17,
        DOM_VK_ALT: 18,
        DOM_VK_PAUSE_BREAK: 19,
        DOM_VK_CAPS_LOCK: 20,
        DOM_VK_ESCAPE: 27,
        DOM_VK_PGUP: 33,
        DOM_VK_PAGE_UP: 33,
        DOM_VK_PGDN: 34,
        DOM_VK_PAGE_DOWN: 34,
        DOM_VK_END: 35,
        DOM_VK_HOME: 36,
        DOM_VK_LEFT: 37,
        DOM_VK_LEFT_ARROW: 37,
        DOM_VK_UP: 38,
        DOM_VK_UP_ARROW: 38,
        DOM_VK_RIGHT: 39,
        DOM_VK_RIGHT_ARROW: 39,
        DOM_VK_DOWN: 40,
        DOM_VK_DOWN_ARROW: 40,
        DOM_VK_INSERT: 45,
        DOM_VK_DEL: 46,
        DOM_VK_DELETE: 46,
        DOM_VK_0: 48, DOM_VK_ALPHA0: 48,
        DOM_VK_1: 49, DOM_VK_ALPHA1: 49,
        DOM_VK_2: 50, DOM_VK_ALPHA2: 50,
        DOM_VK_3: 51, DOM_VK_ALPHA3: 51,
        DOM_VK_4: 52, DOM_VK_ALPHA4: 52,
        DOM_VK_5: 53, DOM_VK_ALPHA5: 53,
        DOM_VK_6: 54, DOM_VK_ALPHA6: 54,
        DOM_VK_7: 55, DOM_VK_ALPHA7: 55,
        DOM_VK_8: 56, DOM_VK_ALPHA8: 56,
        DOM_VK_9: 57, DOM_VK_ALPHA9: 57,
        DOM_VK_A: 65,
        DOM_VK_B: 66,
        DOM_VK_C: 67,
        DOM_VK_D: 68,
        DOM_VK_E: 69,
        DOM_VK_F: 70,
        DOM_VK_G: 71,
        DOM_VK_H: 72,
        DOM_VK_I: 73,
        DOM_VK_J: 74,
        DOM_VK_K: 75,
        DOM_VK_L: 76,
        DOM_VK_M: 77,
        DOM_VK_N: 78,
        DOM_VK_O: 79,
        DOM_VK_P: 80,
        DOM_VK_Q: 81,
        DOM_VK_R: 82,
        DOM_VK_S: 83,
        DOM_VK_T: 84,
        DOM_VK_U: 85,
        DOM_VK_V: 86,
        DOM_VK_W: 87,
        DOM_VK_X: 88,
        DOM_VK_Y: 89,
        DOM_VK_Z: 90,
        DOM_VK_LWIN: 91,
        DOM_VK_LEFT_WINDOW: 91,
        DOM_VK_RWIN: 92,
        DOM_VK_RIGHT_WINDOW: 92,
        DOM_VK_SELECT: 93,
        DOM_VK_NUMPAD0: 96,
        DOM_VK_NUMPAD1: 97,
        DOM_VK_NUMPAD2: 98,
        DOM_VK_NUMPAD3: 99,
        DOM_VK_NUMPAD4: 100,
        DOM_VK_NUMPAD5: 101,
        DOM_VK_NUMPAD6: 102,
        DOM_VK_NUMPAD7: 103,
        DOM_VK_NUMPAD8: 104,
        DOM_VK_NUMPAD9: 105,
        DOM_VK_MULTIPLY: 106,
        DOM_VK_ADD: 107,
        DOM_VK_SUBTRACT: 109,
        DOM_VK_DECIMAL_POINT: 110,
        DOM_VK_DIVIDE: 111,
        DOM_VK_F1: 112,
        DOM_VK_F2: 113,
        DOM_VK_F3: 114,
        DOM_VK_F4: 115,
        DOM_VK_F5: 116,
        DOM_VK_F6: 117,
        DOM_VK_F7: 118,
        DOM_VK_F8: 119,
        DOM_VK_F9: 120,
        DOM_VK_F10: 121,
        DOM_VK_F11: 122,
        DOM_VK_F12: 123,
        DOM_VK_NUM_LOCK: 144,
        DOM_VK_SCROLL_LOCK: 145,
        DOM_VK_SEMICOLON: 186,
        DOM_VK_EQUALS: 187,
        DOM_VK_EQUAL_SIGN: 187,
        DOM_VK_COMMA: 188,
        DOM_VK_DASH: 189,
        DOM_VK_PERIOD: 190,
        DOM_VK_FORWARD_SLASH: 191,
        DOM_VK_GRAVE_ACCENT: 192,
        DOM_VK_OPEN_BRACKET: 219,
        DOM_VK_BACK_SLASH: 220,
        DOM_VK_CLOSE_BRAKET: 221,
        DOM_VK_SINGLE_QUOTE: 222
    };
}

/**
 * keeps on trying to press the bottom related image (the last one to the bottom right) until it does.
 * @param interval  the interval between clicks
 */
function tryToClickBottom_ris_image(interval) {
    if (!interval) interval = 30;
    const recursivelyClickLastRelImg = () => setTimeout(function () {
        const relatedImageDivs = IP.focP.ris_Divs;
        const pop = Array.from(relatedImageDivs).pop();
        // log('recursivelyClickLastRelImg:', pop);
        if (pop && pop.click) {
            pop.click();
            clearTimeout(this);
            return false;
        } else {
            recursivelyClickLastRelImg();
        }
    }, interval);
    recursivelyClickLastRelImg();
}

/**
 * Navigates to the previous related image in the irc_ris in the main panel.
 * @return {boolean} returns true if the successful (no errors occur)
 */
function prevRelImg() {
    try {
        const panel = IP.focP;
        if (!panel.ris_fc_Div) return false;
        let previousElementSibling = panel.ris_fc_Div.previousElementSibling;

        if (previousElementSibling) {
            previousElementSibling.click();
        } else {
            if (LOOP_RELATED_IMAGES) {
                const relImgsOnly = Array.from(panel.ris_Divs);// List of relImgs without that last "View More".
                relImgsOnly.pop().click();
            } else {
                IP.previousImage();
                tryToClickBottom_ris_image(10);
            }
        }
        return true;
    } catch (e) {
        console.warn(e);
    }
}
/**
 * Navigates to the next related image in the irc_ris in the main panel.
 * @return {boolean} returns true if the successful (no errors occur)
 */
function nextRelImg() {
    try {
        const panel = IP.focP;
        const ris_fc_Div = panel.ris_fc_Div;
        if (!panel.ris_fc_Div) {
            return false;
        }
        let nextElSibling = ris_fc_Div.nextElementSibling;
        if (nextElSibling && !nextElSibling.classList.contains('irc_rismo')) {
            nextElSibling.click();
        } else {
            if (LOOP_RELATED_IMAGES) {
                console.log("clicking first irc_irs to loop, cuz there isn't any on the right", panel.ris_DivsAll[0]);
                Array.from(panel.ris_DivsAll)[0].click();
            } else {
                IP.nextImage();
            }
        }
        return true;
    } catch (e) {
        console.warn(e);
    }
}

unsafeWindow.toggleEncryptedGoogle = toggleEncryptedGoogle; // todo: Remove this! it's just made public for the DisplayOriginalImage script
function toggleEncryptedGoogle(dontChangeLocation) {
    console.log("Toggle encrypted google");
    const onEncrGoogle = new RegExp("encrypted\.google\.com").test(location.hostname);

    var targetURL;
    // targetURL=safeSearchOffUrl(); if (targetURL) location.href = targetURL;

    targetURL = location.href;
    targetURL = !onEncrGoogle ?
        targetURL.replace(/www\.google\.[\w.]+/i, "encrypted.google.com") :
        targetURL.replace(/encrypted\.google\.[\w.]+/i, "www.google.com");
    console.log('Target URL:', targetURL);
    if (!dontChangeLocation)
        location.href = targetURL;
    return targetURL;
}

/**
 * Order of key strokes in naming convention:   Ctrl > Shift > Alt >  Meta
 * @param keyEvent
 * @returns {{CTRL_ONLY: boolean, SHIFT_ONLY: boolean, ALT_ONLY: boolean, META_ONLY: boolean, NONE: boolean}}
 */
function getKeyEventModifiers(keyEvent) {
    /** @type {{CTRL_ONLY: boolean, SHIFT_ONLY: boolean, ALT_ONLY: boolean, NONE: boolean}} */
    return {
        CTRL_SHIFT: keyEvent.ctrlKey && !keyEvent.altKey && keyEvent.shiftKey && !keyEvent.metaKey,
        CTRL_ALT: keyEvent.ctrlKey && keyEvent.altKey && !keyEvent.shiftKey && !keyEvent.metaKey,
        SHIFT_ALT: !keyEvent.ctrlKey && keyEvent.altKey && keyEvent.shiftKey && !keyEvent.metaKey,
        CTRL_ONLY: keyEvent.ctrlKey && !keyEvent.altKey && !keyEvent.shiftKey && !keyEvent.metaKey,
        CTRL_SHIFT_ALT: keyEvent.ctrlKey && keyEvent.altKey && keyEvent.shiftKey && !keyEvent.metaKey,

        SHIFT_ONLY: !keyEvent.ctrlKey && !keyEvent.altKey && keyEvent.shiftKey && !keyEvent.metaKey,
        ALT_ONLY: !keyEvent.ctrlKey && keyEvent.altKey && !keyEvent.shiftKey && !keyEvent.metaKey,
        META_ONLY: !keyEvent.ctrlKey && !keyEvent.altKey && !keyEvent.shiftKey && keyEvent.metaKey,

        NONE: !keyEvent.ctrlKey && !keyEvent.shiftKey && !keyEvent.altKey && !keyEvent.metaKey
    };
}
function onkeydown(e) { // there will be no event if the target element is of type input (example: typing in the search bar, no hotkey will activate)
    const targetElIsInput = targetIsInput(e);

    if (targetElIsInput) {
        // console.debug('TargetElIsInput', e.target);
        return false;
    }
    const k = (window.event) ? e.keyCode : e.which;

    const ModifierKeys = getModifierKeys(e);
    /*if(e.ctrlKey && a == KeyEvent.DOM_VK_S)
     {
     if(i)
     {
     a = protected_createElement("a");
     a.href = i.src;
     a.download = ""; // HTML5
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     }
     return;
     }*/
    /*if (e.altKey || e.metaKey /!*|| (e.ctrlKey && a !== KeyEvent.DOM_VK_SPACE && a !== KeyEvent.DOM_VK_F5 && a !== KeyEvent.DOM_VK_R)*!/) {
     return;
     }*/

    // keys that don't need focusedPanel and all those other variables
    switch (k) {
        case KeyEvent.DOM_VK_R:
            if (ModifierKeys.CTRL_ONLY || ModifierKeys.ALT_ONLY) {
                e.preventDefault();
                toggleEncryptedGoogle();
                break;
            }
    }

    if (!IP.mainPanelEl || typeof IP.mainPanelEl === 'undefined') {
        console.debug("Main mainImage panel not found!!");
        return;
    }
    const focusedPanel = IP.focP; //getFocusedPanel(); //ImagePanel.focusedPanel; // the active panel
    if (!focusedPanel) {
        console.warn("PANEL NOT FOUND!");
        return false;
    }

    // @info mainImage drop-down panel:    #irc_bg

    // keys between 1 and (#buttons-1)
    if (k >= KeyEvent.DOM_VK_ALPHA1 && k <= (KeyEvent.DOM_VK_ALPHA1 + focusedPanel.buttons.length - 1)) {
        if (focusedPanel.buttons) {
            focusedPanel.buttons[e.key - 1].click();
        } else {
            console.warn('Panel buttons not found');
        }
    }
    switch (k) {
        // case KeyEvent.DOM_VK_ESCAPE:
        //     break;
        case KeyEvent.DOM_VK_CLOSE_BRAKET:
            if (ModifierKeys.NONE) { //
                const minImgSizeSlider = q('#minImgSizeSlider');
                minImgSizeSlider.value = parseInt(minImgSizeSlider.value) + parseInt(minImgSizeSlider.step);
            }
            break;
        case KeyEvent.DOM_VK_OPEN_BRACKET:
            if (ModifierKeys.NONE) { //
                const minImgSizeSlider = q('#minImgSizeSlider');
                minImgSizeSlider.value = parseInt(minImgSizeSlider.value) - parseInt(minImgSizeSlider.step);
            } else if (ModifierKeys.CTRL_ONLY) { // trim search query from left
                const searchBox = q('#lst-ib');
                var unwantedStr = searchBox.value.match(/(?<=(:)).+?\./);
                if (!unwantedStr)
                    break;
                searchBox.value = searchBox.value.replace(unwantedStr[0], '');
                searchBox.form.submit();
            }
            break;
        case KeyEvent.DOM_VK_SINGLE_QUOTE: // '  toggle the loop-relImgs option on and off
            if (!ModifierKeys.NONE) {
                LOOP_RELATED_IMAGES = !LOOP_RELATED_IMAGES;
                GM_setValue('LOOP_RELATED_IMAGES', LOOP_RELATED_IMAGES);
                console.log('LOOP_RELATED_IMAGES toggled to:', LOOP_RELATED_IMAGES);
            }
            break;
        case KeyEvent.DOM_VK_T: // T for torrent
            console.debug('Torrent search');
            openInTab(gImgSearchURL + encodeURIComponent("+torrent +rarbg " + cleanSymbols(focusedPanel.bestNameFromTitle)));
            break;
        case KeyEvent.DOM_VK_S: // Save
            var btn_Save = focusedPanel.q('.i15087');
            console.debug('btn_Save', btn_Save);
            if (!!btn_Save) btn_Save.click();
            break;
        case KeyEvent.DOM_VK_V: // View saves
            var btn_ViewSaves = focusedPanel.q('.i18192');
            console.debug('btn_ViewSaves', btn_ViewSaves);
            if (!!btn_ViewSaves) btn_ViewSaves.click();
            break;
        case KeyEvent.DOM_VK_B: // Search _B_y image
        case KeyEvent.DOM_VK_NUMPAD1:
            if (ModifierKeys.NONE) {
                const focusedRelatedImageUrl = focusedPanel.ris_fc_Url;
                if (typeof focusedPanel.mainImage !== "undefined") {
                    focusedPanel.q('a.search-by-image').click();
                    log("focusedRelatedImageUrl:", focusedRelatedImageUrl);
                } else {
                    console.error('Image not found', focusedRelatedImageUrl);
                }
            }
            break;
        // TODO:
        case KeyEvent.DOM_VK_NUMPAD4:
            if (ModifierKeys.NONE) {
                IP.previousImage();
            }
            break;
        case KeyEvent.DOM_VK_NUMPAD6:
            if (ModifierKeys.NONE) {
                IP.nextImage();
            }
            break;
        // Open related images (press the bottom right square in the corner) in new tab
        case KeyEvent.DOM_VK_NUMPAD3:
            if (ModifierKeys.NONE) {
                const moreRelatedImagesLink = focusedPanel.q('.irc_rismo.irc_rimask a');
                if (moreRelatedImagesLink != null) {
                    openInTab(moreRelatedImagesLink.href);
                }
            }
            break;
        case KeyEvent.DOM_VK_ENTER:
            console.log('Numpad5 pressed', e);
            if (ModifierKeys.NONE) {
                const currentImgUrl = focusedPanel.ris_fc_Url;
                console.log('currentImgUrl:', currentImgUrl);
                openInTab(currentImgUrl);
            } else if (e.shiftKey) {    // NOT WORKING!!
                IP.downloadCurrentImage();
                // e.preventDefault();
            }
            break;
        // Previous related mainImage
        case KeyEvent.DOM_VK_COMMA:
        case KeyEvent.DOM_VK_UP:
        case KeyEvent.DOM_VK_NUMPAD8: // Prev/Left relImage
            if (ModifierKeys.NONE) {
                prevRelImg();
                break;
            }
        // Next related mainImage
        case KeyEvent.DOM_VK_PERIOD:
        case KeyEvent.DOM_VK_DOWN:
        case KeyEvent.DOM_VK_NUMPAD2:// Next/Right relImage
            if (ModifierKeys.NONE) {
                nextRelImg();
            }
            break;
        case KeyEvent.DOM_VK_O:
            if (ModifierKeys.NONE) {
                for (var div of focusedPanel.ris_Divs) {
                    var anchor = div.querySelector('a[href]');
                    const img = div.querySelector('img');
                    console.log('Replacing with original:', img, "Anchor:", anchor);
                    replaceImgSrc(img, anchor);
                }
            }
            break;
        case KeyEvent.DOM_VK_H:
            if (ModifierKeys.ALT_ONLY) {
                q('#rcnt').style.visibility = (/hidden/i).test(q('#rcnt').style.visibility) ? 'visible' : 'hidden';
                e.preventDefault();
            }
            break;
        case KeyEvent.DOM_VK_M:
            IP.download_ris();
            break;
        // lookup the images title.
        case KeyEvent.DOM_VK_NUMPAD7:
            // I have options, I'll choose the best later
            if (ModifierKeys.NONE) {
                const visitUrl = focusedPanel.buttons[0].href;
                // const visitTitleUrl = subtitleEl.href;

                console.log('Visit:', visitUrl);
                openInTab(visitUrl);
            }
            break;
        // Search using title
        case KeyEvent.DOM_VK_NUMPAD9:
            if (ModifierKeys.NONE) {
                focusedPanel.lookupTitle();
            } else if (ModifierKeys.ALT_ONLY) { // TODO:
                openInTab(gImgSearchURL + encodeURIComponent(cleanSymbols(focusedPanel.descriptionText).trim()));
                e.preventDefault();
            }
            break;
        case KeyEvent.DOM_VK_NUMPAD5:
            IP.downloadCurrentImage();
            break;
        case KeyEvent.DOM_VK_SEMICOLON:
            if (ModifierKeys.SHIFT_ONLY) {
                focusedPanel.siteSearch();
            }
            break;
    }
}

function openInTab(url, target) {
    window.open(url, target || "_blank");
}
function cleanDates(str) {
    return str;
    // return !str ? str : removeDoubleSpaces(str.replace(/\d*([^-/.]+)\d*/g, ' '));
}
function cleanSymbols(str) {
    return !str ? str : removeDoubleSpaces(
        cleanDates(str)
            .replace(/[-!$%^&*()_+|~=`{}\[\]";'<>?,.\/]/gim, ' ')
            .replace(/rarbg|\.com|#|x264|DVDRip|720p|1080p|2160p|MP4|IMAGESET|FuGLi|SD|KLEENEX|BRRip|XviD|MP3|XVID|BluRay|HAAC|WEBRip|DHD|rartv|KTR|YAPG/gi, " ")
    ).trim();
}

function getImgAnchors() {
    return qa('#rg_s > div > a[href]');
}

/**
 * @returns {Set<any>}
 */
function getResultsData() {
    let anchors = getImgAnchors();
    // let map = new Map();
    let set = new Set();
    for (let a of anchors) {
        var img, metaDataObj, metaDataJSONText = "{}";
        try {
            img = a.querySelector('img');
            metaDataJSONText = getMetaEl(img).innerText;
            metaDataObj = JSON.parse(metaDataJSONText);

            metaDataObj.loaded = img.getAttribute('loaded');
            metaDataObj.imgSrc = img.src;
        } catch (e) {
            console.warn(e);
        }
        set.add(JSON.stringify(metaDataObj) || metaDataJSONText);
    }
    console.log('set:', set);
    return set;
}
function stringifyIterable(iterable) {
    let str = '{';
    let i = 0;
    for (let e of iterable.keys()) {
        str += (i == 0 ? '' : ', ') + '\n\t' + e.toString();
        i++;
    }
    return str + '\n}';
}
function downloadImageData() {
    let text = stringifyIterable(getResultsData());
    let name = 'GImg data_' + document.title;
    anchorClick(makeTextFile(text), name);
}

/**
 * adds an attribute "load" indicating the load status
 *  load = "true":      image loaded successfully
 *  load = "false":     image still loading
 *  load = "error":     image failed to load
 * @param imgUrl
 * @param imgEl
 */
function markImageOnLoad(imgEl, imgUrl) {
    if (!imgEl) return;
    imgUrl = !!imgUrl ? imgUrl : imgEl.src;
    if (imgEl.hasAttribute('loaded')) {
        // console.log('Img already has "loaded" attr:', imgEl);
        return;
    }
    var imgObj = new Image();
    createAndAddAttribute(imgEl, 'loaded', false);
    imgObj.onerror = function () {
        imgEl.setAttribute('loaded', 'error');
    };
    imgObj.onload = function () {
        imgEl.setAttribute('loaded', true);
    };
    try {
        imgObj.src = imgUrl;
    } catch (e) {
        if (logAnnoyingNetworkErrors) console.error(e);
    }
}

/**
 * This is the URL with safe search off
 * @returns false if the page is already with "safe search" off
 */
function safeSearchOffUrl() {
    var safeSearchButton = document.getElementById("ss-bimodal-default");
    return !safeSearchButton ? false : safeSearchButton.href;
}

const responseBlobs = new Set();

/**
 * @returns {string}
 */
function getGimgPageInfoText() {
    return `${document.title}:\t${location.href}
    
${stringifyIterable(getResultsData())}
`;
}

function setupProgressBar() {
    progressBar = progressBar || new ProgressBar.Line('#progressbar-container', {
        easing: 'easeInOut',
        color: '#FCB03C',
        strokeWidth: 1,
        trailWidth: 1,
        text: {
            value: '0'
        }
    });
    progressBar.set(0);
    q('.progressbar-text').style = "position: relative;display: inline;";
}

unsafeWindow.getQualifiedGImgs = getQualifiedGImgs;
/**
 * @param ogs
 * @returns {Set<{fileURL: string, fileName: string, img: HTMLImageElement}>}
 * to get images that only satisfy the dimensions condition:    getQualifiedGImgs(null, null, true)
 */
function getQualifiedGImgs(ogs, minSizeExceptionForGIFs, ignoreDlLimit) {
    ogs = !ogs ? qa('img.rg_ic.rg_i') : ogs;
    const minImgSize = q('#minImgSizeSlider').value,
        dlLimit = q('#dlLimitSlider').value,
        urlNameElOfQualifiedImgs = new Set();

    for (const og of ogs) {
        try {
            let img = og;
            const fileName = img.getAttribute('download-name') || img.alt;
            if (zip.files.hasOwnProperty(fileName)) continue;

            const meta = getMeta(img),
                fileURL = meta.ou, //img.src;
                w = parseInt(meta.ow),
                h = parseInt(meta.oh)
            ;

            const bigEnough = w >= minImgSize || h >= minImgSize || minSizeExceptionForGIFs && /\.gif\?|$/i.test(fileURL);

            if (bigEnough && (urlNameElOfQualifiedImgs.size < dlLimit || ignoreDlLimit)) {
                urlNameElOfQualifiedImgs.add({fileURL: fileURL, fileName: fileName, img: img})
            }

        } catch (e) {
            console.warn(e);
        }
    }
    console.debug('qualified img objects list:', urlNameElOfQualifiedImgs);
    return urlNameElOfQualifiedImgs;
}

function zipImages(zipName) {
    var zipCurrent = 0;
    zip = zip || new JSZip();
    zipName = (zipName || document.title).replace(/\//g, " ");

    window.onbeforeunload = function (e) {
        var dialogText = "You still didn't download your zipped files, are you sure you want to exit?";
        e.returnValue = dialogText;
        return dialogText;
    };
    const selector = `.rg_ic.rg_i`
        // `.${TOKEN_DISPLAY}[loaded^="true"], .img-big`
        // '.rg_ic.rg_i.display-original-mainImage:not(.display-original-mainImage-failed)'
    ;
    /** type {HTMLAnchorElement} */
    const ogs = qa(selector);


    const qualifiedImages = getQualifiedGImgs(null, q('#GIFsException').checked);
    zipTotal = qualifiedImages.size;

    setupProgressBar();

    console.debug('Original images to be downloaded:', ogs);
    totalSize = 0;
    totalLoaded = 0;
    activeZipThreads = 0,
        filesCount = 0
    ;

    for (const qualifiedImgArgs of qualifiedImages)
        requestAndZipImage(qualifiedImgArgs.fileURL, qualifiedImgArgs.fileName, qualifiedImgArgs.img);

    function requestAndZipImage(fileUrl, fileName, img) {
        let fileSize = 0,
            loadedLast = 0
        ;
        activeZipThreads++;
        zippingInProgress = true; // todo: destroy this variable
        fileName = /*(++filesCount) +' '+*/ removeDoubleSpaces(fileName.replace(/\//g, " "));

        if (zip.files.hasOwnProperty(fileName)) {
            console.log('ZIP already contains the file: ', fileName);
            return;
        }

        function onBadResult(res) {
            console.debug('onBadResult:', 'fileURL:', fileUrl, 'response.finalURL:', res.finalUrl);
            if (!isDdgUrl(res.finalUrl)) {
                console.debug(
                    'retrying with ddgproxy',
                    '\nddgpURL:', ddgProxy(fileUrl),
                    '\nfileURL:', fileUrl,
                    '\nresponse.finalURL:', res.finalUrl
                );
                if (/<!DOCTYPE/.test(res.responseText)) {
                    console.error('Not image data!', res.responseText);
                    zipCurrent++;
                    return;
                }
                requestAndZipImage(ddgProxy(fileUrl), fileName, img);
            } else {
                return true;
            }
        }

        GM_xmlhttpRequest({
            method: "GET",
            url: fileUrl || "https://i.ytimg.com/vi/RO90omga8D4/maxresdefault.jpg",
            responseType: 'arraybuffer',
            binary: true,
            onload: function (res) {
                if (zip.files.hasOwnProperty(fileName)) {
                    return;
                }
                try {
                    console.debug("onload:"
                        + "\nreadyState: " + res.readyState
                        + "\nresponseHeaders: " + res.responseHeaders
                        + "\nstatus: " + res.status
                        + "\nstatusText: " + res.statusText
                        + "\nfinalUrl: " + res.finalUrl
                        + "\nresponseText: " + res.responseText.slice(0, 100) + '...'
                    );
                } catch (e) {
                }

                var contentType = res.responseHeaders.match(/content-type: \w+\/\w+/)[0].replace('content-type: ', '');
                const typeSplit = contentType.split('/');
                var ext = typeSplit.pop(),
                    mimeType = typeSplit.pop()
                ;
                console.debug('contentType: ' + contentType);

                if (/<!DOCTYPE html PUBLIC/.test(res.responseText) || !/image/i.test(mimeType)) {
                    console.error('Not image data!', res.responseText);
                    if (onBadResult(res) || /<!DOCTYPE html PUBLIC/.test(res.responseText)) {
                        return;
                    }
                }
                var blob = new Blob([res.response], {type: contentType});

                responseBlobs.add(blob);
                zip.file(`${fileName}.${ext || "image/gif"}`, blob);
                console.log("Added file to zip:", fileName, fileUrl);
                zipCurrent++;

                // fixing the download button text
                const downloadBtn = q('#downloadBtn');
                downloadBtn.classList.add('genzip-possible');
                downloadBtn.innerHTML = q('#zipInsteadOfDownload').checked ?
                    (!downloadBtn.classList.contains('genzip-possible') ? 'ZIP' : 'Download&nbsp;ZIP&nbsp;⇓') :
                    'Download&nbsp;⇓';


                if (zipCurrent < zipTotal || zipTotal <= 0) {
                    return;
                }

                if (zipCurrent >= zipTotal) {
                    console.log("Generating ZIP...", "\nFile count:", Object.keys(zip.files).length);
                    zipTotal = 0;
                    genZip();
                }
                activeZipThreads--;
            },
            onreadystatechange: function (res) {
                console.debug("Request state changed to: " + res.readyState);
                if (res.readyState === 4) {
                    console.debug('ret.readyState === 4');
                }
            },
            onerror: function (res) {
                if (onBadResult(res)) {
                    return;
                }
                console.error("An error occurred."
                    + "\nreadyState: " + res.readyState
                    + "\nresponseHeaders: " + res.responseHeaders
                    + "\nstatus: " + res.status
                    + "\nstatusText: " + res.statusText
                    + "\nfinalUrl: " + res.finalUrl
                    + "\nresponseText: " + res.responseText
                );
                // else {
                //     //zipCurrent++;
                // }
                activeZipThreads--;
            },
            onprogress: function (res) {
                if (zip.files.hasOwnProperty(fileName) || zipCurrent < zipTotal || zipTotal <= 0) {
                    //TODO: stop the GM_xmlrequest at this point

                    // if(res.abort)
                    //     res.abort();
                    // else
                    //     console.error('res.abort not defined');
                    // if(this.abort)
                    //     this.abort();
                    // else
                    //     console.error('this.abort not defined');
                    // return;
                }

                if (res.lengthComputable) {
                    if (fileSize == 0) { // happens once
                        fileSize = res.total;
                        totalSize += fileSize;
                    }
                    const loadedSoFar = res.loaded;
                    const justLoaded = loadedSoFar - loadedLast;    // What has been added since the last progress call
                    const fileprogress = loadedSoFar / res.total;   //

                    totalLoaded += justLoaded;
                    const totalProgress = totalLoaded / totalSize;

                    if (false) {
                        console.debug(`
loadedSoFar = ${res.loaded};
justLoaded = ${loadedSoFar - loadedLast}
fileprogress = ${loadedSoFar / res.total}`);
                    }

                    progressBar.set(totalProgress);
                    progressBar.setText(`Files in ZIP: (${Object.keys(zip.files).length} / ${zipTotal}) Active threads: ${activeZipThreads}     (${totalLoaded} / ${totalSize})`);

                    loadedLast = loadedSoFar;
                }
            }
        });
    }

    return zip;
}

/*
 function addToZip(og) {
 try {
 let image = og.tagName == 'IMG' ? og :
 og.querySelector('img[src]');

 if (true || imageIsBigEnough(image)) {
 let fileUrl = isDdgUrl(image.src) ? image.src : extractImgData(image, 'ou');
 const ext = /com/.test(getFileExtension(fileUrl)) ? getFileExtension(fileUrl) : 'gif';
 GM_xmlhttpRequest({
 method: "GET",
 url: fileUrl || "https://i.ytimg.com/vi/RO90omga8D4/maxresdefault.jpg",
 responseType: 'arraybuffer',
 binary: true,
 onload: function (res) {
 var blob = new Blob([res.response], {type: "image/" + ext});
 const fileName = image.getAttribute('download-name') || image.alt;
 console.log("Filename:", fileName, image);
 zip.file(`${fileName}.${ext}`, blob);


 (++zipCurrent >= zipTotal) ? genZip() : addToZip(ogs[zipCurrent]);
 }, onreadystatechange: function (res) {
 console.debug("Request state changed to: " + res.readyState);
 if (res.readyState === 4) {
 console.debug('ret.readyState === 4');
 }
 },
 onerror: function (res) {
 console.error("An error occurred."
 + "\nresponseText: " + res.responseText
 + "\nreadyState: " + res.readyState
 + "\nresponseHeaders: " + res.responseHeaders
 + "\nstatus: " + res.status
 + "\nstatusText: " + res.statusText
 + "\nfinalUrl: " + res.finalUrl);
 zipCurrent++;
 },
 onprogress: function (res) {
 if (res.lengthComputable) {
 const progress = res.loaded / res.total;
 console.log("progress:", progress);
 progressBar.animate(progress);
 }
 }
 });
 }
 } catch (e) {
 console.warn(e);
 }
 }
 */

function unionTitleAndDescr(str1, str2) {
    if (!str1) return str2;
    if (!str2) return str1;
    var regex = new RegExp(str2.match(/[^$-/:-?{-~!"^_`\[\]]+/g).join('|'), 'gi');
    var str1MinusStr2 = str1.replace(regex, ' ');
    var concat = removeDoubleSpaces(str1MinusStr2 + ' ' + str2);
    if (false) {
        console.debug('regex:', regex,
            '\nstr1MinusStr2:', str1MinusStr2,
            '\nConcat:', concat);
    }
    return concat;
}
function unionStrings(str1, str2) {
    var words1 = str1.split(/\s+/g),
        words2 = str2.split(/\s+/g),
        resultWords = [],
        i,
        j;

    for (i = 0; i < words1.length; i++) {
        for (j = 0; j < words2.length; j++) {
            if (words1[i].toLowerCase() == words2[j].toLowerCase()) {
                console.log('word ' + words1[i] + ' was found in both strings');
                resultWords.push(words1[i]);
            }
        }
    }
    return resultWords.join(' ');
}

function iterateOverURLPattern(inputURL) {
    inputURL = inputURL || 'https://proxy.duckduckgo.com/iu/?u=http%3A%2F%2Fwww.chestmeat.com%2Fwp-content%2Fuploads%2Fbusty-blonde-sex-[0-30].jpg&f=1';

    var bracketsContent = inputURL.match(/\[.+]/),
        [start, end] = bracketsContent[0].replace(/[\[\]]/g, '').split('-')
    ;

    console.log('bracketsContent:', bracketsContent);
    console.log('start, end:', `["${start}", "${end}"]`);

    for (var i = start; i < end; i++) {
        var url = inputURL.replace(/\[.+]/, i);
        console.log(url);
    }
}
function incrementURL(up) {
    var e, s;
    IB = !!up ? 1 : -1;

    function isDigit(c) {
        return ("0" <= c && c <= "9")
    }

    var tip = location.href.match(/&f=1$/)[0] || "";
    L = location.href.replace(tip, "");
    LL = L.length;
    for (e = LL - 1; e >= 0; --e) if (isDigit(L.charAt(e))) {
        for (s = e - 1; s >= 0; --s) if (!isDigit(L.charAt(s))) break;
        break;
    }
    ++s;
    if (e < 0) return;
    oldNum = L.substring(s, e + 1);
    newNum = "" + (parseInt(oldNum, 10) + IB);
    while (newNum.length < oldNum.length) newNum = "0" + newNum;
    location.href = L.substring(0, s) + newNum + L.slice(e + 1) + tip;
}

function getGSavesURL(input) {

}


