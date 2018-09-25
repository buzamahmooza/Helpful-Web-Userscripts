//==UserScript==
//@name         Display Original Image (DOI)
//@version      0.1.4
//@namespace    eight04.blogspot.com
//@description  This script will replace thumbnail with full size mainImage if available.
//@exclude      *kfupm.edu*
//@exclude      *blackboard*
//@exclude      *photos.google*
//@exclude      *youtube.com*
//@exclude      *www.saudirailways.org*
//@exclude      *www.webassign.net*
//@exclude      *imgur*
//@include      http*
//@include      https://www.google.*/search?*imghp
//@include      https://encrypted.google.com*
//@grant        GM_xmlhttpRequest
//@grant        GM_download
//@grant        GM_setValue
//@grant        GM_getValue
//@grant        GM_setClipboard
//@grant        unsafeWindow
//@grant        window.close
//@grant        window.focus
//@run-at       document-end
//@require      https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
//@require      https://raw.githubusercontent.com/kimmobrunfeldt/progressbar.js/master/dist/progressbar.min.js
//@require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\download_script.user.js
//@require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\Handy AF functions Faris.user.js
//==/UserScript==

//@require      https://github.com/buzamahmooza/Helpful-Web-Userscripts/raw/master/Handy%20AF%20functions%20Faris.user.js
//@require      https://github.com/buzamahmooza/Helpful-Web-Userscripts/raw/master/download_script.user.js
//UserscriptDownloader
//@require      https://gist.github.com/buzamahmooza/73774aa6900fc4281d01c844433b9031/raw/

//[ ][ ]    TODO:   Make a function to detect images and marks them for replacement (adds to their ATTRIBUTES).
//[x][ ]    TODO:   Make a "Min Image size" slider that will hide images with dimensions smaller than the slider value.
//[ ]      ~TODO:   Instead of replacing images on Google, just clone it and then replace it, that way we have the old pic while the new one is loading.
//[x]       done:   Highlight all images that will be downloaded when sliding the downloadLimit bar
//                    Make another function called by the mutation observer in charge of dealing with them.
//[x]       done:   Replace the "Remove failed images" button to a checkbox, also put some text like "(n)" {n being the number of images that failed to show up}.

// 'use-strict';

// Options
const loopReplacedVids = true,
    autoplayReplacedVids = false;

const GMValues = {};

const ClassNames = {
    DISPLAY_ORIGINAL: "display-original-" + "mainThumbnail",
    DISPLAY_ORIGINAL_GIF: "display-original-" + "-gif",
    FAILED: "display-original-" + "-failed",
    FAILED_DDG: "display-original-" + "-ddg-failed",

    BUTTONS: "super-button"
};
unsafeWindow.DOITokens = ClassNames;


// let slider_dlLimit,
//     slider_minImgSize,
//     cbox_ShowFailedImages,
//     cbox_GIFsOnly,
//     cbox_UseDdgProxy,
//     cbox_GIFsException,
//     cbox_OnlyShowQualifiedImages
// ;
let KeyEvent;

unsafeWindow.displayImages = displayImages;
unsafeWindow.replaceImgSrc = replaceImgSrc;

// use ddg proxy upon failure to show original?
const checked_useDdgProxy = () => q('#useDdgProxyBox').checked,
    SUCCESSFUL_URLS = new Set();
var urls = new Set();

// @google stuff
const searchModeDiv = q('#hdtb-msb-vis'),
    selectedSearchMode = !searchModeDiv ? null : searchModeDiv.querySelector('div.hdtb-msel'),
    onGoogleImages = /google/.test(location.hostname) && selectedSearchMode && selectedSearchMode.innerHTML == 'Images'
;

createAndAddCSS();
// @google-specific
// if (onGoogleImages) {
// wait for the navbar to inject the Google buttons
// waitForElement('#hdtb-msb', injectGoogleButtons);
// }


bindKeys();
function bindKeys() {
    Mousetrap.bind(["o o"], (keyEvent) => {
        console.log('o o: displayImages();');
        displayImages();
    });
    Mousetrap.bind(["o down"], (keyEvent) => {
        console.log('o down: downloadImages();');
        return zipImages(qa(`img.${ClassNames.DISPLAY_ORIGINAL}`));
    });
}

window.ImageManager = {
    _images: new Set(),

    isImageOk: function (img) {
        // During the onload event, IE correctly identifies any images that
        // weren’t downloaded as not complete. Others should too. Gecko-based
        // browsers act like NS4 in that they report this incorrectly.
        if (!img.complete) {
            return false;
        }

        // However, they do have two very useful properties: naturalWidth and
        // naturalHeight. These give the true size of the image. If it failed
        // to load, either of these should be zero.
        if (img.naturalWidth === 0) {
            return false;
        }

        // No other way of checking: assume it’s ok.
        return true;
    },
    /**
     * adds an attribute "load" indicating the load status
     *  load = true:     image loaded successfully
     *  load = false:    image still loading
     *  load = "error":  image failed to load
     * @param imgUrl
     * @param imgEl
     * @param onError
     * @param onLoad
     */
    markImageOnLoad: function (imgEl, imgUrl, onError, onLoad) {
        if (!imgEl) return;
        if (imgEl.hasAttribute('loaded')) {
            /* console.debug('Img already has "loaded" attr:', imgEl);*/
            return;
        }
        if (!imgEl.hasAttribute('loaded')) {
            createAndAddAttribute(imgEl, 'loaded');
        } else {
            imgEl.setAttribute("loaded", "false");
        }
        var imgObj = new Image();
        imgObj.onerror = onError || ImageManager.imgOnError;
        imgObj.onload = onLoad || ImageManager.imgOnLoad;
        imgObj.src = imgUrl || imgEl.src || imgEl.href;
        if (ImageManager._images.has(imgObj)) {
            console.warn('Duplicate image object!', imgObj);
            imgObj = null;
            return;
        }
        ImageManager._images.add(imgObj);
    },
    imgOnError: function () {
        if (ImageManager.isImageOk(this)) {
            this.setAttribute('loaded', true);
            return;
        }
        if (this.classList.contains(ClassNames.DISPLAY_ORIGINAL)) {
            handleError(this);
        } else {
            this.setAttribute('loaded', 'error');
        }
    },
    imgOnLoad: function () {
        this.setAttribute('loaded', true);
        // console.debug('Image loaded! :D', this.alt, !isBase64ImageData(this.src) ? this.src : "Base64ImageData");
        SUCCESSFUL_URLS.add(this.src);
    }
};
/** @param selector
 * @return {NodeListOf<HTMLElement>}*/
function qa(selector) {
    return document.querySelectorAll(selector);
}
/** @param selector
 * @return {HTMLElement} */
function q(selector) {
    return document.querySelector(selector);
}

function displayImages() {
    observeDocument(displayOriginalImage);
    qa('iframe').forEach(iframe =>
        iframe.querySelectorAll("a[href] > img[src]").forEach(img =>
            replaceImgSrc(img, img.parentNode)
        )
    );
    console.debug("Displaying originals\nOriginal Images Displayed:", Array.from(qa(`.${ClassNames.DISPLAY_ORIGINAL}`)));
}


//auto display-originals if enough big images
/*
var bigImgs = document.getElementsByTagName('.img-big');
if (bigImgs.length < 7) {
    console.log("Too little big images, i want to stop displaying original images");
} else {
    console.log('We have enough big images :)\nDisplaying original images automatically...');
    displayOriginalImage();
}
*/

function observeDocument(callback) {
    callback(document.body);
    new MutationObserver(
        /**@param {mutation} mutationsList */
        function mutationCallback(mutationsList) {
            for (var mutation of mutationsList) {
                if (!mutation.addedNodes.length) continue;
                callback(mutation.target);
            }
        }
    ).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: false
    });
}
function displayOriginalImage(node) {
    /*
    for (const img of node.querySelectorAll("a[href] > img[src]")) {
        replaceImgSrc(img, img.parentNode);
        ImageManager.markImageOnLoad(img);
    }
    */
    for (const img of node.querySelectorAll("a[href] img[src]")) {
        replaceImgSrc(img, img.closest('a'));
        ImageManager.markImageOnLoad(img);
    }
    for (const vidThumb of node.querySelectorAll("a[href] > img")) {
        replaceThumbWithVid(vidThumb);
    }
}


function addClass(el, className) {
    el.classList.add(className);
    if (onGoogleImages) {
        el.closest('div').classList.add(className);
    }
}

function handleError() {
    this.removeEventListener("error", handleError);
    this.setAttribute("loaded", "");
    if (!onGoogleImages || checked_useDdgProxy()) {
        tryDdgProxy(this);
    } else {
        markNotFound(this);
        this.src = this.oldSrc;
    }
}
function handleErrorDdg() {
    this.src = this.oldSrc;
    markNotFound(this);
    this.removeEventListener("error", handleErrorDdg);
    // this.classList.add(Tokens.FAILED_DDG);
    addClass(this, ClassNames.FAILED_DDG);
}
function tryDdgProxy(imgEl) {
    // If it already failed ddgProxy, don't even try
    if (imgEl.classList.contains(ClassNames.FAILED_DDG)) return;
    // if (imgEl.hasAttribute('loaded')) imgEl.setAttribute('loaded', '');

    imgEl.addEventListener("error", handleErrorDdg);

    //Make borders ORANGE
    // language=CSS
    setBorder(imgEl, "{border: 2px #FFA500 solid}");

    let ddgProxyUrl = ddgProxy(imgEl.src);
    let anchor = imgEl.parentNode;
    imgEl.anchor.href = ddgProxyUrl;
    // console.log('imgEl.anchor: '+imgEl.anchor);
    replaceImgSrc(imgEl, anchor);
    imgEl.src = ddgProxyUrl;

    // replace(imgEl, createElement('<a anchor='+ddgProxyUrl+'></a>'));
    imgEl.classList.remove(ClassNames.FAILED);
    ImageManager.markImageOnLoad(imgEl, imgEl.src, function () {
        this.setAttribute('loaded', 'error');
    }, function () {
        this.setAttribute('loaded', 'true-ddgp')
    });
}

function replaceThumbWithVid(vidThumb) {
    const anchor = vidThumb.parentNode;
    const href = anchor.href;
    if (/\.(mov|mp4|avi|webm|flv|wmv)($|\?)/i.test(href)) { // if the link is to a video
        console.log('Replacing video thumbnail with original video:', href, vidThumb);
        vidThumb.src = href;
        const videoOptions = 'controls ' + (autoplayReplacedVids ? 'autoplay ' : '') + (loopReplacedVids ? 'loop ' : '');
        const vidEl = createElement(`<video ${videoOptions} name="media" src="${href}"  type="video/webm" style="width:${vidThumb.clientWidth * 2}px;">`);
        anchor.after(vidEl);
        anchor.remove();
    }
}
function replaceImgSrc(img, anchor) {
    if (img.classList.contains(ClassNames.DISPLAY_ORIGINAL)) return;
    if (!/\.(jpg|jpeg|tiff|png|gif)($|\?)/i.test(anchor.href)) return;

    img.addEventListener("error", handleError);
    img.oldSrc = img.src;
    function getSrc() {
        let src = anchor.href;
        if (/\.kym-cdn\.com\/photos\/images\/masonry/.test(img.src)) {
            src = img.src.replace('masonry', 'original');
        }
        return src;
    }
    img.src = getSrc();
    img.anchor = anchor; // Storing the anchor object in case we need it later
    addClass(img, ClassNames.DISPLAY_ORIGINAL);

    const imageObj = new Image();
    imageObj.src = img.src;
    ImageManager._images.add(imageObj);

    if (/\.(gif)($|\?)/i.test(anchor)) {
        setBorder(img, "{border: 3px #6800FF solid !important;}"); //Purple for GIFs
        addClass(img, ClassNames.DISPLAY_ORIGINAL_GIF);
    }
}

/**
 * Sets the CSS border property of an image or it's container if it exists
 * @param el
 * @param borderArgs
 * @return {boolean}
 */
function setBorder(el, borderArgs) {
    if (!el.classList.contains("irc_mi")) {// Condition to improve performance only for Google.com
        var container;
        if (onGoogleImages) container = el.closest("div"); // @Google-Specific: a fix for google only

        if (container && !container.classList.contains("irc_mimg") && !container.classList.contains("irc_mutc")) { // @Google-Specific
            setStyleInHTML(container, borderArgs);
            setStyleInHTML(el, "border", "none !important");
        } else {
            setStyleInHTML(el, borderArgs);
        }
    }
}

/**puts red borders around the mainImage.
 * @param node
 */
function markNotFound(node) {
    addClass(node, ClassNames.FAILED);
    node.setAttribute('loaded', 'error');
    SUCCESSFUL_URLS.delete(node.src);
}

function createAndAddCSS() {
    // language=CSS
    addCss(`
.${ClassNames.BUTTONS} {
    margin: 10px;
}

.tooltip {
    position: relative;
    display: inline-block;
    border-bottom: 1px dotted black;
}

/* add padding to checkbox labels */
.sg > label[for] {
    padding-top: 20px;
    padding-bottom: 20px;
}

img.${ClassNames.DISPLAY_ORIGINAL}[loaded="false"],
img.${ClassNames.DISPLAY_ORIGINAL}[loaded="error"] {
    border: 2px #F00 solid;
}

img.${ClassNames.DISPLAY_ORIGINAL}[loaded="false"],
img.${ClassNames.DISPLAY_ORIGINAL}[loaded="error"] {
    -webkit-filter: grayscale(1) !important; /* Webkit */
    filter: gray !important; /* IE6-9 */
    filter: grayscale(1) !important; /* W3C */

    opacity: 0.5 !important;
    filter: alpha(opacity=50) !important; /* For IE8 and earlier */
}
`);
    // language=CSS
    addCss(
        onGoogleImages ?
            ` /*set borders*/
div.${ClassNames.DISPLAY_ORIGINAL}:not(.irc_mimg):not(.irc_mutc) {	
    border-radius: 5px;
    border: 3px #0F0 solid;
}

div.${ClassNames.DISPLAY_ORIGINAL_GIF}:not(.irc_mimg):not(.irc_mutc) {
    border: 3px #6800FF solid;
}

div.${ClassNames.FAILED_DDG}:not(.irc_mimg):not(.irc_mutc) {
    border: 2px #FFA500 solid;
}` :
            ` /*set borders*/
img.${ClassNames.DISPLAY_ORIGINAL}:not(.irc_mi) {
    border: 3px #0F0 solid;
}

img.${ClassNames.DISPLAY_ORIGINAL_GIF}:not(.irc_mi) {
    border: 3px #6800FF solid;
}

img.${ClassNames.FAILED_DDG}:not(.irc_mi) {
    border: 2px #FFA500 solid;
}
`);

    /* Overlay CSS for highlighting selected images */
    // language=CSS
    addCss(`
        .highlight, .drop-shadow {
            filter: drop-shadow(8px 8px 10px gray) !important;
        }

        .blur.in {
            -webkit-transition: all 0.1s ease-in !important;
            /*-webkit-filter: blur(6px) !important;*/
            transform: scale(0.7) !important;
            opacity: 0.3 !important;
        }

        .blur.out:not(.in) {
            -webkit-filter: blur(0px) !important;
            /*filter: blur(0px) !important;*/
            transform: scale(1) !important;
            opacity: 1 !important;
            -webkit-transition: all 0.25s ease-out !important;
            transition: all 0.25s ease-out !important;
        }

        .transparent {
            opacity: 0.4 !important;
        }

        .sg-too-small {

        }

        .sg-too-small-hide {
            display: none !important;
        }

        .hide-img {
            display: none !important;
        }
    `, 'filters-style');
    /* "border-bottom: 1px dotted black;" is for if you want dots under the hover-able text */
}


/*
 data node text:

		        {
                "clt":"n",
                "id":"ZR4YfY_inahuKM:",
                "isu":"gifs.cc",
                "itg":0,
                "ity":"gif",
                "oh":322,
Source	        "ou":"http://78.media.tumblr.com/....500.gif",
                "ow":492,
PrimaryTitle	"pt":"",
                "rid":"nyyV1PqBnBltYM",
                "rmt":0,
                "rt":0,
Site            "ru":"",
                "s":"Photo",
SecondTitle	    "st":"",
                "th":182,
                "tu":"https://encrypted-tbn0.gstatic.com/images?q\",
                "tw":278
                }

 display panel:
 	Title:
	Domainlink:
	Caption:
 */