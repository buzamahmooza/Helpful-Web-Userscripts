// ==UserScript==
// @name         Threads & 4chan DL all + bigger images
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Faris Hijazi
// @icon         https://boards.4chan.org/favicon.ico
// @include      /http(s)?:\/\/(archive|thread|4chan|chan|yuki|fireden|desuarchive).+?\/.*/
// @match        http*://desuarchive.org/*
// @match        http*://boards.4chan.org/*
// @match        http*://boards.fireden.net/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\Handy AF functions Faris.user.js
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\download_script.user.js
// @run-at       document-end
// ==/UserScript==

// Settings
if (typeof HIDE_REPLIES === 'undefined') {
    HIDE_REPLIES = true; // hide reply/comment containers that are not the main post
}

window.addEventListener('load', function() {
    // 'use strict';
    if (HIDE_REPLIES) {
        observeDocument(mutation => mutation.querySelectorAll('img').forEach(removeDimensionsFromStyle()));
        document.querySelectorAll('.replyContainer').forEach(container => {
            if (!container.querySelector('img') && !container.querySelector('video')) {
                container.style.display = 'none'
            }
        });
    }
    // if not a thread page, exit
    // https://archive.4plebs.org/pol/thread/123367112/
    // http://boards.4chan.org/d/
    console.log('This is a thread page, AWESOME!');
    injectDownloadButton();
    try {
        displayImages();
        var onYukiLaLayout = document.querySelector('.boardNavDesktop') !== null; // if this thing exists, we are on the yuki.la layout

        // if (onYukiLaLayout)
        {
            Array.from(document.images).forEach(removeDimensionsFromStyle);
        }
        Array.from(document.images).forEach(image => zoomImage(image, 2));
    } catch (exception) {}
}, true);


function removeDimensionsFromStyle() {
    return image => image.style = image.style.width = image.style.height = "";
    // return mainImage => mainImage.style = mainImage.style.replace(/(height|width):.*?;/gi, '');
}

function observeDocument(callback) {
    callback(document);
    new MutationObserver(function(mutations) {
        for (let mutation of mutations) {
            if (!mutation.addedNodes.length) continue;
            callback(mutation.target);
        }
    }).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });
}

function injectDownloadButton() {
    var downloadButton = createElement('<a href="#" style="display : ; font-size : 12pt">Download All Media! ↓</a>');
    downloadButton.onclick = downloadMedia;
    downloadButton.addEventListener("click", downloadMedia);

    const dlButtonContainerEl = document.querySelector('.letters' + ', ' + 'body > div.desktop');
    var div = document.createElement('div');
    div.classList.add('letters');
    div.appendChild(downloadButton);
    dlButtonContainerEl.after(div);
}

function zoomImage(image, amt) {
    if (image.initialHeight == null) {
        /* avoid accumulating integer-rounding error */
        image.initialHeight = image.height;
        image.initialWidth = image.width;
        image.scalingFactor = 1;
    }
    image.scalingFactor *= amt;
    image.width = image.scalingFactor * image.initialWidth;
    image.height = image.scalingFactor * image.initialHeight;
}

function downloadMedia() {
    console.log('downloadMedia');
    var dlBtns = document.querySelectorAll(
        'a > .icon-download-alt' + ',' // for desuarchive.org
        +
        '.post_file_controls a[download][href].btnr.parent' //
    );
    const imageLinks = document.querySelectorAll(
        'div.fileText a[href]' + ',' // for yuki.la
        +
        '.thread_image_link');

    const b = confirm('Would you like to download all media on this page?\n' + imageLinks.length + ' elements found.');
    if (b)
        if (typeof download !== 'undefined') {
            imageLinks.forEach(function(link) {
                download(link.href, link.getAttribute("download") ? link.getAttribute("download") : link.href, document.title.replace(/\//, ""), link);
            });
        } else if (dlBtns && dlBtns.length > 0) {
        dlBtns.forEach(elt => elt.click());
    }
}


/* yuki.la media panel HTML:*/
/*
<div className="postContainer replyContainer" id="pc8701523"><div className="sideArrows" id="sa8701523">&gt;&gt;</div><div id="p8701523" className="post reply"><div className="postInfoM mobile" id="pim8701523"><span className="nameBlock"><span className="name">Anonymous</span><br></span><span className="dateTime postNum" data-utc="1465431535">06/08/16(Wed)20:18:55 <a href="#p8701523" title="Link to this post">No.</a><a href="javascript:quote('8701523');" title="Reply to this post">8701523</a></span></div><div className="postInfo desktop" id="pi8701523"><input type="checkbox" name="8701523" value="delete"> <span className="nameBlock"><span className="name">Anonymous</span> </span> <span className="dateTime" data-utc="1465431535">06/09/16(Thu)03:18:55</span> <span className="postNum desktop"><a href="#p8701523" title="Link to this post">No.</a><a href="javascript:quote('8701523');" title="Reply to this post">8701523</a></span><a href="#" className="postMenuBtn" title="Post menu" data-cmd="post-menu">▶</a></div><div className="file" id="f8701523"><div className="fileText" id="fT8701523">File: <a href="//ii.yuki.la/2/05/82a288984ed7d77e499febf8c4cc4101de203162c2cd19a481a6f5debe87a052.gif" target="_blank">44614639_ugoira600x600.gif</a> (566 KB, 450x450)</div><a className="fileThumb display-original-mainImage display-original-mainImage-gif" href="//ii.yuki.la/2/05/82a288984ed7d77e499febf8c4cc4101de203162c2cd19a481a6f5debe87a052.gif" target="_blank"><img src="https://ii.yuki.la/2/05/82a288984ed7d77e499febf8c4cc4101de203162c2cd19a481a6f5debe87a052.gif" alt="566 KB" data-md5="G/Ujz+bQ9hV32P6MQjQttg==" style="height: 125px; width: 125px; border: 5px solid rgb(104, 0, 255);" img-w="125" img-h="125" img-dim="125x125"><div data-tip="" data-tip-cb="mShowFull" className="mFileInfo mobile">566 KB GIF</div></a></div><blockquote className="postMessage" id="m8701523">Freshly taken from pixiv</blockquote></div></div>
*/
/*Things you could use to get the source:
    selector: document.querySelector('a.fileThumb').href;

    */
// Array.from(document.querySelectorAll('div.fileText a[href]')).map(x => x.href);