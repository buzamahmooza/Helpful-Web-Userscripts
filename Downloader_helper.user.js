// ==UserScript==
// @name         Downloader CLI
// @namespace    https://github.com/buzamahmooza
// @version      0.4
// @description  Adds shortcuts allowing the user to download images or elements on the page.
// @author       Faris Hijazi
// @match        *
// @include      *
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @grant        window.close
// @grant        window.focus
// @require      https://code.jquery.com/jquery-3.2.1.slim.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.4/jszip.min.js
// @require      https://github.com/buzamahmooza/Helpful-Web-Userscripts/raw/master/download_script.user.js
// @require      https://raw.githubusercontent.com/ccampbell/mousetrap/master/mousetrap.min.js
// @run-at       document-start
// ==/UserScript==

// @require      https://gist.github.com/buzamahmooza/73774aa6900fc4281d01c844433b9031/raw

const onDirectlyOpenImage = (document.images.length == 1 && document.images[0].src == window.location.href);

var defaultSelector = GM_getValue('defaultSelector', ':a[href],img[src],.img-big');
var defaultAttributes = GM_getValue('defaultAttributes', 'src,href,data-src');

// matches anything starting with ("/","//" or "http"), and ending with an image extension
const imageRegex = /(\/\/|http(s?:))[\d\w?%\-_\/\\=.]+?\.(jpg|png|jpeg|gif|tiff|&f=1)/gim;
// new RegExp(`(/{1,2}|http(s?:))[\d\w?%-_/\=.]+?.(jpg|png|jpeg|gif|tiff)((&f=1)?)`, "gim");
const vidRegex = /(\/\/|http(s?:))[\d\w?%\-_\/\\=.]+?\.(mov|webm|mp4|wmv|&f=1)/gim;
// new RegExp(`(/{1,2}|http(s?:))[\d\w?%-_/\=.]+?.(webm|mp4|wmv|ts|mov)((&f=1)?)`, "gim");


Mousetrap.bind("enter", handleDirectlyOpenImage);
Mousetrap.bind("ctrl+s", function(e) {
    switch (location.hostname) {
        case "yourporn.sexy"://  https://yourporn.sexy/post/
            e.preventDefault();
            f_youporn();
    }
});
Mousetrap.bind("ctrl+Shift+`", promptForDownloads);
Mousetrap.bind("alt+s", user_downloadImages);

//        Attempts downloading the images found on the page
//        Current method: downloads uses regex to match image links
function user_downloadImages() {
    console.log('Download all "Attempt to download images');
    let imgUrls = new Set(Array.from(qa('.img-big, [src*=".gif"]')).map(el => el.src));
    // parseImages();
    let vidUrls = parseVids();

    const message =
        `Download ${(vidUrls.size + imgUrls.size)} files?
Images: ${imgUrls.size}
Videos: ${vidUrls.size}`;
    if (confirm(message)) {
        if (imgUrls.size > 1) {
            downloadImageBatch(imgUrls);
        } else {
            downloadImageWithCondition(imgUrls.values().next().value);
        }
        downloadBatch(vidUrls);
    }
}

function parseImages() {
    var imgUrls = new Set();
    var imageMatches = document.documentElement.innerHTML.match(imageRegex);
    document.querySelectorAll('.big-img, .display-original-image:not(display-original-image-failed)').forEach(
        function (url) {
            try {
                imgUrls.add(url.href);
                imgUrls.add(url.src);
            } catch (e) {
                console.warn("Caught exception:", e);
            }
        }
    );
    if (imageMatches) for (const e of imageMatches) {
        imgUrls.add(e);
        console.log('Image url match:', e);
    }
    console.log('Image urls parsed:', imgUrls);
    return imgUrls;
}
function parseVids() {
    var vidUrls = new Set();
    var vidMatches = document.documentElement.innerHTML.match(vidRegex);
    document.querySelectorAll('vid, source').forEach(
        function (url) {
            try {
                vidUrls.add(url.href);
                vidUrls.add(url.src);
            } catch (e) {
                console.warn("Caught exception:", e);
            }
        }
    );
    console.log('vidMatches:', vidMatches);

    if (vidMatches) vidMatches.forEach(function (e) {
        vidUrls.add(e);
        console.log('Vid url match:', e);
    });
    console.log('Vid urls parsed:', vidUrls);
    return vidUrls;
}

function handleDirectlyOpenImage() {
    if (onDirectlyOpenImage) {
        console.log("pffft... A directly opened image? Easy...", location.href);
        var fname = null, dir = null, imgEl = q('img');
        download(location.href, fname, dir, imgEl);
        return true;
    }
}
// Ctrl+` : Displayes a prompt for the user to manually enter the download URLs
function promptForDownloads() {
    if (handleDirectlyOpenImage()) return;

    defaultSelector = GM_getValue('defaultSelector', ':a[href],img[src],.img-big');
    defaultAttributes = GM_getValue('defaultAttributes', 'src,href,data-src');
    const SELECTOR_FLAG = ':';


    // prompt for user input
    var input = prompt(`Enter URLs sperated by spaces. Hints: (for CSS selectors, start with "${SELECTOR_FLAG}".
    Use "$videos" and "$images" to parse the HTML.).`, defaultSelector);
    var selector = input.charAt(0) === SELECTOR_FLAG ? input.split(SELECTOR_FLAG).pop() : null; // gets the selector
    var userUrls = new Set();

    if (/\$videos/i.test(input)) {
        userUrls.add(parseVids());
    }
    if (/\$images/i.test(input)) {
        userUrls.add(parseImages());
    }
    if (selector) {
        var elements = document.querySelectorAll(selector);
        console.log(elements.length + ' elements match the selector:', `"${selector}"`);

        var attributesInput = prompt('Enter the attribute names containing the URLs (or \'*\' to use all attributes):', defaultAttributes);
        var attributeNames = new Set();
        attributesInput.replace(',', ' ').split(' ').forEach(function (e) {
            attributeNames.add(e);
        });
        if (/\*/.test(attributesInput)) { // if '*' found, push all attributes
            for (let el of elements)
                for (let attr of el.attributes)
                    userUrls.add(attr);
        }
        else {                        // if '*' NOT found, push from attributes list (if found)
            attributeNames.add('src');
            attributeNames.add('href');
            console.log('Attributes:', attributeNames);
            for (let el of elements)
                for (let attr of attributeNames)
                    if (el.hasAttribute(attr))
                        userUrls.add(el.getAttribute(attr));
        }

        console.log('Urls:', userUrls);
        if (selector) GM_setValue('defaultSelector', selector);            // save the user input since last time
        if (attributesInput) GM_setValue('defaultAttributes', attributesInput); // save the user input since last time
    } else {
        userUrls.add(input.replace(/,/gi, ' ').split(" "));
        if (input) GM_setValue('defaultSelector', input);          // save the user input since last time
        console.log('Urls passed', userUrls);
    }

    // printList(userUrls);
    console.log('userUrls', userUrls);
    // const message = `Download ${userUrls.size} files?`;

    if (userUrls.size > 1) {
        downloadBatch(userUrls);
    } else {
        var firstEl = userUrls.keys().next().value;
        download(firstEl);
        console.log('Downloading single file:', firstEl);
    }
}


function f_youporn() {
    console.log('Oh hey! I noticed you were on ' + location.hostname, "\nThe downloader script has special behaviour for this website.");
    var vid = document.querySelector('#player_el');
    console.log('vid:', vid);
    var url = vid.src ? vid.src : vid.querySelector('source').src;
    var name = document.querySelector('[itemprop="description"]').getAttribute('content'); //document.title;
    download(url, name, location.hostname);

    (function () {
        var vid_container = document.querySelectorAll('div.vid_container');

        var dl = confirm("Download " + vid_container.length + " vids?");
        var dlOgs = confirm("Open the site pages and download the full videos too?");

        for (const block of vid_container) {
            try {
                const vidthumb = block.querySelector('video').src;

                const anchor = block.querySelector('a.tdn');
                const title = anchor.title;
                const page = anchor.href;

                console.log('Vidthumb:', vidthumb,
                    '\ntitle:', title,
                    '\npage:', page);
                if (dl)
                    download(vidthumb, "VidThumb " + title, location.hostname + "/_VidThumbs");

                if (dlOgs)
                    fetchElement(page, function (doc, url, opts) {
                        //var matches = doc.innerHTML.match(vidRegex);
                        //if(!matches) { console.warn('First vid not found :('); return; }
                        var firstVid = doc.querySelector('video');
                        download(firstVid.src, doc.querySelector('[itemprop="description"]').getAttribute('content'), location.hostname);
                    });
            } catch (e) {
                console.warn(e);
            }
        }
    })();
}
