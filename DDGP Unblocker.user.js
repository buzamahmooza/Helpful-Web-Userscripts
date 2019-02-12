// ==UserScript==
// @name         DuckDuckGo Unblocker Proxy
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  fkn Boss script that can almost unblock anything!
// @author       You
// @match        *
// @include      *
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// @require      https://github.com/buzamahmooza/Helpful-Web-Userscripts/raw/master/Handy%20AF%20functions%20Faris.user.js
// ==/UserScript==

// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\DuckDuckGo Unblocker Proxy.user.js


const DEFAULT_PROXY_STATE = true;
const proxyUrlToken = 'proxied';

let ATTRIBUTES = ['src', 'href', 'srcset', 'data-src'],
    attributesSelector = `[${ATTRIBUTES.join('], [')}]`,
    proxyOn = GM_getValue('proxyOn', DEFAULT_PROXY_STATE),
    whiteListedSites = new Set(GM_getValue('whiteListedSites', ['www.deviant.com']));

const stateStr = () => (proxyOn ? 'ON' : 'OFF');
/**abbreviation for querySelectorAll()*/
function qa(selector) {
    return document.querySelectorAll(selector);
}
/**abbreviation for querySelector()*/
function q(selector) {
    return document.querySelector(selector);
}
/*
var Proxy = {
    filestack: function (href) {
        this.is = (href2) => new URL(href2 || href).hostname == "process.filestackapi.com";
        this.reverse = (href2) => {
            href2 = href2 || href;
            return this.is(href2) ? decodeURIComponent(href2.split('/').pop()) : href2;
        };
        this.proxy = (href2) => {
            href2 = href2 || href;
            return this.is(href2) ? href2 : `https://process.filestackapi.com/AhTgLagciQByzXpFGRI0Az/${encodeURIComponent(href2.trim())}`;
        };
        return this.proxy(href);
    },
    steemitimages: function (href) {
        this.is = (href2) => new URL(href2 || href).hostname == "steemitimages.com";
        this.reverse = (href2) => this.is(href2) ? decodeURIComponent(href2.split('/').pop()) : href2;
        this.proxy = (href2) => /\.(jpg|jpeg|tiff|png|gif)($|\?)/i.test(href2) && !this.is(href2) ? `https://steemitimages.com/0x0/${href2.trim()}` : href2;
        return this.proxy(href);
    },
    Ddg: class Ddg {
        constructor(href) {
            this.href = href;
            return this.proxy(href);
        }
        get is() {
            return Ddg.is(this.href);
        }
        get reverse() {
            return Ddg.reverse(this.href);
        }
        get proxy() {
            return Ddg.proxy(this.href);
        }

        static is(href2) {
            try {
                return new URL(href2).hostname == "proxy.duckduckgo.com";
            } catch (e) {
                return false
            }
        }
        static reverse(href2) {
            return this.is(href2) ? new URL(href2).searchParams.get('u') : href2;
        }
        static proxy(href2) {
            return this.is(href2) ? href2 : `https://proxy.duckduckgo.com/iu/?u=${encodeURIComponent(href2)}&f=1`;
        }
    }
};
unsafeWindow.Proxy = Proxy;

*/

// language=CSS
addCss(`
    .proxy-og-link {
        display: -webkit-box;
        font-size: 50%;
    }
`);

var SrcSet;
if (typeof SrcSet === 'undefined') {
    SrcSet = {};
    /** A class containing static functions to manipulate the srcset attribute */
    /**
     * @author https://github.com/sindresorhus/srcset/
     * @param arr
     * @return {*}
     */
    SrcSet.deepUnique = function (arr) {
        return arr.sort().filter(function (el, i) {
            return JSON.stringify(el) !== JSON.stringify(arr[i - 1]);
        });
    };
    /**
     * @author https://github.com/sindresorhus/srcset/
     * @param str
     * @return {*}
     */
    SrcSet.parse = function (str) {
        return this.deepUnique(str.split(',').map(function (el) {
            var ret = {};

            el.trim().split(/\s+/).forEach(function (el, i) {
                if (i === 0) {
                    return ret.url = el;
                }

                var value = el.substring(0, el.length - 1);
                var postfix = el[el.length - 1];
                var intVal = parseInt(value, 10);
                var floatVal = parseFloat(value);

                if (postfix === 'w' && /^[\d]+$/.test(value)) {
                    ret.width = intVal;
                } else if (postfix === 'h' && /^[\d]+$/.test(value)) {
                    ret.height = intVal;
                } else if (postfix === 'x' && !isNaN(floatVal)) {
                    ret.density = floatVal;
                } else {
                    throw new Error('Invalid srcset descriptor: ' + el + '.');
                }
            });

            return ret;
        }));
    };
    SrcSet.stringify = function (arr) {
        return (arr.map(function (el) {
            if (!el.url) {
                throw new Error('URL is required.');
            }

            var ret = [el.url];

            if (el.width) {
                ret.push(el.width + 'w');
            }

            if (el.height) {
                ret.push(el.height + 'h');
            }

            if (el.density) {
                ret.push(el.density + 'x');
            }

            return ret.join(' ');
        })).join(', ');
    };
}

const HOSTNAME = getHostname(reverseDdgProxy(location.href), true);

function whiteListSite(url) {
    const stored = new Set(GM_getValue('whiteListedSites', ['www.pornhugo.com']));
    stored.add(url);
    GM_setValue('whiteListedSites', Array.from(stored));
    console.log('DDGP unblockable site added:', url);
}


(function start() {
    'use strict';
    if (proxyOn) {
        if (/proxy\.duckduckgo\.com.*&f=1/.test(location.href) || whiteListedSites.has(HOSTNAME)) {
            console.log('Auto run DDGP for this page.');
            go();
        }
        if (location.hostname !== 'proxy.duckduckgo.com') {
            console.debug('Reverse-DDGp generated HOSTNAME:', HOSTNAME);
        }
    }

    /*if (document.cookie.indexOf("ddg_ubl;") === -1) {
        console.debug('This site is new to DDG Unblocker, taking note.');
        document.cookie += " ddg_ubl";
    } else {
        console.debug("You've been to this site before, haven't you?");
    }*/

    window.addEventListener('keyup', function onKeyUp(e) {
        const key = e.keyCode ? e.keyCode : e.which;
        const modKeys = getModifierKeys(e);
        if (modKeys.targetIsInput) return;



        proxyOn = !proxyOn;
        if (modKeys.SHIFT_ONLY) { // Shift+F7:   Revert changes
            if (isDdgUrl(location.href)) {// change the page URL if it's been proxied
                location.assign(reverseDdgProxy(location.href));
            }

        } else if (modKeys.ALT_ONLY) { // alt key
            const resultingDomainName = prompt(`Turn on DDGP unblocker for this domain?`, HOSTNAME);
            if (!!resultingDomainName) {
                whiteListSite(resultingDomainName);
                go();
            }
        }
        /*
        if (proxyOn && !isDdgUrl(location.href))
            location.assign(ddgProxy(location.href));
        */

        /*if (document.cookie.indexOf("ddg_ubl;") === -1) {
            document.cookie += " ddg_ubl;";
            window.location.reload();
        } else {
            console.debug("No need to reload the page, seems that you've already been here");
        }*/


        Mousetrap.bind('shift+p', function(){
            console.log('addDdgpHrefs');
            (function addDdgHrefs() {
                for (const e of document.querySelectorAll('[href]')) { /*adds an image of the href*/
                    if (e.classList.contains('ddg-link') || /proxy\.duckduckgo/.test(e.href)) {
                        console.error('Not gonna make this into ddg cuz it is already ddg: ', e.href);
                        break;
                    }
                    var clone = e.cloneNode(false);
                    e.classList.add('ddg-link');
                    clone.href = ddgProxy(e.href);
                    clone.innerText += '(DDG)';
                    e.after(clone);
                    console.log('Adding ddgLink:', e.href, '\nNew:' + clone.href);
                }
            })();
        });

        Mousetrap.bind('ctrl+f7', function () {
            printState();
            if (confirm(`Turn DDGP unblocker ${stateStr()}?`)) {
                GM_setValue('proxyOn', proxyOn);
                if (proxyOn) go();
            }
        });
        Mousetrap.bind('f7', function () {
            printState();
            console.log('Sending a DDGP pulse to the document element.');
            go();
        });

    });
})();

/**
 * Activates the proxy on the page
 * Process:
 * 1. Page is observed with a callback *handleElement*
 * 2. Each element will have certain elements that need attributes to be replaced (such as [href] and [src])
 * 3.
 * @see ddgReplaceAllAttributes will be called for each of these elements
 * 4.
 */
function go() {
    // testing
    const handleElement2 = function handleElement2(node) {
        try {
            const nodeList = node.querySelectorAll(attributesSelector);
            for (const el of nodeList) {
                ddgReplaceAllAttributes(el);
            }
            ddgReplaceAllAttributes(node);
        } catch (r) {
            console.warn('Original replace method not working', r);
            try {
                for (const attrName of ATTRIBUTES) {
                    for (const el of document.querySelectorAll(`[${attrName}]`)) {
                        const attr = el.getAttribute(attrName);
                        if (attr && !el.classList.contains(proxyUrlToken) && !isDdgUrl(attr)) {
                            ddgReplaceAttribute(el, attrName, attr, HOSTNAME);
                            el.classList.add(`${attrName}-${proxyUrlToken}`);
                        }
                    }
                }
            } catch (rr) {
                console.error('Caught error while replacing node attributes.', rr);
            }
        }
    };

    observeAllFrames(handleElement);
    // not gonna happen
    if (false) {
        /*document.querySelectorAll('[href]').forEach(e => { /!*adds an mainImage of the href*!/
            if (e.classList.contains(proxyUrlToken) || isDdgUrl(e.href)) {
                console.log('Not gonna make this into ddg cuz it is already ddg:', e.href);
                return false;
            }
            e.classList.add(proxyUrlToken);
            /!*if(/^\/\//.test(e.href))*!/
            {
                e.href = ddgProxy(e.href);
                return false;
            }
            /!*const clone = e.cloneNode(false);
            clone.href = ddgProxy(e.href);
            clone.innerText += '(DDG)';
            e.after(clone);
            console.log('Adding ddgLink:', e.href);*!/
        });
        document.querySelectorAll('[src]').forEach(e => { /!*adds an mainImage of the href*!/
            if (e.classList.contains(proxyUrlToken) || isDdgUrl(e.href)) {
                console.debug('Not gonna make this into ddg cuz it is already ddg:', e.src);
                return false;
            }
            e.classList.add(proxyUrlToken);
            /!*if(/^\/\//.test(e.src))*!/
            {
                e.src = ddgProxy(e.src);
                return false;
            }
            /!*const clone = e.cloneNode(false);
            clone.src = ddgProxy(e.src);
            e.after(clone);
            console.debug('Adding ddgLink:', e.src);*!/
        });*/
    }
}
//working
function handleElement(node) {
    try {
        const selector = `[${ATTRIBUTES.join('], [')}]`;
        for (const el of node.querySelectorAll(selector)) {
            ddgReplaceAllAttributes(el);
        }
        ddgReplaceAllAttributes(node);
    } catch (r) {
        console.warn('Original replace method not working', r);
        try {
            replaceAttributesMethod2();
        } catch (rr) {
            console.error('Caught error while replacing node attributes.', rr);
        }
    }

    function replaceAttributesMethod2() {
        for (const attrName of ATTRIBUTES) {
            for (const el of document.querySelectorAll(`[${attrName}]`)) {
                const attr = el.getAttribute(attrName);
                if (attr && !el.classList.contains(`${attrName}-${proxyUrlToken}`) && !isDdgUrl(attr)) {
                    ddgReplaceAttribute(el, attrName, attr, HOSTNAME);
                    el.classList.add(`${attrName}-${proxyUrlToken}`);
                }
            }
        }
    }
}

/**
 * Iterates through all attributes and calls ddgReplaceAttribute
 * @param el
 * @see ddgReplaceAttribute
 */
function ddgReplaceAllAttributes(el) {
    if (el.classList && el.classList.contains(proxyUrlToken)) {
        // console.warn('el.classList.contains(proxyUrlToken)', el);
        return;
    }
    /* if (!el.attributes || !el.attributes.length) {
         console.warn('no attributes for element:', el);
         return;
     }*/
    if (el.attributes && el.attributes.length)
        for (const attrName of el.attributes) {
            if (el.hasAttribute(attrName)) {
                const attrValue = el.getAttribute(attrName);
                if (/magnet:\?/.test(attrValue)) {
                    console.debug('not gonna replace this attribute:', attrValue);
                    continue;
                }
                ddgReplaceAttribute(el, attrName, attrValue);
            }
        }
}


/**
 * Reconstructs the full URL from the element attribute attrName for a single attribute.
 * Also appends
 * @param el
 * @param attrName
 * @param attrValue
 */
function ddgReplaceAttribute(el, attrName, attrValue) {
    if (!attrValue) {
        console.warn('The following element does not contain the attribute: "', attrName, '", ', el);
        return;
    }
    if (attrName == 'srcset' && attrValue.split(',').length) {
        var srcsetO = SrcSet.parse(attrValue);
        for (var i = 0; i < srcsetO.length; i++) {
            srcsetO[i].url = ddgProxy(reconstructUrl(srcsetO[i].url));
        }
        el.setAttribute(attrName, SrcSet.stringify(srcsetO));
    } else {
        el.setAttribute(attrName, ddgProxy(reconstructUrl(attrValue)));
    }

    //  adding og links to anchors
    if (el.tagName == 'A' && !el.classList.contains('proxy-og-link')) {
        appendOgLink(el, attrValue);
    }

    el.classList.add(`${attrName}-${proxyUrlToken}`);

    // if there's a backslash at the beginning (relative URI)
    function reconstructUrl(url) {
        var reconstructedUrl = `${isDdgUrl(url) ? HOSTNAME : ''}${url}`;
        if (!/^https?/.test(reconstructedUrl))  // add protocol if one is not found
            reconstructedUrl = `https://${reconstructedUrl}`;
        return reconstructedUrl;
    }
}

function appendOgLink(node, ogURL) {
    node.appendChild(createElement(`<a class="proxy-og-link ${proxyUrlToken}" href="${ogURL}">[OG-URL]</a>`));
}

function observeAllFrames(callback) {
    callback(document.body);
    callback(document);

    let mutationObserver = new MutationObserver(function (mutations) {
        for (const mutation of mutations) {
            // if (!mutation.addedNodes.length) continue;
            callback(mutation.target);
        }
    });
    const mutationOptions = {
        childList: true, subtree: true,
        attributes: true, characterData: true
    };
    mutationObserver.observe(document, mutationOptions);
    document.querySelectorAll('iframe').forEach(function (iframe) {
        callback(iframe.body);
        mutationObserver.observe(iframe, mutationOptions);
    });
}

function printState() {
    console.log('DDG Proxy unblocker state: ' + stateStr());
    return proxyOn;
}

function alertState() {
    alert('DDG Proxy unblocker state: ' + stateStr());
    return proxyOn;
}


function isDdgUrl(url) {
    return /^https:\/\/proxy\.duckduckgo\.com/.test(url);
}
var KeyEvent = {
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
    DOM_VK_0: 48, DOM_VK_ALPHA0: 48,
    DOM_VK_1: 49, DOM_VK_ALPHA1: 49,
    DOM_VK_2: 50, DOM_VK_ALPHA2: 50,
    DOM_VK_3: 51, DOM_VK_ALPHA3: 51,
    DOM_VK_4: 52, DOM_VK_ALPHA4: 52,
    DOM_VK_5: 53, DOM_VK_ALPHA5: 53,
    DOM_VK_6: 54, DOM_VK_ALPHA6: 54,
    DOM_VK_7: 55, DOM_VK_ALPHA7: 55,
    DOM_VK_8: 56, DOM_VK_ALPHA8: 56,
    DOM_VK_9: 57, DOM_VK_ALPHA9: 57,
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
    DOM_VK_CLOSE_BRACKET: 221,
    DOM_VK_SINGLE_QUOTE: 222
};
/**
 * Order of key strokes in naming convention:   Ctrl > Shift > Alt >  Meta
 * @param keyEvent
 * @returns {{CTRL_ONLY: boolean, SHIFT_ONLY: boolean, ALT_ONLY: boolean, META_ONLY: boolean, NONE: boolean}}
 */
function getModifierKeys(keyEvent) {
    /** @type {{CTRL_ONLY: boolean, SHIFT_ONLY: boolean, ALT_ONLY: boolean, NONE: boolean}} */
    return {
        CTRL_SHIFT: keyEvent.ctrlKey && !keyEvent.altKey && keyEvent.shiftKey && !keyEvent.metaKey,
        CTRL_ALT: keyEvent.ctrlKey && keyEvent.altKey && !keyEvent.shiftKey && !keyEvent.metaKey,
        ALT_SHIFT: !keyEvent.ctrlKey && keyEvent.altKey && keyEvent.shiftKey && !keyEvent.metaKey,
        CTRL_ONLY: keyEvent.ctrlKey && !keyEvent.altKey && !keyEvent.shiftKey && !keyEvent.metaKey,
        CTRL_ALT_SHIFT: keyEvent.ctrlKey && keyEvent.altKey && keyEvent.shiftKey && !keyEvent.metaKey,

        SHIFT_ONLY: !keyEvent.ctrlKey && !keyEvent.altKey && keyEvent.shiftKey && !keyEvent.metaKey,
        ALT_ONLY: !keyEvent.ctrlKey && keyEvent.altKey && !keyEvent.shiftKey && !keyEvent.metaKey,
        META_ONLY: !keyEvent.ctrlKey && !keyEvent.altKey && !keyEvent.shiftKey && keyEvent.metaKey,

        NONE: !keyEvent.ctrlKey && !keyEvent.shiftKey && !keyEvent.altKey && !keyEvent.metaKey,

        targetIsInput: (function targetIsInput() {
            const ignores = document.getElementsByTagName('input');
            const target = keyEvent.target;
            for (let ignore of ignores)
                if (target === ignore || ignore.contains(target)) return true;
        })()
    };
}


/**
 * Appends a style element to the head of the document containing the given cssStr text
 * @param cssStr
 * @param id
 * @return {HTMLStyleElement}
 */
function addCss(cssStr, id) {
    const style = document.createElement('style');
    if (style.styleSheet) {
        style.styleSheet.cssText = cssStr;
    } else {
        style.appendChild(document.createTextNode(cssStr));
    }
    if (!!id) style.id = id;
    style.classList.add('addCss');
    return document.getElementsByTagName('head')[0].appendChild(style);
}

function getHostname(href, keepPrefix) {
    const a = document.createElement('a');
    a.href = href;
    // if (keepPrefix) console.debug("getHostname href =", href);
    return a.hostname;
}

/**Returns the href wrapped with proxy.DuckDuckGo.com */
function reverseDdgProxy(href) {
    var s = href;
    if (isZscalarUrl(href)) s = getOGZscalarUrl(href); // extra functionality:
    if (isDdgUrl(href)) {
        s = new URL(location.href).searchParams.get('u');
    }
    // https://proxy.duckduckgo.com/iu/?u=
    if (s && s[0]) {
        return decodeURIComponent(s[0]);
    } else {
        console.debug('Was unable to reverseDDGProxy for URL:', href);
        return s;
    }
}