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

var failedImagesCount = 0,
    originalImagesCount = 0,
    bigImagesCount = 0,
    currentDownloadCount = 0;

// Options
const loopReplacedVids = true,
    autoplayReplacedVids = false,
    logAnnoyingNetworkErrors = false,
    /**When hiding failed images, use the style.visibility attribute, otherwise, use the style.display attribute*/
    hideByVisibility = false;


const TOKEN_DISPLAY = "display-original-mainImage",
    TOKEN_GIF = "display-original-mainImage-gif",
    TOKEN_FAILED = "display-original-mainImage-failed",
    TOKEN_DDG_FAILED = "display-original-mainImage-ddg-failed",
    BUTTONS_CLASS = "super-button",
    controlsContainerId = 'google-controls-container';

let slider_dlLimit,
    slider_minImgSize,
    cbox_ShowFailedImages,
    cbox_GIFsOnly,
    cbox_UseDdgProxy
;
unsafeWindow.displayImages = displayImages;
unsafeWindow.replaceImgSrc = replaceImgSrc;

// use ddg proxy upon failure to show original?
const useDdgProxy = () => document.getElementById('useDdgProxyBox').checked,
    checked_GIFsOnly = () => document.getElementById('GIFsOnlyBox').checked,
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

if(onGoogleImages) {
    waitForElement('#hdtb-msb', injectGoogleButtons);
}
window.onkeyup = function (e) {
    const key = e.keyCode ? e.keyCode : e.which;

    if(!targetIsInput(e)) {
        switch (key) {
            case 79: // 'O' key
                if(e.shiftKey) {
                    displayImages();
                }
                break;
        }
        if(onGoogle) {
            switch (key) {
                case 65: // 'A' key
                    if(e.altKey) {
                        q('#AnimatedBtn').click();
                    }
                    break;
                case 68: // 'D' key
                    if(e.shiftKey) {
                        q('#downloadBtn').click();
                    }
                    break;
                case 72: // H
                    if(!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                        if(targetIsInput(e)) break;
                        q('#showFailedImagesBox').click();
                    }
                    break;
                case KeyEvent.DOM_VK_G: //
                    if(!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                        if(targetIsInput(e)) break;
                        q('#GIFsOnlyBox').click();
                    }
                    break;
            }
        }
    }
};
window.ImageManager = {
    _images: new Set(),

    isImageOk: function (img) {
        // During the onload event, IE correctly identifies any images that
        // weren’t downloaded as not complete. Others should too. Gecko-based
        // browsers act like NS4 in that they report this incorrectly.
        if(!img.complete) {
            return false;
        }

        // However, they do have two very useful properties: naturalWidth and
        // naturalHeight. These give the true size of the image. If it failed
        // to load, either of these should be zero.
        if(img.naturalWidth === 0) {
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
        if(!imgEl) return;
        if(imgEl.hasAttribute('loaded')) {
            /* console.debug('Img already has "loaded" attr:', imgEl);*/
            return;
        }
        if(!imgEl.hasAttribute('loaded')) {
            createAndAddAttribute(imgEl, 'loaded');
        } else {
            imgEl.setAttribute("loaded", "false");
        }
        var imgObj = new Image();
        imgObj.onerror = onError || ImageManager.imgOnError;
        imgObj.onload = onLoad || ImageManager.imgOnLoad;
        imgObj.src = imgUrl || imgEl.src || imgEl.href;
        if(ImageManager._images.has(imgObj)) {
            console.warn('Duplicate image object!', imgObj);
            imgObj = null;
            return;
        }
        ImageManager._images.add(imgObj);
    },
    imgOnError: function () {
        if(ImageManager.isImageOk(this)) {
            this.setAttribute('loaded', true);
            return;
        }
        if(this.classList.contains(TOKEN_DISPLAY)) {
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

function qa(selector) {return document.querySelectorAll(selector);}
function q(selector) {return document.querySelector(selector);}

function displayImages() {
    log("Displaying originals\nOriginal Images Displayed:\n" + Array.from(SUCCESSFUL_URLS));
    observeDocument(displayOriginalImage);
    qa('iframe').forEach(iframe =>
        iframe.querySelectorAll("a[href]>img[src]").forEach(img =>
            replaceImgSrc(img, img.parentNode)
        )
    );
}

/** @param visibleThumbnailsOnly
 * @returns {*} */
function getThumbnails(visibleThumbnailsOnly) {
    const selector = 'a[jsname="hSRGPd"] img' +
        (visibleThumbnailsOnly ? ':not([display="none"]):not([visibility="hidden"])' : '')
        // q('#zipInsteadOfDownload').checked ? '.rg_ic.rg_i.display-original-mainImage:not(.display-original-mainImage-failed)' :`.${TOKEN_DISPLAY}:not(${TOKEN_FAILED})`
        // '.rg_bx'
    ;
    return qa(selector);
}

function injectGoogleButtons() {
    function updateQualifiedImagesLabel(value) {
        const satCondLabel = q('#satCondLabel');
        value = value || Math.min(qa('.qualified-dimensions').length, q('#dlLimitSlider').value);
        satCondLabel.innerHTML = Array.from(getQualifiedGImgs()).length + ' images satisfying conditions';
    }

    try {
        //Injects buttons to google.com
        let controlsContainer = createElement(`<div id="${controlsContainerId}"></div>`);
        /*document.getElementById('abar_button_opt').parentNode*/ //The "Settings" button in the google images page
        let googleButtonsContainer = document.querySelector('#hdtb-msb');
        googleButtonsContainer.appendChild(controlsContainer);


        // click on "tools" for Google Images
        const btn_Tools = q(".hdtb-tl");
        if(!!btn_Tools) {
            if(!btn_Tools.classList.contains('hdtb-tl-sel')) { // if the tools bar is not visible (button not clicked)
                btn_Tools.click();
            } else {
                console.warn('tools button already activated');
            }
        } else {
            console.warn('tools button not found');
        }


        // var linkAnimated = createElement('<a style="display:" class="hdtb-tl" href="#" onclick="alert("finally"); document.getElementById("itp_animated").childNodes[0].click();">Animated</a>');


        // injecting "site" button
        if(false) {
            try {
                var searchBar = q('#lst-ib'),
                    siteBtn = createElement(`<a class="gsst_a" href="javascript:void(0)" aria-label="Site"><span><span class="gsst_e" id="">Site</span></span></a>`);
                siteBtn.addEventListener('click', function () {
                    searchBar.value = ((/^site:/.test(searchBar.value)) ?
                        searchBar.value.replace("site:", '') :
                        'site:' + searchBar.value).trim();
                });
                q('#sfdiv > div').appendChild(siteBtn);
            } catch (e) {
                console.warn(e);
            }
        }


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
<label for="${id}">${labelText}</label>
</div>`);
            if(!!changeListener) {
                checkBoxContainerEl.addEventListener('change', () => {
                    changeListener();
                });
            }
            return checkBoxContainerEl;
        }

        // Check boxes
        cbox_ShowFailedImages = createGCheckBox("showFailedImagesBox", "Show&nbsp;failed&nbsp;images", f_sfi, HIDE_FAILED_IMAGES_ON_LOAD);
        cbox_GIFsOnly = createGCheckBox("GIFsOnlyBox", "GIFs&nbsp;only", f_gifsOnly);
        cbox_UseDdgProxy = createGCheckBox("useDdgProxyBox", "Try&nbsp;DDG_P", null, true);

        /**
         * Show failed images
         */
        function f_sfi() {
            const checked = q("#showFailedImagesBox").checked;
            setVisibilityForFailedImages(checked);
            GM_setValue("HIDE_FAILED_IMAGES_ON_LOAD", checked_ShowFailedImages());
        }

        function f_gifsOnly() {
            f_sfi();
            const checked = q("#GIFsOnlyBox").checked;
            Array.from(qa(`.rg_bx a.rg_l img`)).forEach(nonGifImg => {
                if(!/\.gif($|\?)/.test(getMetaEl(nonGifImg))) {
                    console.debug('nonGifImg href doesn\'t end with .gif, settings visibility to:', checked, nonGifImg);
                    setVisible(nonGifImg, checked);
                }
            });
        }


        for (const img of getThumbnails()) {
            img.classList.add('blur');
        }

        // Sliders
        slider_minImgSize = createElement(`<input id="minImgSizeSlider" type="range" min="0" max="3000" value="200" step="25">`);
        var sliderReading_minImgSize = createElement(`<label for="minImgSizeSlider" id="minImgSizeSliderValue">${slider_minImgSize.value}</label>`);
        slider_minImgSize.oninput = function () {
            sliderReading_minImgSize.innerHTML = /*'Min Dimensions<br>' +*/ (this.value + 'x' + this.value);

            // Highlighting images that will be downloaded
            // clearAllEffects(); // todo: this is being called too much
            for (const img of getThumbnails()) {
                var meta = getMeta(img);
                var width = meta.ow, height = meta.oh,
                    isBigger = width >= this.value || height >= this.value;

                if(isBigger) {
                    img.classList.add('qualified-dimensions', 'out');
                    img.classList.remove('in');
                } else {
                    img.classList.add('blur', 'in');
                    img.classList.remove('qualified-dimensions');
                }
            }
            updateQualifiedImagesLabel(Math.min(qa('.qualified-dimensions').length, q('#dlLimitSlider').value));
        };
        slider_minImgSize.onchange = function () {
            for (const img of qa('.sg-too-small-hide')) {
                setVisible(img, false);
            }
            clearEffectsDelayed();
        };

        slider_dlLimit = createElement(`<input id="dlLimitSlider" type="range" min="1" max="${1000}" value="20">`);
        var sliderReading_dlLimit = createElement(`<label id="dlLimitSliderValue">${slider_dlLimit.value}</strong>`);
        slider_dlLimit.oninput = function () {
            sliderReading_dlLimit.innerHTML = this.value;

            // Highlighting images that will be downloaded
            var i = 0;
            // clearAllEffects();
            for (const img of getThumbnails()) {
                if(++i <= this.value) {
                    img.classList.add('drop-shadow', 'out');
                    img.classList.remove('in');
                } else {
                    img.classList.add('blur', 'in');
                    img.classList.remove('out');
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
            }, 800);
        }

        // buttons
        function createGButton(id, innerText, onClick) {
            const button = createElement(`<button class="${BUTTONS_CLASS} sg sbtn hdtb-tl" id="${id}">${innerText}</button>`);
            if(onClick) {
                button.onclick = function () {
                    onClick()
                };
            }
            return button;
        }

        var btn_dispOgs = createGButton(`dispOgsBtn`, `Display&nbsp;<u>o</u>riginals`, displayImages),
            btn_animated = createGButton(`AnimatedBtn`, `<u>A</u>nimated`, function () {
                document.getElementById('itp_animated').childNodes[0].click();
            }),
            btn_download = createGButton(`downloadBtn`, `Download&nbsp;⇓`, function () {
                const zipbox = q('#zipInsteadOfDownload');
                if(zipbox && zipbox.checked) {
                    if(!zip || Object.keys(zip.files).length < 1) {
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
                    ImageManager.markImageOnLoad(img, a.href);
                    console.log('Preloading image:', `"${dlName}"`, !isBase64ImageData(img.src) ? img.src : "Base64ImageData");
                });
            }),
            btn_toggleEncryptedGoogle = createGButton(`toggleEngrypted`, `Toggle&nbsp;engrypted&nbsp;⇌`,
                function toggleEncryptedGoogle() {
                    console.log("Toggle encrypted google");
                    const onEncrGoogle = new RegExp("encrypted\.google\.com").test(location.hostname);

                    var targetURL;
                    // targetURL=safeSearchOffUrl(); if (targetURL) location.href = targetURL;

                    targetURL = location.href;
                    targetURL = !onEncrGoogle ?
                        targetURL.replace(/www\.google\.[\w.]+/i, "encrypted.google.com") :
                        targetURL.replace(/encrypted\.google\.[\w.]+/i, "www.google.com");
                    console.log('Target URL:', targetURL);
                    location.href = targetURL;
                    return targetURL;
                }
            );
        btn_download.style.margin = "20px";
        btn_download.style.border = "20px";

        var cbox_ZIP = createGCheckBox('zipInsteadOfDownload', 'ZIP', function changeZIPBtnText() {
            const checked = q('#zipInsteadOfDownload').checked;
            const downloadBtn = q('#downloadBtn');
            downloadBtn.innerHTML = checked ? (!downloadBtn.classList.contains('genzip-possible') ? 'ZIP' : 'Download&nbsp;ZIP&nbsp;⇓') : 'Download&nbsp;⇓';
        }, false);
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

        const divider = document.createElement('div');
        controlsContainer.appendChild(divider);
        divider.after(btn_dispOgs, cbox_ShowFailedImages, cbox_GIFsOnly, cbox_UseDdgProxy, btn_animated, btn_toggleEncryptedGoogle, downloadPanel);
        sliderConstraintsContainer.after(satCondLabel);
        q('#download-panel').appendChild(createElement(`<div id="progressbar-container"></div>`));
    } catch (r) {
        if(onGoogle) {
            console.error(r);
        }
    }
}

function imageIsBigEnough(image) {
    if(image.hasAttribute('img-dim')) {
        var [w, h] = image.getAttribute('img-dim').split('x');
        if(w >= slider_minImgSize.value || h >= slider_minImgSize.value) {
            console.log("IMAGE IS BIG ENOUGH!!", image);
            return true;
        } else {
            console.debug("Rejecting image cuz too small lol", image);
        }
    } else {
        console.debug("Image doesn't have the img-dim attribute", image);
    }
    return false;
}

function clearAllEffects() { // remove highlighting of elements
    console.warn('clearAllEffects()');
    for (const effectClassName of ['highlight', 'drop-shadow', 'transparent', 'sg-too-small', 'qualified-dimensions', 'sg-too-small-hide', 'in']) {
        for (const el of qa('.' + effectClassName)) {
            el.classList.remove(effectClassName);
            el.classList.add('out');
        }
    }
}
function clearAllEffectsFromEl(el) { // remove highlighting of elements
    console.warn('clearAllEffectsFromEl()');
    for (const effectClassName of ['highlight', 'drop-shadow', 'transparent', 'sg-too-small', 'qualified-dimensions', 'sg-too-small-hide', 'in']) {
        el.classList.remove(effectClassName);
    }
    el.classList.add('out');
}
function downloadImages() {
    bigImagesCount = 0;
    if(currentDownloadCount >= slider_dlLimit.value) {
        currentDownloadCount = 0;
    } else {
        console.log('currentDownloadCount >= dlNumSlider.value');
    }
    urls = new Set();

    for (const qualifiedImgArgs of getQualifiedGImgs()) {
        const directoryName = document.title;
        download(qualifiedImgArgs.fileURL, qualifiedImgArgs.fileName, directoryName, qualifiedImgArgs.img);
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

function downloadIfBigEnough(w, h, url, imgEl) {
    const dimStr = w + "x" + h;
    console.log(dimStr + "\n" + (/data:image\/.+?base64/.test(url) ? "base64 mainImage data" : url));

    if(currentDownloadCount >= slider_dlLimit.value) {
        console.log("currentDownloadCount >= dlNumSlider.value", currentDownloadCount, slider_dlLimit.value);
        return false;
    }
    if(w > slider_minImgSize.value && h > slider_minImgSize.value) {
        console.log('Image is BIG enough');
        bigImagesCount++;
        var dlName;

        dlName = imgEl.hasAttribute('download-name') ? imgEl.getAttribute('download-name') : getGimgDescription(imgEl);
        console.log('Gimg DLName:', dlName);

        download(url, dlName, document.title, imgEl);
        currentDownloadCount++;
    } else {
        console.log('too small: ', dimStr, imgEl);
    }
}

function observeDocument(callback) {
    callback(document.body);
    const mutationCallback = /**@param {mutation} mutationsList */ function (mutationsList) {
        for (var mutation of mutationsList) {
            if(!mutation.addedNodes.length) continue;
            callback(mutation.target);
        }
    };
    new MutationObserver(mutationCallback).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: false
    });
}
function displayOriginalImage(node) {
    node.querySelectorAll("a[href] > img[src]").forEach(function (img) {
        replaceImgSrc(img, img.parentNode);
        ImageManager.markImageOnLoad(img);
    });
    node.querySelectorAll("a[href] > img").forEach(replaceThumbWithVid);
}


function handleError() {
    // console.log('this.src:'+this.src);
    this.removeEventListener("error", handleError);
    this.setAttribute("loaded", "");
    if(!onGoogle || useDdgProxy()) {
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
    this.classList.add(TOKEN_DDG_FAILED);
}
function tryDdgProxy(imgEl) {
    // If it already failed ddgProxy, don't even try
    if(imgEl.classList.contains(TOKEN_DDG_FAILED)) return;
    // if (imgEl.hasAttribute('loaded')) imgEl.setAttribute('loaded', '');

    imgEl.addEventListener("error", ddgHandleError);

    if(!imgEl.classList.contains("irc_mi")) // Condition to improve performance only for Google.com
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
    imgEl.classList.remove(TOKEN_FAILED);
    ImageManager.markImageOnLoad(imgEl, imgEl.src, function () {
        this.setAttribute('loaded', 'error');
    }, function () {
        this.setAttribute('loaded', 'true-ddgp')
    });
}

function replaceThumbWithVid(vidThumb) {
    const anchor = vidThumb.parentNode;
    const href = anchor.href;
    const w = vidThumb.style.width;
    const h = vidThumb.style.height;
    if(/\.(mov|mp4|avi|webm|flv|wmv)($|\?)/i.test(href)) { // if the link is to a video
        console.log('Replacing video thumbnail with original video:', href, vidThumb);
        vidThumb.src = href;
        const videoOptions = 'controls' + (autoplayReplacedVids ? ' autoplay ' : '') + (loopReplacedVids ? ' loop ' : '');
        const vidEl = anchor.after(createElement(`<video ${videoOptions} name="media" src="${href}"  type="video/webm">`));
        anchor.remove();
        vidEl.style.width = w;
        vidEl.style.height = h;
    }
}
function replaceImgSrc(img, anchor) {
    if(img.classList.contains(TOKEN_DISPLAY)) return;
    if(!/\.(jpg|png|gif)($|\?)/i.test(anchor.href)) return;

    img.addEventListener("error", handleError);
    img.oldSrc = img.src;
    img.src = anchor.href;
    img.anchor = anchor; // TODO: please explain this??
    img.classList.add(TOKEN_DISPLAY);

    const imageObj = new Image();
    imageObj.src = img.src;
    ImageManager._images.add(imageObj);

    if(/\.(gif)($|\?)/i.test(anchor)) {
        img.style.border = "5px #6800FF solid"; //Purple for GIFs
        img.classList.add(TOKEN_GIF);
    }
}

/**puts red borders around the mainImage.
 * @param node
 */
function markNotFound(node) {
    node.classList.add(TOKEN_FAILED);
    if(!onGoogle || !checked_ShowFailedImages()) {
        setVisible(node, false);
    }
    SUCCESSFUL_URLS.delete(node.src);
}
function setVisibilityForFailedImages(visibility) {
    console.log("Set visibility for failed images:", visibility);
    let count = 0;
    let bxs = qa('.rg_bx .rg_l img');
    if(!bxs.length) return;

    bxs.forEach(function (imageBox) {
        if(imageBox.classList.contains(TOKEN_FAILED) || imageBox.classList.contains(TOKEN_DDG_FAILED)) {
            setVisible(imageBox, visibility);
            count++;
        }
    });
    console.log("Set visibility of " + count + " images to: " + visibility);
}
function setVisible(node, visible) {
    if(!node) return;
    if(onGoogle) {
        node = node.parentNode.parentNode;
    }
    if(hideByVisibility) {
        node.style.visibility = visible ? 'visible' : 'hidden';
    } else {
        node.style.display = visible ? 'inline-block' : 'none';
    }
}

function createAndAddCSS() {
    // language=CSS
    addCss(`
.${BUTTONS_CLASS} {
margin: 10px;
}
.tooltip {
    position: relative;
    display: inline-block;
    border-bottom: 1px dotted black;
}

.${TOKEN_DISPLAY}[loaded="false"],
.${TOKEN_DISPLAY}[loaded="error"]{
    border:2px #F00 solid
}` +
        // .${CLASS_TOKEN_DDG_FAILED}:not([loaded="true"]),
        // .${CLASS_TOKEN_FAILED}:not([loaded="true"])
        `
.${TOKEN_DISPLAY}[loaded="false"],
.${TOKEN_DISPLAY}[loaded="error"]{
    -webkit-filter: grayscale(1); /* Webkit */
    filter: gray; /* IE6-9 */
    filter: grayscale(1); /* W3C */

    opacity: 0.5;
    filter: alpha(opacity=50); /* For IE8 and earlier */
}
.${TOKEN_DISPLAY}:not(.irc_mi){
    border: 3px #0F0 solid
}
.${TOKEN_GIF}:not(.irc_mi){
    border: 5px #6800FF solid
}
.${TOKEN_DDG_FAILED}:not(.irc_mi){
    border: 2px #FFA500 solid
}
`);

    /* Overlay CSS for highlighting selected images */
    // language=CSS
    addCss(`
        .highlight, .drop-shadow {
            filter: drop-shadow(8px 8px 10px gray);
        }

        .blur.in {
            -webkit-transition: all 0.1s ease-in;
            /*-webkit-filter: blur(6px);*/
            transform: scale(0.7);
            opacity: 0.3;
        }

        .blur.out:not(.in) {
            -webkit-filter: blur(0px);
            /*filter: blur(0px);*/
            transform: scale(1);
            opacity: 1;
            -webkit-transition: all 0.25s ease-out;
            transition: all 0.25s ease-out;
        }

        .transparent {
            opacity: 0.4;
        }

        .sg-too-small {
        }

        .sg-too-small-hide {
            display: none;
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
