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

//          TODO:   Move the injectGoogleButtons functions and fields to the SuperGoogle script
//[ ][ ]    TODO:   Make a function to detect images and marks them for replacement (adds to their ATTRIBUTES).
//[x][ ]    TODO:   Make a "Min Image size" slider that will hide images with dimensions smaller than the slider value.
//[ ]       TODO:   Merge/combine the 3 google mainImage scripts to make this script work on Google images.
//[ ]      ~TODO:   Instead of replacing images on Google, just clone it and then replace it, that way we have the old pic while the new one is loading.
//[ ]       TODO:   (low priority) Add tooltips to the checkboxes with descriptions and include the keyboard shortcuts.
//[x]       done:   Highlight all images that will be downloaded when sliding the downloadLimit bar
//                      Make another function called by the mutation observer in charge of dealing with them.
//[x]       done:   Replace the "Remove failed images" button to a checkbox, also put some text like "(n)" {n being the number of images that failed to show up}.
//[x]       done:   Replace the "Show originals" button to a checkbox, and also add a "Use DDG proxy" checkbox.
//[x]       done:   Get to the bottom of: why this script stops some websites from working.

// 'use-strict';
const HIDE_FAILED_IMAGES_ON_LOAD = GM_getValue("HIDE_FAILED_IMAGES_ON_LOAD", false);

var bigImagesCount = 0,
    currentDownloadCount = 0;

// Options
const loopReplacedVids = true,
    autoplayReplacedVids = false;

const GMValues = {};

const Tokens = {
    DISPLAY_ORIGINAL: "display-original-" + "mainImage",
    DISPLAY_ORIGINAL_GIF: "display-original-" + "-gif",
    FAILED: "display-original-" + "-failed",
    FAILED_DDG: "display-original-" + "-ddg-failed"
};
unsafeWindow.DOITokens = Tokens;

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
const checked_useDdgProxy = () => q('#useDdgProxyBox').checked,
    checked_ShowFailedImages = () => q('#showFailedImagesBox').checked,
    SUCCESSFUL_URLS = new Set();
var urls = new Set();

// @google stuff
const searchModeDiv = q('#hdtb-msb-vis'),
    selectedSearchMode = !searchModeDiv ? null : searchModeDiv.querySelector('div.hdtb-msel'),
    onGoogleImages = /google/.test(location.hostname) && selectedSearchMode && selectedSearchMode.innerHTML == 'Images'
;

createAndAddCSS();

if (onGoogleImages) {
    // wait for the navbar to inject the Google buttons
    waitForElement('#hdtb-msb', injectGoogleButtons);
}


try {
    bindKeys();
} catch (e) {
    // I commented this because an error keeps popping up:  "object.dispatchEvent is not a function..."
    // console.error(e);
}
function bindKeys() {
    Mousetrap.bind(["alt+o"], (keyEvent) => {
        console.log('Alt+o: displayImages();');
        displayImages();
    });
    Mousetrap.bind(["alt+o"], (keyEvent) => {
        console.log('Alt+o: displayImages();');
        displayImages();
    });
    Mousetrap.bind(["* d"], (keyEvent) => {
        console.log('* d: downloadImages();');
        downloadImages();
    });

    if (!onGoogleImages) {
        return;
    }
    Mousetrap(["alt+a"], () => {
        (!q('#itp_animated').firstElementChild ? q('#itp_').firstElementChild : q('#itp_animated').firstElementChild).click();
    });
    Mousetrap(["D"], () => {
        q('#downloadBtn').click();
    });
    Mousetrap(["h"], () => {
        q('#showFailedImagesBox').click();
    });
    Mousetrap(["g"], () => {
        q('#GIFsOnlyBox').click();
    });
}
/*
window.addEventListener('keydown', function (e) {
    const key = e.keyCode ? e.keyCode : e.which;
    let modifierKeys = getModifierKeys(e);
    if (!targetIsInput(e)) {
        switch (key) {
            case KeyEvent.DOM_VK_O: // 'O' key
                if (modifierKeys.ALT_ONLY) {
                    console.log('Alt+O: displayImages();');
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
*/
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
    console.debug("Displaying originals\nOriginal Images Displayed:", Array.from(qa(`.${Tokens.DISPLAY_ORIGINAL}`)));
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

// TODO:    move this to the Super google script

// TODO:    Make a navbar that drops down containing all the buttons and controls
function injectGoogleButtons() {
    function updateQualifiedImagesLabel(value) {
        const qualifiedGImgs = getQualifiedGImgs();
        value = value || Array.from(qualifiedGImgs).length;
        satCondLabel.innerHTML = `${value} images satisfying conditions`;
        const dlLimitSlider = q('#dlLimitSlider');
        if (dlLimitSlider.value < value) {
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

    try {
        //Injects buttons to google.com
        let controlsContainer = createElement(`<div id="${controlsContainerId}"></div>`);
        /*q('#abar_button_opt').parentNode*/ //The "Settings" button in the google images page
        let googleButtonsContainer = document.querySelector('#hdtb-msb');
        googleButtonsContainer.appendChild(controlsContainer);


        // click on "tools" for Google Images
        const btn_Tools = q(".hdtb-tl");
        if (!!btn_Tools) {
            if (!btn_Tools.classList.contains('hdtb-tl-sel')) { // if the tools bar is not visible (button not clicked)
                btn_Tools.click();
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
        cbox_ShowFailedImages = createGCheckBox("showFailedImagesBox", "Show failed images", _sfi, HIDE_FAILED_IMAGES_ON_LOAD);
        cbox_GIFsOnly = createGCheckBox("GIFsOnlyBox", "GIFs only", _gifsOnly, false);
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
            if (onClick) {
                button.onclick = function () {
                    onClick()
                };
            }
            return button;
        }


        // Display originals
        var btn_dispOgs = createGButton(`dispOgsBtn`, `Display <u>o</u>riginals`, displayImages),
            btn_animated = createGButton(`AnimatedBtn`, `<u>A</u>nimated`, function () {
                q('#itp_animated').firstElementChild.click();
            }),
            btn_download = createGButton(`downloadBtn`, `Download ⇓`, function () {
                const zipBox = q('#zipInsteadOfDownload');
                if (zipBox && zipBox.checked) {
                    if (!zip || Object.keys(zip.files).length < 1) {
                        gZipImages();
                    } else {
                        genZip();
                    }
                } else {
                    downloadImages();
                }
            }),
            btn_preload = createGButton(`preloadBtn`, `Preload images ↻`, function () {
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
        if (onGoogleImages) {
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
    if (onGoogleImages) {
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
    } else {
        return zipImages(qa(`img.${Tokens.DISPLAY_ORIGINAL}`));
    }
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
    addClass(this, Tokens.FAILED_DDG);
}
function tryDdgProxy(imgEl) {
    // If it already failed ddgProxy, don't even try
    if (imgEl.classList.contains(Tokens.FAILED_DDG)) return;
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
        const videoOptions = 'controls ' + (autoplayReplacedVids ? 'autoplay ' : '') + (loopReplacedVids ? 'loop ' : '');
        const vidEl = createElement(`<video ${videoOptions} name="media" src="${href}"  type="video/webm" style="width:${vidThumb.clientWidth * 2}px;">`);
        anchor.after(vidEl);
        anchor.remove();
    }
}
function replaceImgSrc(img, anchor) {
    if (img.classList.contains(Tokens.DISPLAY_ORIGINAL)) return;
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
    console.debug('disp og img:', img);
    img.src = getSrc();
    img.anchor = anchor; // Storing the anchor object in case we need it later
    addClass(img, Tokens.DISPLAY_ORIGINAL);

    const imageObj = new Image();
    imageObj.src = img.src;
    ImageManager._images.add(imageObj);

    if (/\.(gif)($|\?)/i.test(anchor)) {
        setBorder(img, "{border: 5px #6800FF solid !important;}"); //Purple for GIFs
        addClass(img, Tokens.DISPLAY_ORIGINAL_GIF);
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
        if (onGoogleImages) container = el.closest("div"); // @GoogleSpecific: a fix for google only

        if (container) {
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
    addClass(node, Tokens.FAILED);
    if (onGoogleImages && !checked_ShowFailedImages()) {
        setVisible(node, false);
    }
    node.setAttribute('loaded', 'error');
    SUCCESSFUL_URLS.delete(node.src);
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

    let bxs = qa(`div.rg_bx > a.rg_l > img.${Tokens.FAILED_DDG}, div.rg_bx > a.rg_l > img.${Tokens.FAILED}`);
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

img.${Tokens.DISPLAY_ORIGINAL}[loaded="false"],
img.${Tokens.DISPLAY_ORIGINAL}[loaded="error"] {
    border: 2px #F00 solid;
}

img.${Tokens.DISPLAY_ORIGINAL}[loaded="false"],
img.${Tokens.DISPLAY_ORIGINAL}[loaded="error"] {
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
div.${Tokens.DISPLAY_ORIGINAL}:not(.irc_mi) {
    border: 3px #0F0 solid;
}

div.${Tokens.DISPLAY_ORIGINAL_GIF}:not(.irc_mi) {
    border: 5px #6800FF solid;
}

div.${Tokens.FAILED_DDG}:not(.irc_mi) {
    border: 2px #FFA500 solid;
}` :
            ` /*set borders*/
img.${Tokens.DISPLAY_ORIGINAL}:not(.irc_mi) {
    border: 3px #0F0 solid;
}

img.${Tokens.DISPLAY_ORIGINAL_GIF}:not(.irc_mi) {
    border: 5px #6800FF solid;
}

img.${Tokens.FAILED_DDG}:not(.irc_mi) {
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