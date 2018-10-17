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
// @grant        GM_setValue
// @grant        GM_getValue
// @icon         https://www.google.com/s2/favicons?domain=rarbg.com
// @run-at       document-idle
// @updateUrl    https://gist.github.com/buzamahmooza/dccc1825be7e6a75127883a899e3a9a9/raw/
// @require      http://code.jquery.com/jquery-latest.js
// @require      https://unpkg.com/in-view@0.6.1/dist/in-view.min.js
// @require      https://raw.githubusercontent.com/antimatter15/ocrad.js/master/ocrad.js
// ==/UserScript==in.js

// Original link 1:      https://greasyfork.org/scripts/12648-rarbg-add-magnet-link/code/RARBG%20-%20Add%20Magnet%20Link.user.js
// Original link 2:      https://greasyfork.org/scripts/23493-rarbg-torrent-and-magnet-links/code/RARBG%20-%20torrent%20and%20magnet%20links.user.js

// todo:	Improve cross-browser compatability by replacing element.before() with element.insertBefore() or create polyfill

/**
 * ok here's how it goes
 * first
 * appendColumn()
 *  -> appendColumnSingle()
 *      -> addDlAndMl()
 * observeDocument(dealWithTorrents)
 * */

//todo: maybe change hotkeys to Mousetrap
//todo:	remove searchEngine variable and use Options.searchEngine instead, this way you won't have to manually use GM_setValue and getValue for it
//done: FIX random extra "DL ML" columns appearing
//done: make script run independantly of other scripts
//done: add an option to change what the thumbnail downloads (magnet link or torrent file)
//done: maybe make the colors extra red/green depending on the seeds
//done: add forward slash hotkey to go to the search bar
//done: if there's no next page, scrolling down shouldn't append an extra link
//done: complete category search

// Cat. | File | Added | Size | S. | L. | comments	|   Uploader

console.log('rarbg script running');

var debug = true; // debug mode (setting this to false will disable the console logging)

var currentDocument = document; // placeholder to keep track of the latest document object (since multiple documents are used)
const SEARCH_ICON_URL = "https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-ios7-search-strong-128.png";
// "http://icons.iconarchive.com/icons/custom-icon-design/mono-general-2/512/search-icon.png"; // search icon
const TORRENT_ICO = "https://dyncdn.me/static/20/img/16x16/download.png";
const MAGNET_ICO = "https://dyncdn.me/static/20/img/magnet.gif";
const trackers = 'http%3A%2F%2Ftracker.trackerfix.com%3A80%2Fannounce&tr=udp%3A%2F%2F9.rarbg.me%3A2710&tr=udp%3A%2F%2F9.rarbg.to%3A2710';

const Options = GM_getValue("RarbgOptions",
    {
        thumbnailLink: "ml",    //options:  "ml", "tor", "img", "page"
        addThumbnails: true,	// if set to false, the content thumbnails will not be used, magnet or torrent thumbnails will be used isntead
        showGeneratedSearchQuery: false,
        addCategoryWithSearch: true,
        userLargeThumbnails: true,
        defaultImageSearchEngine: "google"
    }
);
window.addEventListener("unload", function () {
    GM_setValue("RarbgOptions", Options);
});

Math.clamp = function (a, min, max) {
    return a < min ? min :
        a > max ? max : a;
};

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
    const searchEngineValue = GM_getValue("ImageSearchEngine", Options.defaultImageSearchEngine);
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
var torrents = document.querySelectorAll('a[onmouseover][href^="/torrent/"]');

(function addColumnHeader() {
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
})();

//if on a single torrent page, it gets special treatment
if (matchSite(/\/torrent\//)) {
    let mainTorrentLink = q('body > table:nth-child(6) > tbody > tr > td:nth-child(2) > div > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr:nth-child(1) > td.lista > a:nth-child(2)');
    addImageSearchAnchor(mainTorrentLink, mainTorrentLink.innerText);

    var i = 0; // just for counting and debugging
    for (const torrent of torrents) {
        //creating and adding the elements
        const cell = document.createElement('td'),
            thumbnailLink = document.createElement('a'),
            thumbnailImg = document.createElement('img');
        thumbnailLink.href = torrent.href;

        cell.classList.add('magnet-cell');
        cell.appendChild(thumbnailLink);
        // thumbnail
        thumbnailImg.classList.add('preview-image');
        const thumbnailSrc = extractMouseoverThumbnail(torrent);
        console.log('Added thumbnail:', thumbnailSrc, thumbnailImg);
        thumbnailImg.src = thumbnailSrc;
        thumbnailLink.appendChild(thumbnailImg);

        torrent.parentNode.parentNode.after(cell, torrent.parentNode);
        i++;
    }
    if (debug) console.log(`You should see ${i} thumbnails now.`);
    void(0);
}

// this is the selector for the element to append a page to it once it's in view
if (typeof inView !== "undefined")
    inView('body > div:nth-child(7)').on('enter', function () {
        appendPage(currentDocument.querySelector('a[title="next page"]'));
    });

clickToVerifyBrowser();

var title = 'DL&nbsp;ML',
    mls = appendColumn(),
    magnetImgData = 'data:image/svg+xml;base64,',
    appendedPageNum = 1;

const onLoad = function () {
    console.log('loaded');
    // check for captcha
    if (/rarbg.+threat_defence/i.test(location.href) && document.querySelector('#solve_string')) {
        console.log('rarbg threat defence page');
        solveCaptcha();
    }
    document.body.onclick = null; // remove annoying click listeners

    /** removes all coded functionality to the element by removing it and reappending it's outerHTML */
    function clearElementFunctions(element) {
        const outerHTML = element.outerHTML;
        element.after(createElement(outerHTML));
        element.remove();
    }
    // remove annoying search description
    if (q("#SearchDescription"))
        q("#SearchDescription").remove();


    observeDocument((target) => {
        dealWithTorrents(target);

        // remove links for adds that cover the screen
        for (const x of qa('[style*="2147483647"]')) {
            console.log('removed element covering everything:', x);
            x.remove();
        }
    });
};

onLoad();

let width = 200, maxwidth = 250, maxheight = 300;
var imagesList = [];	// just used to save image objects so that they won't get garbage-collected

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
table.lista2t tr.lista2 td {
    border-bottom: 1px solid #fff;
    min-width: 40px;
}

.magnet-cell img.preview-image {
    width: ${!Options.addThumbnails ? width * 0.5 : !Options.userLargeThumbnails ? width : width * 1.3}px;
    max-width: ${maxwidth * 1.4}px;
    max-height: ${(!Options.userLargeThumbnails ? width : maxwidth * 1.4) * 1.5}px;
    padding: 5px 5px;
}

.magnet-cell {
    text-align: center;
    max-width: ${maxwidth}px;
    max-height: ${maxheight}px;
}
a.torrent-ml, a.torrent-dl{
	display: table-cell;	
	padding: 5px;
}
a.torrent-ml > img, a.torrent-dl > img {
    width: 40px;
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

/**
 * @param numberOfSeeders
 * @return {number} alpha channel (between 0 and 1 but clamped between [0.2, 0.6]) according to the number of seeders
 */
function mapSeedersToAlpha(numberOfSeeders) {
    const alpha = 0.013 * Math.log(1 + numberOfSeeders) / Math.log(1.15);
    return Math.clamp(alpha, 0.1, 0.4);
}
function dealWithTorrents(node) {
    torrents = node.querySelectorAll('.lista2 td:nth-child(2) [href^="/torrent/"]');
    for (var i = 0; i < torrents.length; i++) {
        //creating and adding the elements
        const cell = document.createElement('td'),
            thumbnailLink = document.createElement('a'),
            thumbnailImg = document.createElement('img');

        switch (Options.thumbnailLink) {
            case "ml":
                try {
                    thumbnailLink.href = mls[i];
                    if (!/^magnet:\?/.test(thumbnailLink.href))  // noinspection ExceptionCaughtLocallyJS
                        throw new Error("Not a magnet link");
                } catch (e) {
                    thumbnailLink.href = getTorrentDownloadLinkFromAnchor(torrents[i]);
                }
                break;
            case "tor":
                try {
                    thumbnailLink.href = getTorrentDownloadLinkFromAnchor(torrents[i]);
                } catch (e) {
                    thumbnailLink.href = mls[i];
                    console.debug('Using MagnetLink for torrent thumbnail since torrent failed:', mls[i]);
                }
                break;
            case "page":
                thumbnailLink.href = torrents[i].href;
                break;
            case "img":
                thumbnailLink.href = thumbnailImg.src;
                break;
        }

        cell.classList.add('magnet-cell');

        cell.appendChild(thumbnailLink);

        if (thumbnailLink.href.indexOf('undefined') >= 0)
            console.warn(
                "thumbnail Link:", thumbnailLink,
                "torrents[i]:", torrents[i].innerText,
                "getTorrentDownloadLinkFromAnchor(torrents[i])", getTorrentDownloadLinkFromAnchor(torrents[i])
            );

        // thumbnail
        thumbnailImg.classList.add('preview-image');
        thumbnailImg.classList.add('zoom');

        thumbnailImg.onmouseover = function playSound(soundobj) {
            var thissound = document.getElementById('hoverSound');
            // if(thissound.paused)
            thissound.currentTime = 0;
            thissound.play();
        };

        let thumb = extractMouseoverThumbnail(torrents[i]);
        createAndAddAttribute(thumbnailImg, 'smallSrc', thumb);
        createAndAddAttribute(thumbnailImg, 'bigSrc', getLargeThumbnail(thumb));

        thumbnailLink.appendChild(thumbnailImg);
        setThumbnail(thumbnailImg);

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

        if (debug) console.log('column_Added:', column_Added);
        column_Added.innerHTML =
            column_Added.innerHTML + '<br>\n' + ((hours ? (hours + 'h') : '') + minutes ? (minutes + 'min') : '') + '&nbsp' + 'ago';


        // color backgrounds depending on the number of seeders
        const seedersFont = row.querySelector('font[color]');
        var statusRGB = hex2rgb(seedersFont.getAttribute('color')); // to color the row
        const clampedAlpha = mapSeedersToAlpha(parseInt(seedersFont.innerText));
        statusRGB.map(x => x * clampedAlpha * 10);
        statusRGB.push(clampedAlpha); // add alpha channel

        row.style.background = 'rgb(' + statusRGB.join(', ') + ')';
    }
    torrents.forEach(addImageSearchAnchor);
}

function setThumbnail(magnetImg) {

    if (!magnetImg.src) {
        magnetImg.src = magnetImg.getAttribute('smallSrc');
    }

    // creating image objects to add load listeners to them
    var smallImage = new Image();
    smallImage.src = magnetImg.getAttribute('smallSrc');
    // set to small src when loading small image
    smallImage.onLoad = function () {
        createAndAddAttribute(magnetImg, 'small-loaded');
        magnetImg.src = magnetImg.getAttribute('smallSrc');

        if (Options.userLargeThumbnails && magnetImg.getAttribute('big-loaded')) {
            magnetImg.src = magnetImg.getAttribute('bigSrc');
        }
    };
    // creating image objects to add load listeners to them
    var bigImage = new Image();
    bigImage.src = magnetImg.getAttribute('bigSrc');
    // set to small src when loading small image
    bigImage.onLoad = function () {
        createAndAddAttribute(magnetImg, 'big-loaded');

        if (Options.userLargeThumbnails) {
            magnetImg.src = magnetImg.getAttribute('bigSrc');
        }
    };

    // magnetImg.src = magnetImg.getAttribute((!Options.userLargeThumbnails ? 'smallSrc' : 'bigSrc'));
    if (Options.userLargeThumbnails)
        magnetImg.src = magnetImg.getAttribute('bigSrc');


    if (!Options.addThumbnails) {
        if (magnetImg.closest('a').href.indexOf('magnet:?') === 0) {	// if magnet link
            magnetImg.src = MAGNET_ICO;
        } else {	// if torrent link
            magnetImg.src = TORRENT_ICO;
        }
    }
}
function toggleThumbnailSize() {
    console.log('toggleThumbnailSize()');
    Options.userLargeThumbnails = !Options.userLargeThumbnails;
    document.querySelectorAll('.preview-image').forEach(setThumbnail);
    fixCss();
    if (debug) console.log('toggling thumbnail sizes. Options.userLargeThumbnails = ', Options.userLargeThumbnails);
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

/** @Return returns the extracted source url from the 'onmouseover' attribute */
function extractMouseoverThumbnail(torrentAnchor) {
    if (!torrentAnchor) console.warn('null torrent anchor:', torrentAnchor);
    let thb = '';
    try {
        // thb = thb.match(/(?<=(return overlib('\<img src\=\')))(.*?)(?=(\' border\=0\>\'))/i)[0];
        thb = torrentAnchor.getAttribute('onmouseover') || "";
        thb = thb.substring("return overlib('<img src=\'".length + 1, thb.length - "\' border=0>'".length - 2);
    } catch (r) {
        thb = magnetImgData;
        if (debug) console.error('getMouseoverThumbnail error:', r);
    }
    return thb;
}
function addImageSearchAnchor(torrentAnchor) {
    const searchTd = document.createElement('td'),
        searchLink = document.createElement('a')
    ;
    searchTd.style = "border-top-width: 10px; padding-top: 10px;";

    let searchQuery = cleanSymbols(torrentAnchor.title || torrentAnchor.innerText) //replacing common useless torrent terms
        // replace dates (numbers with dots between them)
            .replace(/\s\s+/g, ' ')	// removes double spaces
            .trim()
    ;

    /**
     * @return {string} the category of the torrent (Movies, XXX, TV Shows, Games, Music, Software, Non XXX)
     */
    function getCategory(torrentAnchor) {
        const anchor = torrentAnchor.parentNode.parentNode.parentNode.querySelector('table.lista2t a[href^="/torrents.php?category="]');
        /*
         *  extracting the code of the category from the url.
         *  example:
         *    TV shows:   .../torrents.php?category=18
         *    code is:  18
         */
        const categoryCode = anchor.href.split('torrents.php?category=').pop();
        // a map of the
        const catMap = {
            'Movies': 'Movies',
            '4': "XXX",
            '23': "Music",
            '18': "TV show",
            '33': "Software",
        };
        if (catMap.hasOwnProperty(categoryCode)) {
            return catMap[categoryCode];
        } else {
            console.debug('Uknown category:', categoryCode);
        }
    }

    searchLink.href = searchEngine.imageSearchUrl(searchQuery);
    try {
        if (Options.addCategoryWithSearch && !new RegExp(getCategory(torrentAnchor)).test(searchLink.href))
            searchLink.href += " " + getCategory(torrentAnchor);
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
    qText.innerHTML = (Options.showGeneratedSearchQuery) ? ':\t' + searchQuery : '';

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
    if (!pageLink) return;

    const tb = document.createElement('tr');
    const pageAnchor = createElement(`<td><a href="${pageLink.href}"><p1 style="white-space: nowrap;">Go to page ${++appendedPageNum}</p1></a></td>`);
    tb.appendChild(pageAnchor);
    tbodyEl.appendChild(tb);

    var req = new XMLHttpRequest();
    req.open('GET', pageLink.href);
    req.send();
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            var pageHTML = req.responseText;
            currentDocument = document.createElement('html');
            currentDocument.innerHTML = pageHTML;
            var lista2s = currentDocument.querySelectorAll('tbody>.lista2');
            if (debug) console.log('lista2s:', lista2s);
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
            appendPage(currentDocument.querySelector('a[title="next page"]'));
            break;
        case 191: // "/"
            console.log('clicking search input');
            const searchBar = q("#searchinput");
            searchBar.click();
            searchBar.scrollIntoView();
            searchBar.select();
            searchBar.setSelectionRange(0, searchBar.value.length); // this one is for compatability
            break;
        case 88:  // x
            location.assign("/torrents.php?category=2;4");
            break;
        case 37: // Left arrowKey
            e.preventDefault();
            prevPage.click();
            break;
        case 39:// Right arrowKey
            e.preventDefault();
            nextPage.click();
            break;
        case 192: // "`" backquote
            toggleThumbnailSize();
            break;
        case 83: // Ctrl + S
            if (e.ctrlKey) { // saves an html file containing the data
                let text = document.title + '\t' + Date.now() +
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

/** Create an element by HTML.
 example:   var myAnchor = createElement('<a href="https://example.com">Go to example.com</a>');*/
function createElement(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.childNodes[0];
}

function anchorClick(href, downloadValue, target) {
    downloadValue = downloadValue || '_untitled';
    var a = document.createElement('a');
    a.setAttribute('href', href);
    a.setAttribute('download', downloadValue);
    a.target = target;
    document.body.appendChild(a);
    a.click();
    a.remove();
}
function saveByAnchor(url, dlName) {
    anchorClick(url, dlName);
}
unsafeWindow.dlTorrents = dlTorrents;
function dlTorrents() {
    console.log('dlTorrents');
    const dlAnchors = document.querySelectorAll(".torrent-dl");
    if (confirm(`Would you like to download all the torrents on the page? (${dlAnchors.length})`)) {
        for (const dlAnchor of dlAnchors) {
            saveByAnchor(dlAnchor.href, new URL(dlAnchor.href).searchParams.get('f'));
        }
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

    // the rest cells of the new column
    document.querySelectorAll('.lista2t > tbody > tr[class="lista2"] > td:nth-child(3)')
        .forEach(fixCellCss);
    var oldColumn = Array.from(document.querySelectorAll('.lista2t > tbody > tr[class="lista2"] > td a[title]'))
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
        `<a href="${getTorrentDownloadLinkFromAnchor(cellNode.querySelector('a[title]'))}" class="torrent-dl" target="_blank" ><img src="${TORRENT_ICO}"></a>`
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

function getTorrentDownloadLinkFromAnchor(anchor) {
    return anchor.href.replace('torrent/', 'download.php?id=') + '&f=' + encodeURI(anchor.innerText) + '-[rarbg.com].torrent';
}

/**
 *
 * @param torrentLink
 * @return {*}
 */
function appendColumnSingle(torrentLink) {
    if (torrentLink.closest('tr.lista2').querySelector('.has-torrent-DL-ML')) // check that the same row doesn't already have DL-ML
        return;
    // the initial column 'Files' after of which the extra column will be appended
    // creation of the extra column

    torrentLink.insertAdjacentHTML('afterend', `<td>${title}</td>`);
    torrentLink.classList.add('has-torrent-DL-ML');

    // the rest cells of the new column
    fixCellCss(torrentLink.nextSibling);


    // populate the cells in the new column with DL and ML links
    return (addDlAndMl(torrentLink.nextSibling, torrentLink));
}

function matchSite(siteRegex) {
    let result = location.href.match(siteRegex);
    if (result) if (debug) console.log("Site matched regex: " + siteRegex);
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

function makeTextFile(text) {
    var data = new Blob([text], {type: 'text/plain'});
    var textFile = null;
    // If we are replacing a previously generated file we need to manually revoke the object URL to avoid memory leaks.
    if (textFile !== null) window.URL.revokeObjectURL(textFile);
    textFile = window.URL.createObjectURL(data);
    return textFile;
}


/**abbreviation for querySelectorAll()
 * @param selector
 * @param node
 * @return {set<HTMLElement>} */
function qa(selector, node = document) {
    return node.querySelectorAll(selector);
}
/**abbreviation for querySelector()
 * @param selector
 * @param node
 * @return {HTMLElement} */
function q(selector, node = document) {
    return node.querySelector(selector);
}

/**
 *    @author    https://codepen.io/frosas/
 *    Also works with scripts from other sites if they have CORS enabled (look for the header Access-Control-Allow-Origin: *).
 *
 *    // Usage
 *    var url = 'https://raw.githubusercontent.com/buzamahmooza/Helpful-Web-Userscripts/master/GM_dummy_functions.js?token=AZoN2Rl0UPDtcrOIgaESbGp_tuHy51Hmks5bpijqwA%3D%3D';
 *    loadGitHubScript(url).then((event) => {	});
 */
function loadGitHubScript(url) {
    return fetch(url).then(res => res.blob()).then(body => loadScript(URL.createObjectURL(body)));

    function loadScript(url) {
        return new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = function () {
                console.warn("couldn't load script: ", url);
                if (typeof reject === 'function')
                    reject();
            }; // TODO Not sure it really works
            document.head.appendChild(script);
        });
    }
}


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
