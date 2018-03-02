//==UserScript==
//@name         Display Original Image
//@version      0.1.4
//@namespace    eight04.blogspot.com
//@description  This script will replace thumbnail with full size image if available.
//@exclude      *kfupm.edu*
//@exclude      *blackboard*
//@exclude      *photos.google*
//@exclude      *youtube.com*
//@exclude      *www.saudirailways.org*
//@exclude      *www.webassign.net*
//@exclude      *imgur*
//@include      http*
//@include      https://www.google.*/search?*imghp
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
//@require      https://github.com/buzamahmooza/Helpful-Web-Userscripts/raw/master/Handy%20AF%20functions%20Faris.user.js
//@require      https://github.com/buzamahmooza/Helpful-Web-Userscripts/raw/master/download_script.user.js
//==/UserScript==

//@require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\download_script.user.js
//@require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\Handy AF functions Faris.user.js
//UserscriptDownloader
//@require      https://gist.github.com/buzamahmooza/73774aa6900fc4281d01c844433b9031/raw/

//[ ] TODO: Make a function to detect images and marks them for replacement (adds to their ATTRIBUTES).
//[ ] TODO: Make another function called by the mutation ovserver incharge of dealing with them.
//[ ] TODO: Instead of replacing images on google, just clone it and then replace it, that way we have the old pic while the new one is loading.
//[x] TODO: Replace the "Remove failed images" button to a checkbox, also put some text like "(n)" {n being the number of images that failed to show up}.
//[x] TODO: Replace the "Show originals" button to a checkbox, and also add a "Use DDG proxy" checkbox.
//[ ] TODO: (low priority) Add tooltips to the checkboxes with descriptions and include the keyboard shortcuts.
//[ ] TODO: Make a "Min Image size" slider that will hide images with dimensions smaller than the slider value.
//[x] TODO: Get to the bottom of: why this script stops some websites from working.
//[ ] TODO: Merge/combine the 3 google image scripts to make this script work on Google images.

// 'use-strict';
const HIDE_FAILED_IMAGES_ON_LOAD = GM_getValue("HIDE_FAILED_IMAGES_ON_LOAD", false);
let failedImagesCount = 0;
let originalImagesCount = 0;
let bigEnoughImagesCount = 0;
//Setup:
//var att = document.createAttribute("image-status"); // Create an attribute
//att.value = "democlass"; // Set the value of the attribute, has one of 3 values: 'replace', 'hide', ''
//node.setAttributeNode(att);                           // Add the class attribute to <h1>

const CLASS_TOKEN_FAILED =      "display-original-image-failed";
const CLASS_TOKEN_DDG_FAILED =  "display-original-image-ddg-failed";
const CLASS_TOKEN_GIF =         "display-original-image-gif";
const CLASS_TOKEN_DISPLAY =     "display-original-image";

let dlNumSlider;
let minImgSizeSlider;
let showFailedImagesBox;
let gifsOnlyBox;
var useDdgProxyBox;
unsafeWindow.displayImages = displayImages;

// use ddg proxy upon failure to show original?
const useDdgProxy = function () {
    return document.getElementById('useDdgProxy').checked;
};
const gifsOnly = function () {
    return document.getElementById('GIFsOnlyBox').checked;
};
const showFailedImages = function () {
    return document.getElementById('showFailedImagesBox').checked;
};
const SUCCESSFUL_URLS = new Set();
const cssBlock = document.createElement('style');

cssBlock.innerText = '' +
    '.tooltip {' +
    'position: relative;' +
    'display: inline-block;' +
    'border-bottom: 1px dotted black;' + /* If you want dots under the hover-able text */
    '}'
;
document.head.appendChild(cssBlock);
document.addEventListener('keydown', function (e) {
    const ignores = document.getElementsByTagName('input');
    const target = e.target;
    for (let ignore of ignores)
        if (target === ignore || ignore.contains(target)) {
            // console.log('The target recieving the keycode is of type "input", so it will not recieve your keystroke', target);
            return;
        }
    if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        switch (e.keyCode) {
            case 72: // H
                document.getElementById('showFailedImagesBox').click();
                break;
        }
    }
});

if (/google.com/.test(location.href))
    injectGoogleButtons();
window.onkeyup = function (e) {
    const key = e.keyCode ? e.keyCode : e.which;
    switch (key) {
        case 65: // 'a' key
            if (e.altKey) displayImages();
            break;
    }
};


function displayImages() {
    log("Displaying originals\nOriginal Images Displayed:\n" + Array.from(SUCCESSFUL_URLS));
    observeDocument(displayOriginalImage);
    document.querySelectorAll('iframe').forEach(function (iframe) {
        iframe.querySelectorAll("a[href]>img[src]").forEach(function (elt, i, array) {
            replace(elt, elt.parentNode);
        });
    });
}

function injectGoogleButtons() {
    try {
        //Injects buttons to google.com
        let settingsBtn = document.getElementById('abar_button_opt'); //The "Settings" button in the google images page
        // console.log('inserting the "hide failed images" button');

        // var linkAnimated = createElement('<a style="display:" class="hdtb-tl" href="#" onclick="alert("finally"); document.getElementById("itp_animated").childNodes[0].click();">Animated</a>');
        showFailedImagesBox = createElement('<strong><input id="showFailedImagesBox" type="checkbox" ' + (HIDE_FAILED_IMAGES_ON_LOAD ? ' checked ="checked" ' : '') + '>Show failed images</strong>');
        showFailedImagesBox.addEventListener("click", function (e) {
            document.getElementById("showFailedImagesBox").click();
        });
        showFailedImagesBox.addEventListener('change', function () {
            const checked = document.getElementById("showFailedImagesBox").checked;
            setVisibilityForFailedImages(checked);
            GM_setValue("HIDE_FAILED_IMAGES_ON_LOAD", showFailedImages(checked));
        });

        gifsOnlyBox = createElement('<strong><input id="GIFsOnlyBox" type="checkbox" >GIFs Only</strong>');
        gifsOnlyBox.addEventListener("click", function (e) {
            document.getElementById("GIFsOnlyBox").click();
        });
        gifsOnlyBox.addEventListener('change', function () {
            // updateAllImages();
            const checked = document.getElementById("GIFsOnlyBox").checked;
            let nongifs = document.querySelectorAll('.' + CLASS_TOKEN_DISPLAY + ':not(.' + CLASS_TOKEN_GIF + ')');
            let imgs = document.querySelectorAll('.' + CLASS_TOKEN_DISPLAY);

            nongifs.forEach(function (elt, i, array) {
                setVisible(elt, checked);
            });
        });

        useDdgProxyBox = createElement('<strong><input id="useDdgProxy" type="checkbox" id="useDdgProxyBox" checked="checked">Try DDG_P</strong>');
        useDdgProxyBox.addEventListener("click", function (e) {
            document.getElementById("useDdgProxyBox").click();
        });

        minImgSizeSlider = createElement('<input id="minImgSizeSlider" type="range" min="0" max="3000" value="200">');
        var minImgSliderValue = createElement('<strong id="minImgSizeSliderValue">' + minImgSizeSlider.value + '</strong>');
        minImgSizeSlider.oninput = function () {
            minImgSliderValue.innerText = this.value;
        };

        dlNumSlider = createElement('<input id="dlNumSlider" type="range" min="1" max="' + 600 + '" value="20">');
        var dlNumSliderValue = createElement('<strong id="dlNumSliderValue">' + dlNumSlider.value + '</strong>');
        dlNumSlider.oninput = function () {
            dlNumSliderValue.innerText = this.value;
        };
        // buttons
        var dispOgsBtn = createElement('<button style="display:" class="sbtn hdtb-tl">Display Originals</button>');
        var animatedBtn = createElement('<button style="display:" class="sbtn hdtb-tl">Animated</button>');
        var downloadBtn = createElement('<button style="display:" class="sbtn? hdtb-tl">Download</button>');
        dispOgsBtn.onclick = displayImages;
        animatedBtn.onclick = function () {
            document.getElementById('itp_animated').childNodes[0].click();
        };
        downloadBtn.onclick = function () {
            bigEnoughImagesCount = 0;
            const urls = new Set();
            const ogs = document.querySelectorAll('.'+CLASS_TOKEN_DISPLAY+':not('+CLASS_TOKEN_FAILED+')');
            ogs.forEach(function (e, i, array) {
                if (i > dlNumSlider.value) {
                    console.log('Reached download limit (limitied by user):', i);
                    return;
                }
                let image = e.childNodes[0];
                let newUrl = image.src;
                onLoadDim(newUrl, downloadIfBigEnough, image);
            });

            if (ogs.length < 1) {
                const response = confirm('No original images found' +
                    '\nWould you like to try using the image links?' +
                    '\n(DDG proxy will not be helpful here).');

                if (response) {
                    document.querySelectorAll('a[href]>img[src]').forEach(function (e, i, array) {
                        if (i > dlNumSlider.value) {
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
                if (confirm('Download ' + urls.length + ' images?')) {
                    console.log('Passing urls to downloadBatch', urls);
                    downloadBatch(urls, dlNumSliderValue.innerHTML);
                }
            }
        };

        var downloadPanel = createElement(
            '<div></div>'
            // '<form action="/action_page.php">'+
            // 	'First name:<br>'+
            // 	'<input type="text" name="firstname" value="Mickey"><br>'+
            // 	'Last name:<br>'+
            // 	'<input type="text" name="lastname" value="Mouse"><br><br>'+
            // 	'<input type="submit" value="Submit">'+
            // 	'<input type="reset">'+
            // '</form>'
        );
        downloadPanel.appendChild(downloadBtn);
        downloadPanel.appendChild(minImgSizeSlider);
        downloadPanel.appendChild(minImgSliderValue);
        downloadPanel.appendChild(dlNumSlider);
        downloadPanel.appendChild(dlNumSliderValue);

        // don't use this function, BAD
        var dlCondition = function (element) {
            return (element.hasAttribute('img-w') && element.getAttribute('img-w') > minImgSizeSlider.value);
        };
        try {
            settingsBtn.nextSibling.after(dispOgsBtn, showFailedImagesBox, gifsOnlyBox, useDdgProxyBox, animatedBtn, downloadPanel);
        } catch (exception) {
        }

    } catch (r) {
        if (/google.com/.test(location.href))
            console.error(r);
    }
}

//auto display-originals if enough big images
// var bigImgs = document.getElementsByTagName('.img-big');
// if (bigImgs.length < 7) {
//     console.log("Too little big images, i want to stop displaying original images");
// } else {
//     console.log('We have enough big images :)\nDisplaying original images automatically...');
//     displayOriginalImage();
// }

function downloadIfBigEnough(w, h, url, imgEl) {
    console.log(w + "x" + h + "\n" + (/data:image\/.*?base64/.test(url) ? "base64 image data" : url));
    if (w > minImgSizeSlider.value && h > minImgSizeSlider.value) {
        console.log('Image is BIG enough');
        bigEnoughImagesCount++;

        download(url, getGimgDescription(imgEl), encodeURIComponent(document.title), imgEl);
    }
}

function observeDocument(callback) {
    callback(document.body);
    new MutationObserver(function (mutations) {
        for (let i = 0; i < mutations.length; i++) {
            if (!mutations[i].addedNodes.length) continue;
            updateImage(mutations[i].target);
            callback(mutations[i].target);
        }
    }).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: false
    });
}

function displayOriginalImage(node) {
    node.querySelectorAll("a[href]>img[src]").forEach(function (elt, i, array) {
        replace(elt, elt.parentNode);
    });
}

function handleError() {
    // console.log('this.src:'+this.src);
    this.removeEventListener("error", handleError);
    if (useDdgProxy)
        tryDdgProxy(this); else {
        markNotFound(this);
        this.src = this.oldSrc;
    }
}

function ddgHandleError() {
    this.src = this.oldSrc;
    markNotFound(this);
    this.removeEventListener("error", ddgHandleError);
}

function tryDdgProxy(node) {
    // If it already failed ddgProxy, don't even try
    if (node.classList.contains(CLASS_TOKEN_DDG_FAILED)) return;
    node.addEventListener("error", ddgHandleError);

    if (!node.classList.contains("irc_mi")) // Condition to improve performance only for Google.com
        node.style.border = "2px #FFA500 solid"; //Make borders ORANGE

    let prxy = ddgProxy(node.src);
    let anchor = node.parentNode;
    node.anchor.href = prxy;
    // console.log('node.anchor: '+node.anchor);
    replace(node, anchor);
    node.src = prxy;

    // replace(node, createElement('<a anchor='+prxy+'></a>'));
    node.classList.remove(CLASS_TOKEN_FAILED);
    node.classList.add(CLASS_TOKEN_DDG_FAILED);
}

function updateImage(node) {
    return;
    if (!node.classList.contains(CLASS_TOKEN_DISPLAY)) return; // if not one of our images, return

    // console.log('gifsonly: '+gifsOnly);
    // console.log('hidefailed: '+showFailedImages);

    if (!node.classList.contains(CLASS_TOKEN_GIF)) { //if non-gif, apply changes
        setVisible(node, !gifsOnly);
        console.log('setting nongif visibility to: ' + gifsOnly);
    }
    if (gifsOnly) return; //no further discussion

    // setVisibilityForFailedImages(showFailedImages);
    if (node.classList.contains(CLASS_TOKEN_FAILED)) { //if "failed"
        setVisible(node, !showFailedImages);
    }
}

function updateAllImages() {
    var bxs = document.querySelectorAll('div.rg_bx a img');
    if (!bxs) return;
    for (var i = 0; i < bxs.length; i++) {
        if (bxs[i].classList.contains(CLASS_TOKEN_DISPLAY)) {
            updateImage(bxs[i]);
        }
    }
}

function replace(img, anchor) {
    if (anchor.classList.contains(CLASS_TOKEN_DISPLAY)) return;
    if (!/\.(jpg|png|gif)($|\?)/i.test(anchor.href)) return;

    img.addEventListener("error", handleError);
    img.oldSrc = img.src;
    img.src = anchor.href;
    img.style.border = "3px #0F0 solid"; //Green
    img.anchor = anchor; // TODO: please explain this??
    anchor.classList.add(CLASS_TOKEN_DISPLAY);
    SUCCESSFUL_URLS.add(img.src);

    if (/\.(gif)($|\?)/i.test(anchor)) {
        img.style.border = "5px #6800FF solid"; //Purple for GIFs
        anchor.classList.add(CLASS_TOKEN_GIF);
    }
}

/**puts red borders around the image.
 *
 * @param node
 */
function markNotFound(node) {
    if (!node.classList.contains("irc_mi")) // Condition to improve performance only for Google.com
        node.style.border = "2px #F00 solid"; //Make borders RED
    node.classList.add(CLASS_TOKEN_FAILED);
    if (!showFailedImages()) {
        setVisible(node, false);
    }
    SUCCESSFUL_URLS.delete(node.src);
}

function setVisibilityForFailedImages(visibility) {
    console.log("Set visibility for failed images.");
    let count = 0;
    let bxs = document.querySelectorAll('div.rg_bx a img');
    if (!bxs) return;

    bxs.forEach(function (imageBox) {
        if (imageBox.classList.contains(CLASS_TOKEN_FAILED) || imageBox.classList.contains(CLASS_TOKEN_DDG_FAILED)) {
            setVisible(imageBox, visibility);
            count++;
        }
    });
    console.log("Set visibility of " + count + " images to: " + visibility);
}

function setVisible(node, visible) {
    if (!node) return;
    node.style.visibility = visible ? 'visible' : 'hidden';
//	node.style.display = visible ? 'block' : 'none';
}

/*
 data node text:

		 {
		 "clt":"n",
		 "id":"ZR4YfY_inahuKM:",
		 "isu":"porngifs.cc",
		 "itg":0,
		 "ity":"gif",
		 "oh":322,
Source	 "ou":"http://78.media.tumblr.com/b76a1e49bf361a0648fc0cdfa382bbc5/tumblr_oxwf74trde1seon5zo1_500.gif",
		 "ow":492,
Title	 "pt":"Porn Gifs with Porn Stars | Threesome Porn Gifs - Porn Gifs with ...",
		 "rid":"nyyV1PqBnBltYM",
		 "rmt":0,
		 "rt":0,
Site	 "ru":"http://porngifs.cc/threesome-porn-gifs/",
		 "s":"Photo",
Title2	 "st":"Porn Gifs with Porn Stars",
		 "th":182,
		 "tu":"https://encrypted-tbn0.gstatic.com/images?q\u003dtbn:ANd9GcT5UKBvZXI9vUhDzBA7-8tDKRB2KAYUbGH_VEMMUc3bG1dvZTeyWg",
		 "tw":278
		 }


 display panel:
 	Title:			(Porn Gifs with Porn Stars | Threesome Porn Gifs - Porn Gifs with ...){http://porngifs.cc/threesome-porn-gifs/}
	Domainlink:		Porn Gifs with Porn Stars (492 × 322) Search by image
	Caption:		Photo
 */
