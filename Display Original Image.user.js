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

//[ ]       TODO: Make a function to detect images and marks them for replacement (adds to their ATTRIBUTES).
//[ ]       TODO: Make another function called by the mutation ovserver incharge of dealing with them.
//[ ]       TODO: Instead of replacing images on google, just clone it and then replace it, that way we have the old pic while the new one is loading.
//[x]       Replace the "Remove failed images" button to a checkbox, also put some text like "(n)" {n being the number of images that failed to show up}.
//[x]       Replace the "Show originals" button to a checkbox, and also add a "Use DDG proxy" checkbox.
//[ ]       TODO: (low priority) Add tooltips to the checkboxes with descriptions and include the keyboard shortcuts.
//[x][ ]    TODO: Make a "Min Image size" slider that will hide images with dimensions smaller than the slider value.
//[x]       Get to the bottom of: why this script stops some websites from working.
//[ ]       TODO: Merge/combine the 3 google mainImage scripts to make this script work on Google images.

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
    cbox_UseDdgProxy;
unsafeWindow.displayImages = displayImages;
unsafeWindow.zipImages = zipImages;
var zip = new JSZip();
unsafeWindow.zip = zip;
unsafeWindow.replaceImgSrc = replaceImgSrc;
unsafeWindow.genZip = function (zipName) {
    zip.generateAsync({type: "blob"}).then(function (content) {
            zipName = zipName || document.title;
            saveAs(content, zipName + ".zip");
        }
    );
};

// use ddg proxy upon failure to show original?
const useDdgProxy = () => document.getElementById('useDdgProxyBox').checked,
    gifsOnly = () => document.getElementById('GIFsOnlyBox').checked,
    showFailedImages = () => document.getElementById('showFailedImagesBox').checked,
    SUCCESSFUL_URLS = new Set();
var progressBar;
var urls = new Set();
const onGoogle = /google\.com/.test(location.hostname);

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
/* "border-bottom: 1px dotted black;" is for if you want dots under the hover-able text */


if (onGoogle) {
    waitForElement('#hdtb-msb', injectGoogleButtons);
}
window.onkeyup = function (e) {
    const key = e.keyCode ? e.keyCode : e.which;

    if (!targetIsInput(e)) {
        switch (key) {
            case 79: // 'O' key
                if (e.shiftKey)
                    displayImages();
                break;
        }
        if (onGoogle)
            switch (key) {
                case 65: // 'A' key
                    if (e.altKey)
                        q('#AnimatedBtn').click();
                    break;
                case 68: // 'D' key
                    if (e.shiftKey)
                        q('#downloadBtn').click();
                    break;
                case 72: // H
                    if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                        if (targetIsInput(e)) break;
                        document.getElementById('showFailedImagesBox').click();
                    }
                    break;
            }
    }
};
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
            imgEl.setAttribute("loaded", "");
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
        if (this.classList.contains(TOKEN_DISPLAY)) {
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

q = (selector) => document.querySelector(selector);
qa = (selector) => document.querySelectorAll(selector);

function displayImages() {
    log("Displaying originals\nOriginal Images Displayed:\n" + Array.from(SUCCESSFUL_URLS));
    observeDocument(displayOriginalImage);
    qa('iframe').forEach(iframe =>
        iframe.querySelectorAll("a[href]>img[src]").forEach(img =>
            replaceImgSrc(img, img.parentNode)
        )
    );
}

function injectGoogleButtons() {
    try {
        //Injects buttons to google.com
        let controlsContainer = createElement(`<div id="${controlsContainerId}"></div>`);
        /*document.getElementById('abar_button_opt').parentNode*/ //The "Settings" button in the google images page
        let googleButtonsContainer = document.querySelector('#hdtb-msb');
        googleButtonsContainer.appendChild(controlsContainer);

        // var linkAnimated = createElement('<a style="display:" class="hdtb-tl" href="#" onclick="alert("finally"); document.getElementById("itp_animated").childNodes[0].click();">Animated</a>');
        const checkedByDefault = (HIDE_FAILED_IMAGES_ON_LOAD ? ' checked ="checked" ' : '');
        cbox_ShowFailedImages = createElement(`<strong><input id="showFailedImagesBox" type="checkbox" ${checkedByDefault}>Show&nbsp;failed&nbsp;images</strong>`);
        cbox_ShowFailedImages.addEventListener("click", () => {
            document.getElementById("showFailedImagesBox").click();
        });
        cbox_ShowFailedImages.addEventListener('change', function () {
            const checked = document.getElementById("showFailedImagesBox").checked;
            setVisibilityForFailedImages(checked);
            GM_setValue("HIDE_FAILED_IMAGES_ON_LOAD", showFailedImages(checked));
        });

        cbox_GIFsOnly = createElement('<strong><input id="GIFsOnlyBox" type="checkbox" >GIFs&nbsp;only</strong>');
        cbox_GIFsOnly.addEventListener("click", () => document.getElementById("GIFsOnlyBox").click());
        cbox_GIFsOnly.addEventListener('change', function () {
            const checked = document.getElementById("GIFsOnlyBox").checked;
            let nongifs = qa(`.${TOKEN_DISPLAY}:not(.${TOKEN_GIF})`);

            nongifs.forEach(nongif => setVisible(nongif, checked));
        });

        cbox_UseDdgProxy = createElement('<strong><input type="checkbox" id="useDdgProxyBox" checked="checked">Try&nbsp;DDG_P</strong>');
        cbox_UseDdgProxy.addEventListener("click", () => document.getElementById("useDdgProxyBox").click());

        slider_minImgSize = createElement('<input id="minImgSizeSlider" type="range" min="0" max="3000" value="200">');
        var minImgSliderValue = createElement(`<strong id="minImgSizeSliderValue">${slider_minImgSize.value}</strong>`);
        slider_minImgSize.oninput = function () {
            minImgSliderValue.innerHTML = this.value
        };

        slider_dlLimit = createElement(`<input id="dlNumSlider" type="range" min="1" max="${1000}" value="20">`);
        var dlNumSliderValue = createElement(`<strong id="dlNumSliderValue">${slider_dlLimit.value}</strong>`);
        slider_dlLimit.oninput = function () {
            dlNumSliderValue.innerHTML = this.value
        };

        // buttons
        const createGBarButton = (id, innerText) =>
            createElement(`<button id="${id}" style="display:" class="${BUTTONS_CLASS} sbtn hdtb-tl">${innerText}</button>`);
        var btn_dispOgs = createGBarButton(`dispOgsBtn`, `Display&nbsp;originals`),
            btn_animated = createGBarButton(`AnimatedBtn`, `Animated`),
            btn_download = createGBarButton(`downloadBtn`, `Download&nbsp;⇓`),
            btn_preload = createGBarButton(`preloadBtn`, `Preload&nbsp;images&nbsp;↻`)
        ;

        btn_dispOgs.onclick = displayImages;
        btn_animated.onclick = function () {
            document.getElementById('itp_animated').childNodes[0].click();
        };

        const zipInsteadOfDownload = false;
        btn_download.onclick = zipInsteadOfDownload ? zipImages : downloadImages;

        btn_preload.onclick = function () {
            const imgLinks = Array.from(qa('a.rg_l[href]'));
            console.log('imgLinks:', imgLinks);

            imgLinks.forEach(a => {
                let img = a.querySelector('img'),
                    dlName = clearGibberish(getGimgDescription(img));

                createAndAddAttribute(img, 'download-name', dlName);
                img.alt = dlName;
                ImageManager.markImageOnLoad(img, a.href);
                console.log('Preloading image:', `"${dlName}"`, !isBase64ImageData(img.src) ? img.src : "Base64ImageData");
            });
        };

        var downloadPanel = createElement(
            '<div id="download-panel"></div>'
            /*'<form action="/action_page.php">'+
            	'First name:<br>'+
            	'<input type="text" name="firstname" value="Mickey"><br>'+
            	'Last name:<br>'+
            	'<input type="text" name="lastname" value="Mouse"><br><br>'+
            	'<input type="submit" value="Submit">'+
            	'<input type="reset">'+
            '</form>'*/
        );
        // Appending the buttons
        for (const el of [btn_download, btn_preload, slider_minImgSize, minImgSliderValue, slider_dlLimit, dlNumSliderValue]) {
            downloadPanel.appendChild(el);
        }

        // don't use this function, BAD // var dlCondition = function (element) {return (element.hasAttribute('img-w') && element.getAttribute('img-w') > minImgSizeSlider.value);};

        const divider = document.createElement('div');
        controlsContainer.appendChild(divider);
        divider.after(btn_dispOgs, cbox_ShowFailedImages, cbox_GIFsOnly, cbox_UseDdgProxy, btn_animated, downloadPanel);

    } catch (r) {
        if (onGoogle)
            console.error(r);
    }
}

function imageIsBigEnough(image) {
    if (image.hasAttribute('img-dim')) {
        var [w, h] = image.getAttribute('img-dim').split('x');
        if (w > slider_minImgSize.value && h > slider_minImgSize.value) {
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

function zipImages() {
    zipCurrent = 0;
    const userDownloadLimit = slider_dlLimit.value;
    zipTotal = userDownloadLimit; //ogs.length;
    zip = zip || new JSZip();

    const ogs = qa(`.rg_ic.rg_i`)
        // qa(`.${TOKEN_DISPLAY}[loaded="true"], .img-big`)
    ;
    progressBar = new ProgressBar.Line('#download-panel', {easing: 'easeInOut'});

    progressBar.animate(0);

    console.debug('Original images to be downloaded:', Array.from(ogs).map(og => og.src || og.href));

    for (const og of ogs) {
        try {
            let image = og.tagName == 'IMG' ? og :
                og.querySelector('img[src]');

            if (true || imageIsBigEnough(image)) {
                const fileUrl = extractImgData(image, 'ou');//image.src;
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

                        if (zipCurrent >= zipTotal++) {
                            console.log("Generating ZIP...");
                            zip.generateAsync({type: "blob"}).then(function (content) {
                                    zipName = zipName || document.title;
                                    saveAs(content, zipName + ".zip");
                                }
                            );
                        }
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
}

function downloadImages() {
    bigImagesCount = 0;
    // currentDownloadCount = 0;
    if (currentDownloadCount >= slider_dlLimit.value) {
        currentDownloadCount = 0;
    } else {
        console.log('currentDownloadCount >= dlNumSlider.value');
    }
    urls = new Set();
    const ogs = qa(`.${TOKEN_DISPLAY}:not(${TOKEN_FAILED})`);

    if (ogs.length > 0) {
        if (true)
            for (const og of ogs) {
                try {
                    let image = og.tagName == 'IMG' ? og :
                        og.querySelector('img[src]');
                    /*if (image.hasAttribute('img-dim')) {
                        const imgDim = image.getAttribute('img-dim').split('x');
                        downloadIfBigEnough(imgDim[0], imgDim[1], image.src, image);
                    }
                    else*/
                    onLoadDim(image.src, downloadIfBigEnough, image);
                } catch (e) {
                    console.warn(e);
                }
            }
        else
            downloadBatch(Array.from(ogs).map(og => og.tagName == 'IMG' ? og : og.querySelector('img[src]')), q('#dlNumSliderValue').innerText);

    } else { // No original images found
        const response = confirm('No original images found.' +
            '\nWould you like to try using the mainImage links?' +
            '\n(DDG proxy will not be helpful here).');

        if (response) {
            qa('a[href]>img[src]').forEach(function (e, i) {
                if (i > slider_dlLimit.value) {
                    console.log('Reached download limit (limitied by user):', i);
                    return;
                }
                let newUrl = e.parentNode.href;
                onLoadDim(newUrl, downloadIfBigEnough, e);
            });
        } else {
            console.log('Download canceled by user.');
            return;
        }
        if (confirm(`Download ${urls.size} images?`)) {
            console.log('Passing urls to downloadBatch', urls);
            downloadBatch(urls, q('#dlNumSliderValue').innerText);
        }
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

    if (currentDownloadCount >= slider_dlLimit.value) {
        console.log("currentDownloadCount >= dlNumSlider.value", currentDownloadCount, slider_dlLimit.value);
        return false;
    }
    if (w > slider_minImgSize.value && h > slider_minImgSize.value) {
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
            if (!mutation.addedNodes.length) continue;
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

function replaceThumbWithVid(vidThumb) {
    const anchor = vidThumb.parentNode;
    const href = anchor.href;
    const w = vidThumb.style.width;
    const h = vidThumb.style.height;
    if (/\.(mov|mp4|avi|webm|flv|wmv)($|\?)/i.test(href)) { // if the link is to a video
        console.log('Replacing video thumbnail with original video:', href, vidThumb);
        vidThumb.src = href;
        const videoOptions = 'controls' + (autoplayReplacedVids ? ' autoplay ' : '') + (loopReplacedVids ? ' loop ' : '');
        const vidEl = anchor.after(createElement(`<video ${videoOptions} name="media" src="${href}"  type="video/webm">`));
        anchor.remove();
        vidEl.style.width = w;
        vidEl.style.height = h;
    }
}

function handleError() {
    // console.log('this.src:'+this.src);
    this.removeEventListener("error", handleError);
    this.setAttribute("loaded", "");
    if (!onGoogle || useDdgProxy()) {
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
    if (imgEl.classList.contains(TOKEN_DDG_FAILED)) return;
    if (imgEl.hasAttribute('loaded'))
        imgEl.setAttribute('loaded', '');

    imgEl.addEventListener("error", ddgHandleError);

    if (!imgEl.classList.contains("irc_mi")) // Condition to improve performance only for Google.com
        imgEl.style.border = "2px" + "#FFA500" + " solid"; //Make borders ORANGE

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
        this.setAttribute('loaded', 'ddgp')
    });
}


function replaceImgSrc(img, anchor) {
    if (img.classList.contains(TOKEN_DISPLAY)) return;
    if (!/\.(jpg|png|gif)($|\?)/i.test(anchor.href)) return;

    img.addEventListener("error", handleError);
    try {
        img.oldSrc = img.src;
        img.src = anchor.href;
    } catch (e) {
        if (logAnnoyingNetworkErrors) console.error(e);
    }
    img.anchor = anchor; // TODO: please explain this??
    img.classList.add(TOKEN_DISPLAY);

    if (/\.(gif)($|\?)/i.test(anchor)) {
        img.style.border = "5px #6800FF solid"; //Purple for GIFs
        img.classList.add(TOKEN_GIF);
    }
}

/**puts red borders around the mainImage.
 * @param node
 */
function markNotFound(node) {
    node.classList.add(TOKEN_FAILED);
    if (!showFailedImages()) {
        setVisible(node, false);
    }
    SUCCESSFUL_URLS.delete(node.src);
}

function setVisibilityForFailedImages(visibility) {
    console.log("Set visibility for failed images.");
    let count = 0;
    let bxs = qa('div.rg_bx a img');
    if (!bxs.length) return;

    bxs.forEach(function (imageBox) {
        if (imageBox.classList.contains(TOKEN_FAILED) || imageBox.classList.contains(TOKEN_DDG_FAILED)) {
            setVisible(imageBox, visibility);
            count++;
        }
    });
    console.log("Set visibility of " + count + " images to: " + visibility);
}

function setVisible(node, visible) {
    if (!node) return;
    if (onGoogle)
        node = node.parentNode.parentNode;
    if (hideByVisibility)
        node.style.visibility = visible ? 'visible' : 'hidden';
    else
        node.style.display = visible ? 'inline-block' : 'none';
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
