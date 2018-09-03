// ==UserScript==
// @name         RARBG - Add Magnet Link & thumbnails!
// @namespace    https://github.com/buzamahmooza
// @version      0.5.3
// @description  Add a magnet link shortcut and thumbnails of torrents.
// @description  Also adds a google image saerch link in case you want to see more pics of the torrent.
// @author       Cisco, forked by Faris Hijazi
// @include      /https?:\/\/.*rarbg.*\.\/*/
// @include      https://rarbg.to/*
// @include      http://rarbgmirror.xyz/*
// @include      https://rarbgunblock.com/*
// @include      https://rarbg.unblocked.st/*
// @include      https://*rarbg.*
// @include      http://rarbg4-to.unblocked.lol/
// @include      https://rarbgunblock.com/
// @include      https://rarbgmirror.com/
// @include      https://rarbg.immunicity.host/
// @include      https://rarbg.unblocked.bet/
// @include      http://rarbg-to.pbproxy.red/
// @include      https://rarbg.unblocked.cool/
// @include      https://rarbg.unblockall.xyz/
// @include      https://rarbg.unblocked.red/
// @include      https://rarbg.unlockproj.party/
// @include      http://rarbg-to.pbproxy2.co/
// @include      http://rarbg-to.proxydude.red/
// @include      https://rarbgunblock.com/
// @include      https://www.rarbg.is/
// @include      http://rarbg.com.torrentprox.com/
// @include      https://rarbg.bypassed.cab/
// @include      https://rarbg.unblockmy.link/
// @include      https://rarbg.immunicity.plus/
// @include      https://rarbg.unblocked.team/
// @include      https://rarbg.bypassed.plus/
// @include      https://rarbg.immunicity.cab/
// @include      https://rarbg.unblocked.plus/
// @include      https://rarbgunblock.com/
// @include      https://rarbgmirror.com/
// @include      http://rarbg.bypassed.team/
// @include      https://rarbg.unblocked.cab/
// @include      https://rarbg.immunicity.cab/
// @include      https://rarbg.bypassed.cab/
// @include      https://rarbg.unblocked.plus/
// @include      https://rarbg.immunicity.plus/
// @include      https://rarbg.immunicity.team/
// @include      https://rarbg.immunicity.cool/
// @include      https://rarbg.unblockall.xyz/
// @include      https://rarbg.unblocked.pub/
// @include      https://rarbg.unblocker.cc/
// @include      https://rarbg.proxydude.win/
// @include      https://rarbg.unblocker.win/
// @include      https://rarbg.unblocked.lol/
// @include      https://sitenable.co/proxify.php?proxy=c2l0ZW5hYmxlLmNv&site=aHR0cDovL3JhcmJnLnRvLw==
// @include      https://sitenable.info/proxify.php?proxy=c2l0ZW5hYmxlLmluZm8=&site=aHR0cDovL3JhcmJnLnRvLw==
// @include      https://siteget.net/proxify.php?proxy=c2l0ZWdldC5uZXQ=&site=aHR0cDovL3JhcmJnLnRvLw==
// @include      https://sitenable.ch/proxify.php?proxy=c2l0ZW5hYmxlLmNo&site=aHR0cDovL3JhcmJnLnRvLw==
// @include      https://freeproxy.io/proxify.php?proxy=ZnJlZXByb3h5Lmlv&site=aHR0cDovL3JhcmJnLnRvLw==
// @include      https://filesdownloader.com/proxify.php?proxy=ZmlsZXNkb3dubG9hZGVyLmNvbQ==&site=aHR0cDovL3JhcmJnLnRvLw==
// @include      https://freeanimesonline.com/proxify.php?proxy=ZnJlZWFuaW1lc29ubGluZS5jb20=&site=aHR0cDovL3JhcmJnLnRvLw==
// @include      https://sitenable.pw/proxify.php?proxy=c2l0ZW5hYmxlLnB3&site=aHR0cDovL3JhcmJnLnRvLw==
// @include      https://sitenable.top/proxify.php?proxy=c2l0ZW5hYmxlLnRvcA==&site=aHR0cDovL3JhcmJnLnRvLw==
// @include      https://rarbg.unblockedall.site/
// @include      https://rarbg.unblockmy.site/
// @include      http://rarbg-to.proxydude.xyz/
// @include      https://rarbgproxy.org/
// @grant        unsafeWindow
// @grant	     GM_setValue
// @grant        GM_getValue
// @icon         https://www.google.com/s2/favicons?domain=rarbg.com
// @run-at		 document-idle
// @updateUrl    https://gist.github.com/buzamahmooza/dccc1825be7e6a75127883a899e3a9a9/raw/
// @require      http://code.jquery.com/jquery-latest.js
// @require      https://unpkg.com/in-view@0.6.1/dist/in-view.min.js
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\libs\ocrad.js
// ==/UserScript==
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\Scraps\ocrad.min.js

// @require      https://gist.github.com/buzamahmooza/6fec79f1a8cb775562f02f7ffacde3f0/raw/d44f2c8f6db21f0c54958fd78af5bb1a6ec81b3b/ocrad.min.js

// Original link 1:      https://greasyfork.org/scripts/12648-rarbg-add-magnet-link/code/RARBG%20-%20Add%20Magnet%20Link.user.js
// Original link 2:      https://greasyfork.org/scripts/23493-rarbg-torrent-and-magnet-links/code/RARBG%20-%20torrent%20and%20magnet%20links.user.js

// ideas:
// [x] make a link that downloads all the images on the torrent page
// [x] sound on mouse hover

/**
 * ok here's how it goes
 * first
 * appendColumn()
 *  -> appendColumnSingle()
 *      -> addDlAndMl()
 * observeDocument(dealWithTorrents)
 * */

// Cat. | File | Added | Size | S. | L. | comments	|   Uploader

console.log('rarbg script running');

const DBG = true; // debug mode (setting this to false will disable the console logging)
var currentDocument = document;
const SEARCH_ICON_URL = "https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-ios7-search-strong-128.png";
// "http://icons.iconarchive.com/icons/custom-icon-design/mono-general-2/512/search-icon.png"; // search icon
const TORRENT_DL_ICO = "https://dyncdn.me/static/20/img/16x16/download.png";
const MAGNET_ICO = "https://dyncdn.me/static/20/img/magnet.gif";
const trackers = 'http%3A%2F%2Ftracker.trackerfix.com%3A80%2Fannounce&tr=udp%3A%2F%2F9.rarbg.me%3A2710&tr=udp%3A%2F%2F9.rarbg.to%3A2710';

const showGeneratedSearchQuery = false;
const addCategoryWithSearch = true;
const bigPics = true;


const SearchEngines = {
    google: {
        name: "Google",
        imageSearchUrl: (q) => `https://www.google.com/search?&hl=en&tbm=isch&q=${encodeURIComponent(q)}`
    },
    ddg: {
        name: "DuckDuckGo",
        imageSearchUrl: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}&atb=v73-5__&iar=images&iax=images&ia=images`
    },
    yandex: {
        name: "Yandex",
        imageSearchUrl: (q) => `https://yandex.com/images/search?text=${encodeURIComponent(q)}`
    }
};
let searchEngine = {};
initSearchEngine();
function initSearchEngine() {
    const searchEngineValue = GM_getValue("ImageSearchEngine", "google");
    if (SearchEngines.hasOwnProperty(searchEngineValue)) {
        searchEngine = SearchEngines[searchEngineValue];
        console.log('search engine:', searchEngineValue, searchEngine);
    } else {
        searchEngine = SearchEngines.google;
        console.warn(`Search engine ${searchEngineValue} does not exist, falling back to ${searchEngine.name}`);
    }
}
unsafeWindow.setSearchEngine = function (newSearchEngineName) {
    console.log('Setting search engine to ', newSearchEngineName);
    GM_setValue("ImageSearchEngine", newSearchEngineName);
    initSearchEngine();
};

var tbodyEl = document.querySelector('body > table:nth-child(6) > tbody > tr > td:nth-child(2) > div > table > tbody > tr:nth-child(2) > td > table.lista2t > tbody');
if (!tbodyEl) {
    console.warn("tbody element not found!");
}

const nextPage = document.querySelector('a[title="next page"]'),
    prevPage = document.querySelector('a[title="previous page"]');
var usingSmallThumbnails = GM_getValue('usingSmallThumbnails', true);
var torrents = document.querySelectorAll('tr.lista_related td:nth-child(1) [href^="/torrent/"]');

//if on a single torrent page, it gets special treatment
if (matchSite(/\/torrent\//)) {
    let mainTorrentLink = q('body > table:nth-child(6) > tbody > tr > td:nth-child(2) > div > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr:nth-child(1) > td.lista > a:nth-child(2)');
    addImageSearchAnchor(mainTorrentLink, mainTorrentLink.innerText);

    var i = 0;
    for (var torrent of torrents) {
        let thb = getMouseoverThumbnail(torrent);
        //creating and adding the elements
        var cell = document.createElement('td'),
            magnetLink = document.createElement('a'),
            magnetImg = document.createElement('img');
        magnetLink.href = torrent.href;

        cell.classList.add('magnet-cell');
        cell.appendChild(magnetLink);
        // thumbnail
        magnetImg.classList.add('preview-image');
        magnetImg.src = thb;
        magnetLink.appendChild(magnetImg);

        torrent.parentNode.parentNode.after(cell, torrent.parentNode);
        i++;
    }
    if (DBG) console.log('You should see ' + i + ' thumbnails now.');
    void(0);
}
// this is the selector for the element to append a page once it's in view
inView('body > div:nth-child(7)').on('enter', function () {
    appendPage(currentDocument.querySelector('a[title="next page"]'));
});

clickToVerifyBrowser();

var addedColumnHeader = false,
    title = 'DL&nbsp;ML',
    mls = appendColumn(),
    magnetImgData = 'data:image/svg+xml;base64,',
    appendedPageNum = 1;

const onLoad = function () {
    if (/rarbg.+threat_defence/i.test(location.href) && document.querySelector('#solve_string')) {
        console.log('rarbg threat defence page');
        solveCaptcha();
    }
    document.body.onclick = null;
    console.log('loaded');

    observeDocument((target) => {
        dealWithTorrents(target);

        // remove links for adds that cover the screen
        for (const x of qa('[style*="2147483647"]')) {
            console.log('removed element covering everything:', x);
            x.remove();
        }
    });
};
// window.addEventListener('load', onLoad);
onLoad();

let width = 100, maxwidth = 110, maxheight = 300;
width = bigPics ? width * 2 : width;
maxwidth = bigPics ? maxwidth * 2 : maxwidth;

var cssBlock = document.createElement('style');
fixCss();

document.getElementsByTagName('head')[0].appendChild(cssBlock);

var headCell = document.createElement('td');
headCell.innerHTML = 'Thumbnails';
headCell.classList.add('header6');
headCell.classList.add('header40');

// Adds the click functionality to the Thumbnails header
headCell.addEventListener('click', toggleThumbnailSize);
var x = document.querySelector('.lista2t tr:first-child td:nth-child(2)');
if (!!x)
    x.parentNode.insertBefore(headCell, document.querySelector('.lista2t tr:first-child td:nth-child(2)'));


function cleanSymbols(str) {
    return !!str ? removeDoubleSpaces(cleanDates(str).replace(/[-!$%^&*()_+|~=`{}\[\]";'<>?,.\/]|(\s\s+)/gim, ' ')
        .replace(/rarbg|\.com|#|x264|DVDRip|720p|1080p|2160p|MP4|IMAGESET|FuGLi|SD|KLEENEX|BRRip|XviD|MP3|XVID|BluRay|HAAC|WEBRip|DHD|rartv|KTR|YAPG|[^0-9a-zA-z]/gi, " ")).trim() : str;
}

function solveCaptcha() {
    try {
        console.log('solving captcha...');
        var container = document.querySelector('tbody > :nth-child(2)');
        var img = container.querySelector('img');
        var captcha = document.querySelector('#solve_string');

        var image = new Image();
        var imageText = '';

        image.src = img.src;
        imageText = OCRAD(image);
        console.log('OCRAD result:', imageText);
        captcha.value = imageText;
        // var fakeSubmitBtn = createElemeng(`<button class="button" type="submit" style="padding-top: 10px;" id="button_submit"><i class="icon-user"></i> I am human</button>`);
        // container.appendChild(fakeSubmitBtn);
        var submitBtn = document.querySelector('#button_submit');
        submitBtn.display = '';
        submitBtn.click();
    } catch (e) {
        console.error(e);
    }
}

function fixCss() {
    // language=CSS
    cssBlock.innerText = `
.magnet-cell img.preview-image {
    width: ${usingSmallThumbnails ? width : width * 1.3}px;
    max-width: ${usingSmallThumbnails ? width : maxwidth * 1.4};
    max-height: ${(usingSmallThumbnails ? width : maxwidth * 1.4) * 1.5};
    padding: 5px 5px;
}

.magnet-cell {
    text-align: center;
    max-width: ${maxwidth}
    max-height: ${maxheight};
}
a.torrent-ml, a.torrent-dl{
	display: table-cell;	
	padding: 5px;
}

a.gs:link {
    color: red;
}

a.gs:visited {
    color: green;
}

a.gs:hover {
    color: hotpink;
}

a.gs:active {
    color: blue;
}

a.gs {
    font-size: 8px;
    padding: 5px 5px;
    padding: 20px;
    display: -webkit-box;
    background-color: #b7b7b73b;
    margin: 10px;
}

.zoom {
    padding: 50px;
    transition: transform .2s; /* Animation */
    margin: 0 auto;
}

.zoom:hover {
    transform: scale(1.5); /* (150% zoom - Note: if the zoom is too large, it will go outside of the viewport) */
}

td.lista {
    color: #000;
    font-size: 10pt;
    font-family: sans-serif;
}

tr.lista2 > td.lista > a[onmouseover] {
    font-size: 15px !important;
    padding: 20px !important;
    display: -webkit-box !important;
    background-color: rgba(183, 183, 183, 0.23) !important;
    margin: 10px !important;
    font-family: sans-serif !important;
}
`;
}

const audioData = 'http://freesound.org/data/previews/166/166186_3034894-lq.mp3';
// 'https://d1490khl9dq1ow.cloudfront.net/sfx/mp3preview/mouse-over-soft_zJssOs4u.mp3';
// 'http://allwebco-templates.com/support/scripts/sound-mouseover/click.ogg';
// 'https://www.soundsnap.com/streamers/play.php?id=1525000313.3333:3674807a9a4d05c0f265f949fad14edf057953ab:9628157b0132a9429262f8f1eb20b98717a4fda466616387926b54aeef2cb2518126de551390af19809b64732931b485a133b447dd7ea535aefbc348ae25e4b342cc86d1735831315eb94d6628acc8348965e41efe2e3dfd72bfa1251c9f0e78a58ad0e0d8b880fc700db110819c57a478860108bfc329f27851d1e83b247c0b1cb3e858ba8ba6cb16e25c001c1620cede8a8e4173c1251964ae8e5b826bcdc7163592420c02a18604cf45506233b4900a02feeca41a6d1c3cb4fc581fab1ff26e65253b8e1c3f08b35455553dd8e5afb54880535c3e79780a76d42633b5c6fa71e8d3cacc96976cedc1aaefa0202b9030da061702eb8b6c07bbb7b5329f8ecac38c79e866bf3f0dbc78fe944ee47e81';
// 'https://www.soundsnap.com/streamers/play.php?id=1525000286.3919:eea4cf95325ec0997b3cc5d0e03cf5b4b50eb9f7:9d8649822403278c2864503b85926891c995314a664532d13aa630f65fc4de934e1b3cc6bfce907c2cd05ca32f74523edd48ccbd0146d22281d6d4365b4e55a1d6e44fa02dcb66af3f5fb25073e29e2d43a40033e0c324ee9d6b3cc11983e0101dcf1c44f670581417a46e8afd3783037bf631841c01c127452205f40dff2b465cd9d96ef551037072dd9f0ec780698daa8dc24f93d0cdbebf56e55256c8c9bf5d6e07e253c0906c8a02a16be3f67d96f3f8564119474ae5dcc6724a47ab005f7f5abd839cb00266efe4a47130b576c5729eb34b0db902799b669d55d5c09a1efc15d5cd2c07bd475f5bbbc5c49d813efa153fd8d3c7bb6a4f11a4ea5e8f3a53';
// 'https://www.soundsnap.com/streamers/play.php?id=1525000300.3565:844eb32506a44909418840ba153b8871871e1509:8ecc501d5e6eb1f8f698db74be09ce3fff4ceca976dfe1cee7cfcb941bb0db2896ccd245ea81c33d1f9f1f4d7cd48b7585ab5c8ad11fbe4aebc648bf27b2722835db8484785e27d1a2eee1edfdd8dfdbc12fffbafed9825a5dacc807193c64678d355cdccc99d4b1c7c4c87797d35f3404befd5fcb59de0cd1eb07934ff9664849e2494ebc7a651ba98af2c5afa5f2199d0dc3d5127e5dd689433f0cb9c40e6005e430afb36e6e96423dd15a22cd6550d63dbc213ebcacab554c5e70afce9fd114939e7b4018839c549cbc71c203289810c58e0fb9b18e1315622f308038b1288becc0a0b04003bfafd29fa95fbe4322b6645c3f758d0b2d6ac27cb5d0a77f6b';
// 'https://css-tricks.com/examples/SoundOnHover/audio/beep.mp3';

addAudioElement();
function addAudioElement() {
    document.body.appendChild(createElement(`<audio id="hoverSound">
<source src="${audioData}" type="audio/mp3">
</audio>`));
    // document.getElementById(']').volume = 0.25;
}

function observeDocument(callback) {
    callback(document.body);
    new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
            if (!mutations[i].addedNodes.length) continue;
            callback(mutations[i].target);
        }
    })
        .observe(document.body, {
            childList: true, subtree: true,
            attributes: false, characterData: false
        });
}

function dealWithTorrents(node) {
    torrents = node.querySelectorAll('.lista2 td:nth-child(2) [href^="/torrent/"]');
    if (DBG) console.log('torrents.length: ' + torrents.length);
    for (var i = 0; i < torrents.length; i++) {
        //creating and adding the elements
        var cell = document.createElement('td'),
            magnetLink = document.createElement('a'),
            magnetImg = document.createElement('img');

        try {
            magnetLink.href = getTorrentDownloadLinkFromAnchor(torrents[i]);
            // getTorrentDownloadLink(torrents[i].parentNode);
        } catch (e) {
            magnetLink.href = mls[i];
            if (DBG) console.log('Using mls for MagnetLink:', mls[i]);
        }
        // magnetLink.href = mls[i];

        cell.classList.add('magnet-cell');

        // cell.insertAdjacentElement("beforebegin", magnetLink);
        cell.appendChild(magnetLink);

        if (DBG) console.log("thumbnail Link:", magnetLink);
        // thumbnail
        magnetImg.classList.add('preview-image');
        magnetImg.classList.add('zoom');

        magnetImg.onmouseover = function playSound(soundobj) {
            var thissound = document.getElementById('hoverSound');
            // if(thissound.paused)
            thissound.currentTime = 0;
            thissound.play();
        };

        let thumb = getMouseoverThumbnail(torrents[i]);
        createAndAddAttribute(magnetImg, 'smallSrc', thumb);
        createAndAddAttribute(magnetImg, 'bigSrc', getLargeThumbnail(thumb));

        setThumbnail(magnetImg);
        magnetLink.appendChild(magnetImg);

        torrents[i].parentNode.before(cell);

        var row = torrents[i].closest('tr');
        var column_Added = row.querySelector('td:nth-child(5)');
        var minutes = ((Date.now() - Date.parse(column_Added.innerHTML)) / (1000 * 60)),
            hours = 0
        ;
        if (minutes > 60) {
            hours = Math.round(minutes / 60);
            minutes = minutes % 60;
        }
        minutes = Math.round(minutes);

        if (DBG) console.log('column_Added:', column_Added);
        column_Added.innerHTML =
            column_Added.innerHTML + '<br>\n' + ((hours ? (hours + 'h') : '') + minutes ? (minutes + 'min') : '') + '&nbsp' + 'ago';


        // color backgrounds depending on the number of peers
        var statusRGB = hex2rgb(row.querySelector('font[color]').getAttribute('color')); // to color the row
        statusRGB.push(0.15);
        statusRGB = 'rgb(' + statusRGB.join(', ') + ')';
        row.style.background = statusRGB;

    }
    torrents.forEach(addImageSearchAnchor);
}

function setThumbnail(magnetImg) {
    // magnetImg.src = magnetImg.getAttribute((usingSmallThumbnails ? 'smallSrc' : 'bigSrc'));
    if (!usingSmallThumbnails)
        magnetImg.src = magnetImg.getAttribute('bigSrc');

    if (!magnetImg.src) {
        magnetImg.src = magnetImg.getAttribute('smallSrc');
    }
}
function toggleThumbnailSize() {
    console.log('toggleThumbnailSize()');
    usingSmallThumbnails = !usingSmallThumbnails;
    GM_setValue('usingSmallThumbnails', usingSmallThumbnails);
    document.querySelectorAll('.preview-image').forEach(setThumbnail);
    fixCss();
    if (DBG) console.log('toggling thumbnail sizes. usingSmallThumbnails = ', usingSmallThumbnails);
}
function tryBigImage(img) {
    img.addEventListener("error", bigThumbHandleError);
    img.oldSrc = img.src;
    img.src = getLargeThumbnail(img.src);
}
function bigThumbHandleError() {
    this.removeEventListener("error", bigThumbHandleError);
    this.src = this.oldSrc;
    console.warn('Failed to load big thumbnail for', this.src, ' Attempting xml request');
    addMagnetCell(this.parentNode);
}
// gets the large thumbnail from the small thumbnail (works for rarbg thumbnails)
function getLargeThumbnail(smallThumbUrl) {
    // Movie example
    // Small pic:	http://dyncdn.me/mimages/316661/over_opt.jpg
    // Big pic:		http://dyncdn.me/mimages/316661/poster_opt.jpg
    return smallThumbUrl
        .replace('over_opt', 'poster_opt') // movie thumbnail replacement
        // other thumbnail replacement
        .replace('static/over', 'posters2/' + smallThumbUrl.replace(/(.*?)over\//, '').charAt(0)) //put "posters2" + the first character after the '/'
        ;
}
function createAndAddAttribute(node, attributeName, attributeValue) {
    if (!node) {
        console.error('Node is null, cannot add attribute.');
        return;
    }

    var att = document.createAttribute(attributeName);
    att.value = attributeValue;
    node.setAttributeNode(att);
}

/** @Return returns the link from the 'onmouseover' attribute */
function getMouseoverThumbnail(node) {
    if (!node) console.warn('null torrent anchor:', node);
    let thb = '';
    try {
        // thb = thb.match(/(?<=(return overlib('\<img src\=\')))(.*?)(?=(\' border\=0\>\'))/i)[0];
        thb = node.getAttribute('onmouseover');
        thb = thb.substring("return overlib('<img src=\'".length + 1, thb.length - "\' border=0>'".length - 2);
    } catch (r) {
        thb = magnetImgData;
        if (DBG) console.error('getMouseoverThumbnail error:', r);
    }
    return thb;
}
function addImageSearchAnchor(torrentAnchor, query) {
    var searchTd = document.createElement('td'),
        searchLink = document.createElement('a'),
        frame = document.createElement('iframe'),
        searchImg = document.createElement('img')
    ;
    searchTd.style = "border-top-width: 10px; padding-top: 10px;";

    let q = cleanSymbols(torrentAnchor.title || torrentAnchor.innerText) //replacing common useless torrent terms
        // replace dates (numbers with dots between them)
            .replace(/\s\s+/g, ' ')	// removes double spaces
            .trim()
    ;

    frame.src = SearchEngines.ddg.imageSearchUrl(q);
    frame.height = "200";
    frame.width = "300";


    // category
    function getCat() {
        var anchor = torrentAnchor.parentNode.parentNode.parentNode.querySelector('a[href^="/torrents.php?category="]');
        var catSearch = anchor.href.match(/(?<=\/torrents\.php\?category=)(.+?)/i)[0];
        switch (catSearch) {
            case '4':
                var c = String.fromCharCode(88);
                catSearch = c.concat(c).concat(c);
                break;
            case 'Movies':
            case 'Shows':
                break;
            default:
                console.log('Uknown category:', catSearch);
                catSearch = undefined;
        }
        console.debug('category:', catSearch);
        return catSearch;
    }

    searchLink.href = searchEngine.imageSearchUrl(q);
    try {
        if (addCategoryWithSearch && !new RegExp(getCat()).test(searchLink.href))
            searchLink.href += " " + getCat();
    } catch (e) {
        console.warn("unable to get category", searchLink);
    }
    console.debug('search url:', searchLink.href);
    searchLink.classList.add('gs');
    searchLink.target = "_blank";
    searchLink.style = `
font-size: 15px;
padding:5px 5px;
padding: 20px;
display: -webkit-box;
background-color: #b7b7b73b;
margin: 10px;
font-family: sans-serif;`
    ;

    var searchEngineText = document.createElement('p5');
    var qText = document.createElement('p6');
    searchEngineText.innerHTML = `${searchEngine.name} Image Search`;
    qText.innerHTML = (showGeneratedSearchQuery) ? ':\t' + q : '';

    let searchIcon = document.createElement('img');
    // searchIcon.src = SEARCH_ICON_URL;
    searchIcon.src = "https://www.google.com/s2/favicons?domain=" + searchEngine.name + ".com";

    searchIcon.style.height = '20px';
    searchIcon.style.width = '20px';
    searchLink.style.padding = '20px';
    // searchTd.appendChild(searchLink);
    searchLink.appendChild(searchIcon);
    searchLink.appendChild(searchEngineText);
    searchLink.appendChild(qText);

    // torrentAnchor.after(searchTd);
    torrentAnchor.parentNode.appendChild(searchLink);
}

function appendPage(pageLink) {
    var tb = document.createElement('tr');
    var pageAnchor = createElement(`<td><a href="${pageLink}"><p1 style="white-space: nowrap;">Go to page ${++appendedPageNum}</p1></a></td>`);
    tb.appendChild(pageAnchor);
    tbodyEl.appendChild(tb);

    var url = pageLink;
    var req = new XMLHttpRequest();
    req.open('GET', url);
    req.send();
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            var pageHTML = req.responseText;
            currentDocument = document.createElement('html');
            currentDocument.innerHTML = pageHTML;
            var lista2s = currentDocument.querySelectorAll('tbody>.lista2');
            if (DBG) console.log('lista2s:', lista2s);
            lista2s.forEach(function (e) {
                tbodyEl.appendChild(e);
                appendColumnSingle(e.childNodes[1]);
            });
        }
    };
}
function addMagnetCell(torrent) {
    var url = torrent.href;
    var req = new XMLHttpRequest();
    req.open('GET', url);
    req.send();
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            var pageHTML = req.responseText;
            var magnetURL = pageHTML.match(/href="(magnet[:_\-+%?=&;.0-9a-zA-Z]*)"/)[1]; //match magnet URL
            var thumbURLs = pageHTML.match("src\=\"((.?)*\.jpg)\"");

            //creating and adding the elements
            var magnetCell = document.createElement('td'),
                magnetLink = document.createElement('a'),
                magnetImg = document.createElement('img');
            magnetLink.href = magnetURL;
            magnetCell.classList.add('magnet-cell');
            // magnetCell.style = '';
            magnetCell.appendChild(magnetLink);

            magnetImg.src = thumbURLs[1];
            if (!thumbURLs[1]) magnetImg = magnetImgData;
            magnetLink.appendChild(magnetImg);
            torrent.parentNode.parentNode.replaceChild(magnetCell, torrent.parentNode.parentNode.childNodes[1]);
        }
    };
}
function clickToVerifyBrowser() {
    document.querySelectorAll('a[href^="/threat_defence.php?defence=1"]').forEach(a => {
        a.click();
    });
}

window.onkeyup = function (e) {
    var key = e.keyCode ? e.keyCode : e.which;
    switch (key) {
        case 32: // SpaceBar
            appendPage();
            break;
        case 37: // Left arrowKey
            e.preventDefault();
            prevPage.click();
            break;
        case 39:// Right arrowKey
            e.preventDefault();
            nextPage.click();
            break;
        case 192: // ' ` ' key
            toggleThumbnailSize();
            break;
        case 83: // Ctrl + S
            if (e.ctrlKey) {
                var text = document.title + '\t' + Date.now() +
                    '\n' + location.href
                    + '\n\n\n';
                for (const row of document.querySelectorAll('table > tbody > tr.lista2')) {
                    const a = row.querySelector('a[onmouseover]');
                    text += 'Title: ' + (a.title || a.innerText) +
                        'Torrent page:\t' + a.href +
                        'Torrent link:\t' + row.querySelector('.torrent-dl').href +
                        'Magnet link:\t' + row.querySelector('.torrent-ml').href +
                        '\n\n'
                    ;
                }
                anchorClick(makeTextFile(text), document.title + ' info.txt');
            }
            break;
    }
};
/** Create an element by typing it's inner HTML.
 example:   var myAnchor = createElement('<a href="https://example.com">Go to example.com</a>');*/
function createElement(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.childNodes[0];
}

unsafeWindow.dlTorrents = dlTorrents;
function dlTorrents() {
    console.log('dlTorrents');
    const dlAnchors = document.querySelectorAll(".torrent-dl");
    if (confirm(`Would you like to download all the torrents on the page? (${dlAnchors.length})`)) {
        dlAnchors.forEach(e => {
            e.click();
            console.log(e.href);
        });
    }
}

// the magnet and url buttons
// @source: https://greasyfork.org/scripts/23493-rarbg-torrent-and-magnet-links/code/RARBG%20-%20torrent%20and%20magnet%20links.user.js
// Cat. | File | Added | Size | S. | L. | comments	|   Uploader
function appendColumn() {
    // the initial column 'Files' after of which the extra column will be appended
    /*document.querySelectorAll('.lista2t > tbody > tr > td:nth-child(2)').forEach(function(entry){		// creation of the extra column
    	entry.insertAdjacentHTML('afterend', `<td>` + title + `</td>`);
    });*/
    // add header
    console.log("addedColumnHeader:", addedColumnHeader);
    if (!addedColumnHeader) {
        var nearHeader = document.querySelector('.lista2t > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(3)'); // the first cell (header cell) of the new column
        if (!nearHeader) {
            console.warn("Problem: Header not found");
            return;
        }
        var header = nearHeader.cloneNode(false);
        nearHeader.before(header);
        // noinspection JSUnusedAssignment
        nearHeader = undefined; // clear memory

        header.setAttribute('class', 'header6');
        header.setAttribute('align', 'center');
        header.setAttribute('id', 'DL-header');

        var dlAnchor = createElement('<a>DL</a>');
        dlAnchor.addEventListener('click', dlTorrents);
        header.appendChild(dlAnchor);

        addedColumnHeader = true;
    }

    // the rest cells of the new column
    document.querySelectorAll('.lista2t > tbody > tr[class="lista2"] > td:nth-child(3)')
        .forEach(fixCellCss);
    var oldColumn = Array.from(document.querySelectorAll('.lista2t > tbody > tr[class="lista2"] > td a[href^="/torrent/"]'))
        .map(a => a.parentElement);		// torrent links row
    // populate the cells in the new column with DL and ML links
    return Array.from(oldColumn).map(appendColumnSingle);
}
/**
 * sets the following attributes:
 *  class: lista
 *  width: 50px
 *  align: center
 * @param cell
 */
function fixCellCss(cell) {
    cell.setAttribute('class', 'lista');
    cell.setAttribute('width', '50px');
    cell.setAttribute('align', 'center');
}

function addDlAndMl(torrentAnchor, cellNode) {
    // language=HTML
    torrentAnchor.appendChild(createElement(
        `<a href="${getTorrentDownloadLink(cellNode)}" class="torrent-dl" target="_blank" ><img src="${TORRENT_DL_ICO}"></a>`
    )); // torrent download

    // matches anything containing "over/*.jpg" *: anything
    const anchorOuterHTML = cellNode.firstChild.outerHTML;
    const hash = (/over\/(.*)\.jpg\\/).test(anchorOuterHTML) ?
        anchorOuterHTML.match(/over\/(.*)\.jpg\\/)[1] :
        undefined;

    let title = cellNode.firstChild.innerText;

    const magnetUriStr = `magnet:?xt=urn:btih:${hash}&dn=${title}&tr=${trackers}`;
    console.log('magnetUri:', magnetUriStr);
    const ml = createElement(
        hash !== undefined ?
            (`<a class="torrent-ml" href="${magnetUriStr}"><img src="${MAGNET_ICO}"></a>`) :
            '&nbsp;&nbsp;&nbsp;&nbsp;'
    );
    console.log('magnetLink button:', ml);
    torrentAnchor.appendChild(ml); // magnet ink

    return magnetUriStr;
}

function getTorrentDownloadLink(oldColumn) {
    return oldColumn.firstChild.href.replace('torrent/', 'download.php?id=') + '&f=' + oldColumn.firstChild.innerText + '-[rarbg.com].torrent"';
}
function getTorrentDownloadLinkFromAnchor(anchor) {
    return anchor.href.replace('torrent/', 'download.php?id=') + '&f=' + anchor.innerText + '-[rarbg.com].torrent';
}

/**
 *
 * @param torrentLink
 * @return {*}
 */
function appendColumnSingle(torrentLink) {
    if (torrentLink.classList.contains('has-torrent-DL-ML')) return;
    // the initial column 'Files' after of which the extra column will be appended
    // creation of the extra column

    torrentLink.insertAdjacentHTML('afterend', `<td>${title}</td>`);
    torrentLink.classList.add('has-torrent-DL-ML');
    // add header
    if (!addedColumnHeader) {
        // the first cell (the header cell) of the new column
        var header = document.querySelector('.lista2t > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(3)');
        header.setAttribute('class', 'header6');
        header.setAttribute('align', 'center');
        header.addEventListener('click', dlTorrents);
        header.appendChild(createElement('<a>DL</a>')); // append DL anchor
        addedColumnHeader = true;
    }

    // the rest cells of the new column
    fixCellCss(torrentLink.nextSibling);


    // populate the cells in the new column with DL and ML links
    return (addDlAndMl(torrentLink.nextSibling, torrentLink));
}

function matchSite(siteRegex) {
    let result = location.href.match(siteRegex);
    if (result) if (DBG) console.log("Site matched regex: " + siteRegex);
    return result;
}
function loadBigPics() {
    fixCss();
    // Advised not to use as it uses XML requests and will get you banned form the site if you use it for a few pages.
    document.querySelectorAll('.preview-image').forEach(tryBigImage);
}

function removeDoubleSpaces(str) {
    return !!str ? str.replace(/(\s\s+)/g, " ") : str;
}

function cleanDates(str) {
    return !!str ? removeDoubleSpaces(str.replace(/\d+([.\-])(\d+)([.\-])\d*/g, ' ')) : str;
}

/////////
function hex2rgb(c) {
    if (c[0] === '#') c = c.substr(1);
    var r = parseInt(c.slice(0, 2), 16),
        g = parseInt(c.slice(2, 4), 16),
        b = parseInt(c.slice(4, 6), 16);
    return [r, g, b];
}


function saveByAnchor(url, dlName) {
    anchorClick(url, dlName);
}
function saveBlobAsFile(blob, fileName) {
    var reader = new FileReader();

    reader.onloadend = function () {
        var base64 = reader.result;
        var link = document.createElement("a");

        link.setAttribute("href", base64);
        link.setAttribute("download", fileName);
        link.click();
    };

    reader.readAsDataURL(blob);
}
function makeTextFile(text) {
    var data = new Blob([text], {type: 'text/plain'});
    var textFile = null;
    // If we are replacing a previously generated file we need to manually revoke the object URL to avoid memory leaks.
    if (textFile !== null) window.URL.revokeObjectURL(textFile);
    textFile = window.URL.createObjectURL(data);
    return textFile;
}


class Queue {
    constructor() {
        this._oldestIndex = 1;
        this._newestIndex = 1;
        this._storage = {};
    }
    size() {
        return this._newestIndex - this._oldestIndex;
    }
    enqueue(data) {
        this._storage[this._newestIndex] = data;
        this._newestIndex++;
    }
    dequeue() {
        var oldestIndex = this._oldestIndex,
            newestIndex = this._newestIndex,
            deletedData;

        if (oldestIndex !== newestIndex) {
            deletedData = this._storage[oldestIndex];
            delete this._storage[oldestIndex];
            this._oldestIndex++;

            return deletedData;
        }
    }
}


/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.3.8
 * 2018-03-22 14:03:47
 *
 * By Eli Grey, https://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/src/FileSaver.js */

var saveAs = saveAs || (function (view) {
    "use strict";
    // IE <10 is explicitly unsupported
    if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
        return;
    }
    var
        doc = view.document
        // only get URL when necessary in case Blob.js hasn't overridden it yet
        ,
        get_URL = function () {
            return view.URL || view.webkitURL || view;
        },
        save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"),
        can_use_save_link = "download" in save_link,
        click = function (node) {
            var event = new MouseEvent("click");
            node.dispatchEvent(event);
        },
        is_safari = /constructor/i.test(view.HTMLElement) || view.safari,
        is_chrome_ios = /CriOS\/[\d]+/.test(navigator.userAgent),
        setImmediate = view.setImmediate || view.setTimeout,
        throw_outside = function (ex) {
            setImmediate(function () {
                throw ex;
            }, 0);
        },
        force_saveable_type = "application/octet-stream"
        // the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
        ,
        arbitrary_revoke_timeout = 1000 * 40 // in ms
        ,
        revoke = function (file) {
            var revoker = function () {
                if (typeof file === "string") { // file is an object URL
                    get_URL().revokeObjectURL(file);
                } else { // file is a File
                    file.remove();
                }
            };
            setTimeout(revoker, arbitrary_revoke_timeout);
        },
        dispatch = function (filesaver, event_types, event) {
            event_types = [].concat(event_types);
            var i = event_types.length;
            while (i--) {
                var listener = filesaver["on" + event_types[i]];
                if (typeof listener === "function") {
                    try {
                        listener.call(filesaver, event || filesaver);
                    } catch (ex) {
                        throw_outside(ex);
                    }
                }
            }
        },
        auto_bom = function (blob) {
            // prepend BOM for UTF-8 XML and text/* types (including HTML)
            // note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
            if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
                return new Blob([String.fromCharCode(0xFEFF), blob], {
                    type: blob.type
                });
            }
            return blob;
        },
        FileSaver = function (blob, name, no_auto_bom) {
            if (!no_auto_bom) {
                blob = auto_bom(blob);
            }
            // First try a.download, then web filesystem, then object URLs
            var
                filesaver = this,
                type = blob.type,
                force = type === force_saveable_type,
                object_url, dispatch_all = function () {
                    dispatch(filesaver, "writestart progress write writeend".split(" "));
                }
                // on any filesys errors revert to saving with object URLs
                ,
                fs_error = function () {
                    if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
                        // Safari doesn't allow downloading of blob urls
                        var reader = new FileReader();
                        reader.onloadend = function () {
                            var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
                            var popup = view.open(url, '_blank');
                            if (!popup) view.location.href = url;
                            url = undefined; // release reference before dispatching
                            filesaver.readyState = filesaver.DONE;
                            dispatch_all();
                        };
                        reader.readAsDataURL(blob);
                        filesaver.readyState = filesaver.INIT;
                        return;
                    }
                    // don't create more object URLs than needed
                    if (!object_url) {
                        object_url = get_URL().createObjectURL(blob);
                    }
                    if (force) {
                        view.location.href = object_url;
                    } else {
                        var opened = view.open(object_url, "_blank");
                        if (!opened) {
                            // Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
                            view.location.href = object_url;
                        }
                    }
                    filesaver.readyState = filesaver.DONE;
                    dispatch_all();
                    revoke(object_url);
                };
            filesaver.readyState = filesaver.INIT;

            if (can_use_save_link) {
                object_url = get_URL().createObjectURL(blob);
                setImmediate(function () {
                    save_link.href = object_url;
                    save_link.download = name;
                    click(save_link);
                    dispatch_all();
                    revoke(object_url);
                    filesaver.readyState = filesaver.DONE;
                }, 0);
                return;
            }

            fs_error();
        },
        FS_proto = FileSaver.prototype,
        saveAs = function (blob, name, no_auto_bom) {
            return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
        };

    // IE 10+ (native saveAs)
    if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
        return function (blob, name, no_auto_bom) {
            name = name || blob.name || "download";

            if (!no_auto_bom) {
                blob = auto_bom(blob);
            }
            return navigator.msSaveOrOpenBlob(blob, name);
        };
    }

    //save_link.target = "_blank";

    FS_proto.abort = function () {
    };
    FS_proto.readyState = FS_proto.INIT = 0;
    FS_proto.WRITING = 1;
    FS_proto.DONE = 2;

    FS_proto.error =
        FS_proto.onwritestart =
            FS_proto.onprogress =
                FS_proto.onwrite =
                    FS_proto.onabort =
                        FS_proto.onerror =
                            FS_proto.onwriteend =
                                null;

    return saveAs;
}(
    typeof self !== "undefined" && self ||
    typeof window !== "undefined" && window ||
    this
));


// this is one row
/*<tr className="lista2">
    <td align="left" className="lista" width="48" style="width:48px;">
        <a href="/torrents.php?category=45">
            <img src="https://dyncdn.me/static/20/images/categories/cat_new45.gif" border="0" alt="">
        </a>
    </td>

    <td align="left" className="lista">
        <a onMouseOver="return overlib('<img src=\'https://dyncdn.me/mimages/5975/over_opt.jpg\' border=0>')"
           onMouseOut="return nd();" href="/torrent/ifcvj5g" title="">The.Visitor.2007.720p.BluRay.H264.AAC-RARBG</a>
        <a href="/torrents.php?imdb=tt0857191">
            <img src="https://dyncdn.me/static/20/images/imdb_thumb.gif" border="0" alt=""></a><br>
        <span style="color:DarkSlateGray">Drama IMDB: 7.7/10</span>
    </td>

    <td align="center" width="150px" className="lista">2018-07-25 16:55:06</td>
    <td align="center" width="100px" className="lista">1.25 GB</td>
    <td align="center" width="50px" className="lista"><font color="#dd0000">1</font></td>
    <td align="center" width="50px" className="lista">5</td>
    <td align="center" width="50px" className="lista">--</td>
    <td align="center" className="lista">Scene</td>
</tr>
*/
