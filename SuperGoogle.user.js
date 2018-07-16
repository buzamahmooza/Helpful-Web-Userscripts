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
// @require      http://code.jquery.com/jquery-latest.min.js
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\Handy AF functions Faris.user.js
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\SuperGoogle.user.js
// @require      https://raw.githubusercontent.com/kimmobrunfeldt/progressbar.js/master/dist/progressbar.min.js
// @run-at       document-end
// ==/UserScript==

// @require      https://github.com/buzamahmooza/Helpful-Web-Userscripts/raw/master/Handy%20AF%20functions%20Faris.user.js
// @require      https://greasyfork.org/scripts/38996-faris-handy-webdev-javascript-functions/code/Faris%20Handy%20Webdev%20JavaScript%20functions.user.js


// To-do list:
// [] TODO  work on the saveublsites function to save data as JSON (information such as: ddgp, dimensions, #successes, #dgpSuccesses)
//[ ]       TODO:   Merge/combine the 3 google mainImage scripts to make this script work on Google images independantly.
//[ ]       TODO:   (low priority) Add tooltips to the checkboxes with descriptions and include the keyboard shortcuts.
// [x]      Migrate all the buttons and extra Google stuff from the DisplayOriginalImages script
// [x]      Make function unionTitles(title1, title2) (has words in both but without duplicates), good for naming images using both description and title
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

console.debug('SuperGoogleScript running');

// noinspection ES6ConvertVarToLetConst
var debug = true;
var logAnnoyingNetworkErrors = false;
if (typeof debug === 'undefined') debug = false;
if (typeof log === 'undefined') log = (...msg) => (debug) ? console.log('Log:', ...msg) : false;

const Consts = {
    GMValues: {
        UBL_SITES: 'unblocked sites of og images',
        UBL_URLS: 'unblocked image URLs',
        UBL_SITES_MAP: 'UBL sites map',
        autosaveUblSites: 'AUTO_SAVE_UBL_SITES'
    },
    Selectors: {
        showAllSizes: '#jHnbRc > div.O1id0e > span:nth-child(2) > a',    // The "All sizes" link from the SearchByImage page
        searchModeDiv: 'div#hdtb-msb-vis',
        selectedSearchMode: 'div#hdtb-msb-vis' + ' div.hdtb-msel',
        currentImagePanel: "a#irc_cb",     // the panel element containing the current image [data-ved], so if you observe this element, you can get pretty much get all the data you want.
        searchBox: "#lst-ib"
    }
};

const ClassNames = {
    DISPLAY_ORIGINAL: "display-original-" + "mainImage",
    DISPLAY_ORIGINAL_GIF: "display-original-" + "-gif",
    FAILED: "display-original-" + "-failed",
    FAILED_DDG: "display-original-" + "-ddg-failed",

    BUTTONS: "super-button"
};
const HIDE_FAILED_IMAGES_ON_LOAD = GM_getValue("HIDE_FAILED_IMAGES_ON_LOAD", false),
    AUTO_SAVE_UBL_SITES = GM_getValue(Consts.GMValues.autosaveUblSites, false);

googleBaseURL = `${location.protocol}//${location.hostname}`;
gImgSearchURL = `${googleBaseURL}/search?&hl=en&tbm=isch&q=`;

// GM_setValue(Constants.GMValues.UBL_SITES, "");
// GM_setValue(Constants.GMValues.UBL_URLS, "");
// GM_setValue(Constants.GMValues.UBL_SITES_MAP, "");

let ublSitesSet = new Set(),
    ublMetas = new Set();

/** Contains the ubl data of a single domain name */
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
    GM.getValue = GM_getValue;
    GM.setValue = GM_setValue;
}

if (typeof unsafeWindow === "undefined") unsafeWindow = window;
// prevents duplicates
if (typeof unsafeWindow.superGoogleScript === 'undefined') {
    unsafeWindow.superGoogleScript = this;
} else {
    void(0);
}

const mimeTypesJSON = $.getJSON(
    "https://cdn.rawgit.com/jshttp/mime-db/master/db.json",
    /** (PlainObject data, String textStatus, jqXHR jqXHR) */
    function (data, textStatus, jqXHR) {
        console.log("JQuery.getJSON()\ndata, textStatus, jqXHR :", data, textStatus, jqXHR);
    }
);

// OPTIONS:
const Settings = {
    invertWheelRelativeImageNavigation: false,
    defaultAnchorTarget: "_blank",
    staticNavbar: false,
    LOOP_RELATED_IMAGES: GM_getValue('LOOP_RELATED_IMAGES', false)
};
const successColor = 'rgb(167, 99, 255)',
    urlArgs = {
        // "tbs=isz": "lt",//
        // islt: "2mp",    // isLargerThan
        // tbs: "isz:l",   // l=large, m=medium...
        // "hl": "en"
    }
;


let slider_dlLimit,
    slider_minImgSize,

    controlsContainerId = 'google-controls-container',
    progressBar,
    searchModeDiv = q('#hdtb-msb-vis'),
    selectedSearchMode = !searchModeDiv ? null : searchModeDiv.querySelector('div.hdtb-msel'),
    onGoogleImages = selectedSearchMode && selectedSearchMode.innerHTML == 'Images'
;
var currentDownloadCount = 0;


// language=CSS
addCss(
    `.hover-click:hover,
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

/*bigger space between image boxes*/
div.rg_bx {
    margin: 10px;
}

/*fixes the selection area of main image anchors*/
.irc_asc {
    display: inline-block !important;
}
.irc_ris {
	height: fit-content !important;
	width: 80% !important;
}

/**/
div.text-block {
    display: block;
    position: absolute;
    color: white;
    opacity: 0.4;
    
    padding: 5px;
    margin: 2px;
    
	min-height: 15px;
	min-width: 15px;
	width: fit-content;
	height: fit-content;
    top: 0;
    left: 0;
    
    border-radius: 5px;
    font: normal 11px arial, sans-serif;
	white-space: nowrap;
}
div.text-block.ext-gif {
    background-color: magenta;
}
div.text-block.ext:not(.ext-gif) {
    background-color: #00cbff;
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

.fixed-position${Settings.staticNavbar ? ', #qbc, #rshdr:not(#sfcnt)' : ''} {
    position: fixed;
    top: 0;
    z-index: 1000;
}

.ubl-site {
    color: ${successColor} !important;
}

.scroll-nav:hover,
.scroll-nav *:hover:not(.hover-click),
.scroll-nav *:focus:not(.hover-click) {
    cursor: crosshair, auto;
}
`, 'superGoogleStyle');


/** change mouse cursor when hovering over elements for scroll navigation
 * cursor found here:   https://www.flaticon.com/free-icon/arrows_95103#
 */
/*addCss(`

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

// URL args: Modifying the URL and adding arguments, such as specifying the size
if (urlArgs && Object.keys(urlArgs).length) {
    const url = new URL(location.href),
        searchParams = url.searchParams;

    for (const key in urlArgs) {
        if (urlArgs.hasOwnProperty(key)) {
            if (searchParams.has(key))
                searchParams.set(key, urlArgs[key]);
            else
                searchParams.append(key, urlArgs[key]);
        }
    }
    console.debug('new location:', url.toString());


    // if (false)
    if (!compareUrlSearchParams(new URL(location.href), url))
        location.assign(url.toString());

    //done: problem: url equality between old and new URLs always returns false. Find a way to compare the new URL with the old one (considering the fact that searchParams may have been reordered, so string comparison is not an option).
    function compareUrlSearchParams(url1, url2) {
        const sp1 = url1.searchParams;
        const sp2 = url2.searchParams;
        sp1.sort();
        sp2.sort();
        console.log(
            sp1.toString() + " === " + sp2.toString(),
            "\n " + sp1.toString() === sp2.toString()
        );
        return sp1.toString() === sp2.toString();
    }
}

// if on google.com/saves, add keyboard shortcuts
if (/google\..+\/save/.test(location.href)) {
    console.log('beginning of google.com/save site...');
    window.addEventListener('keydown', function keyDown(e) {
        const k = (window.event) ? e.keyCode : e.which,
            modKeys = getModKeys(e);
        switch (k) {
            case KeyEvent.DOM_VK_GRAVE_ACCENT: // `
                if (modKeys.NONE) {
                    console.log('wrapGSavesPanelsWithAnchors');
                    GSaves.wrapPanels();
                }
                break;
        }
    });

    if (false)
        observeAllFrames(function (mutationTarget) {
            console.log('mutationTarget:', mutationTarget);
            if (mutationTarget.querySelector('.str-clip-card-space')) {
                console.log('mutationTarget invoked wrapGSavesPanelsWithAnchors()');
                GSaves.wrapPanels();
            }
        });
}

const belowDivClassName = 'below-st-div';

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
    for (const metaEl of qa('div.rg_meta')) {
        if (metaEl.innerText.indexOf(id) > -1) {
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

unsafeWindow.gZipImages = gZipImages;
var zip = new JSZip();
unsafeWindow.zip = zip;
unsafeWindow.genZip = genZip;
JSZip.prototype.generateZipIndexHtml = function generateZipIndexHtml() {
    let html = "";
    for (const key in this.files) {
        try {
            const file = this.files[key];
            /**{url, name, page}*/
            const data = JSON.parse(file.comment ? file.comment : "{}");
            html += `<div>
    <a href="${data.url || file.name}">
        <img src="${file.name}">
    </a>
        <div>
        <a href="${data.page}" target="_blank">${file.name}</a>
        <h4>${file.name}</h4>
        <h3>${data.name || file.name}</h3>
        </div>
    </div>`;
        } catch (e) {
            console.error(e)
        }
    }
    return zip.file("index.html", new Blob([html], {type: 'text/plain'}));
};

function genZip(zipName) {
    zip.file("index (online).html", new Blob([getIndexHtml()], {type: 'text/plain'}));

    zip.generateZipIndexHtml(zip);
    zip.generateAsync({type: "blob"}).then(function (content) {
            zipName = (zipName || document.title).replace(/site:|( - Google Search)/gi, '');

            saveAs(content, `${zipName} [${Object.keys(zip.files).length}].zip`);
            unsafeWindow.zipGenerated = true;

            window.removeEventListener('beforeunload', zipBeforeUnload);
            window.onunload = null;
        }
    );
}

unsafeWindow.extractRarbgTorrentURL = extractRarbgTorrentURL;
/**
 * @param {string} torrentName
 * @param {string} torrentPageURL
 * @returns {string}
 * https://rarbg.unblocker.win/download.php?id= kmvf126 &f= <TorrentName>-[rarbg.to].torrent
 */
function extractRarbgTorrentURL(torrentName, torrentPageURL) {
    const torrentURL = `${torrentPageURL.replace(/torrent\//i, 'download.php?id=')}&f=${torrentName.split(/\s+/)[0]}.torrent`;
    console.debug('extracted rarbg torrent URL:', torrentURL);
    return torrentURL;
}


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


/**
 * ImagePanel class
 * Provides functions for a partner element (one of the 3 panels)
 * Abbreviations:
 * ris: related image search
 * fc:  focused
 * sbi: search by image
 */
class ImagePanel {  // ImagePanel class
    constructor(element) {
        if (typeof element !== 'undefined') {
            this.el = element;
        }
    }

    /** @return {HTMLDivElement} */
    static get mainPanelEl() {
        return q("#irc_cc");
    }
    /** @return {ImagePanel} returns the panel that is currently in focus (there are 3 panels) */
    static get focP() {
        return this.mainPanelEl ? new ImagePanel(this.mainPanelEl.querySelector('div.irc_c[style*="translate3d(0px, 0px, 0px)"]')) : console.warn('MainPanel not found!');
        // return this.mainPanelEl ? new IP(this.mainPanelEl.querySelector('div.immersive-container')) : console.warn('MainPanel not found!');
    }
    static get noPanelWasOpened() {
        return q('#irc_cb').getAttribute('data-ved') == null;
    }
    static get panelCurrentlyOpen() {
        return q('#irc_bg').style.display != 'none';
    }
    /**
     @return {
     { clt: string, id: string,
                 isu: string, itg: string, ity: string,
                 oh: string, ou: string, ow: string,
                 pt: string,
                 rid: string, rmt: string, rt: string, ru: string,
                 s: string, st: string,
                 th: string, tu: string, tw
                 }
                 }
     */
    get imageData() {
        return getMeta(this.mainImage);
    }
    get isFocused() {
        return this.el.style.transform === 'translate3d(0px, 0px, 0px);';
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
        const descr = this.titleAndDescriptionDiv.querySelector('div.irc_asc');

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
        return cleanGibberish(secondaryTitle.outerText.replace(siteHostName, ''));
    }

    get ris_fc_Url() {
        return this.ris_fc_Div ? this.ris_fc_Div.querySelector('a').href : "JavaScript:void(0);";
    }
    /** Returns that small square at the bottom right (the focused one)
     * @return {HTMLDivElement} */
    get ris_fc_Div() {
        return this.q('div.irc-deck > div.irc_rimask.irc_rist');
    }
    /** @return {NodeListOf<HTMLDivElement>} returns all related image divs (including the "VIEW MORE" div)*/
    get ris_DivsAll() {
        return this.qa('div.irc-deck > div.irc_rimask');
    }
    /** @return {NodeListOf<HTMLDivElement>} returns only related image divs (excluding the "VIEW MORE" div)*/
    get ris_Divs() {
        return this.qa('div.irc-deck > div.irc_rimask:not(.irc_rismo)');
    }
    /** @return {HTMLDivElement} returns related image container (div.irc-deck)*/
    get ris_Container() {
        return this.q('div.irc-deck');
    }

    /**
     * @type {NodeListOf<HTMLAnchorElement>}
     * Visit:       a.i3599.irc_vpl.irc_lth,
     * Save:        a.i15087,
     * View saved:  a.i18192.r-iXoO2jjyyEGY,
     * Share:       a.i17628
     */
    get buttons() {
        var buttonsContaier = this.q('.irc_but_r > tbody > tr');
        var buttons = this.qa('.irc_but_r > tbody > tr a:first-child');

        buttons.Visit = buttonsContaier.querySelector('a.i3599.irc_vpl.irc_lth');
        buttons.Save = buttonsContaier.querySelector('a.i15087');
        buttons.ViewSaved = buttonsContaier.querySelector('a.i18192.r-iXoO2jjyyEGY');
        buttons.Share = buttonsContaier.querySelector('a.i17628');

        return buttons;
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

        console.log(
            'BestNameFromTitle:',
            `sTitle: ${sTitle}
pTitle: ${pTitle}
description: ${description}
unionPTitleAndDescrAndSTitle: ${unionPTitleAndDescrAndSTitle}`
        );

        return unionPTitleAndDescrAndSTitle;
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
        const risFcDiv = this.ris_fc_Div;
        var reverseImgSearchUrl = "#";
        if (!!risFcDiv) {
            const imgURL = this.mainImage.src || risFcDiv.querySelector('a').href;
            const reverseSearchURL = getGImgReverseSearchURL(imgURL),
                url = new URL(reverseSearchURL);
            url.searchParams.append('allsizes', '1');
            reverseImgSearchUrl = url.toString();
        }
        return reverseImgSearchUrl;
    }
    /**Goes to the previous (Left) main mainImage*/
    static previousImage() {
        const previousImageArrow = q('a[id^="irc-la"]');  // id that starts with "irc-la"
        var x = previousImageArrow.style.display != 'none' ? // is it there?
            !previousImageArrow.click() : // returns true
            false;
        if (!x) console.log("prev arrow doesn't exist");
        return x;
    }

    /**Goes to the next (Right) main mainImage*/
    static nextImage() {
        const nextImageArrow = q('a[id^="irc-ra"]');  // id that starts with "irc-ra"
        var x = nextImageArrow.style.display != 'none' ? // is it there?
            !nextImageArrow.click() : // returns true
            false;
        if (!x) console.log("next arrow doesn't exist");
        return x;
    }
    static modifyP(panelEl) {
        console.log('Modifying panelEl:', panelEl);
        let p = new ImagePanel(panelEl);

        const classList = p.rightPart.classList;
        if (!classList.contains('scroll-nav')) {
            classList.add('scroll-nav');
        }

        // if(!!p.buttons.Save) underlineText(p.buttons.Save.querySelector('span'), 's');
        // if(!!p.buttons.ViewSaved) underlineText(p.buttons.ViewSaved.querySelector('span'), 'v');

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
        dimensionsEl.addEventListener('click', ImagePanel.moreSizes);
        dimensionsEl.classList.add('hover-click');

        // remove "Images may be subject to copyright"
        p.sTitle_Anchor.style = "padding-right: 5px; text-decoration:none;";
        const copyrightEl = p.q('span.Af3fH.rn92ee');
        if (copyrightEl) copyrightEl.remove();

        // injecting rarbg torrent link button
        (function () {
            const rarbg_tl = createElement(`<a class="_r3 hover-click o5rIVb torrent-link"
   style=" float: left; padding: 4px; display: inline-block; font-size: 10px; color: white;">
    <img src="https://rarbg.unblocker.win/cdn/static/20/img/16x16/download.png" alt="Rarbg torrent link" border="0"
         style=" width: 25px; height: 25px; ">
    <label style=" display: list-item; ">Torrent link</label></a>`);
            rarbg_tl.onclick = () => {
                if (/\/torrent\/|rarbg/i.test(p.pTitle_Anchor.href))
                    anchorClick(extractRarbgTorrentURL(p.pTitle_Anchor.innerText, p.pTitle_Anchor.href), '_blank');
            };
            p.pTitle_Anchor.before(rarbg_tl);
        })();

        //@info .irc_ris    class of the relatedImgsDivContainer
        //@info div#isr_mc  the main container containing all the image boxes, and the panels (only 2 children)
        panelEl.addEventListener("wheel", /**
         * @param {WheelEvent} wheelEvent
         * @return {boolean}
         */
        function handleScroll(wheelEvent) {
            if (!wheelEvent.ctrlKey && !wheelEvent.metaKey && !wheelEvent.shiftKey && !wheelEvent.altKey) {
                let elUnderMouse = elementUnderMouse(wheelEvent);
                if (ImagePanel.mainPanelEl.contains(elUnderMouse)) {
                    try {
                        // Listen for scroll events
                        /** @type {DOMRect} */
                            // var rect = IP.mainPanelEl.getBoundingClientRect();
                            // console.log(rect.top, rect.right, rect.bottom, rect.left);

                        const leftPart = ImagePanel.focP.leftPart;
                        const rightPart = ImagePanel.focP.rightPart; // this is NOT the entire RIGHT part
                        const irc_ris = ImagePanel.focP.q('.irc_ris');
                        const onLeftSide = isOrContains(leftPart, elUnderMouse); //containsClassName(elUnderMouse, '.irc_t');// on left half of panel
                        const onRightPart = isOrContains(rightPart, elUnderMouse); // on RIGHT half of panel
                        const delta = getWheelDelta(wheelEvent);
                        if (Math.abs(delta) < 0.1) { // Do nothing if didn't scroll
                            log("Mousewheel didn't move");
                            return false;
                        }
                        /// Wheel definetely moved at this point
                        let wheelUp = Settings.invertWheelRelativeImageNavigation ? (delta > 0.1) : (delta < 0.1);
                        if (!onLeftSide) {   // If the mouse is under the RIGHT side of the image panel
                            if (isOrContains(elUnderMouse, leftPart)) {
                                if (wheelUp) {
                                    ImagePanel.nextImage();
                                } else {
                                    ImagePanel.previousImage();
                                }
                            }
                            if (onRightPart || isOrContains(irc_ris, elUnderMouse) || (elUnderMouse.classList.contains('irc_mut'))) {
                                // console.log('elUnderMouse:', elUnderMouse);
                                if (wheelUp) {
                                    nextRelImg();
                                } else {
                                    prevRelImg();
                                }
                            } else {
                                console.debug('Mouse wheel did NOT scroll while over a container element.\nelUnderMouse:', elUnderMouse);
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

        ImagePanel.updateP(p);
    }
    static updateP(panelEl) {
        // console.debug('Updating panel');
        if (!panelEl) {
            console.warn('Null panel passed');
            return false;
        }

        let p = (panelEl instanceof HTMLElement) ? new ImagePanel(panelEl) : ImagePanel.focP;
        // p.removeLink();
        // p.injectSearchByImage();
        // p.addDownloadRelatedImages();
        p.makeDescriptionClickable();
        p.addImageAttributes();
        p.update_SiteSearch();
        p.update_ViewImage();
        p.update_ImageHost();
        p.update_sbi();

        addImgExtensionBox(panelEl.qa("div.irc_rimask:not(.ext)"));

        // rarbg torrent link
        let torrentLink = p.q('.torrent-link'),
            linkIsTorrent = /\/torrent\//gi.test(p.pTitle_Anchor.href);
        if (!!torrentLink) {
            torrentLink.style.display = linkIsTorrent ? 'inline-block' : 'none';
        }
    }
    static moreSizes() {
        const panel = ImagePanel.focP;
        const reverseImgSearchUrl = getGImgReverseSearchURL(panel.ris_fc_Div.querySelector('img').src);
        let z = open().document;
        fetchUsingProxy(reverseImgSearchUrl, function (content) {
            console.log('content:', content);
            let doc = document.createElement('html');
            doc.innerHTML = content;
            const allSizesAnchor = doc.querySelector(Consts.Selectors.showAllSizes);
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
        const relatedImageDivs = ImagePanel.focP.ris_DivsAll;
        console.log('download related images:', relatedImageDivs);

        var metaDataStr =
            `Google images data for related images
Title:     ${document.title}
URL:     ${location.href}
Search:    ${q('#lst-ib').value}`
        ;
        for (const imgDiv of relatedImageDivs) {
            var img = imgDiv.querySelector('img'),
                metaObj = getMeta(img),
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
        // anchorClick(makeTextFile(metaDataStr), dir + '/' + 'info.txt');
    }
    static downloadCurrentImage() {
        try {
            const panel = ImagePanel.focP;
            const name = panel.bestNameFromTitle;
            console.log('downloadCurrentImage:', name);
            const focused_risDiv = panel.ris_fc_Div;
            var currentImageURL = panel.mainImage.src && panel.mainImage.parentElement.classList.contains("display-original-mainImage") ?
                focused_risDiv.querySelector('img').src :
                focused_risDiv.querySelector('[href]').href;
            console.log('Download:', name, currentImageURL);
            download(currentImageURL, name, undefined, focused_risDiv);
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

        const buttonHtml = `<a class="${className}" role="button" jsaction="" data-rtid="" jsl="" tabindex="0" data-ved="${dataVed}" style="padding-right: 5px; padding-left: 5px; text-decoration:none;"> <span>${text}</span></a>`;
        var button = createElement(buttonHtml);
        button.addEventListener('click', function (element) {
            ImagePanel.download_ris(element);
            return false;
        });
        targetEl.after(button);
    }
    inject_DownloadImage() {
        const text = 'Download&nbsp;↓';
        if (this.sTitle_Anchor) {
            const dataVed = '';
            const className = 'download-image';

            const buttonHtml = `<td><a class="${className}" role="button" jsaction="" data-rtid="" jsl="" tabindex="0" data-ved="${dataVed}"> <span>${text}</span></a></td>`;
            const button = createElement(buttonHtml);
            button.addEventListener('click', function handleClick(element) {
                ImagePanel.downloadCurrentImage(element);
                return false;
            });
            var tb = this.buttons[0].parentElement.cloneNode(false);
            tb.appendChild(button);
            return this.q('.view-image').parentNode.after(tb);
        }
    }

    /** Inject the SearchByImage anchor
     * @return {*} */
    inject_sbi() {
        const href = '#'; //getGImgReverseSearchURL(this.imageUrl);
        const dataVed = ''; //()=>this.sTitleAnchor.getAttribute('data-ved'); // classes:    _ZR irc_hol i3724 irc_lth
        const className = `search-by-image`;
        var html = `<a class="o5rIVb ${className}" target="${Settings.defaultAnchorTarget}" href="${href}" data-ved="${dataVed}" rel="noreferrer" data-noload="" referrerpolicy="no-referrer" tabindex="0" data-ctbtn="2" <span class="irc_ho" dir="ltr" style="text-align: left;">Search&nbsp;by&nbsp;image</span></a>`;

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

            const buttonHtml = `<td><a href="JavaScript:void(0);" target="${"_blank"}" class="${className}" role="button" jsaction="" data-rtid="" jsl="" tabindex="0" data-ved="${dataVed}"> <span>${text}</span></a></td>`;
            const link = createElement(buttonHtml);
            var globeIcon = document.querySelector('._RKw._wtf._Ptf');
            if (!globeIcon) {
                globeIcon = document.querySelector('.RL3J9c.Cws1Yc.wmCrUb');
            }
            if (!!globeIcon)
                link.firstElementChild.before(globeIcon.cloneNode(true));

            var tb = this.buttons[0].parentElement.cloneNode(false);
            tb.appendChild(link);


            var afterSaveBtn = false; // add View image button after save button?
            const saveBtn = this.q('.iv_mssc.i35661');
            return (afterSaveBtn ? saveBtn.parentNode : this.buttons[0].parentNode).after(tb);
        }
    }
    update_ViewImage() {
        const viewImage = this.q('.view-image');
        if (viewImage) {
            viewImage.href = ImagePanel.focP.ris_fc_Url;
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
            const element = createElement(`<a class="${className}" href="" target="${Settings.defaultAnchorTarget}" rel="noreferrer" data-noload="" referrerpolicy="no-referrer" tabindex="0"  data-ved="" data-ctbtn="2" 
style="padding-right: 5px; padding-left: 5px; text-decoration:none;"
<span class="irc_ho" dir="ltr" style="text-align: center;">Image&nbsp;Host</span></a>`);
            // const button = this.addElementAfterSTitle(html, "image-host hover-click", null, 'NONE');
            container.after(element);
            return element;
        }
    }
    update_ImageHost() {
        const focusedImageDiv = ImagePanel.focP.ris_fc_Div;
        if (focusedImageDiv) {
            const url = focusedImageDiv.querySelector('a').href;
            const hostname = getHostname(isDdgUrl(url) ? reverseDdgProxy(url) : url);
            // updating ImageHost
            const ih = this.q('a.image-host');
            if (ih) {
                ih.innerText = hostname;
                ih.href = gImgSearchURL + 'site:' + hostname;

                if (ublSitesSet.has(hostname))
                    setStyleInHTML(ih, 'color', `${successColor} !important`);
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
        const html = `<a class="${spanClass} _r3 hover-click o5rIVb" target="${Settings.defaultAnchorTarget}" rel="noreferrer" data-noload="" referrerpolicy="no-referrer" tabindex="0" href="${href}" data-ved="${dataVed}" data-ctbtn="2" <span class="irc_ho" dir="ltr" style="text-align: left;font-size: 12px;" >Site: ${hostname}</span></a>`;
        var siteSearch = createElement(html);

        let ddgSearch = siteSearch.cloneNode(false);
        ddgSearch.innerText = "[DDGP]";
        ddgSearch.id = "ddgSearch";

        siteSearch = this.addElementAfterSTitle(siteSearch, "", null, 'BOTTOM', 'div');
        siteSearch.appendChild(ddgSearch);
        return siteSearch;
    }
    update_SiteSearch() {
        const siteSearchAnchor = this.q('a.site-search');
        const hostname = getHostname(this.sTitle_Anchor.href);
        if (siteSearchAnchor) {
            siteSearchAnchor.innerText = hostname;
            siteSearchAnchor.href = (siteSearchUrl(getHostname(ImagePanel.focP.q('span a.irc_lth.irc_hol').href)));
        } else {
            console.warn('Site Search element not found:', siteSearchAnchor);
        }

        const ddgAnchor = this.q('#ddgSearch');
        if (ddgAnchor) {
            ddgAnchor.href = ddgProxy(this.pTitle_Anchor.href);
        }

        if (ublSitesSet.has(hostname))
            setStyleInHTML(this.sTitle_Anchor, 'color', `${successColor} !important`);
    }

    /** Removes the annoying image link when the panel is open */
    removeLink() {
        const image = this.mainImage;
        const anchor = image.parentNode;
        anchor.href = null;
        console.log('anchor.href', anchor.href);
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
                let belowDiv = sTitle.parentElement.parentElement.querySelector(`.${belowDivClassName}`);
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

unsafeWindow.ImagePanel = ImagePanel;
unsafeWindow.successfulUrlsSet = ublSitesSet;
unsafeWindow.ublSitesSet = ublSitesSet;
unsafeWindow.ublMap = ublMap;

go();
if (!/google\..+\/save/.test(location.href)) { // TODO: find a better way of determining whether the page is a Google Image search

    function cleanSearch() {
        console.log('cleanSearch()');
        const searchBar = q("input#lst-ib");
        searchBar.value = cleanDates(searchBar.value).replace(/\s+|[.\-_]+/g, " ");
    }
    Mousetrap.bind(["c c"], cleanSearch);
    Mousetrap.bind(["u"], () => {
        location.assign(safeSearchOffUrl());
    });

    window.addEventListener("keydown", onKeyDown, true);
    console.log('added super google key listener');
    window.addEventListener("load", function modifyImgsOnLoad() {
        for (const a of getImgAnchors()) {
            let img = a.querySelector('img');
            createAndAddAttribute(img, 'download-name', getGimgDescription(img));
            markImageOnLoad(img, a.href);
        }
    }, true);

    (function afterPageReloads() {
        var reloading = sessionStorage.getItem("reloading");
        if (reloading) {
            sessionStorage.removeItem("reloading");
            GSaves.wrapPanels();
        }
    })();
}

// add small text box containing image extension
function addImgExtensionBox(imageContainers) {
    for (const imgBox of imageContainers) {
        if (imgBox.querySelector('.text-block')) continue;
        const img = imgBox.querySelector('img.rg_ic.rg_i'),
            meta = getMeta(img),
            ext = meta ? meta.ity : img.src.match(/\.(jpg|jpeg|tiff|png|gif)($|\?)/i);
        if (!ext) continue;
        const textBox = createElement(`<div class="text-block ext ext-${ext}"></div>`);
        if (!ext.toUpperCase) {
            console.warn("ext.toUpperCase is not a function:", ext);
            return;
        }
        textBox.innerText = ext.toUpperCase();
        // textBox.style["background-color"] = (ext == 'gif') ? "magenta" : "#83a3ff";
        img.after(textBox);
        img.classList.add('ext', `ext-${ext}`);
    }
}

observeDocument(function (mutationTarget, addedNodes) {

    clickLoadMoreImages();
    const addedImageBoxes = mutationTarget.querySelectorAll(".rg_bx");
    if (mutationTarget.classList.contains("rg_bx") || addedImageBoxes.length) {
        onImagesLoading(addedImageBoxes);
    }


    (function updateDlLimitSliderMax() {
        const dlLimitSlider = q('#dlLimitSlider');
        if (dlLimitSlider) {
            var tmpValue = dlLimitSlider.getAttribute('value');
            const numImages = qa('.rg_bx').length;
            dlLimitSlider.setAttribute('max', numImages);

            const newValue = Math.min(numImages, tmpValue);
            dlLimitSlider.setAttribute('value', newValue);
            const sliderValueEl = q('#dlLimitSliderValue');
            if (sliderValueEl) sliderValueEl.setAttribute('value', newValue);
        }
    })();

});
// attach chgMon to document.body


function go() {
    if (onGoogleImages) {
        try {
            // iterating over the stored ubl sites
            for (const ublHostname of GM_getValue(Consts.GMValues.UBL_SITES, new Set())) ublSitesSet.add(ublHostname);
            for (const ublURL of GM_getValue(Consts.GMValues.UBL_URLS, new Set())) ublMetas.add(ublURL);
            for (const [ublHostname, data] of new Map(GM_getValue(Consts.GMValues.UBL_SITES_MAP, new Map()))) ublMap.set(ublHostname, data);
            if (AUTO_SAVE_UBL_SITES) setInterval(storeUblSitesSet, 5000);

            // if (new URL(location.href).searchParams.get('allsizes'))
            {
                var showAllSizesAnchor = q(Consts.Selectors.showAllSizes);
                if (!!showAllSizesAnchor) showAllSizesAnchor.click();
            }
            const conditionSelector = '#irc_cc > div';

            waitForElement(() => {
                if (ImagePanel.mainPanelEl && ImagePanel.focP && ImagePanel.focP.mainImage && ImagePanel.focP.buttons) {
                    return qa(conditionSelector);
                }
            }, function startPanelModifications(panelEl) {
                ImagePanel.modifyP(panelEl);
                const mutationObserver = new MutationObserver(function (mutations) {
                    mutations.forEach(function (mutation) {
                        if (!mutation.addedNodes.length) {
                            return;
                        }
                        try {
                            if (!!ImagePanel.focP) {
                                ImagePanel.updateP(ImagePanel.focP);
                            }
                            const dlLimitSlider = q('#dlLimitSlider');
                            if (dlLimitSlider) dlLimitSlider.setAttribute('max', qa('.rg_bx').length);
                        } catch (e) {
                            console.warn(e, "Focused panel:", ImagePanel.focP);
                        }
                    })
                });

                const target = ImagePanel.mainPanelEl;
                // console.debug('Target element to be observed:', target, 'type:', typeof target);
                mutationObserver.observe(target, {
                    childList: true, subtree: true,
                    attributes: false, characterData: true
                });
            });

            (function bindKeys() {
                Mousetrap.bind(["alt+a"], () => {
                    (!q('#itp_animated').firstElementChild ? q('#itp_').firstElementChild : q('#itp_animated').firstElementChild).click();
                });
                Mousetrap.bind(["D"], () => {
                    q('#downloadBtn').click();
                });
                Mousetrap.bind(["h"], () => {
                    q('#showFailedImagesBox').click();
                });
                Mousetrap.bind(["g"], () => {
                    q('#GIFsOnlyBox').click();
                });
            })();
            // adds a toggleEncryptedGoogle button
            /*q('#ab_ctls').appendChild(createElement(`<i class="ab_ctl">
        <a id="toggleEngrypted" href="${toggleEncryptedGoogle(true)}"> ${/www\.google/.test(location.hostname) ? "engrypted.google&nbsp;⇌" : "www.google.com"}</a>
    </i>`));*/
        } catch (e) {
            console.error(e);
        }

        waitForElement('#hdtb-msb', injectGoogleButtons);
    } else {
        const results = qa('div.srg > div');
        for (let i = 0; i < results.length; i++) {
            // bind each result to the corresponding number
            Mousetrap.bind(`${i + 1}`, () => {
                results[i].querySelector('a').click();
            });
            results[i].before(createElement(`<strong style="float: left;">${i + 1}</strong>`));
        }
    }
}

/** @param visibleThumbnailsOnly
 * @returns {set<HTMLImageElement>} */
function getThumbnails(visibleThumbnailsOnly) {
    // language=CSS
    const selector = 'div.rg_bx > a.rg_l[jsname="hSRGPd"] > img' +
        (visibleThumbnailsOnly ? ':not([style*=":none;"]):not([visibility="hidden"])' : '')
    ;
    return qa(selector);
}
// done:    Make a navbar that drops down containing all the buttons and controls
function updateQualifiedImagesLabel(value) {
    const qualifiedGImgs = getQualifiedGImgs();
    value = value || Array.from(qualifiedGImgs).length;
    const satCondLabel = q("#satCondLabel");
    if (satCondLabel)
        satCondLabel.innerHTML = `${value} images satisfying conditions`;

    const dlLimitSlider = q('#dlLimitSlider');
    if (dlLimitSlider && dlLimitSlider.value < value) {
        dlLimitSlider.setAttribute('value', value);
        q("#dlLimitSliderValue").innerText = value;
    }
    /*if (q("#OnlyShowQualifiedImages").checked)
        for (const img of getThumbnails()) {
            const qualified = img.hasAttribute('qualified-dimensions');
            setVisible(img, qualified);
        }
        */
}
/**Modify the navbar and add custom buttons*/
function injectGoogleButtons() {
    try {
        let controlsContainer = createElement(`<div id="${controlsContainerId}"</div>`);
        const googleButtonsContainer = document.querySelector('#hdtb-msb');
        /*q('#abar_button_opt').parentNode*/ //The "Settings" button in the google images page

        var callback = function (topnavContentDiv) {
            const gNavbar = q('#rshdr');
            topnavContentDiv.before(gNavbar, q('#searchform'));
            topnavContentDiv.appendChild(controlsContainer);
        };
        var navbar = createAndGetNavbar(callback);

        // auto-click on "tools" if on Google Images @google-specific
        const toolsButton = q(".hdtb-tl");
        if (!!toolsButton) {
            if (!toolsButton.classList.contains('hdtb-tl-sel')) { // if the tools bar is not already visible (not already clicked)
                toolsButton.click();
            } else console.warn('tools button already activated');
        } else console.warn('tools button not found');


        // var linkAnimated = createElement('<a style="display:" class="hdtb-tl" href="#" onclick="alert("finally"); document.getElementById("itp_animated").firstElementChild.click();">Animated</a>');


        /**
         * @param id    the checkbox element id
         * @param labelText
         * @param changeListener    what happens when the text box changes?
         * @param checked
         * @returns {HTMLDivElement} this label element contains a checkbox input element
         */
        function createGCheckBox(id, labelText, changeListener, checked) {
            var checkBoxContainerEl;

            checkBoxContainerEl = createElement(
                `<div class="sg" style="display:inline;">
<input id="${id}" type="checkbox" ${(checked !== null ? checked : GM_getValue(id)) ? 'checked="checked"' : ""}>
<label for="${id}">${labelText.replace(/\s/g, '&nbsp;')}</label>
</div>`);
            if (!!changeListener) {
                checkBoxContainerEl.addEventListener('change', () => {
                    changeListener();
                });
            }
            return checkBoxContainerEl;
        }

        // Check boxes
        const cbox_ShowFailedImages = createGCheckBox("showFailedImagesBox", "Show failed images", _sfi, HIDE_FAILED_IMAGES_ON_LOAD);
        const cbox_GIFsOnly = createGCheckBox("GIFsOnlyBox", "GIFs only", _gifsOnly, false);
        const cbox_UseDdgProxy = createGCheckBox("useDdgProxyBox", "Try DDGP",
            () => {
                GM_setValue("useDdgProxy", q('#useDdgProxyBox').checked);
                updateQualifiedImagesLabel();
            },
            GM_getValue("useDdgProxy", true)
        );

        // passive checkbox
        const cbox_GIFsException = createGCheckBox("GIFsExceptionBox", "Always download GIFs",
            () => GM_setValue("GIFsException", q('#GIFsExceptionBox').checked),
            GM_getValue("GIFsException", true)
        );
        // passive checkbox
        const cbox_OnlyShowQualifiedImages = createGCheckBox("OnlyShowQualifiedImages", "Only show qualified images",
            () => GM_setValue("OnlyShowQualifiedImages", this.checked),
            GM_getValue("OnlyShowQualifiedImages", false)
        );

        /** Show failed images */
        function _sfi() {
            const checked = q("#showFailedImagesBox").checked;
            setVisibilityForFailedImages(checked);
            GM_setValue("HIDE_FAILED_IMAGES_ON_LOAD", checked_ShowFailedImages());
        }

        function _gifsOnly() {
            _sfi();
            const checked = q("#GIFsOnlyBox").checked;
            Array.from(qa(`.rg_bx a.rg_l img`)).forEach(nonGifImg => {
                if (!/\.gif($|\?)/.test(getMeta(nonGifImg).ou)) {
                    console.debug('nonGifImg href doesn\'t end with .gif, settings visibility to:', checked, nonGifImg);
                    setVisible(nonGifImg, checked);
                }
            });
        }


        for (const img of getThumbnails(true)) {
            img.classList.add('blur');
        }

        //todo: make the image size slider increment discretely, depending on the available dimensions of the images
        // Sliders
        const default_slider_minImgSize_value = 250;
        slider_minImgSize = createElement(`<input id="minImgSizeSlider" type="range" min="0" max="3000" value="${default_slider_minImgSize_value}" step="25">`);
        var sliderReading_minImgSize = createElement(`<label for="minImgSizeSlider" id="minImgSizeSliderValue">${slider_minImgSize.value}x${slider_minImgSize.value}</label>`);
        slider_minImgSize.oninput = function () {
            sliderReading_minImgSize.innerHTML = /*'Min Dimensions<br>' +*/ (`${this.value}x${this.value}`);

            // Highlighting images that will be downloaded
            // clearAllEffects(); // todo: this is being called too much
            for (const img of getThumbnails(true)) {
                var meta = getMeta(img);
                var width = meta.ow, height = meta.oh,
                    isBigger = width >= this.value || height >= this.value;

                if (isBigger) {
                    img.classList.add('qualified-dimensions', 'out');
                    img.classList.remove('in');
                } else {
                    img.classList.add('blur', 'in');
                    img.classList.remove('qualified-dimensions');
                }
            }
            updateQualifiedImagesLabel(getQualifiedGImgs({
                ogs: qa('img.rg_ic.rg_i'),
                exception4smallGifs: null,
                ignoreDlLimit: true
            }).size);
        };
        slider_minImgSize.onchange = function () {
            for (const img of qa('.sg-too-small-hide')) {
                setVisible(img, false);
            }
            clearEffectsDelayed();
            updateQualifiedImagesLabel();
        };

        slider_dlLimit = createElement(`<input id="dlLimitSlider" type="range" min="1" max="${1000}" value="20">`);
        var sliderReading_dlLimit = createElement(`<label id="dlLimitSliderValue">${slider_dlLimit.value}</strong>`);
        slider_dlLimit.oninput = function () {
            sliderReading_dlLimit.innerHTML = this.value;

            // Highlighting images that will be downloaded

            // blur all


            var i = 0;
            /*
            for (const qualifiedImgObj of getQualifiedGImgs(null, null, true)) {
                const img = qualifiedImgObj.img;
                console.debug('i:', i, 'this.value:', this.value);
                if(++i <= this.value) {
                    img.classList.add('drop-shadow', 'out');
                    img.classList.remove('in');
                }
            }
            */

            for (const img of qa('.rg_bx img.qualified-dimensions')) {
                if (++i <= this.value) {
                    img.classList.add('drop-shadow', 'out');
                    img.classList.remove('in');
                } else {
                    img.classList.remove('out');
                    img.classList.add('blur', 'in');
                }
            }
            // un-blur the remaining images (even though they may not satisfy img dimensions)
            for (const img of qa('.rg_bx img:not(.qualified-dimensions)')) {
                if (++i <= this.value) {
                    img.classList.add('drop-shadow', 'out');
                    img.classList.remove('in');
                } else {
                    img.classList.remove('out');
                    img.classList.add('blur', 'in');
                }
            }

            updateQualifiedImagesLabel();
        };
        slider_dlLimit.onchange = function () {
            clearEffectsDelayed()
        };

        var satCondLabel = createElement(`<label id="satCondLabel">Images satisfying conditions: 0</label>`);

        var timeOut;
        function clearEffectsDelayed() {
            clearTimeout(timeOut);
            timeOut = setTimeout(function () {
                clearAllEffects();
                // updateQualifiedImagesLabel();
            }, 800);
        }

        // buttons
        function createGButton(id, innerText, onClick) {
            const button = createElement(`<button class="${ClassNames.BUTTONS} sg sbtn hdtb-tl" id="${id}">${innerText.replace(/\s/g, "&nbsp;")}</button>`);
            if (onClick && typeof(onClick) === "function") button.onclick = function () {
                onClick()
            };
            return button;
        }


        // Display originals
        const downloadImages = function downloadImages() {
            const zipBox = q('#zipInsteadOfDownload');
            if (zipBox && zipBox.checked) {
                if (!zip || Object.keys(zip.files).length < 1) {
                    gZipImages();
                } else {
                    genZip();
                }
            } else {
                if (currentDownloadCount >= slider_dlLimit.value) {
                    currentDownloadCount = 0;
                } else {
                    console.log('currentDownloadCount >= dlNumSlider.value');
                }
                const qualifiedGImgs = Array.from(getQualifiedGImgs());
                let i = 0;
                const downloadInterval = setInterval(function () {
                    if (i < qualifiedGImgs.length) {
                        download(
                            qualifiedGImgs[i].fileURL,
                            qualifiedGImgs[i].fileName,
                            `${location.hostname} ${document.title}`,
                            qualifiedGImgs[i]
                        );
                        currentDownloadCount++;
                        i++;
                    } else {
                        clearInterval(downloadInterval);
                    }
                }, 300);
            }
        };
        var btn_dispOgs = createGButton(`dispOgsBtn`, `Display <u>o</u>riginals`, displayImages),
            btn_animated = createGButton(`AnimatedBtn`, `<u>A</u>nimated`, function () {
                q('#itp_animated').firstElementChild.click();
            }),
            btn_download = createGButton(`downloadBtn`, `Download ⇓`, downloadImages),
            btn_preload = createGButton(`preloadBtn`, `Preload images ↻`, function () {
                const imgLinks = Array.from(qa('a.rg_l[href]'));
                console.log('imgLinks:', imgLinks);

                for (const a of imgLinks) {
                    let img = a.querySelector('img'),
                        dlName = cleanGibberish(getMeta(img)["pt"]);

                    createAndAddAttribute(img, 'download-name', dlName);
                    img.alt = dlName;
                    ImageManager.markImageOnLoad(img, a.getAttribute('href'));
                    console.log('Preloading image:', `"${dlName}"`, !isBase64ImageData(img.src) ? img.src : "Base64ImageData");
                }
            });


        btn_download.style.margin = "20px";
        btn_download.style.border = "20px";

        var cbox_ZIP = createGCheckBox('zipInsteadOfDownload', 'ZIP', function changeZIPBtnText() {
            const checked = cbox_ZIP.checked;
            const downloadBtn = q('#downloadBtn');
            downloadBtn.innerHTML = checked ?
                (!downloadBtn.classList.contains('genzip-possible') ? 'ZIP&nbsp;images' : 'Download&nbsp;ZIP&nbsp;⇓') :// "zip" or "download zip"
                'Download&nbsp;⇓';
            GM_setValue("zipInsteadOfDownload", checked);
        }, GM_getValue("zipInsteadOfDownload", true));
        cbox_ZIP.style.padding = "0px";

        var downloadPanel = createElement('<div id="download-panel" style="display: block;"></div>');

        var sliderConstraintsContainer = document.createElement('tb');
        var tr1 = document.createElement('tr');
        tr1.appendChild(slider_minImgSize);
        tr1.appendChild(sliderReading_minImgSize);
        var tr2 = document.createElement('tr');
        tr2.appendChild(slider_dlLimit);
        tr2.appendChild(sliderReading_dlLimit);
        sliderConstraintsContainer.classList.add('sg');
        sliderConstraintsContainer.appendChild(tr1);
        sliderConstraintsContainer.appendChild(tr2);

        // Appending the buttons
        for (const el of [cbox_ZIP, btn_download, btn_preload, sliderConstraintsContainer]) {
            downloadPanel.appendChild(el);
        }

        // don't use this function, BAD // var dlCondition = function (element) {return (element.hasAttribute('img-w') && element.getAttribute('img-w') > minImgSizeSlider.value);};

        // automatically display originals if searching for a site:
        if (/q=site:/i.test(location.href) && !/tbs=rimg:/i.test(location.href)) {
            displayImages();
        }

        const divider = document.createElement('div');
        controlsContainer.appendChild(divider);
        divider.after(btn_dispOgs, cbox_ShowFailedImages, cbox_GIFsOnly, cbox_UseDdgProxy, cbox_GIFsException, cbox_OnlyShowQualifiedImages, btn_animated, downloadPanel);
        sliderConstraintsContainer.after(satCondLabel);
        downloadPanel.appendChild(createElement(`<div id="progressbar-container"></div>`));

        btn_download.innerHTML = cbox_ZIP.checked ? 'ZIP&nbsp;images' : `Download&nbsp;⇓`;
    } catch (r) {
        console.error(r);
    }
}
function clearAllEffects() { // remove highlighting of elements
    console.warn('clearAllEffects()');
    for (const effectClassName of ['highlight', 'drop-shadow', 'transparent', 'sg-too-small', /*'qualified-dimensions',*/ 'sg-too-small-hide', 'in']) {
        for (const el of qa('.' + effectClassName)) {
            el.classList.remove(effectClassName);
            el.classList.add('out');
        }
    }
}

function getQualifiedUblImgMetas() {
    let qualifiedUblImgMetas = new Set();
    for (const img of qa(`.${ClassNames.DISPLAY_ORIGINAL}, img[loaded="true"]`)) {
        if (img.classList.contains(ClassNames.FAILED) || img.classList.contains(ClassNames.FAILED_DDG))
            continue;
        let meta = getMeta(img);
        if (meta && Math.max(meta.ow, meta.oh) < 120) continue;
        meta.imgEl = img;

        qualifiedUblImgMetas.add(meta);
        console.log('Ubl URLs:', isBase64ImageData(img.src) ? 'base64 image data...' : img.src);
    }
    return qualifiedUblImgMetas;
}
unsafeWindow.getQualifiedGImgs = getQualifiedGImgs;
/**
 * @returns {Set<{fileURL: string, fileName: string, img: HTMLImageElement}>}
 * to get images that only satisfy the dimensions condition:    getQualifiedGImgs(null, null, true)
 * @param ogs
 * @param exception4smallGifs
 * @param ignoreDlLimit
 */
function getQualifiedGImgs(ogs, exception4smallGifs, ignoreDlLimit) {
    if (typeof ogs === "object" && ogs.ogs) {
        ogs = ogs.ogs;
        exception4smallGifs = ogs.exception4smallGifs;
        ignoreDlLimit = ogs.ignoreDlLimit;
    }
    ogs = !ogs ? qa('img.rg_ic.rg_i') : ogs;

    const minImgSizeSlider = q('#minImgSizeSlider'),
        dlLimitSlider = q('#dlLimitSlider');

    const minImgSize = minImgSizeSlider ? minImgSizeSlider.value : 0,
        dlLimit = dlLimitSlider ? dlLimitSlider.value : 0,
        qualImgs = new Set();

    for (const img of ogs) {
        try {
            const fileName = img.getAttribute('download-name') || img.alt;

            if (zip.file(fileName))
                continue;

            const meta = getMeta(img),
                fileURL = meta.ou,
                w = parseInt(meta.ow),
                h = parseInt(meta.oh)
            ;

            // adding new property names to the img object
            img["fileURL"] = fileURL;
            img["fileName"] = fileName;
            img["meta"] = meta;

            const isBig = w >= minImgSize || h >= minImgSize,
                qualDim = isBig || exception4smallGifs && /\.gif\?|$/i.test(fileURL),
                underDlLimit = qualImgs.size < dlLimit;

            if (qualDim && (ignoreDlLimit || underDlLimit)) {
                qualImgs.add(img);
            }
        } catch (e) {
            console.warn(e);
        }
    }
    console.debug('qualified img objects list:', qualImgs);
    return qualImgs;
}


unsafeWindow.storeUblMap = storeUblMap;

function storeUblSitesSet() {
    for (const imgMeta of getQualifiedUblImgMetas()) {
        let hostname = getHostname(imgMeta.src);
        if (/tumblr\.com/.test(hostname)) hostname = hostname.replace(/^\d+?\./, "");
        if (/google|gstatic/i.test(hostname)) {
            hostname = getHostname(imgMeta.anchor.href);
            if (/google|gstatic/i.test(hostname)) {
                continue;
            }
        }
        ublSitesSet.add(hostname);
    }
    const stored = GM_getValue(Consts.GMValues.UBL_SITES);
    const merged = new Set(
        Array.from(stored)
            .concat(Array.from(ublSitesSet))
    );


    const diff = Array.from(ublSitesSet).filter(x => Array.from(stored).indexOf(x) < 0);
    GM_setValue(Consts.GMValues.UBL_SITES, Array.from(merged));

    console.log("Found new unblocked sites:", diff);
    return ublSitesSet;

}
unsafeWindow.ublMetas = ublMetas;
unsafeWindow.storeUblMetas = storeUblMetas;
function storeUblMetas() {
    for (const imgMeta of getQualifiedUblImgMetas()) {
        imgMeta.imgEl = undefined;
        ublMetas.add(imgMeta);
    }

    const stored = new Set(GM_getValue(Consts.GMValues.UBL_URLS, new Set()));
    for (const meta of stored) {
        ublMetas.add(meta);
    }
    console.debug(
        'stored ublURLs:', stored,
        '\nnew ublURLs:', ublMetas
    );

    GM_setValue(Consts.GMValues.UBL_URLS, Array.from(ublMetas).map(ublMeta => {
        if (!ublMeta || Array.isArray(ublMeta)) {
            ublMetas.delete(ublMeta);
            return;
        }
        delete ublMeta.clt;
        delete ublMeta.cl;
        delete ublMeta.cb;
        delete ublMeta.cr;
        delete ublMeta.sc;
        delete ublMeta.tu;
        delete ublMeta.th;
        delete ublMeta.tw;
        delete ublMeta.rh;
        delete ublMeta.rid;
        delete ublMeta.rt;
        delete ublMeta.itg;
        delete ublMeta.imgEl;

        return ublMeta;
    }));
    return ublMetas;
}
function storeUblMap() {
    for (const imgMeta of getQualifiedUblImgMetas()) {
        ublMap.addURL(imgMeta.src, imgMeta.imgEl.loaded == true || imgMeta.imgEl.loaded == "ddgp", {
            imgEl: imgMeta.imgEl,
            dimensions: (imgMeta.ow + 'x' + imgMeta.oh)
        });
    }

    const stored = new Map(GM_getValue(Consts.GMValues.UBL_SITES_MAP, new Map()));
    for (const [k, v] of stored) {
        ublMap.addURL(k, v);
    }
    console.debug(
        'stored map:', stored,
        '\nnew ublMap:', ublMap
    );

    GM_setValue(Consts.GMValues.UBL_SITES_MAP, Array.from(ublMap.entries()));
    return ublMap;
}

/** @param selector
 * @return {NodeListOf<Node>}*/
function qa(selector) {
    return document.querySelectorAll(selector);
}
/** @param selector
 * @return {HTMLElement} */
function q(selector) {
    return document.querySelector(selector);
}

function clickLoadMoreImages() {
    // click "Load more images"
    let el = q("#smb");
    if (el) {
        el.click();
    }
}
function onImagesLoading(addedImageBoxes) {
    addImgExtensionBox(addedImageBoxes);
    try {
        updateQualifiedImagesLabel();
    } catch (e) {
        console.error(e);
    }
}

/**
 * @deprecated just use getMeta(img)["pt"]
 * @param {HTMLImageElement} imgEl
 * @return {string}
 */
function getGimgDescription(imgEl) {
    let meta = getMeta(imgEl);
    let title = meta.pt,
        desc = meta.s;
    return `${title}_${desc}`; // choosing one of them (prioratizing the description over the title)
}
function getGimgTitle(imgN) {
    return getMeta(imgN)['pt'];
}
unsafeWindow.getMeta = getMeta;


/**
 * @param imageElement image element, either <img class="rg_ic rg_i" ....> in .rg_bx
 * todo: make this function detect if the image is a thumbnail or inside the panel, also make it work by getting the "id" and finding the meta through that
 * @return {
 * { clt: string, id: string,
 *   isu: string, itg: string, ity: string,
 *   oh: string, ou: string, ow: string,
 *   pt: string,
 *   rid: string, rmt: string, rt: string, ru: string,
 *   s: string, st: string,
 *   th: string, tu: string, tw,
 *   src: string
 *   }
 * }
 */
function getMeta(imageElement) {
    var metaObj = {};
    if (!imageElement)
        return metaObj;

    try {
        metaObj = JSON.parse(_getMetaText(imageElement));

        // removing useless properties
        for (const propertyName of ["clt", "cl", "cb", "cr", "sc", "tu", "th", "tw", "rh", "rid", "rt", "itg"])
            delete metaObj[propertyName];

        metaObj.src = imageElement.src;
    } catch (e) {
        console.warn(e, imageElement);
    }

    /** @param img
     * @return {string} */
    function _getMetaText(img) {
        //[Google.com images]
        /** @param thumbnail
         * @return {HTMLDivElement } */
        const _getMetaEl = thumbnail => thumbnail.closest('div.rg_bx.rg_di.rg_el').querySelector('div.rg_meta');

        let data = "{}";
        try {
            data = _getMetaEl(img).innerText;
        } catch (e) {
            console.error('Caught:', e, img);
        }

        return data;
    }
    return metaObj;
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

unsafeWindow.getGimgTitle = getGimgTitle;
unsafeWindow.getGimgDescription = getGimgDescription;

unsafeWindow.geResultsData = getResultsData;
unsafeWindow.downloadImageData = downloadImageData;

//[Google.com images]
unsafeWindow.saveUblSites = saveUblSites;

function saveUblSites() {
    storeUblSitesSet();
    console.log('Site links of unblocked images:', Array.from(ublSitesSet));
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
        DOM_VK_CLOSE_BRACKET: 221,
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
        const relatedImageDivs = ImagePanel.focP.ris_Divs;
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
        const panel = ImagePanel.focP;
        if (!panel.ris_fc_Div) return false;
        let previousElementSibling = panel.ris_fc_Div.previousElementSibling;

        if (!!previousElementSibling) {
            previousElementSibling.click();
        } else if (Settings.LOOP_RELATED_IMAGES) {
            const relImgsOnly = Array.from(panel.ris_Divs);// List of relImgs without that last "View More".

            const endRis = relImgsOnly.pop();
            endRis.click();
        } else {
            ImagePanel.previousImage();
            tryToClickBottom_ris_image(10);
        }


        /* // if the image hasn't loaded (doesn't appear), then just go to the one after it
         try {
             const sibblingImg = panel.ris_fc_Div.querySelector('img');
             if (sibblingImg && sibblingImg.getAttribute('loaded') == 'undefined') {
                 console.debug('sibblingImg.loaded = ', sibblingImg.getAttribute('loaded'));
                 return prevRelImg()
             }
         } catch (e) {
         }*/
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
        const panel = ImagePanel.focP;
        const ris_fc_Div = panel.ris_fc_Div;
        if (!panel.ris_fc_Div) {
            return false;
        }
        let nextElSibling = ris_fc_Div.nextElementSibling;
        if (nextElSibling && !nextElSibling.classList.contains('irc_rismo')) {
            nextElSibling.click();
        } else if (Settings.LOOP_RELATED_IMAGES) {
            Array.from(panel.ris_DivsAll)[0].click();
            console.debug("clicking first irc_irs to loop, cuz there isn't any on the right", panel.ris_DivsAll[0]);
        } else {
            ImagePanel.nextImage();
        }

        return true;
    } catch (e) {
        console.warn(e);
    }
}

function toggleEncryptedGoogle(doNotChangeLocation) {
    console.log("Toggle encrypted google");
    const onEncrGoogle = new RegExp("encrypted\\.google\\.com").test(location.hostname);

    var targetURL;

    targetURL = location.href;
    targetURL = !onEncrGoogle ?
        targetURL.replace(/www\.google\.[\w.]+/i, "encrypted.google.com") :
        targetURL.replace(/encrypted\.google\.[\w.]+/i, "www.google.com");
    console.log('Target URL:', targetURL);
    if (!doNotChangeLocation)
        location.assign(targetURL);
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
        ALT_SHIFT: !keyEvent.ctrlKey && keyEvent.altKey && keyEvent.shiftKey && !keyEvent.metaKey,
        CTRL_ONLY: keyEvent.ctrlKey && !keyEvent.altKey && !keyEvent.shiftKey && !keyEvent.metaKey,
        CTRL_ALT_SHIFT: keyEvent.ctrlKey && keyEvent.altKey && keyEvent.shiftKey && !keyEvent.metaKey,

        SHIFT_ONLY: !keyEvent.ctrlKey && !keyEvent.altKey && keyEvent.shiftKey && !keyEvent.metaKey,
        ALT_ONLY: !keyEvent.ctrlKey && keyEvent.altKey && !keyEvent.shiftKey && !keyEvent.metaKey,
        META_ONLY: !keyEvent.ctrlKey && !keyEvent.altKey && !keyEvent.shiftKey && keyEvent.metaKey,

        NONE: !keyEvent.ctrlKey && !keyEvent.shiftKey && !keyEvent.altKey && !keyEvent.metaKey
    };
}
function onKeyDown(e) { // there will be no event if the target element is of type input (example: typing in the search bar, no hotkey will activate)
    const targetElIsInput = targetIsInput(e);
    const k = (window.event) ? e.keyCode : e.which;
    const modKeys = getModKeys(e);

    // keys that don't need a focusedPanel and all those other variables
    switch (k) {
        case KeyEvent.DOM_VK_R:
            if (targetElIsInput) break;
            if (modKeys.CTRL_ONLY || modKeys.ALT_ONLY) {
                e.preventDefault();
                toggleEncryptedGoogle();
                break;
            }
        // noinspection FallThroughInSwitchStatementJS
        case KeyEvent.DOM_VK_I:
            if (targetElIsInput) break;
            var mi = getMenuItems();
            if (mi.images.firstElementChild) {
                mi.images.firstElementChild.click();
            }
            break;
        case KeyEvent.DOM_VK_FORWARD_SLASH: // focus search box
            if (!$(q('#lst-ib')).is(':focus')) {
                q('#lst-ib').focus();
                e.preventDefault();
            }
            break;
    }

    if (targetElIsInput) {
        return false;
    }

    if (!ImagePanel.mainPanelEl || typeof ImagePanel.mainPanelEl === 'undefined') {
        console.debug("Main mainImage panel not found!!");
        return;
    }
    const focusedPanel = ImagePanel.focP; //getFocusedPanel(); //ImagePanel.focusedPanel; // the active panel
    if (!focusedPanel) {
        console.warn("PANEL NOT FOUND!");
        return false;
    }

    // @info mainImage drop-down panel:    #irc_bg

    // todo: split the switch statement to 2, one of them is panel-specific (panel controls, and a panel must be active for them to work)


    // keys between 1 and (#buttons-1)
    if (k >= KeyEvent.DOM_VK_ALPHA1 && k <= (KeyEvent.DOM_VK_ALPHA1 + focusedPanel.buttons.length - 1)) {
        if (focusedPanel.buttons) {
            focusedPanel.buttons[e.key - 1].click();
        } else {
            console.warn('Panel buttons not found');
        }
    }
    // noinspection FallThroughInSwitchStatementJS
    switch (k) {
        // case KeyEvent.DOM_VK_ESCAPE:
        //     break;
        case KeyEvent.DOM_VK_CLOSE_BRACKET: // ]
            if (modKeys.NONE) { // increment minImgSize
                const minImgSizeSlider = q('#minImgSizeSlider');
                minImgSizeSlider.value = parseInt(minImgSizeSlider.value) + parseInt(minImgSizeSlider.step);
            }
            break;
        case KeyEvent.DOM_VK_OPEN_BRACKET: // [
            if (modKeys.NONE) { // decrement minImgSize
                const minImgSizeSlider = q('#minImgSizeSlider');
                minImgSizeSlider.value = parseInt(minImgSizeSlider.value) - parseInt(minImgSizeSlider.step);
            } else if (modKeys.CTRL_ONLY) { // trim left search query
                const searchBox = q('#lst-ib');
                var unwantedStr = searchBox.value.match(/(?<=([.:])).+?\./);
                if (!unwantedStr)
                    break;
                searchBox.value = searchBox.value.replace(unwantedStr[0], '');
                searchBox.form.submit();
            }
            break;
        case KeyEvent.DOM_VK_SINGLE_QUOTE: // '
            if (!modKeys.NONE) { //    toggle "loop-relImgs" option on/off
                Settings.LOOP_RELATED_IMAGES = !Settings.LOOP_RELATED_IMAGES;
                GM_setValue('LOOP_RELATED_IMAGES', Settings.LOOP_RELATED_IMAGES);
                console.log('LOOP_RELATED_IMAGES toggled to:', Settings.LOOP_RELATED_IMAGES);
            }
            break;
        case KeyEvent.DOM_VK_T: // T (for torrent)
            console.debug('Torrent search');
            openInTab(gImgSearchURL + encodeURIComponent("+torrent +rarbg " + cleanSymbols(focusedPanel.bestNameFromTitle)));
            break;
        case KeyEvent.DOM_VK_S: // S
            if (modKeys.NONE) { // Save
                var btn_Save = focusedPanel.q('.i15087');
                console.debug('btn_Save', btn_Save);
                if (!!btn_Save) btn_Save.click();
            }
            break;
        case KeyEvent.DOM_VK_V: // View saves
            if (modKeys.NONE) {
                var btn_ViewSaves = focusedPanel.q('.i18192');
                console.debug('btn_ViewSaves', btn_ViewSaves);
                if (!!btn_ViewSaves) btn_ViewSaves.click();
            }
            break;
        case KeyEvent.DOM_VK_B: // Search By image
        case KeyEvent.DOM_VK_NUMPAD1:// ⬋
            if (modKeys.NONE) { // Search by image
                const focusedRelatedImageUrl = focusedPanel.ris_fc_Url;
                if (typeof focusedPanel.mainImage !== "undefined") {
                    focusedPanel.q('a.search-by-image').click();
                    log("focusedRelatedImageUrl:", focusedRelatedImageUrl);
                } else {
                    console.error('Image not found', focusedRelatedImageUrl);
                }
            }
            break;
        case KeyEvent.DOM_VK_NUMPAD4:// ◀
            if (modKeys.NONE) {
                ImagePanel.previousImage();
            }
            break;
        case KeyEvent.DOM_VK_NUMPAD6: // ▶
            if (modKeys.NONE) {
                ImagePanel.nextImage();
            }
            break;
        // Open related images (press the bottom right square in the corner) in new tab
        case KeyEvent.DOM_VK_NUMPAD3:// ⬊
            if (modKeys.NONE) {
                const moreRelatedImagesLink = focusedPanel.q('.irc_rismo.irc_rimask a');
                if (moreRelatedImagesLink != null) {
                    openInTab(moreRelatedImagesLink.href);
                }
            }
            break;
        case KeyEvent.DOM_VK_D:
            if (modKeys.NONE) {
                ImagePanel.downloadCurrentImage();
            }
            break;
        case KeyEvent.DOM_VK_ENTER:
            console.log('Numpad5 pressed', e);
            if (modKeys.NONE) {
                const currentImgUrl = focusedPanel.ris_fc_Url;
                console.log('currentImgUrl:', currentImgUrl);
                openInTab(currentImgUrl);
            } else if (modKeys.SHIFT_ONLY) {    // NOT WORKING!!
                ImagePanel.downloadCurrentImage();
                // e.preventDefault();
            }
            break;
        // Previous related mainImage
        case KeyEvent.DOM_VK_COMMA:
        case KeyEvent.DOM_VK_UP:
        case KeyEvent.DOM_VK_NUMPAD8: // ▲
            // Prev/Left relImage
            if (modKeys.NONE) {
                prevRelImg();
                break;
            }
        // Next related mainImage
        case KeyEvent.DOM_VK_PERIOD: //fall-through
        case KeyEvent.DOM_VK_DOWN:
        case KeyEvent.DOM_VK_NUMPAD2:// ▼
            if (modKeys.NONE) {// Next/Right relImage
                nextRelImg();
            }
            break;
        case KeyEvent.DOM_VK_O:
            if (modKeys.NONE) {
                for (var div of focusedPanel.ris_Divs) {
                    const img = div.querySelector('img');
                    var anchor = img.closest('a[href]');
                    console.log('Replacing with original:', img, "Anchor:", anchor);
                    replaceImgSrc(img, anchor);
                }
            }
            break;
        case KeyEvent.DOM_VK_H:
            if (modKeys.ALT_ONLY) {
                q('#rcnt').style.visibility = (/hidden/i).test(q('#rcnt').style.visibility) ? 'visible' : 'hidden';
                e.preventDefault();
            }
            break;
        case KeyEvent.DOM_VK_M:
            ImagePanel.download_ris();
            break;
        // I have options, I'll choose the best later
        case KeyEvent.DOM_VK_NUMPAD7:// ⬉
            if (modKeys.NONE) { // lookup the images title.
                const visitUrl = focusedPanel.buttons[0].href;
                // const visitTitleUrl = subtitleEl.href;

                console.log('Visit:', visitUrl);
                openInTab(visitUrl);
            }
            break;
        // Search using title
        case KeyEvent.DOM_VK_NUMPAD9:// ⬈
            if (modKeys.NONE) {
                focusedPanel.lookupTitle();
            }
            break;
        case KeyEvent.DOM_VK_NUMPAD5: //downloadCurrentImage
            ImagePanel.downloadCurrentImage();
            break;
        case KeyEvent.DOM_VK_SEMICOLON:
            if (modKeys.SHIFT_ONLY) {
                focusedPanel.siteSearch();
            }
            break;
        // TODO: find a hotkey for this function
        /*openInTab(`${gImgSearchURL}${encodeURIComponent(cleanSymbols(focusedPanel.descriptionText).trim())}`);
        e.preventDefault();*/
    }
}

function openInTab(url, target) {
    window.open(url, target || "_blank");
}
function cleanDates(str) {
    return !str ? str : removeDoubleSpaces(str.replace(/\d+([.\-])(\d+)([.\-])\d*/g, ' '));
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
    let set = new Set();
    for (let a of anchors) {
        var img,
            metaDataObj = {};
        try {
            img = a.querySelector('img');
            metaDataObj = getMeta(img);
            metaDataObj.loaded = img.getAttribute('loaded');
        } catch (e) {
            console.warn(e);
        }
        set.add(JSON.stringify(metaDataObj));
    }
    console.log('resultsData set:', set);
    return set;
}
function stringifyIterable(iterable) {
    let str = '{';
    let i = 0;
    for (const e of iterable.keys()) {
        str += (i == 0 ? '' : ', ') + '\n\t' + e.toString();
        i++;
    }
    return str + '\n}';
}
function downloadImageData() {
    let text = stringifyIterable(getResultsData());
    let name = 'GImg data_' + document.title;
    anchorClick(makeTextFile(text), `${name}.json`);
}

function getIndexHtml() {
    return Array.from(qa('.rg_bx')).map(bx => {
        const meta = getMeta(bx);
        return `<div>
<img src="${meta.ou}">
	<div>
    <a href="${meta.ru}" target="_blank">${meta.ru}</a>
    <h3>${meta.pt} ${meta.st}</h3>
    <h4>${meta.s}</h4>
	</div>
</div>`;
    }).join('\n');
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
 * @deprecated
 */
function safeSearchOffUrl() {
    var safeSearchButton = q("#ss-bimodal-default");
    if (safeSearchButton) return safeSearchButton.href;
}

const responseBlobs = new Set();

/**
 * @returns {string}
 */
function getGimgPageInfoText() {
    return `${document.title}:\t${location.href}\n    \n${stringifyIterable(getResultsData())}\n`;
}

function setupProgressBar() {
    // noinspection JSUnresolvedVariable
    if (typeof(ProgressBar) == 'undefined') {
        console.warn("ProgressBar is not defined.");
        return;
    }
    if (!q('#progressbar-container'))
        document.body.firstElementChild.before(createElement(`<header id="progressbar-container" 
style="
    position: fixed !important;
    top: 0;
    left: 0;
    width: 100%;
    min-height: 30px;
    padding: 10px 0;
    background-color: #36465d;
    box-shadow: 0 0 0 1px hsla(0,0%,100%,.13);
    z-index: 100;"
    />`));

    // noinspection JSUnresolvedVariable
    // noinspection ES6ModulesDependencies
    var progressBar = new ProgressBar.Line('#progressbar-container', {
        easing: 'easeInOut',
        color: '#FCB03C',
        strokeWidth: 1,
        trailWidth: 1,
        text: {
            value: '0'
        }
    });
    console.log('progressBar:', progressBar);
    progressBar.set(0);
    const progressbarText = q('.progressbar-text');
    progressbarText.style.display = "inline";
    progressbarText.style.position = "relative";
    return progressBar;
}

function zipBeforeUnload(e) {
    var dialogText = "You still didn't download your zipped files, are you sure you want to exit?";
    e.returnValue = dialogText;
    return dialogText;
}
function gZipImages() {
    zip = zip || new JSZip();
    zip.current = 0;
    zip.totalSize = 0;
    zip.file("info.txt", new Blob([getGimgPageInfoText()], {type: 'text/plain'}));

    window.addEventListener('beforeunload', zipBeforeUnload);
    window.onunload = genZip;
    const selector = `img.rg_ic.rg_i`
        // `.${TOKEN_DISPLAY}[loaded^="true"], .img-big`
        // '.rg_ic.rg_i.display-original-mainImage:not(.display-original-mainImage-failed)'
    ;
    /** type {HTMLAnchorElement} */
    const ogs = qa(selector);


    const qualImgs = getQualifiedGImgs(ogs, null, q('#GIFsExceptionBox').checked);
    zip.zipTotal = qualImgs.size;

    progressBar = setupProgressBar();

    console.debug('Original images to be downloaded:', ogs);
    zip.totalSize = 0;
    zip.totalLoaded = 0;
    var activeZipThreads = 0;

    for (const qualifiedImgArgs of qualImgs)
        requestAndZipImage(qualifiedImgArgs.fileURL, qualifiedImgArgs.fileName, qualifiedImgArgs.img);
    /**
     * Takes a name and returns the same name and iterates it if it already exists in the zip
     * @param fname
     * @return {string}
     */
    function getValidIteratedName(fname) {
        if (!zip.file(fname)) {
            return fname;
        } else {
            var numberStr = (fname).match(/\d+/g);
            var newName = fname;
            if (numberStr) {
                numberStr = numberStr.pop();
                var number = parseInt(numberStr);
                newName = fname.replace(numberStr, ++number)
            } else {
                var split = newName.split('.');
                newName = split.slice(0, -1).join('.') + (" 1.") + split.slice(-1);
            }
            return getValidIteratedName(newName);
        }
    }

    function requestAndZipImage(fileUrl, fileName, img) {
        let fileSize = 0,
            loadedLast = 0
        ;
        activeZipThreads++;
        const meta = getMeta(img);

        fileName = getValidIteratedName(removeDoubleSpaces(fileName.replace(/\//g, " ")));

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
                    zip.current++;
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
            onload: res => {
                if (zip.file(fileName)) {
                    return;
                }
                try {
                    console.debug(
                        `onload:
readyState: ${res.readyState}
respHeaders: ${res.responseHeaders}
status:     ${res.status}
statusText: ${res.statusText}
finalUrl:   ${res.finalUrl}
respText:   ${res.responseText.slice(0, 100)}...`
                    );
                } catch (e) {
                }

                const [fullMatch, mimeType1, mimeType2] = res.responseHeaders.match(/(?:content-type: )([\w]+)\/([\w\-]+)/);
                const contentType = [mimeType1, mimeType2].join('/');
                let ext = mimeTypesJSON.hasOwnProperty(contentType) && mimeTypesJSON[contentType] ?
                    mimeTypesJSON[contentType].extensions[0] :
                    mimeType2;
                console.debug(fullMatch);
                const wrongMime = !/image/i.test(mimeType1),
                    isDoctype = /<!DOCTYPE html PUBLIC/.test(res.responseText);

                if (wrongMime) {
                    console.log('wrongMime type but continueing to download it:', contentType);
                    ext = "gif";
                }
                if (isDoctype) {
                    console.error(
                        'Not image data!: ',
                        isDoctype ?
                            'matches "<!DOCTYPE html PUBLIC"' :
                            wrongMime ? `Wrong mime: ${contentType}` :
                                "idk",
                        "\n" + fileUrl,
                        `${res.responseText.slice(0, 100)}...`
                    );
                    if (onBadResult(res) || isDoctype) {
                        return;
                    }
                }
                var blob = new Blob([res.response], {type: contentType});

                responseBlobs.add(blob);
                zip.file(`${fileName}.${ext || "image/gif"}`, blob, {
                        comment: JSON.stringify({
                            url: fileUrl,
                            name: `${meta.pt} ${meta.st}`,
                            page: meta.ru
                        })
                    }
                );
                console.log("Added file to zip:", fileName, fileUrl);
                zip.current++;

                // fixing the download button text
                const downloadBtn = q('#downloadBtn');
                downloadBtn.classList.add('genzip-possible');
                downloadBtn.innerHTML = q('#zipInsteadOfDownload').checked ?
                    (!downloadBtn.classList.contains('genzip-possible') ? 'ZIP' : 'Download&nbsp;ZIP&nbsp;⇓') : // "zip" or "download zip"
                    'Download&nbsp;⇓';


                if (zip.current < zip.zipTotal || zip.zipTotal <= 0) {
                    return;
                }

                if (zip.current >= zip.zipTotal - 1) {
                    console.log("Generating ZIP...", "\nFile count:", Object.keys(zip.files).length);
                    zip.zipTotal = 0;
                    progressBar.destroy();
                    genZip();
                }
                activeZipThreads--;
            },
            onreadystatechange: res => {
                console.debug("Request state changed to: " + res.readyState);
                if (res.readyState === 4) {
                    console.debug('ret.readyState === 4');
                }
            },
            onerror: res => {
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
                activeZipThreads--;
            },
            onprogress: res => {
                if (zip.file(fileName) || zip.current < zip.zipTotal || zip.zipTotal <= 0) {
                    //TODO: stop the GM_xmlrequest at this point

                    /*if(res.abort)
                        res.abort();
                    else
                        console.error('res.abort not defined');
                    if(this.abort)
                        this.abort();
                    else
                        console.error('this.abort not defined');
                    return;*/
                }

                if (res.lengthComputable) {
                    if (fileSize == 0) { // happens once
                        fileSize = res.total;
                        zip.totalSize += fileSize;
                    }
                    const loadedSoFar = res.loaded;
                    const justLoaded = loadedSoFar - loadedLast;    // What has been added since the last progress call
                    const fileprogress = loadedSoFar / res.total;

                    zip.totalLoaded += justLoaded;
                    const totalProgress = zip.totalLoaded / zip.totalSize;

                    if (false) {
                        console.debug(`loadedSoFar = ${res.loaded}\njustLoaded = ${loadedSoFar - loadedLast}\nfileprogress = ${loadedSoFar / res.total}`);
                    }
                    if (progressBar) {
                        progressBar.set(totalProgress);
                        progressBar.setText(`Files in ZIP: (${Object.keys(zip.files).length} / ${zip.zipTotal}) Active threads: ${activeZipThreads}     (${zip.totalLoaded} / ${zip.totalSize})`);
                    }

                    loadedLast = loadedSoFar;
                }
            }
        });
    }

    return zip;
}

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


function setVisibilityForFailedImages(visibility) {

// language=CSS
    /*
    const css = visibility ? '' :
        ` /!*Failed images selector*!/
    div.rg_bx > a.rg_l > img.${Tokens.FAILED_DDG},
    div.rg_bx > a.rg_l > img.${Tokens.FAILED} {
        display: none !important;
    }
`;
    const id = 'hide-failed-images-style';
    const styleEl = q('#' + id);
    if (!styleEl) {
        addCss(css, id);
    } else {
        styleEl.innerHTML = css;
    }
    */

    let bxs = qa(`div.rg_bx > a.rg_l > img.${ClassNames.FAILED_DDG}, div.rg_bx > a.rg_l > img.${ClassNames.FAILED}`);
    if (!bxs.length) return;

    let count = 0;
    for (const imageBox of bxs) {
        setVisible(imageBox, visibility);
        count++;
    }
    console.log(`Set visibility of ${count} images to`, visibility);
}
function setVisible(node, visible) {
    if (!node) return;
    if (onGoogleImages) {
        node = node.parentNode.parentNode;
    }

    if (visible) {
        node.classList.remove('hide-img');
    } else {
        node.classList.add('hide-img');
    }
}

class GSaves {
    static get initialItem() {
        return google.pmc.colmob.initial_item.map(item => JSON.parse(item));
    }
    /**
     * @return {{
     * imageUrl:{string},
     * url:{string},
     * title:{string},
     * faviconUrl:{string},
     * redirectUrl:{string},
     * realUrl:{string}
     * }}
     */
    static get initialItemObjectList() {
        function item2Obj(item) {
            var itemObj = {};
            try {
                itemObj.imageUrl = item[9] ? item[9][0] : null; // img url
                itemObj.url = item[5];
                itemObj.title = item[6];
                itemObj.faviconUrl = item[17];
                itemObj.redirectUrl = item[18];

                const searchParams = new URL(itemObj.redirectUrl, 'https://www.google.com').searchParams;
                console.log('searchParams for:', item, searchParams);

                var q = searchParams.get("q");
                var qUrl = new URL(q, "https://google.com");

                const imgrefurl = qUrl.searchParams.get("imgrefurl") ? qUrl.searchParams.get("imgrefurl") : q;

                itemObj.realUrl = imgrefurl ? imgrefurl : q;
            } catch (e) {
                console.error(e);
            }

            return itemObj;
        }
        return this.initialItem.map(item2Obj);
    }
    static get containers() {
        return qa('div.str-clip-card-space:not(.modified)');
    }
    static removeClickListeners(container) {
        container.parentNode.appendChild(createElement(container.outerHTML));
        container.remove();
    }
    static wrapPanels() {

        var iio = this.initialItemObjectList;

        for (const container of this.containers) {
            this.removeClickListeners(container);
        }

        var i = 0;
        for (const container of this.containers) {
            if (container.querySelector(['.str-tag-card-images-holder', 'a.wrapper-anchor', 'a.mod-anchor'].join(', '))) {
                console.warn('element will not be wrapped by anchor:', container);
                continue;
            }
            // main card
            this.slipAnchorUnderElement(container.querySelector('div.str-wide-card-text-holder'), iio[i].realUrl);

            // title div
            // this.slipAnchorUnderElement(container.querySelector('div.str-wide-card-title'), iio[i].url);

            // img container
            this.slipAnchorUnderElement(container.querySelector('div.str-wide-card-image-holder'), iio[i].imageUrl);

            i++;
        }

        // language=CSS
        addCss(
                `.str-wide-card {
                    cursor: default !important;
                }

                .str-wide-card-title, .str-wide-card-text-holder {
                    display: -webkit-inline-box !important;
                }

                .str-wide-card.expandable:not(.expanded) {
                    height: 100%;
                }`);
    }
    static slipAnchorUnderElement(element, href) {
        var tempInnerHTML = element.innerHTML;
        element.innerHTML = "";
        element.appendChild(createElement(`<a class="mod-anchor" target="_blank" href="${href}">${tempInnerHTML}</a>`));
    }
    static outerWrapPanels() {
        /**
         * @type {any[]}
         [
         0: "wc_70E6Xj2JB_HiZhxy9l7_mcA5R5meGZhF"
         1: 2
         5 site: "https://www.google.com.sa/search?q=site%3A4chanarchives.cu.cc&tbm=isch&tbs=rimg%3ACW1a4FzI3jU7Ijin5u866o8-rRk8k1t7XEy5aJ7Uf3c8yS3dCdQ8DD2esqCQHRopVHoj1O5adUXJe-LHtJD3Y9fi6CoSCafm7zrqjz6tEd2HvPoFvwkxKhIJGTyTW3tcTLkR2HOwTpIxd-4qEglontR_1dzzJLRFUC00ZWceOXioSCd0J1DwMPZ6yEY-nOZAfV2KIKhIJoJAdGilUeiMR0eOEGcWrGUAqEgnU7lp1Rcl74hF8oHVvSZhDTCoSCce0kPdj1-LoEbJ4kSjG9QhA&tbo=u&bih=543&biw=1097&ved=0ahUKEwjeqcS_6u7PAhVEuBoKHXXVDX4Q9C8ICQ"
         6: "site:4chanarchives.cu.cc - Google Search"
         9 image: (4) ["https://encrypted-tbn2.gstatic.com/images?q=tbn:AN…RbziTjEKR8ZLQR0mN1zewWYHbr73MsqCmMIwLWB3wjEfiqt2A", 264, 191, Array(0)]
         10: (4) ["https://encrypted-tbn3.gstatic.com/images?q=tbn:AN…QZ1NGhDYp5R-QDtW_mhH5YsTF7o9etY-TMv0yUcTt1LbX6yo_", 211, 152, Array(10)]
         17: "https://encrypted-tbn2.gstatic.com/favicon?q=tbn:ANd9GcS7Gq4fBcOyAR1DBH7iP5t2k1zJfM6QTpiEKaR1ODP7GzDzQ5gGFkl0gfZA326v72gT-spvAg"
         18: "/url?q=https%3A%2F%2Fwww.google.com.sa%2Fsearch%3Fq%3Dsite%253A4chanarchives.cu.cc%26tbm%3Disch%26tbs%3Drimg%253ACW1a4FzI3jU7Ijin5u866o8-rRk8k1t7XEy5aJ7Uf3c8yS3dCdQ8DD2esqCQHRopVHoj1O5adUXJe-LHtJD3Y9fi6CoSCafm7zrqjz6tEd2HvPoFvwkxKhIJGTyTW3tcTLkR2HOwTpIxd-4qEglontR_1dzzJLRFUC00ZWceOXioSCd0J1DwMPZ6yEY-nOZAfV2KIKhIJoJAdGilUeiMR0eOEGcWrGUAqEgnU7lp1Rcl74hF8oHVvSZhDTCoSCce0kPdj1-LoEbJ4kSjG9QhA%26tbo%3Du%26bih%3D543%26biw%3D1097%26ved%3D0ahUKEwjeqcS_6u7PAhVEuBoKHXXVDX4Q9C8ICQ&usg=AOvVaw3eb9K2V3-5Fl2DR41rvzXB"
         length: 20
         ]
         */
        var initial_item = google.pmc.colmob.initial_item.map(item => JSON.parse(item));
        var urls = initial_item.map(item => item[9] ? item[9][0] : item[5]);

        var i = 0;
        for (const el of qa('div.str-clip-card-space')) {
            if (el.querySelector('.str-tag-card-images-holder') || el.closest('a.wrapper-anchor')) {
                console.warn('element will not be wrapped by anchor:', el);
                continue;
            }
            el.parentElement.appendChild(createElement(
                `<a class="wrapper-anchor" target="_blank" href="${urls[i]}"> ${el.outerHTML} </a>>`)
            );
            console.log('replaceGSavesPanelsWithAnchors:', el);
            el.remove();
            i++;
        }
    }
}

unsafeWindow.GSaves = GSaves;

function underlineText(el, subStr) {
    if (!el) {
        console.error("Element not defined.");
        return;
    }
    var rx = new RegExp(subStr, 'i');
    if (rx.test(el.innerHTML)) {
        var oldInnerHTML = el.innerHTML;
        var newHTML = el.innerHTML.replace(rx, `<span class="underlineChar" style="text-decoration: underline;">${subStr}</span>`);
        el.innerHTML = newHTML;
        console.log(
            'oldInnerHTML=', oldInnerHTML,
            '\nnewHTML=', newHTML
        );
    } else console.error("Element doesn't contain text: ", subStr, el);
}

/**
 * @return an object map of menuItem name as the key, and HTMLDivElement as value
 * {key: menuItemName, value: menuItem HTMLDivElement}
 * menuItemNames = [ "all", "images", "videos", "news", "maps", "more" ]
 */
function getMenuItems() {
    const menuItems = qa('.hdtb-mitem');
    const menuItemNames = [
        "all",
        "images",
        "videos",
        "news",
        "maps",
        "more"
    ];
    let menuItemsObj = {};

    for (const menuItem of menuItems) {
        for (const menuItemName of menuItemNames) {
            if (new RegExp(menuItemName, "i").test(menuItem.innerText)) {
                menuItemsObj[menuItemName] = menuItem;
                break;
            }
        }
    }
    menuItemsObj.selected = q('.hdtb-mitem.hdtb-imb');

    console.log('menuItemsObj=', menuItemsObj);
    return menuItemsObj;
}

/** @return {Array} returns an array of words with the most common word in the first index */
function getSortedWords() {
    const rx = /[\s\W,.\/\\\\-_]+/g;
    /*this is an array containing all the words of all titles and all images*/
    const wordList = Array.from(qa('.rg_bx')).map(bx => {
        const meta = getMeta(bx);
        try {
            return (meta.pt ? meta.pt.split(rx) : [])
                .concat(meta.st ? meta.st.split(rx) : [])
                .concat(meta.s ? meta.s.split(rx) : []);
        } catch (e) {
            console.error(e);
        }
    }).reduce((occumulator, currentValue) => occumulator.concat(currentValue))
        .filter(word => word && word.length > 2);

    return sortByFrequency(wordList);
}

//todo: make these functions in a utility class
/** https://stackoverflow.com/a/3579651/7771202 */
function sortByFrequency(array) {
    var frequency = {};

    array.forEach(function (value) {
        frequency[value] = 0;
    });

    var uniques = array.filter(function (value) {
        return ++frequency[value] == 1;
    });

    return uniques.sort(function (a, b) {
        return frequency[b] - frequency[a];
    });
}
/** https://stackoverflow.com/a/3579651/7771202 */
function sortByFrequencyAndRemoveDuplicates(array) {
    var frequency = {}, value;

    // compute frequencies of each value
    for (var i = 0; i < array.length; i++) {
        value = array[i];
        if (value in frequency) {
            frequency[value]++;
        }
        else {
            frequency[value] = 1;
        }
    }

    // make array from the frequency object to de-duplicate
    var uniques = [];
    for (value in frequency) {
        uniques.push(value);
    }

    // sort the uniques array in descending order by frequency
    function compareFrequency(a, b) {
        return frequency[b] - frequency[a];
    }

    return uniques.sort(compareFrequency);
}
function object2Map(obj) {
    const map = new Map();
    for (const key in obj) {
        map.set(key, obj[key]);
    }
    return map;
}
