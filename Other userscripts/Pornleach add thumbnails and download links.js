// ==UserScript==
// @name         pnleech
// @namespace    http://tampermonkey.net/
// @author       Faris Hijazi
// @description
// @version      0.1
// @icon	 https://www.google.com/s2/favicons?domain=https://pornleech-is.prox.space/
// @match        *pornleech*
// @include      *pornleech*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @grant        window.close
// @grant        window.focus
// @run-at       document-end
// @connect      *
// ==/UserScript==
// @require      https://code.jquery.com/jquery-3.2.1.slim.min.js
// @require       https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\Handy AF functions Faris.user.js
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\download_script.user.js


/**/
if (typeof unsafeWindow == "undefined") unsafeWindow = window;

/**abbreviation for querySelectorAll()*/
function qa(selector) {
    return document.querySelectorAll(selector);
}
/**abbreviation for querySelector()*/
function q(selector) {
    return document.querySelector(selector);
}


const GoogleImagesSearchURL = "https://www.google.com/search?&hl=en&tbm=isch&q=";
var cssBlock = document.createElement('style');
// language=CSS
cssBlock.innerHTML = `
    img.thumbnail {
        max-height: 200px;
        max-width: 200px;
        display: -webkit-box;
    }

    a.thumbnail-added {
        display: contents;
    }

    .zoom {
        transition: transform .2s; /* Animation */
    }

    .zoom:hover {
        transform: scale(2); /* (150% zoom - Note: if the zoom is too large, it will go outside of the viewport) */
    }

`;
document.getElementsByTagName('head')[0].appendChild(cssBlock);

const tbody = document.querySelector('#mcol > div > div.block-content > div > div > div > form > table > tbody > tr:nth-child(2) > td > table > tbody');

observeDocument(dealWithTorrent);

var dlFrame = document.createElement('iframe');
dlFrame.name = "dlFrame";
document.body.appendChild(dlFrame);

/**
 * if fakeLink is set to true, then a fake link will be used without actually fetching the link, clicking the link will fetch the actual link.
 * this is to minimize requests and prevent from getting blocked
 */
function addDownloadLink(torLink, fakeLink) {
    console.debug(torLink);
    if (torLink.classList.contains('has-download-now')) return;

    try {

        var btn = document.createElement('a');

        btn.onclick = fakeLink ? action : null;
        btn.href = 'JavaScript:void(0);';
        torLink.classList.add('has-download-now');

        var downloadNowImg = document.createElement('img');
        downloadNowImg.src = "images/download.png";
        downloadNowImg.className = "download-now";
        downloadNowImg.alt = "DOWNLOAD NOW";
        btn.appendChild(downloadNowImg);

        torLink.after(btn);

        function action() {
            fetchDoc(torLink.href, function (doc) {
                console.log('fetching url:', torLink.href);
                var a = doc.querySelector('a[href^="download.php?"]');
                var clone = a.cloneNode(true);
                console.log('got download link:', a.href);

                if (fakeLink) {
                    window.open(a.href, "dlFrame");
                    btn.href = a.href;
                    btn.onclick = null;
                }
            });
        }
        if (!fakeLink) {
            action();
        }
    } catch (r) {
        console.error(r);
    }
}
function fetchDoc(url, callback) {
    fetch(url, {
        mode: 'no-cors',
        method: 'get'
    }).then((res) => {
        return res.text();
    }).then((data) => {
        var doc = document.createElement('html');
        doc.innerHTML = data;
        if (callback && typeof callback === 'function') callback(doc);
    });
}

function dealWithTorrent(node) {
    'use strict';
    /*
	how onmouseover looks like:
	return overlib('<img src=torrentimg/1f73d8a1a946d38797fe01e8b2789cc8be26b604.png width=200 border=0>', CENTER);
	*/
    for (const a of node.querySelectorAll('a[onmouseover]')) {
        if (a.classList.contains('thumbnail-added')) continue;
        const onmouseover = a.getAttribute('onmouseover');
        try {
            const match = location.protocol + "//" + location.hostname + '/' + onmouseover.match(/torrentimg\/.+\.[^\s]+/gim);
            if (!!match && match.length) {
                a.classList.add('thumbnail-added');
                console.debug(match);
                const img = document.createElement('img');
                img.src = match;
                a.appendChild(img);
                img.classList.add('thumbnail', 'zoom');

                const searchLink = document.createElement('a');
                searchLink.innerHTML = 'GimgSearch: ' + a.innerText;

                let q = cleanSymbols(a.innerText) //replacing common useless torrent terms
                    // replace dates (numbers with dots between them)
                        .replace(/\s\s+/g, ' ')	// removes double spaces
                        .trim()
                ;
                searchLink.href = (GoogleImagesSearchURL + q);
                console.debug('search url:', searchLink.href);
                searchLink.classList.add('gs');
                searchLink.target = "_blank";
                searchLink.style = `padding:5px 5px;padding: 20px;display: -webkit-box;background-color: #b7b7b73b;margin: 10px;font-family: sans-serif;`;
                a.after(searchLink);

                a.removeAttribute('onmouseover');
            }
        } catch (e) {
            console.warn(e);
        }
    }

}
if (tbody) for (const torLink of tbody.querySelectorAll('tbody > tr:nth-child(1) > td > a[title^="View details:"]:not(.has-download-now)')) {
    addDownloadLink(torLink, true);
}


// example pageURL:
// https://pornleech.torrentzmirror.org/bigwetbutts-aj-applegate-new-bodystocking-butt-brazzers-15-february-2016-480p-new-511700.html
// torrent URL:
// https://pornleech.torrentzmirror.org/download.php?id=a725eae9b318a8479149ebef9a02c051aa03f9e1&f=BigWetButts%20~%20AJ%20Applegate%20NEW%20(Bodystocking%20Butt%20/%20BraZZers%20/%2015%20February%202016)%20480p%20NEW.torrent

function createTorrentButton(torrentPage) {
    var btn = createElement(`<td class="lista" align="center" style="text-align:left;" valign="top">
<a href="download.php?id=a725eae9b318a8479149ebef9a02c051aa03f9e1&amp;f=BigWetButts ~ AJ Applegate NEW (Bodystocking Butt / BraZZers / 15 February 2016) 480p NEW.torrent"></a>

<center>
<a href="download.php?id=a725eae9b318a8479149ebef9a02c051aa03f9e1&amp;f=BigWetButts ~ AJ Applegate NEW (Bodystocking Butt / BraZZers / 15 February 2016) 480p NEW.torrent">
<img src="images/download.png">
</a>
</center>
</td>`);
    // torrentPage
}

function observeDocument(callback) {
    callback(document.body);
    new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
            if (!mutations[i].addedNodes.length) continue;
            callback(mutations[i].target);
        }
    }).observe(document.body, {
        childList: true, subtree: true,
        attributes: false, characterData: false
    });
}


function cleanSymbols(str) {
    return !!str ? removeDoubleSpaces(cleanDates(str).replace(/[-!$%^&*()_+|~=`{}\[\]";'<>?,.\/]|(\s\s+)/gim, ' ')
        .replace(/rarbg|\.com|#|x264|DVDRip|720p|1080p|2160p|MP4|IMAGESET|FuGLi|SD|KLEENEX|BRRip|XviD|MP3|XVID|BluRay|HAAC|WEBRip|DHD|rartv|KTR|YAPG|[^0-9a-zA-z]/gi, " ")).trim() : str;
}

function cleanDates(str) {
    return !!str ? removeDoubleSpaces(str.replace(/\d*\.([^.]+)\.\d*/g, ' ')) : str;
}

function removeDoubleSpaces(str) {
    return !!str ? str.replace(/(\s\s+)/g, " ") : str;
}
