//==UserScript==
//@name         Display Original Image
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
//@require      http://code.jquery.com/jquery-latest.js
//@require      https://raw.githubusercontent.com/kimmobrunfeldt/progressbar.js/master/dist/progressbar.min.js
//@require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\download_script.user.js
//@require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\Handy AF functions Faris.user.js
//==/UserScript==

//@require      https://github.com/buzamahmooza/Helpful-Web-Userscripts/raw/master/Handy%20AF%20functions%20Faris.user.js
//@require      https://github.com/buzamahmooza/Helpful-Web-Userscripts/raw/master/download_script.user.js
//UserscriptDownloader
//@require      https://gist.github.com/buzamahmooza/73774aa6900fc4281d01c844433b9031/raw/

// []       TODO: Highlight all images that will be downloaded when sliding the downloadLimit bar
//[ ][ ]    TODO: Make a function to detect images and marks them for replacement (adds to their ATTRIBUTES).
//          Make another function called by the mutation ovserver incharge of dealing with them.
//[x]       Replace the "Remove failed images" button to a checkbox, also put some text like "(n)" {n being the number of images that failed to show up}.
//[x]       Replace the "Show originals" button to a checkbox, and also add a "Use DDG proxy" checkbox.
//[x][ ]    TODO: Make a "Min Image size" slider that will hide images with dimensions smaller than the slider value.
//[x]       Get to the bottom of: why this script stops some websites from working.
//[ ]       TODO: Merge/combine the 3 google mainImage scripts to make this script work on Google images.
//[ ]      ~TODO: Instead of replacing images on Google, just clone it and then replace it, that way we have the old pic while the new one is loading.
//[ ]       TODO: (low priority) Add tooltips to the checkboxes with descriptions and include the keyboard shortcuts.

// 'use-strict';
const HIDE_FAILED_IMAGES_ON_LOAD = GM_getValue("HIDE_FAILED_IMAGES_ON_LOAD", false);

var bigImagesCount = 0,
    currentDownloadCount = 0;

// Options
const loopReplacedVids = true,
    autoplayReplacedVids = false;

const GMValues = {};

const Tokens = {
    DISPLAY_ORIGINAL: "display-original-mainImage",
    DISPLAY_ORIGINAL_GIF: "display-original-mainImage" + "-gif",
    FAILED: "display-original-mainImage" + "-failed",
    FAILED_DDG: "display-original-mainImage" + "-ddg-failed"
};
unsafeWindow.Tokens = Tokens;

const ClassNames = {
    BUTTONS: "super-button"
};
const controlsContainerId = 'google-controls-container';

let slider_dlLimit,
    slider_minImgSize,
    cbox_ShowFailedImages,
    cbox_GIFsOnly,
    cbox_UseDdgProxy,
    cbox_GIFsException,
    cbox_OnlyShowQualifiedImages
;
let KeyEvent;

unsafeWindow.displayImages = displayImages;
unsafeWindow.replaceImgSrc = replaceImgSrc;

// use ddg proxy upon failure to show original?
const checked_useDdgProxy = () => document.getElementById('useDdgProxyBox').checked,
    checked_ShowFailedImages = () => document.getElementById('showFailedImagesBox').checked,
    SUCCESSFUL_URLS = new Set();
var urls = new Set();

const onGoogle = /google/.test(location.hostname),
    // @google
    searchModeDiv = q('#hdtb-msb-vis'),
    selectedSearchMode = !searchModeDiv ? null : searchModeDiv.querySelector('div.hdtb-msel'),
    onGoogleImages = onGoogle && selectedSearchMode && selectedSearchMode.innerHTML == 'Images'
;

createAndAddCSS();

if (onGoogleImages) {
    waitForElement('#hdtb-msb', injectGoogleButtons);
}


window.addEventListener('keydown', function (e) {
    const key = e.keyCode ? e.keyCode : e.which;
    let modifierKeys = getModifierKeys(e);
    if (!targetIsInput(e)) {
        switch (key) {
            case KeyEvent.DOM_VK_O: // 'O' key
                if (modifierKeys.ALT_ONLY) {
                    displayImages();
                }
                break;
        }
        if (onGoogle) {
            switch (key) {
                case KeyEvent.DOM_VK_A: // 'A' key
                    if (modifierKeys.ALT_ONLY) {
                        (!q('#itp_animated').firstElementChild ? q('#itp_').firstElementChild : q('#itp_animated').firstElementChild).click();
                    }
                    break;
                case KeyEvent.DOM_VK_D: // 'D' key
                    if (modifierKeys.SHIFT_ONLY) {
                        q('#downloadBtn').click();
                    }
                    break;
                case KeyEvent.DOM_VK_H: // H
                    if (modifierKeys.NONE) {
                        if (targetIsInput(e)) break;
                        q('#showFailedImagesBox').click();
                    }
                    break;
                case KeyEvent.DOM_VK_G: //
                    if (modifierKeys.NONE) {
                        if (targetIsInput(e)) break;
                        q('#GIFsOnlyBox').click();
                    }
                    break;
            }
        }
    }
});
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
        if (this.classList.contains(Tokens.DISPLAY_ORIGINAL)) {
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
    console.debug("Displaying originals\nOriginal Images Displayed:", Array.from(qa('.' + Tokens.DISPLAY_ORIGINAL)));
}

/** @param visibleThumbnailsOnly
 * @returns {set<HTMLImageElement>} */
function getThumbnails(visibleThumbnailsOnly) {
    const selector = 'div.rg_bx > a.rg_l[jsname="hSRGPd"] > img' +
        (visibleThumbnailsOnly ? ':not([display="none"]):not([visibility="hidden"])' : '')
    ;
    return qa(selector);
}

function injectGoogleButtons() {
    function updateQualifiedImagesLabel(value) {
        const qualifiedGImgs = getQualifiedGImgs();
        value = value || Array.from(qualifiedGImgs).length;
        satCondLabel.innerHTML = value + ' images satisfying conditions';

        // if (q("#OnlyShowQualifiedImages").checked)
        //     for (const img of getThumbnails()) {
        //         const qualified = img.hasAttribute('qualified-dimensions');
        //         setVisible(img, qualified);
        //     }
    }

    try {
        //Injects buttons to google.com
        let controlsContainer = createElement(`<div id="${controlsContainerId}"></div>`);
        /*document.getElementById('abar_button_opt').parentNode*/ //The "Settings" button in the google images page
        let googleButtonsContainer = document.querySelector('#hdtb-msb');
        googleButtonsContainer.appendChild(controlsContainer);


        // click on "tools" for Google Images
        const btn_Tools = q(".hdtb-tl");
        if (!!btn_Tools) {
            if (!btn_Tools.classList.contains('hdtb-tl-sel')) { // if the tools bar is not visible (button not clicked)
                btn_Tools.click();
            } else {
                console.warn('tools button already activated');
            }
        } else {
            console.warn('tools button not found');
        }


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
        cbox_ShowFailedImages = createGCheckBox("showFailedImagesBox", "Show failed images", f_sfi, HIDE_FAILED_IMAGES_ON_LOAD);
        cbox_GIFsOnly = createGCheckBox("GIFsOnlyBox", "GIFs only", f_gifsOnly, false);
        cbox_UseDdgProxy = createGCheckBox("useDdgProxyBox", "Try DDGP",
            () => {
                GM_setValue("useDdgProxy", q('#useDdgProxyBox').checked);
                updateQualifiedImagesLabel();
            },
            GM_getValue("useDdgProxy", true)
        );

        // passive checkbox
        cbox_GIFsException = createGCheckBox("GIFsExceptionBox", "Always download GIFs",
            () => GM_setValue("GIFsException", q('#GIFsExceptionBox').checked),
            GM_getValue("GIFsException", true)
        );
        // passive checkbox
        cbox_OnlyShowQualifiedImages = createGCheckBox("OnlyShowQualifiedImages", "Only show qualified images",
            () => GM_setValue("OnlyShowQualifiedImages", this.checked),
            GM_getValue("OnlyShowQualifiedImages", false)
        );

        /** Show failed images */
        function f_sfi() {
            const checked = q("#showFailedImagesBox").checked;
            setVisibilityForFailedImages(checked);
            GM_setValue("HIDE_FAILED_IMAGES_ON_LOAD", checked_ShowFailedImages());
        }

        function f_gifsOnly() {
            f_sfi();
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
            sliderReading_minImgSize.innerHTML = /*'Min Dimensions<br>' +*/ (this.value + 'x' + this.value);

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
            updateQualifiedImagesLabel(getQualifiedGImgs(null, null, true).size);
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

            // clearAllEffects();
            // Highlighting images that will be downloaded

            // blur all


            var i = 0;
            /*for (const qualifiedImgObj of getQualifiedGImgs(null, null, true)) {
                const img = qualifiedImgObj.img;
                console.debug('i:', i, 'this.value:', this.value);
                if(++i <= this.value) {
                    img.classList.add('drop-shadow', 'out');
                    img.classList.remove('in');
                }
                // else {
                //     console.debug('img should be hidden:', img);
                //     img.classList.remove('out');
                //     img.classList.add('blur', 'in');
                // }
            }*/

            for (const img of qa('.rg_bx img.qualified-dimensions')) {
                if (++i <= this.value) {
                    img.classList.add('drop-shadow', 'out');
                    img.classList.remove('in');
                } else {
                    // console.debug('img should be hidden:', img);
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
                    // console.debug('img should be hidden:', img);
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
            const button = createElement(`<button class="${ClassNames.BUTTONS} sg sbtn hdtb-tl" id="${id}">${innerText}</button>`);
            if (onClick) {
                button.onclick = function () {
                    onClick()
                };
            }
            return button;
        }


        // Display originals
        var btn_dispOgs = createGButton(`dispOgsBtn`, `Display&nbsp;<u>o</u>riginals`, displayImages),
            btn_animated = createGButton(`AnimatedBtn`, `<u>A</u>nimated`, function () {
                q('#itp_animated').firstElementChild.click();
            }),
            btn_download = createGButton(`downloadBtn`, `Download&nbsp;⇓`, function () {
                const zipBox = q('#zipInsteadOfDownload');
                if (zipBox && zipBox.checked) {
                    if (!zip || Object.keys(zip.files).length < 1) {
                        zipImages();
                    } else {
                        genZip();
                    }
                } else {
                    downloadImages();
                }
            }),
            btn_preload = createGButton(`preloadBtn`, `Preload&nbsp;images&nbsp;↻`, function () {
                const imgLinks = Array.from(qa('a.rg_l[href]'));
                console.log('imgLinks:', imgLinks);

                imgLinks.forEach(a => {
                    let img = a.querySelector('img'),
                        dlName = cleanGibberish(getGimgDescription(img));

                    createAndAddAttribute(img, 'download-name', dlName);
                    img.alt = dlName;
                    ImageManager.markImageOnLoad(img, a.getAttribute('href'));
                    console.log('Preloading image:', `"${dlName}"`, !isBase64ImageData(img.src) ? img.src : "Base64ImageData");
                });
            });


        btn_download.style.margin = "20px";
        btn_download.style.border = "20px";

        var cbox_ZIP = createGCheckBox('zipInsteadOfDownload', 'ZIP', function changeZIPBtnText() {
            const checked = q('#zipInsteadOfDownload').checked;
            const downloadBtn = q('#downloadBtn');
            downloadBtn.innerHTML = checked ? (!downloadBtn.classList.contains('genzip-possible') ? 'ZIP&nbsp;images' : 'Download&nbsp;ZIP&nbsp;⇓') : 'Download&nbsp;⇓';
            GM_setValue("zipInsteadOfDownload", checked);
        }, GM_getValue("zipInsteadOfDownload", true));
        cbox_ZIP.style.padding = "0px";

        var downloadPanel = createElement(
            '<div id="download-panel" style="display: block;"></div>'
            /*'<form action="/action_page.php">'+
            	'First name:<br>'+
            	'<input type="text" name="firstname" value="Mickey"><br>'+
            	'Last name:<br>'+
            	'<input type="text" name="lastname" value="Mouse"><br><br>'+
            	'<input type="submit" value="Submit">'+
            	'<input type="reset">'+
            '</form>'*/
        );

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

        if (/q=site:/i.test(location.href) && !/tbs=rimg:/i.test(location.href)) {
            displayImages();
        }

        const divider = document.createElement('div');
        controlsContainer.appendChild(divider);
        divider.after(btn_dispOgs, cbox_ShowFailedImages, cbox_GIFsOnly, cbox_UseDdgProxy, cbox_GIFsException, cbox_OnlyShowQualifiedImages, btn_animated, downloadPanel);
        sliderConstraintsContainer.after(satCondLabel);
        q('#download-panel').appendChild(createElement(`<div id="progressbar-container"></div>`));

        btn_download.innerHTML = q('#zipInsteadOfDownload').checked ? 'ZIP&nbsp;images' : `Download&nbsp;⇓`;
    } catch (r) {
        if (onGoogle) {
            console.error(r);
        }
    }
}

//todo: problem: this even removes the effects of images that didn't load (greyscale), fix this! Make a separate selector in the CSS for those that didn't load
function clearAllEffects() { // remove highlighting of elements
    console.warn('clearAllEffects()');
    for (const effectClassName of ['highlight', 'drop-shadow', 'transparent', 'sg-too-small', /*'qualified-dimensions',*/ 'sg-too-small-hide', 'in']) {
        for (const el of qa('.' + effectClassName)) {
            el.classList.remove(effectClassName);
            el.classList.add('out');
        }
    }
}
function clearAllEffectsFromEl(el) { // remove highlighting of elements
    console.warn('clearAllEffectsFromEl()');
    for (const effectClassName of ['highlight', 'drop-shadow', 'transparent', 'sg-too-small', /*'qualified-dimensions', */'sg-too-small-hide', 'in']) {
        el.classList.remove(effectClassName);
    }
    el.classList.add('out');
}
function downloadImages() {
    bigImagesCount = 0;
    if (currentDownloadCount >= slider_dlLimit.value) {
        currentDownloadCount = 0;
    } else {
        console.log('currentDownloadCount >= dlNumSlider.value');
    }
    urls = new Set();

    for (const qualifiedImgArgs of getQualifiedGImgs()) {
        const directoryName = document.title;
        download(qualifiedImgArgs.fileURL, qualifiedImgArgs.fileName, directoryName, qualifiedImgArgs);
    }
}

//auto display-originals if enough big images
/*var bigImgs = document.getElementsByTagName('.img-big');
if (bigImgs.length < 7) {
    console.log("Too little big images, i want to stop displaying original images");
} else {
    console.log('We have enough big images :)\nDisplaying original images automatically...');
    displayOriginalImage();
}*/

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
    for (const img of node.querySelectorAll("a[href] > img[src]")) {
        replaceImgSrc(img, img.parentNode);
        ImageManager.markImageOnLoad(img);
    }
    for (const vidThumb of node.querySelectorAll("a[href] > img")) {
        replaceThumbWithVid(vidThumb);
    }
}


function handleError() {
    this.removeEventListener("error", handleError);
    this.setAttribute("loaded", "");
    if (!onGoogle || checked_useDdgProxy()) {
        tryDdgProxy(this);
    } else {
        markNotFound(this);
        this.src = this.oldSrc;
    }
}
function ddgHandleError() {
    this.src = this.oldSrc;
    markNotFound(this);
    this.removeEventListener("error", ddgHandleError);
    this.classList.add(Tokens.FAILED_DDG);
}
function tryDdgProxy(imgEl) {
    // If it already failed ddgProxy, don't even try
    if (imgEl.classList.contains(Tokens.FAILED_DDG)) return;
    // if (imgEl.hasAttribute('loaded')) imgEl.setAttribute('loaded', '');

    imgEl.addEventListener("error", ddgHandleError);

    if (!imgEl.classList.contains("irc_mi")) // Condition to improve performance only for Google.com
    {
        imgEl.style.border = "2px" + "#FFA500" + " solid";
    } //Make borders ORANGE

    let ddgProxyUrl = ddgProxy(imgEl.src);
    let anchor = imgEl.parentNode;
    imgEl.anchor.href = ddgProxyUrl;
    // console.log('imgEl.anchor: '+imgEl.anchor);
    replaceImgSrc(imgEl, anchor);
    imgEl.src = ddgProxyUrl;

    // replace(imgEl, createElement('<a anchor='+ddgProxyUrl+'></a>'));
    imgEl.classList.remove(Tokens.FAILED);
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
        const videoOptions = 'controls' + (autoplayReplacedVids ? ' autoplay ' : '') + (loopReplacedVids ? ' loop ' : '');
        const vidEl = createElement(`<video ${videoOptions} name="media" src="${href}"  type="video/webm" style="width:${vidThumb.clientWidth * 2}px;">`);
        anchor.after(vidEl);
        anchor.remove();
    }
}
function replaceImgSrc(img, anchor) {
    if (img.classList.contains(Tokens.DISPLAY_ORIGINAL)) return;
    if (!/\.(jpg|png|gif)($|\?)/i.test(anchor.href)) return;

    img.addEventListener("error", handleError);
    img.oldSrc = img.src;
    function getSrc() {
        let src = anchor.href;
        if (/\.kym-cdn\.com\/photos\/images\/masonry/.test(img.src)) {
            src = img.src.replace('masonry', 'original');
        }
        return src;
    }
    console.debug('disp og img:', img);
    img.src = getSrc();
    img.anchor = anchor; // Storing the anchor object in case we need it later
    img.classList.add(Tokens.DISPLAY_ORIGINAL);

    const imageObj = new Image();
    imageObj.src = img.src;
    ImageManager._images.add(imageObj);

    if (/\.(gif)($|\?)/i.test(anchor)) {
        img.style.border = "5px #6800FF solid"; //Purple for GIFs
        img.classList.add(Tokens.DISPLAY_ORIGINAL_GIF);
    }
}

/**puts red borders around the mainImage.
 * @param node
 */
function markNotFound(node) {
    node.classList.add(Tokens.FAILED);
    if (!onGoogle || !checked_ShowFailedImages()) {
        setVisible(node, false);
    }
    node.setAttribute('loaded', 'error');
    SUCCESSFUL_URLS.delete(node.src);
}
function setVisibilityForFailedImages(visibility) {

// language=CSS
//     const css = visibility ? '' :
//         ` /*Failed images selector*/
//     div.rg_bx > a.rg_l > img.${Tokens.FAILED_DDG},
//     div.rg_bx > a.rg_l > img.${Tokens.FAILED} {
//         display: none !important;
//     }
// `;
//     const id = 'hide-failed-images-style';
//     const styleEl = q('#' + id);
//     if (!styleEl) {
//         addCss(css, id);
//     } else {
//         styleEl.innerHTML = css;
//     }

    let bxs = qa(`div.rg_bx > a.rg_l > img.${Tokens.FAILED_DDG}, div.rg_bx > a.rg_l > img.${Tokens.FAILED}`);
    if (!bxs.length) return;

    let count = 0;
    for (const imageBox of bxs) {
        setVisible(imageBox, visibility);
        count++;
    }
    console.log("Set visibility of " + count + " images to", visibility);
}
function setVisible(node, visible) {
    if (!node) return;
    if (onGoogle) {
        node = node.parentNode.parentNode;
    }

    if (visible) {
        node.classList.remove('hide-img');
    } else {
        node.classList.add('hide-img');
    }

    // if(hideByVisibility) {
    //     node.style.visibility = visible ? 'visible' : 'hidden';
    // } else {
    //     node.style.display = visible ? 'inline-block' : 'none';
    // }
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

.${Tokens.DISPLAY_ORIGINAL}[loaded="false"], 
.${Tokens.DISPLAY_ORIGINAL}[loaded="error"]{
    border:2px #F00 solid;
}` +
        // .${CLASS_TOKEN_DDG_FAILED}:not([loaded="true"]),
        // .${CLASS_Tokens.FAILED}:not([loaded="true"])
        `
.${Tokens.DISPLAY_ORIGINAL}[loaded="false"],
.${Tokens.DISPLAY_ORIGINAL}[loaded="error"]{
    -webkit-filter: grayscale(1) !important; /* Webkit */
    filter: gray !important; /* IE6-9 */
    filter: grayscale(1) !important; /* W3C */

    opacity: 0.5 !important;
    filter: alpha(opacity=50) !important; /* For IE8 and earlier */
}
.${Tokens.DISPLAY_ORIGINAL}:not(.irc_mi){
    border: 3px #0F0 solid;
}
.${Tokens.DISPLAY_ORIGINAL_GIF}:not(.irc_mi){
    border: 5px #6800FF solid;
}
.${Tokens.FAILED_DDG}:not(.irc_mi){
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

if (typeof KeyEvent == 'undefined')
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
        DOM_VK_PGUP: 33, DOM_VK_PAGE_UP: 33,
        DOM_VK_PGDN: 34, DOM_VK_PAGE_DOWN: 34,
        DOM_VK_END: 35,
        DOM_VK_HOME: 36,
        DOM_VK_LEFT: 37, DOM_VK_LEFT_ARROW: 37,
        DOM_VK_UP: 38, DOM_VK_UP_ARROW: 38,
        DOM_VK_RIGHT: 39, DOM_VK_RIGHT_ARROW: 39,
        DOM_VK_DOWN: 40, DOM_VK_DOWN_ARROW: 40,
        DOM_VK_INSERT: 45,
        DOM_VK_DEL: 46, DOM_VK_DELETE: 46,
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
        DOM_VK_LWIN: 91, DOM_VK_LEFT_WINDOW: 91,
        DOM_VK_RWIN: 92, DOM_VK_RIGHT_WINDOW: 92,
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
        DOM_VK_EQUALS: 187, DOM_VK_EQUAL_SIGN: 187,
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
/**
 * Order of key strokes in naming convention:   Ctrl > Alt > Shift >  Meta
 * @param keyEvent
 * @returns {{
            CTRL_SHIFT: boolean,
            CTRL_ALT: boolean,
            ALT_SHIFT: boolean,
            CTRL_ONLY: boolean,
            CTRL_ALT_SHIFT: boolean,

            SHIFT_ONLY: boolean,
            ALT_ONLY: boolean,
            META_ONLY: boolean,

            NONE: boolean
      }}
 */
function getModifierKeys(keyEvent) {
    /** @type {
      {
            CTRL_SHIFT: boolean,
            CTRL_ALT: boolean,
            ALT_SHIFT: boolean,
            CTRL_ONLY: boolean,
            CTRL_ALT_SHIFT: boolean,

            SHIFT_ONLY: boolean,
            ALT_ONLY: boolean,
            META_ONLY: boolean,

            NONE: boolean
      }
  } */
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