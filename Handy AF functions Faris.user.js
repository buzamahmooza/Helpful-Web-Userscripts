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
// @run-at		 document-start
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// ==/UserScript==

// noinspection ES6ConvertVarToLetConst
var debug;

/**/
if (typeof unsafeWindow === "undefined") unsafeWindow = window;
if (typeof debug === 'undefined') debug = true;
if (typeof log === 'undefined')
    log = (...arguments) => (debug) ? console.log('Log:', ...arguments) : false;

URL_REGEX_STR = `(//|http(s?:))[\\d\\w?%\\-_/\\\\=.]+?`;
IMAGE_URL_REGEX = new RegExp(`(//|http(s?:))[\\d\\w?%\\-_/\\\\=.]+?\\.(jpg|png|jpeg|gif|tiff|&f=1)`, 'gim');
// /(\/\/|http(s?:))[\d\w?%\-_\/\\=.]+?\.(jpg|png|jpeg|gif|tiff|&f=1)/gim;
VID_URL_REGEX = /(\/\/|http(s?:))[\d\w?%\-_\/\\=.]+?\.(mov|webm|mp4|wmv|&f=1)/gim;

var useEncryptedGoogle = /encrypted.google.com/.test(location.hostname);
var googleBaseURL = "https://" + (useEncryptedGoogle ? "encrypted" : "www") + ".google.com";
gImgSearchURL = googleBaseURL + "/search?&hl=en&tbm=isch&q=";
gImgReverseSearchURL = googleBaseURL + "/searchbyimage?&image_url=";

if (typeof GM_xmlhttpRequest !== 'undefined')
    unsafeWindow.GM_xmlhttpRequest =
        /**
         * Description
         GM_xmlhttpRequest is a cross-origin version of XMLHttpRequest. The beauty of this function is that a user script can make requests that do not use the same-origin policy, creating opportunities for powerful mashups.

         Restrictions
         GM_xmlhttpRequest restricts access to the http, https, ftp, data, blob, and moz-blob protocols.

         If a script uses one or more @domains then the GM_xmlhttpRequest api will be restricted to those domains.

         If the url provided does not pass the above criteria then a error will be thrown when calling GM_xmlhttpRequest

         Arguments
         Object details
         A single object with properties defining the request behavior.

         String method: Optional. The HTTP method to utilize. Currently only "GET" and "POST" are supported. Defaults to "GET".
         String url: The URL to which the request will be sent. This value may be relative to the page the user script is running on.
         Function onload: Optional. A function called if the request finishes successfully. Passed a Scriptish response object (see below).
         Function onerror: Optional. A function called if the request fails. Passed a Scriptish response object (see below).
         Function onreadystatechange: Optional. A function called whenever the request's readyState changes. Passed a Scriptish response object (see below).
         String data: Optional. Content to send as the body of the request.
         Object headers: Optional. An object containing headers to be sent as part of the request.
         Boolean binary: Optional. Forces the request to send data as binary. Defaults to false.
         Boolean makePrivate: Optional. Forces the request to be a private request (same as initiated from a private window). (0.1.9+)
         Boolean mozBackgroundRequest: Optional. If true security dialogs will not be shown, and the request will fail. Defaults to true.
         String user: Optional. The user name to use for authentication purposes. Defaults to the empty string "".
         String password: Optional. The password to use for authentication purposes. Defaults to the empty string "".
         String overrideMimeType: Optional. Overrides the MIME type returned by the server.
         Boolean ignoreCache: Optional. Forces a request to the server, bypassing the cache. Defaults to false.
         Boolean ignoreRedirect: Optional. Forces the request to ignore both temporary and permanent redirects.
         Boolean ignoreTempRedirect: Optional. Forces the request to ignore only temporary redirects.
         Boolean ignorePermanentRedirect: Optional. Forces the request to ignore only permanent redirects.
         Boolean failOnRedirect: Optional. Forces the request to fail if a redirect occurs.
         Integer redirectionLimit: Optional. Range allowed: 0-10. Forces the request to fail if a certain number of redirects occur.
         Note: A redirectionLimit of 0 is equivalent to setting failOnRedirect to true.
         Note: If both are set, redirectionLimit will take priority over failOnRedirect.

         Note: When ignore*Redirect is set and a redirect is encountered the request will still succeed, and subsequently call onload. failOnRedirect or redirectionLimit exhaustion, however, will produce an error when encountering a redirect, and subsequently call onerror.

         Response Object
         This is the response object passed to the onload, onerror, and onreadystatechange callbacks described for the details object above.

         String responseText: The response to the request in text form.
         String responseJSON: If the content type is JSON (example: application/json, text/x-json, and more..) then responseJSON will be available.
         Integer readyState: The state of the request. Refer to https://developer.mozilla.org/en/XMLHttpRequest#Properties
         String responseHeaders: The string value of all response headers. null if no response has been received.
         Integer status: The HTTP status code from the server. null if the request hasn't yet completed, or resulted in an error.
         String statusText: The entire HTTP status response string from the server. null if the request hasn't yet completed, or resulted in an error.
         String finalUrl: The final URL used for the request. Takes redirects into account. null if the request hasn't yet completed, or resulted in an error.
         For "onprogress" only:

         Boolean lengthComputable: Whether it is currently possible to know the total size of the response.
         Integer loaded: The number of bytes loaded thus far.
         Integer total: The total size of the response.
         Returns
         */
        GM_xmlhttpRequest;

unsafeWindow.URL_REGEX_STR = URL_REGEX_STR;
unsafeWindow.VID_URL_REGEX = VID_URL_REGEX;
unsafeWindow.IMAGE_URL_REGEX = IMAGE_URL_REGEX;
unsafeWindow.gImgSearchURL = gImgSearchURL;
unsafeWindow.gImgReverseSearchURL = gImgReverseSearchURL;
unsafeWindow.log = log;
unsafeWindow.setLog = newDebugState => debug = (typeof newDebugState === "boolean") ? newDebugState : debug;
unsafeWindow.matchSite = matchSite;
unsafeWindow.createElement = createElement;
unsafeWindow.loadScript = loadScript;
unsafeWindow.ddgProxy = ddgProxy;
unsafeWindow.getOGZscalarUrl = getOGZscalarUrl;
unsafeWindow.reverseDdgProxy = reverseDdgProxy;
unsafeWindow.isDdgUrl = isDdgUrl;
unsafeWindow.targetIsInput = targetIsInput;
unsafeWindow.createAndAddAttribute = createAndAddAttribute;
unsafeWindow.getGImgReverseSearchURL = getGImgReverseSearchURL;

unsafeWindow.toDdgProxy = () => location.href = ddgProxy(location.href);
unsafeWindow.isIterable = obj => obj != null && typeof obj[Symbol.iterator] == 'function';

unsafeWindow.q = q;
unsafeWindow.qa = qa;
unsafeWindow.siteSearchUrl = siteSearchUrl;
unsafeWindow.getAbsoluteURI = getAbsoluteURI;

/**Returns the HOSTNAME of a website url*/
unsafeWindow.getHostname = getHostname;
/***/
unsafeWindow.openAllLinks = function () {
    Array.from(document.links).forEach(function (link) {
        if (link.hasAttribute("href"))
            window.open(link.href);
    });
};

/**Returns a DuckDuckGo proxy url (attempts to unblock the url)*/
function ddgProxy(url) {
    return isDdgUrl(url) ? url : (`https://proxy.duckduckgo.com/iu/?u=${encodeURIComponent(url)}&f=1`);
}

/**Opens the url via fetch(), then performs a callback giving it the document element*/
unsafeWindow.fetchElement = fetchElement;
/**Opens the url via xmlhttpRequest, then performs a callback giving it the document element*/
unsafeWindow.xmlRequestElement = xmlRequestElement;

unsafeWindow.onLoadDim = onLoadDim;

unsafeWindow.addCss = addCss;

unsafeWindow.observe = observe;

unsafeWindow.gfycatPage2GifUrl = function (gfycatPageUrl) {
    if (!/https:\/\/gfycat\.com\/gifs\/detail\/.+/.test(gfycatPageUrl))
        throw error("Not a gfycat home url:" + gfycatPageUrl);
    return `https://thumbs.gfycat.com/${gfycatPageUrl.split('/').pop()}-size_restricted.gif`;
};

unsafeWindow.preloader = preloader;

unsafeWindow.waitForElement = waitForElement;

unsafeWindow.includeJS = includeJS;

function addCss(css) {
    const style = document.createElement('style');
    if (style.styleSheet)
        style.styleSheet.cssText = css;
    else
        style.appendChild(document.createTextNode(css));
    return document.getElementsByTagName('head')[0].appendChild(style);
}


/**
 * @param targetElement
 * @param callback
 * @param options   mutationObserver options{ childList: boolean, subtree: boolean, attributes: boolean, characterData: boolean }
 * @returns the mutationObserver object
 */
function observe(targetElement, callback, options) {
    if (!targetElement) targetElement = document.body;
    if (!options) options = {
        childList: true, subtree: true,
        attributes: false, characterData: false
    };
    const mutationsHandler = function (mutations) {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length)
                callback(mutation.target);
            callback();
        }
    };
    callback(targetElement);
    const mutationObserver = new MutationObserver(mutationsHandler);
    mutationObserver.observe(targetElement, options);
    return mutationObserver;
}

function getGImgReverseSearchURL(url) {
    return url ? gImgReverseSearchURL + encodeURIComponent(url.trim()) : "";
}

/**Returns the url wrapped with proxy.DuckDuckGo.com */
function reverseDdgProxy(url) {
    var s = url;
    if (isZscalarUrl(url)) s = getOGZscalarUrl(url); // extra functionality:
    // var s = url.substring("https://proxy.duckduckgo.com/iu/?u=", url.indexOf("&f=1") > -1 ? url.indexOf("&f=1") : (url.length - 1));
    if (isDdgUrl(url)) {
        s = s.trim().match(/(?<=(https:\/\/proxy\.duckduckgo\.com\/iu\/\?u=))(.+?)(?=(&f=1|$))/i);
    }
    // https://proxy\.duckduckgo\.com/iu/\?u=
    if (s && s[0])
        return decodeURIComponent(s[0]);
    else {
        console.log('Was unable to reverseDDGProxy for URL:', url);
        return s;
    }
}

unsafeWindow.regexBetween = function (preceedingRegEx, betweenRegEx, proceedingRegEx, regexOptions) {
    return new RegExp(`(?<=(${preceedingRegEx}))(${!betweenRegEx ? ".+?" : betweenRegEx})(?=(${proceedingRegEx}))`, regexOptions)
};
unsafeWindow.extend = function () {
    return $extend();
};

function preloader(imgUrls) {
    console.log('imgs passed:', imgUrls);
    let imgObjs = [];
    // start preloading
    for (const url of imgUrls) {
        // create object
        let imageObj = new Image();
        imageObj.src = url;
        imageObj.onload = (function () {
            console.log('ImageLoaded:', this.src, this);
        });
        imgObjs.push(imageObj);
    }
}

// http://code.jquery.com/jquery.js
function includeJS(src) {
    const s = document.createElement('script');
    s.setAttribute('src', src);
    document.getElementsByTagName('body')[0].appendChild(s);
}

//TODO:
/**
 * @param {function} elementGetter a function to get the wanted element (or event a condition function)
 * that will be called to test if the element has appeared yet. (should return true only when the element appears)
 * @param callback  the elementGetter will be passed as the first argument
 * @return {MutationObserver}
 */
function waitForElement(elementGetter, callback) {
    const observer = new MutationObserver(function (mutations, me) {
        // mutations.forEach(function (mutation) {
        // if (!mutation.addedNodes) return false;

        function handleSuccess(node) {
            // console.debug('Wanted node found:', node);
            callback(node);
            me.disconnect();
        }

        // for (let i = 0; i < mutation.addedNodes.length; i++) {
        //     var node = mutation.addedNodes[i];
        var node = (typeof(elementGetter) === 'function') ? elementGetter() : q(elementGetter);
        try {
            if (node) {
                if (node.length !== undefined && node.length !== 0)
                    for (const n of node)
                        handleSuccess(n);
                else if (node.length === undefined)
                    handleSuccess(node);
            }
        } catch (e) {
            console.warn(e);
        }
        // }
        // });
    });

    observer.observe(document.body, {
        childList: true
        , subtree: true
        , attributes: false
        , characterData: false
    });
    return observer;
// stop watching using: observer.disconnect();
}

/**
 * cross-browser wheel delta
 * Returns the mousewheel scroll delta as -1 (wheelUp) or 1 (wheelDown) (cross-browser support)
 * @param {MouseWheelEvent} wheelEvent
 * @return {number} -1 or 1
 */
function getWheelDelta(wheelEvent) {
    // cross-browser wheel delta
    wheelEvent = window.event || wheelEvent; // old IE support
    return Math.max(-1, Math.min(1, (wheelEvent.wheelDelta || -wheelEvent.detail)));
}

function elementUnderMouse(wheelEvent) {
    return document.elementFromPoint(wheelEvent.clientX, wheelEvent.clientY);
}

/** Create an element by typing it's inner HTML.
 For example:   var myAnchor = createElement('<a href="https://example.com">Go to example.com</a>');
 * @param html
 * @return {Node}
 */
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
    if (query)
        return gImgSearchURL + "site:" + encodeURIComponent(query.trim());
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

function isZscalarUrl(zscalarUrl) {
    return /https:\/\/zscaler\.kfupm\.edu\.sa\/Default\.aspx\?url=/.test(zscalarUrl);
}

/**Returns the original link that ZScalar is blocking*/
function getOGZscalarUrl(zscalarUrl) {
    if (!isZscalarUrl(zscalarUrl))
        return zscalarUrl; // not a zscalar url
    zscalarUrl = zscalarUrl.trim();
    let x = decodeURIComponent(('' + zscalarUrl).substring(46, zscalarUrl.indexOf('&referer')));
    // let x = decodeURIComponent(('' + zscalarUrl).substring(46, zscalarUrl.indexOf('&referer')));
    log('Extracted ZScalar original link:', x);
    return x;
}

/*function loadScript(url, callback) {
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
}*/
function loadScript(url, callback, type) {
    if (!callback) callback = () => console.log('Script laoded:', url);
    // Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    if (!type) type = 'text/javascript';
    script.type = type;
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
    return script;
}

unsafeWindow.loadModule = loadModule;

function loadModule(url, callback) {
    return loadScript(url, callback, 'module');
}

function createAndAddAttribute(node, attributeName, attributeValue) {
    if (!node) {
        console.error('Node is null, cannot add attribute.');
        return;
    }

    if (!node.hasAttribute(attributeName)) {
        var attr = document.createAttribute(attributeName);
        attr.value = attributeValue;
        node.setAttributeNode(attr);
    }
    if (!!attributeValue)
        node.setAttribute(attributeName, attributeValue);
}


/** Deal with relative URIs (URIs starting with "/" or "//") */
function getAbsoluteURI(inputUrl) {
    return inputUrl
        .replace(new RegExp(`^//`), (location.protocol + "//"))        // If string starts with "//", replace with protocal
        .replace(new RegExp(`^/`), getHostname(location.href) + "/") // convert relative uri (preceed with hostname if URI starts with "/")
        ;
}

/**
 * Returns true if the event target is an input element (such as a textfield).
 * This is useful when you want to remap letter keys only when you are not typing in a text field :)
 * @param event
 * @return {boolean}
 */
function targetIsInput(event) {
    const ignores = document.getElementsByTagName('input');
    const target = event.target;
    for (let ignore of ignores)
        if (target === ignore || ignore.contains(target)) {
            // console.log('The target recieving the keycode is of type "input", so it will not recieve your keystroke', target);
            return true;
        }
    return false;
}

/** Calls the callback function, passing to it the width and height: "callback(w, h)"
 * @param url
 * @param callback  callback(width, height, url, imgNode, opts)
 * @param imgNode
 * @param opts
 */
function onLoadDim(url, callback, imgNode, opts) {
    var img = new Image();
    if (!url) {
        console.warn('Url is invalid');
        return;
    }
    if (typeof url !== "string")
        url = !!url.src ? url.src : url.href;

    if (typeof callback === 'function') {
        img.addEventListener('load', function () {
            callback(this.naturalWidth, this.naturalHeight, url, imgNode, opts);
        });
    } else
        console.error('onLoad() callback passed should be of type "function".');
    img.src = url;
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
 * @param {string} url
 * @param {function} callback   passes: (doc, url, opts) to the callback function when the response is complete
 * @param {o} opts  Options object.
 *                  "args":   Arguments to pass to the callback (Array or Object type)
 */
function fetchElement(url, callback, opts) {
    if (typeof callback !== 'function') console.error('Callback is not a function.!');
    fetch(url).then(
        response => response.text() // .json(), etc.
        // same as function(response) {return response.text();}
    ).then(function (html) {
            var doc = document.implementation.createHTMLDocument('');
            doc.open();
            doc.write(html);
            doc.close();
            // doc.location = new window.location(url); //TODO: fix
            try {
                callback(doc, url, opts);
            } catch (e) {
                console.error(e);
            }
        }
    );
}

function isDdgUrl(url) {
    return /^https:\/\/proxy\.duckduckgo\.com/.test(url);
}

/**
 * @param href
 * @param keepPrefix    defaults to false
 *        www.example.com
 *        if true:      example.com
 *        if false:     www.example.com
 * @returns {string} Returns the hostname of the site URL
 */
function getHostname(href, keepPrefix) {
    const l = document.createElement("a");
    l.href =
        // (keepPrefixAndProtocol ? (l.protocol.length ? l.protocol : "https://") : "") +
        href;
    if (keepPrefix) console.debug("getHostname href =", href);
    const hostname = l.hostname;
    return !keepPrefix ? hostname.replace('www.', '') : hostname;
}

function getIframeDoc(iframe) {
    return iframe.contentDocument || iframe.contentWindow.document;
}

/**
 * Under construction! TODO:
 */
function removeEventListeners(eventTarget) {

    eventType = "click";
    eventTarget = window;

    for (var eventType in window.getEventListeners(eventTarget)) {
        for (let o of getEventListeners(eventTarget)[eventType]) {
            console.log('before:', o);
            o.listener = null;
            console.log('after:', o);
        }
    }


    // noinspection JSUnresolvedFunction
    let listeners = eventTarget.getEventListeners(eventTarget);
    listeners.forEach(function (listener) {
        console.log('removing listener:', listener);
        eventTarget.removeEventListener("click", listener, false);
    });
}

unsafeWindow.removeDoubleSpaces = removeDoubleSpaces;
unsafeWindow.clearGibberish = clearGibberish;
unsafeWindow.isBase64ImageData = isBase64ImageData;

/**
 * Returns true if the string is an image data string
 * @param str
 * @returns {boolean}
 */
function isBase64ImageData(str) {
    return /^data:image\/.{1,5};base64/.test(str);
}

function removeDoubleSpaces(str) {
    return str ? str.replace(/(\s\s+)/g, " ") : str;
}

function clearGibberish(str, gibberishRatioThreshold) {
    if (str) {
        const gibberishRegex = /(\W{2,})|(\d{3,})|(\d+\w{1,5}\d+){2,}/g;
        let noGibberish = removeDoubleSpaces(str.replace(gibberishRegex, " "));
        if (noGibberish.length < 3) return str;
        gibberishRatioThreshold = 0.4 | gibberishRatioThreshold;
        // const reducedGibberish = Array.from(gibberish).reduce((total, num) => total + num);
        /**
         * WGR: Word to Gibberish Ratio (between 0 and 1)
         * 0:   No gibberish    (Good)
         * 1:   100% Gibberish  (Bad)
         * @type {number}
         */
        let wGratio = (str.length - noGibberish.length) / str.length;
        if (0 == 1)
            console.log('Original:', str,
                '\nNoGibberish:', noGibberish,
                '\nRatio:', wGratio
            );

        if (wGratio > gibberishRatioThreshold) {
            return clearGibberish(noGibberish, gibberishRatioThreshold);
        } else {
            return str.length > 3 ? str : "";
        }
    } else return "";
}

/**
 * @param {function} condition
 * @param {function} action
 * @param {number} interval
 */
function waitFor(condition, action, interval) {
    if (typeof condition === 'undefined') {
        console.error('"condition" should be a function type:', condition);
        return false;
    }
    if (typeof action === 'undefined') {
        console.error('"condition" should be a function type:', action);
        return false;
    }
    if (!interval) interval = 50;

    var checkExist = setInterval(function () {
        if (condition) {
            console.log("Exists!");
            clearInterval(checkExist);
            action();
        }
    }, interval);
}

function downloadUsingXmlhttpRequest(url, opts) {
    var imgUrl = "http://static.jsbin.com/images/dave.min.svg?4.1.4";
    GM_xmlhttpRequest({
        method: 'GET',
        url: imgUrl,
        onload: function (respDetails) {
            var binResp = customBase64Encode(respDetails.responseText);

            /*-- Here, we just demo that we have a valid base64 encoding
                by inserting the image into the page.
                We could just as easily AJAX-off the data instead.
            */
            var zImgPara = document.createElement('p');
            var zTargetNode = document.querySelector("body *"); //1st child

            zImgPara.innerHTML = 'Image: <img src="data:image/png;base64,'
                + binResp + '">';
            zTargetNode.parentNode.insertBefore(zImgPara, zTargetNode);
        },
        overrideMimeType: 'text/plain; charset=x-user-defined'
    });


    function customBase64Encode(inputStr) {
        var
            bbLen = 3,
            enCharLen = 4,
            inpLen = inputStr.length,
            inx = 0,
            jnx,
            keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
                + "0123456789+/=",
            output = "",
            paddingBytes = 0;
        var
            bytebuffer = new Array(bbLen),
            encodedCharIndexes = new Array(enCharLen);

        while (inx < inpLen) {
            for (jnx = 0; jnx < bbLen; ++jnx) {
                /*--- Throw away high-order byte, as documented at:
                  https://developer.mozilla.org/En/Using_XMLHttpRequest#Handling_binary_data
                */
                if (inx < inpLen)
                    bytebuffer[jnx] = inputStr.charCodeAt(inx++) & 0xff;
                else
                    bytebuffer[jnx] = 0;
            }

            /*--- Get each encoded character, 6 bits at a time.
                index 0: first  6 bits
                index 1: second 6 bits
                            (2 least significant bits from inputStr byte 1
                             + 4 most significant bits from byte 2)
                index 2: third  6 bits
                            (4 least significant bits from inputStr byte 2
                             + 2 most significant bits from byte 3)
                index 3: forth  6 bits (6 least significant bits from inputStr byte 3)
            */
            encodedCharIndexes[0] = bytebuffer[0] >> 2;
            encodedCharIndexes[1] = ((bytebuffer[0] & 0x3) << 4) | (bytebuffer[1] >> 4);
            encodedCharIndexes[2] = ((bytebuffer[1] & 0x0f) << 2) | (bytebuffer[2] >> 6);
            encodedCharIndexes[3] = bytebuffer[2] & 0x3f;

            //--- Determine whether padding happened, and adjust accordingly.
            paddingBytes = inx - (inpLen - 1);
            switch (paddingBytes) {
                case 1:
                    // Set last character to padding char
                    encodedCharIndexes[3] = 64;
                    break;
                case 2:
                    // Set last 2 characters to padding char
                    encodedCharIndexes[3] = 64;
                    encodedCharIndexes[2] = 64;
                    break;
                default:
                    break; // No padding - proceed
            }

            /*--- Now grab each appropriate character out of our keystring,
                based on our index array and append it to the output string.
            */
            for (jnx = 0; jnx < enCharLen; ++jnx)
                output += keyStr.charAt(encodedCharIndexes[jnx]);
        }
        return output;
    }
}

/*global self */

/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */
/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/src/FileSaver.js */
/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.3.8
 * 2018-03-22 14:03:47
 *
 * By Eli Grey, https://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 *
 */
// noinspection ThisExpressionReferencesGlobalObjectJS
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

    // todo: detect chrome extensions & packaged apps
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
}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this));
/*`self` is undefined in Firefox for Android content script context
while `this` is nsIContentFrameMessageManager
with an attribute `content` that corresponds to the window*/
if (typeof module !== "undefined" && module.exports) {
    module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd !== null)) {
    define([], function () {
        return saveAs;
    });
}
/*   Example:
 *   var blob = new Blob(["Hello, world!"], {type: "text/plain;charset=utf-8"});
 *   saveAs(blob, "hello world.txt");
 */
unsafeWindow.saveAs = saveAs;
unsafeWindow.fetchUsingProxy = fetchUsingProxy;

/**
 * @param url
 * Found from:    https://stackoverflow.com/questions/43871637/no-access-control-allow-origin-header-is-present-on-the-requested-resource-whe
 * @param callback
 * @see     https://cors-anywhere.herokuapp.com/
 */
function fetchUsingProxy(url, callback) {
    const proxyurl = "https://cors-anywhere.herokuapp.com/";
    callback = callback | (contents => console.log(contents));
    fetch(proxyurl + url) // https://cors-anywhere.herokuapp.com/https://example.com
        .then(response => response.text())
        .then(callback)
        .catch(() => console.error(`Can’t access ${url} response. Blocked by browser?`))
}

unsafeWindow.KeyEvent = {
    DOM_VK_BACKSPACE: 8,
    DOM_VK_TAB: 9,
    DOM_VK_ENTER: 13,
    DOM_VK_SHIFT: 16,
    DOM_VK_CTRL: 17,
    DOM_VK_ALT: 18,
    DOM_VK_PAUSE_BREAK: 19,
    DOM_VK_CAPS_LOCK: 20,
    DOM_VK_ESCAPE: 27,
    DOM_VK_PGUP: 33, DOM_VK_PAGE_UP: 33,
    DOM_VK_PGDN: 34, DOM_VK_PAGE_DOWN: 34,
    DOM_VK_END: 35,
    DOM_VK_HOME: 36,
    DOM_VK_LEFT: 37, DOM_VK_LEFT_ARROW: 37,
    DOM_VK_UP: 38, DOM_VK_UP_ARROW: 38,
    DOM_VK_RIGHT: 39, DOM_VK_RIGHT_ARROW: 39,
    DOM_VK_DOWN: 40, DOM_VK_DOWN_ARROW: 40,
    DOM_VK_INSERT: 45,
    DOM_VK_DEL: 46, DOM_VK_DELETE: 46,
    DOM_VK_0: 48,
    DOM_VK_1: 49,
    DOM_VK_2: 50,
    DOM_VK_3: 51,
    DOM_VK_4: 52,
    DOM_VK_5: 53,
    DOM_VK_6: 54,
    DOM_VK_7: 55,
    DOM_VK_8: 56,
    DOM_VK_9: 57,
    DOM_VK_A: 65,
    DOM_VK_B: 66,
    DOM_VK_C: 67,
    DOM_VK_D: 68,
    DOM_VK_E: 69,
    DOM_VK_F: 70,
    DOM_VK_G: 71,
    DOM_VK_H: 72,
    DOM_VK_I: 73,
    DOM_VK_J: 74,
    DOM_VK_K: 75,
    DOM_VK_L: 76,
    DOM_VK_M: 77,
    DOM_VK_N: 78,
    DOM_VK_O: 79,
    DOM_VK_P: 80,
    DOM_VK_Q: 81,
    DOM_VK_R: 82,
    DOM_VK_S: 83,
    DOM_VK_T: 84,
    DOM_VK_U: 85,
    DOM_VK_V: 86,
    DOM_VK_W: 87,
    DOM_VK_X: 88,
    DOM_VK_Y: 89,
    DOM_VK_Z: 90,
    DOM_VK_LWIN: 91, DOM_VK_LEFT_WINDOW: 91,
    DOM_VK_RWIN: 92, DOM_VK_RIGHT_WINDOW: 92,
    DOM_VK_SELECT: 93,

    DOM_VK_NUMPAD0: 96,
    DOM_VK_NUMPAD1: 97,
    DOM_VK_NUMPAD2: 98,
    DOM_VK_NUMPAD3: 99,
    DOM_VK_NUMPAD4: 100,
    DOM_VK_NUMPAD5: 101,
    DOM_VK_NUMPAD6: 102,
    DOM_VK_NUMPAD7: 103,
    DOM_VK_NUMPAD8: 104,
    DOM_VK_NUMPAD9: 105,
    DOM_VK_MULTIPLY: 106,

    DOM_VK_ADD: 107,
    DOM_VK_SUBTRACT: 109,
    DOM_VK_DECIMAL_POINT: 110,
    DOM_VK_DIVIDE: 111,
    DOM_VK_F1: 112,
    DOM_VK_F2: 113,
    DOM_VK_F3: 114,
    DOM_VK_F4: 115,
    DOM_VK_F5: 116,
    DOM_VK_F6: 117,
    DOM_VK_F7: 118,
    DOM_VK_F8: 119,
    DOM_VK_F9: 120,
    DOM_VK_F10: 121,
    DOM_VK_F11: 122,
    DOM_VK_F12: 123,
    DOM_VK_NUM_LOCK: 144,
    DOM_VK_SCROLL_LOCK: 145,
    DOM_VK_SEMICOLON: 186,
    DOM_VK_EQUALS: 187, DOM_VK_EQUAL_SIGN: 187,
    DOM_VK_COMMA: 188,
    DOM_VK_DASH: 189,
    DOM_VK_PERIOD: 190,
    DOM_VK_FORWARD_SLASH: 191,
    DOM_VK_GRAVE_ACCENT: 192,
    DOM_VK_OPEN_BRACKET: 219,
    DOM_VK_BACK_SLASH: 220,
    DOM_VK_CLOSE_BRAKET: 221,
    DOM_VK_SINGLE_QUOTE: 222
};
