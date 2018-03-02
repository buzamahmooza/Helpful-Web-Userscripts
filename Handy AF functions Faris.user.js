// ==UserScript==
// @name         Faris Handy Webdev JavaScript functions
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  A bunch of useful JavaScript functions
// @description  This is not a regular script for you to run! Only use this via the @require keyword.
// @author       Faris Hijazi
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @grant        window.close
// @grant        window.focus
// ==/UserScript==

// noinspection ES6ConvertVarToLetConst
var debug;

if (typeof debug === 'undefined') {
    debug = false;
}
if (typeof log === 'undefined') {
    log = function (msg) {
        if (debug) console.log('Log:', msg);
    };
}
GoogleImagesSearchURL = "https://encrypted.google.com/search?&hl=en&tbm=isch&q=";
GoogleReverseImagesSearchURL = "https://encrypted.google.com/searchbyimage?&image_url=";

unsafeWindow.GoogleImagesSearchURL = "https://encrypted.google.com/search?&hl=en&tbm=isch&q=";
unsafeWindow.GoogleReverseImagesSearchURL = "https://encrypted.google.com/searchbyimage?&image_url=";
unsafeWindow.log = log;
unsafeWindow.setLog = function (debugState) {
    if (typeof debugState === "boolean") debug = debugState;
};
unsafeWindow.matchSite = matchSite;
unsafeWindow.ddgProxy = ddgProxy;
unsafeWindow.createElement = createElement;
unsafeWindow.getOGZscalarLink = getOGZscalarLink; //TODO: change "link" to "url"
unsafeWindow.loadScript = loadScript;
unsafeWindow.reverseDdgProxy = reverseDdgProxy;
unsafeWindow.createAndAddAttribute = createAndAddAttribute;
unsafeWindow.toDdgProxy = function () {
    location.href = ddgProxy(location.href);
};
unsafeWindow.isIterable = obj => obj != null && typeof obj[Symbol.iterator] === 'function';

unsafeWindow.q = q;
unsafeWindow.qa = qa;
unsafeWindow.siteSearchUrl = siteSearchUrl;
unsafeWindow.getAbsoluteURI = getAbsoluteURI;

/**Returns the HOSTNAME of a website url*/
unsafeWindow.getHostname = getHostname;
/***/
unsafeWindow.openAllLinks = function () {
    const links = document.links;
    links.forEach(function (link) {
        if (link.hasAttribute("href") && /[^#\0]/.test(link.href))
            window.open(link.href);
    });
};

/**Returns a DuckDuckGo proxy url (attempts to unblock the url)*/
function ddgProxy(url) {
    return ("https://proxy.duckduckgo.com/iu/?u=" + encodeURIComponent(url) + "&f=1");
}

/**Opens the url via fetch(), then performs a callback giving it the document element*/
unsafeWindow.fetchElement = fetchElement;
/**Opens the url via xmlhttpRequest, then performs a callback giving it the document element*/
unsafeWindow.xmlRequestElement = xmlRequestElement;


/**Returns the url wrapped with proxy.DuckDuckGo.com */
function reverseDdgProxy(url) {
    return decodeURIComponent(url.match(/(?<=(https:\/\/proxy\.duckduckgo\.com\/iu\/\?u=))(.*?)(?=(&f=1))/i)[0]);
}

/** Create an element by typing it's inner HTML.
 example:   var myAnchor = createElement('<a href="https://example.com">Go to example.com</a>');*/
function createElement(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.childNodes[0];
}

function matchSite(siteRegex) {
    let result = location.href.match(siteRegex);
    if (result) log("Site matched regex: " + siteRegex);
    return result;
}

function siteSearchUrl(query) {
    return GoogleImagesSearchURL + "site:" + query;
}

/**abbreviation for querySelectorAll()*/
function qa(selector) {
    let x = document.querySelectorAll(selector);
    return x ? x : null;
}

/**abbreviation for querySelector()*/
function q(selector) {
    let x = document.querySelector(selector);
    return x ? x : null;
}

/**Returns the original link that ZScalar is blocking*/
function getOGZscalarLink(zscalarUrl) {
    let x = decodeURIComponent(('' + zscalarUrl).substring(46, zscalarUrl.indexOf('&referer')));
    log('Extracted ZScalar original link:', x);
    return x;
}

function loadScript(url, callback) {
    let script = document.createElement("script");
    script.type = "text/javascript";
    if (script.readyState) { //IE
        script.onreadystatechange = function () {
            if (script.readyState === "loaded" ||
                script.readyState === "complete") {
                script.onreadystatechange = null;
                callback();
            }
        };
    } else { //Others
        script.onload = function () {
            callback();
        };
    }
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

function createAndAddAttribute(node, attributeName, attributeValue) {
    if (!node) {
        console.error('Node is null, cannot add attribute.');
        return;
    }

    let att = document.createAttribute(attributeName);
    att.value = attributeValue;
    node.setAttributeNode(att);
}


/** Deal with relative URIs (URIs starting with "/" or "//") */
function getAbsoluteURI(inputUrl) {
    return inputUrl
        .replace(new RegExp(`^//`), (location.protocol + "//"))        // If string starts with "//", replace with protocal
        .replace(new RegExp(`^/`), getHostname(location.href) + "/") // convert relative uri (preceed with hostname if URI starts with "/")
        ;
}


/**@deprecated Opens the url via xmlhttpRequest, then performs a callback giving it the document element*/
function xmlRequestElement(url, callback) {
    if (typeof callback !== 'function') console.error("The callback is not a function", callback);
    const req = new XMLHttpRequest();
    req.open('GET', url);
    req.send();
    req.onreadystatechange = function () {
        if (req.readyState === req.DONE) {
            const pageHTML = req.responseText;
            const doc = document.createElement('html');
            doc.innerHTML = pageHTML;

            console.log('Recieved document for page ', url + ":", doc);

            callback(doc, url);
        }
    };
}

/**Opens the url, then performs a callback giving it the document element
 * @param url
 * @param callback
 * @param opts      Options object.
 *                  "args":   Arguments to pass to the callback (Array or Object type)
 */
function fetchElement(url, callback, opts) {
    if (typeof callback !== 'function') console.error('Callback is not a function.!');
    fetch(url).then(
        response => response.text() // .json(), etc.
        // same as function(response) {return response.text();}
    ).then(function (html) {
            const doc = document.createElement('html');
            doc.innerHTML = html;
            // let title = html.match(new RegExp(`(?<=(<title>))(.*?)(?=(</title>))`))[0];
            callback(doc, url, opts);
        }
    );
}

function getHostname(href) {
    const l = document.createElement("a");
    l.href = href;
    return l.hostname.replace('www.', '');
}

/**
 * Under construction! TODO:
 */
function removeEventListeners(eventTarget) {
    // noinspection JSUnresolvedFunction
    let listeners = eventTarget.getEventListeners(eventTarget);
    listeners.forEach(function (listener) {
        console.log('removing listener:', listener);
        eventTarget.removeEventListener("click", listener, false);
    });
}