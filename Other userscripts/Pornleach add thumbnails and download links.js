// ==UserScript==
// @name         Pornleach - add thumbnails and download links
// @namespace    http://tampermonkey.net/
// @author       Faris Hijazi
// @description  Adds thumbnails and the torrent download button. Adds mirrors list dropdown
// @version      0.2
// @match        *pornleech*
// @include      *pornleech*
// @include      https://pornleech.mrunlock.icu/
// @include      https://pornleech.nocensor.pro/
// @include      https://pornleech.unlockproject.icu/
// @include      https://pornleech.prox4you.pw/
// @include      https://pornleech.123unblock.xyz/
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @grant        window.close
// @grant        window.focus
// @run-at       document-end
// @require      http://code.jquery.com/jquery-latest.min.js
// @require      https://unpkg.com/infinite-scroll@3.0.5/dist/infinite-scroll.pkgd.min.js
// @icon         data:text/plain;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAsdEVYdENvbW1lbnQAQ3JlYXRlZCBieSBJbWFnZUdlYXIsIEFjY3VTb2Z0IENvcnAu6O63XQAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTAw9HKhAAADBklEQVRIS6WWS2gTURSGi7XYRd2ICxHBnfioG0ERsUlmkpkkLU3tw7bWboqCtAZFUNcibrpSF4KilPpo05nceycWF4JFXAlCW0RdtNRoS2sfeU1ek2SSScZ7p51Q0pY8OnAYZuac/5t7zrlnpqqq4PjsHKopvFfKdaCRM4da3IaivhErmBYbuZaijpscRHasKWMQUgHrmLVoXMokfM0aBDVhhl9WW/ljxQICDv5s2ihI2QZB9bMlACQLGCSAHDbZiGKiHTp2gix0jOxLUmiWiOewBRxC8RWstPL1mQZBIQBiikFQInZ0cztIlOFuEGHil21AqsjCc8VWrD2XaM9rHbAOQbkoA52FwUkKTOcB2G+1kz9aEmC5ExyUTWBuMyRjFLIhO9ehCyxdBoczGKwBsKUpJHmdnr0lAYjTWvPoyYwR+fMQImJEUV+b+wR5LjYCRhcn5wQNJ0oW1x2DDld9ioJeIqDiHJNzikJT/i5QG7GDXh1Oihy2gv6yASRgrvvN/pgZPEyZYFgrpsGjxhnwLGyHGoAUV6YE3+LVsbqKAHrQny5XXZTl+xNm9B13lhqxgXECwB2nRu2wZ1fia82QilvgK5mG3rQJKfncY0DcAp5ULC7e/VgtMeh50vZeTVs8Wr8XGk7dr4XO4dqKIFEWPc3gnCdngmry28oWcRWnRyEFZt33ywb4m0ZPKbj3tbn08ocqPZ7aFkCKnKLBVNmAOI2c+TYkqbm4NUVkBTkMSBuhv2yAaOe6tSG2kXdNrKAGOiBjQr6yATMDQo1Euz/pkJ0AWoooOF02gAR4B0BNhAV3kiY4r5CdvMMKJDMYqgigB/299WFPzAK59Z1Mdq8+ovHoMMFgwOY6sysACU7QwgQWmw1b+St4N/+UKTQftcB7C33cgckHqHL9pUsj5+MMfOFr43tjDHjkbxN6ltvfXQjZUEfMgt4GWTQ+2T1c0Y+C9lZrXa4j+NMp43EMZaOQSDDgdsjmHgyzoO9f6+ihyl99I/L3NVi91M4f174BTdzpEMtfL0f0P707Zc5QFnR4AAAAAElFTkSuQmCC
// ==/UserScript==

// @require      https://code.jquery.com/jquery-3.2.1.slim.min.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require      https://github.com/buzamahmooza/Helpful-Web-Userscripts/raw/master/Handy%20AF%20functions%20Faris.user.js
// @require      https://github.com/buzamahmooza/Helpful-Web-Userscripts/raw/master/download_script.user.js

// [x]: make infinite scrolling


const debugmode = false;
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


mirrors = ["http://pornleech.is", "https://pornleech.mrunlock.icu/", "https://pornleech.nocensor.pro/", "https://pornleech.unlockproject.icu/", "https://pornleech.prox4you.pw/", "https://pornleech.123unblock.xyz/"];

function isPageBlocked() {
    return document.querySelector(`[href^="http://www.internet.gov.sa/resources-ar/block-unblock-request-ar/view?set_language"]`) !== null ||
        document.querySelector('body > table > tbody > tr > td').className !== "logo1";
}

if (isPageBlocked()) {
    switchToMirror(mirrors[Math.floor(Math.random() * mirrors.length)]);
}

const GoogleImagesSearchURL = "https://www.google.com/search?&hl=en&tbm=isch&q=";
var cssBlock = document.createElement('style');
// language=CSS
cssBlock.innerHTML = `
    img.thumbnail {
        height: 300px;
        display: -webkit-box;
    }

    a.thumbnail-added {
        font-size: large;
        font-family: sans-serif;
        display: contents;
    }

    a.toptor.thumbnail-added {
        padding: 20px;
        display: block;
        background-color: rgba(183, 183, 183, 0.23);
        margin: 10px;
        /* font-family: sans-serif; */
        --darkreader-inline-bgcolor: rgba(39, 45, 55, 0.23);
    }

    .zoom {
        transition: transform .2s; /* Animation */
    }

    .zoom:hover {
        transform: scale(1.15); /* (150% zoom - Note: if the zoom is too large, it will go outside of the viewport) */
    }

    img[alt="Download Torrent"] {
        padding: 15px;
    }
`;
document.getElementsByTagName('head')[0].appendChild(cssBlock);

const tbody = document.querySelector('#mcol > div > div.block-content > div > div > div > form > table > tbody > tr:nth-child(2) > td > table > tbody');

observeDocument(dealWithTorrent);


(function makeInfiniteScroll() {
    // next_page link:  div.block:nth-child(2) div.block-content div.block-content-l div.block-content-r div.block:nth-child(2) div.block-content div.block-content-l div.block-content-r div.b-content table:nth-child(3) tbody:nth-child(2) tr:nth-child(3) td:nth-child(1) > p:nth-child(1) >a:last-child
    const tableLvl2 = "div.block:nth-child(2) div.block-content div.block-content-l div.block-content-r div.block:nth-child(2) div.block-content div.block-content-l div.block-content-r div.b-content table:nth-child(3) tbody:nth-child(2) tr:nth-child(2) td:nth-child(1) > table.lista";
    const tbody = tableLvl2 + ">tbody";
    const nav = "div.block:nth-child(2) div.block-content div.block-content-l div.block-content-r div.block:nth-child(2) div.block-content div.block-content-l div.block-content-r div.b-content table:nth-child(3) tbody:nth-child(2) > tr:nth-child(3)";

    const url = new URL(location.href);
    const sp = url.searchParams;
    const pageOffset = sp.has('pages') ? parseInt(sp.get("pages")) : 0;

    $(tableLvl2).infiniteScroll({
        path: function () {
            sp.set('pages', pageOffset + this.loadCount);
            return url.toString();
        },
        append: tbody, // the table
        status: '.scroller-status',
        hideNav: nav
    });
})();

// if on /index.php torrents page
if (location.pathname.indexOf("/index.php") === 0) {
    if (tbody) for (const torLink of tbody.querySelectorAll('tbody > tr:nth-child(1) > td > a[title^="View details:"]:not(.has-download-now)')) {
        addDownloadLink(torLink, true);
    }
}

// adding a dropdown list for mirrors
(function addMirrorsDropdown() {
    const blankTab = document.querySelector('#header > table:nth-child(1) > tbody > tr > td > div > div > div.block-content > div > div > div.b-content > table:nth-child(2) > tbody > tr > td:nth-child(4)');
    const mirrorsTab = document.createElement('td');
    mirrorsTab.className = 'header3';
    mirrorsTab.innerText = "Switch to mirror site:";

    const mirrorsSelect = document.createElement('select');
    mirrorsSelect.onchange = function () {
        if (!this.value) return;
        mirrorHost = this.value;
        switchToMirror(mirrorHost);
    };
    mirrorsTab.appendChild(mirrorsSelect);

    for (const mirror of mirrors) {
        const option = document.createElement('option');
        option.value = mirror;
        option.innerText = createElement(`<a href="${mirror}"/>`).hostname;
        if (option.innerText === location.hostname)
            continue;

        mirrorsSelect.appendChild(option);
    }

    const option = document.createElement('option');
    option.innerText = location.hostname;
    option.setAttribute('selected', "");
    mirrorsSelect.appendChild(option);

    blankTab.after(mirrorsTab);
})();

function switchToMirror(mirrorHost) {
    const split = location.href.split('/').slice(2);
    split[0] = mirrorHost;
    const newUrl = split.join('/');
    location.assign(newUrl);
}

/**
 * if fakeLink is set to true, then a fake link will be used without actually fetching the link, clicking the link will fetch the actual link.
 * this is to minimize requests and prevent from getting blocked
 */
function addDownloadLink(torLink, fakeLink) {
    if (debugmode) console.debug(torLink);
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

/**
 * Plays audio
 * https://stackoverflow.com/a/17762789/7771202
 */
let Sound = (function () {
    var df = document.createDocumentFragment();
    return function Sound(src) {
        var snd = new Audio(src);
        df.appendChild(snd); // keep in fragment until finished playing
        snd.addEventListener('ended', function () {
            df.removeChild(snd);
        });
        snd.play();
        return snd;
    }
}());
var snd = Sound("data:audio/wav;base64," + "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");

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
                if (debugmode) console.debug(match);
                const thumbnail = document.createElement('img');
                thumbnail.src = match;
                a.appendChild(thumbnail);
                thumbnail.classList.add('thumbnail', 'zoom');
                thumbnail.onmouseover = function playSound() {
                    var snd = Sound("data:audio/wav;base64," + "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");
                };


                const searchLink = document.createElement('a');
                searchLink.innerHTML = 'GimgSearch: ' + a.innerText;

                let q = cleanSymbols(a.innerText) //replacing common useless torrent terms
                    // replace dates (numbers with dots between them)
                        .replace(/\s\s+/g, ' ')	// removes double spaces
                        .trim()
                ;
                searchLink.href = (GoogleImagesSearchURL + q);
                if (debugmode) console.debug('search url:', searchLink.href);
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

// example pageURL:
// https://pornleech.torrentzmirror.org/bigwetbutts-aj-applegate-new-bodystocking-butt-brazzers-15-february-2016-480p-new-511700.html
// torrent URL:
// https://pornleech.torrentzmirror.org/download.php?id=a725eae9b318a8479149ebef9a02c051aa03f9e1&f=BigWetButts%20~%20AJ%20Applegate%20NEW%20(Bodystocking%20Butt%20/%20BraZZers%20/%2015%20February%202016)%20480p%20NEW.torrent

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

function createTorrentButton(torrentPage) {
    var btn = createElement(`<td class="lista" align="center" style="text-align:left;" valign="top">
    <a href="/download.php?id=a725eae9b318a8479149ebef9a02c051aa03f9e1&amp;f=BigWetButts ~ AJ Applegate NEW (Bodystocking Butt / BraZZers / 15 February 2016) 480p NEW.torrent"/>

    <div style="text-align: center;">
        <a href="/download.php?id=a725eae9b318a8479149ebef9a02c051aa03f9e1&amp;f=BigWetButts ~ AJ Applegate NEW (Bodystocking Butt / BraZZers / 15 February 2016) 480p NEW.torrent">
            <img src="images/download.png" alt="">
        </a>
    </div>
</td>`);
    // torrentPage
}
