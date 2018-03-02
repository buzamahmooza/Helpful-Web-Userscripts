// ==UserScript==
// @name         DuckDuckGo Unblocker Proxy
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  fkn Boss script that can almost unblock anything!
// @author       You
// @match        *
// @include      *
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// ==/UserScript==

// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\DuckDuckGo Unblocker Proxy.user.js


const DEFAULT_PROXY_STATE = true;
const ddgUrlToken = 'is-ddg-url';

const ATTRIBUTES = ['src', 'href'];
let proxyOn = GM_getValue('proxyOn', DEFAULT_PROXY_STATE);

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

if (typeof reverseDdgProxy === 'undefined')
    reverseDdgProxy = function (url) {
        let s = url;
        try {
            s = isDdgUrl(url) ? decodeURIComponent(url.match(/(?<=https:\/\/proxy\.duckduckgo\.com\/iu\/\?u=)(.*?)(?=&f=1)/i)[0]) : url;
            console.log("reverseDdgProxy from:", url, "\n\n\nBecame:", s);
        } catch (exc) {
            console.error('Caught error trying to reverse DDG proxy for ' + url + '\n', exc);
        }
        return s;
    };

const HOSTNAME = getHostname(reverseDdgProxy(location.href));
console.log('generated HOSTNAME:', HOSTNAME);

if (document.cookie.indexOf("ddg_ubl;") === -1) {
    log('This site is new to DDG Unblocker, taking note.');
    document.cookie += " ddg_ubl";
} else {
    log("You've been to this site before, haven't you?");
}

window.onkeyup = function (e) {
    const key = e.keyCode ? e.keyCode : e.which;
    switch (key) {
        case 118: // F7
            printState();
            if (!e.shiftKey && !e.ctrlKey) {
                log('Sending a DDGP pulse to the document element.');
                go();
                handleElement(document);
                if (!isDdgUrl(location.href))
                    location.href = ("https://proxy.duckduckgo.com/iu/?u=" + encodeURI(location) + "&f=1");
                return false;
            }

            proxyOn = !proxyOn;
            if (e.ctrlKey && !e.shiftKey) { // ctrl key
                console.warn('Ctrl + F7 pressed (no action is assigned yet).');
            } else if (e.shiftKey && !e.ctrlKey) { // shift key
                if (confirm("Would you like DDGP unblocker to remember this state?" + "\nState: " + (proxyOn ? 'ON' : 'OFF'))) {
                    GM_setValue('proxyOn', proxyOn);
                }
            }
            if (proxyOn && !isDdgUrl(location.href))
                location.href = ("https://proxy.duckduckgo.com/iu/?u=" + encodeURI(location) + "&f=1");

            if (document.cookie.indexOf("ddg_ubl;") === -1) {
                document.cookie += " ddg_ubl;";
                window.location.reload();
            } else {
                log("No need to reload the page, seems that you've already been here");
            }
            go();
            break;
    }
};

(function () {
    'use strict';
    if (!/google\.com/.test(location.href) && printState())
        go();
})();

function go() {
    observeAllFrames(handleElement);

    // not gonna happen
    if (false) {
        document.querySelectorAll('[href]').forEach(function (e) { /*adds an image of the href*/
            if (e.classList.contains(ddgUrlToken) || isDdgUrl(e.href)) {
                console.log('Not gonna make this into ddg cuz it is already ddg:', e.href);
                return false;
            }
            e.classList.add(ddgUrlToken);
            /*if(/^\/\//.test(e.href))*/
            {
                e.href = ddgProxy(e.href);
                return false;
            }
            // const clone = e.cloneNode(false);
            // clone.href = ddgProxy(e.href);
            // clone.innerText += '(DDG)';
            // e.after(clone);
            // console.log('Adding ddgLink:', e.href);
        });
        document.querySelectorAll('[src]').forEach(function (e) { /*adds an image of the href*/
            if (e.classList.contains(ddgUrlToken) || isDdgUrl(e.href)) {
                log('Not gonna make this into ddg cuz it is already ddg:', e.src);
                return false;
            }
            e.classList.add(ddgUrlToken);
            /*if(/^\/\//.test(e.src))*/
            {
                e.src = ddgProxy(e.src);
                return false;
            }
            // const clone = e.cloneNode(false);
            // clone.src = ddgProxy(e.src);
            // e.after(clone);
            // log('Adding ddgLink:', e.src);
        });
    }
}

function handleElement(node) {
    if (!node) return false;
    try {
        node.forEach(ddgReplaceElementAttributes);
    } catch (exc) {
        try {
            ATTRIBUTES.forEach(function (attrName) {
                node.querySelectorAll('[' + attrName + ']').forEach(function (el) {
                    const attr = el.getAttribute(attrName);

                    if (el.classList.contains(ddgUrlToken) || isDdgUrl(attr)) {
                        return;
                    }
                    el.classList.add(ddgUrlToken);
                    ddgReplaceAttribute(el, attrName, attr, HOSTNAME);
                    return false;
                });
            });
        } catch (exc2) {
            console.error('Caught error while replacing node attributes.', exc2);
        }
    }
}

function ddgReplaceAttribute(el, attrName, attr) {
    el.setAttribute(attrName, ddgProxy(((attr.charAt(0) === '/' ? getHostname(reverseDdgProxy(location.href)) : '') + attr)));
}

function ddgReplaceElementAttributes(el) {
    el.attributes.forEach(function (attrName) {
        ddgReplaceAttribute(el, attrName, el.getAttribute(attrName));
    });
    // for(let attr of ATTRIBUTES){
    // 	if(el.hasAttribute(attr)){
    // 		var x = el.getAttribute(attr);
    // 		if(isDdgUrl(x)) break;
    // 		else {
    // 			el.setAttribute(attr, ddgProxy(x));
    // 		}
    // 	}
    // }
}

function observeAllFrames(callback) {
    callback(document.body);
    let mutationObserver = new MutationObserver(function (mutations) {
        for (let i = 0; i < mutations.length; i++) {
            if (!mutations[i].addedNodes.length) continue;
            callback(mutations[i].target);
        }
    });
    mutationObserver.observe(document, {
        childList: true, subtree: true,
        attributes: true, characterData: false
    });
    document.querySelectorAll('iframe').forEach(function (iframe) {
        callback(iframe.body);
        mutationObserver.observe(iframe, {
            childList: true, subtree: true,
            attributes: true, characterData: false
        });
    });
}

function printState() {
    log('DDG Proxy unblocker state:', proxyOn ? 'ON' : 'OFF');
    return proxyOn;
}

function ddgProxy(url) {
    return ("https://proxy.duckduckgo.com/iu/?u=" + encodeURIComponent(url) + "&f=1");
}

function isDdgUrl(url) {
    return /^https:\/\/proxy\.duckduckgo\.com/.test(url);
}
