// ==UserScript==
// @name         DuckDuckGo Unblocker Proxy
// @namespace    https://github.com/buzamahmooza
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

(function () {
    'use strict';

    const DEFAULT_PROXY_STATE = true;

    const proxyUrlToken = 'proxied';

    const tokenManager = {
        markElementAsReplaced: function (el) {
            el.classList.add(proxyUrlToken);
        },
        isElementReplaced: function (el) {
            return el.classList.contains(proxyUrlToken) && !el.classList.contains('no-ddgp');
        },
        markAttributeAsReplaced: function (el, attributeName) {
            el.classList.add(`${attributeName}-${proxyUrlToken}`);
        },
        isAttributeReplaced: function (el, attributeName) {
            return el.classList.contains(`${attributeName}-${proxyUrlToken}`) && !el.classList.contains('no-ddgp' + '-' + attributeName);
        },
    };

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

    if (false) {
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
    }

    // language=CSS
    addCss(`.proxy-og-link {
    display: -webkit-box;
    font-size: 50%;
}`);

    const SrcSet = (function () {
        if (typeof SrcSet === 'undefined') {
            var SrcSet = {};
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
            return SrcSet;
        }
        return SrcSet;
    })();

    const url = (function () {
        var location_href = (/^localhost\:/.test(location.host)) ? // if localhost, try inferring the url from the majoraty of the links
            (function () {
                return mode(getAllUrlsInPage().map(href => new URL(href).hostname)); // most frequently occurred hostname
            })()
            : location.href;

        try {
            return new URL(reverseDdgProxy(location_href));
        } catch (e) { /* console.warn('duckduckgo proxy:', e); */ }
        return new URL(location.href);
    })();

    function whiteListSite(url) {
        const stored = new Set(GM_getValue('whiteListedSites', ['www.pornhugo.com']));
        stored.add(url);
        GM_setValue('whiteListedSites', Array.from(stored));
        console.log('DDGP unblockable site added:', url);
    }


    (function start() {
        if (isDdgUrl(location.href)) {
            // add a link at the top of the page to the original url
            const ogURL = reverseDdgProxy(location.href);
            document.body.insertBefore(
                createElement(`<a href="${ogURL}" id="og-page-url" class="no-ddgp" style="margin: 10px;padding: 4px;position: fixed;top: 0px;">Original URL: "${ogURL}"</a>`),
                document.body.firstChild
            );
        }

        if (proxyOn) {
            if (isDdgUrl(location.href) || whiteListedSites.has(url.hostname)) {
                console.log('Auto run DDGP for this page.');
                go();
            }

            if (location.hostname === 'proxy.duckduckgo.com') {
                console.debug('Reverse-DDGp generated HOSTNAME:', url.hostname);
            }
        }

        /*if (document.cookie.indexOf("ddg_ubl;") === -1) {
            console.debug('This site is new to DDG Unblocker, taking note.');
            document.cookie += " ddg_ubl";
        } else {
            console.debug("You've been to this site before, haven't you?");
        }*/

        (function bindKeys() {
            /*
            alt+F7:     go(), addThisSiteToWhiteList
            ctrl+F7:    toggleState, go()
            shift+F7:   go(), reverseDdgProxyForPage
            F7:         go()
            shift+p:    addDdgHrefs
            */


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

            Mousetrap.bind('alt+f7', function addThisSiteToWhiteList() {
                proxyOn = !proxyOn;
                const resultingDomainName = prompt(`Turn on DDGP unblocker for this domain? (you may edit the domain name)`, url.hostname);
                if (!!resultingDomainName) {
                    whiteListSite(resultingDomainName);
                    go();
                }
            });

            Mousetrap.bind('shift+f7', function reverseDdgProxyForPage() {
                proxyOn = !proxyOn;
                if (isDdgUrl(location.href)) {// change the page URL if it's been proxied
                    location.assign(reverseDdgProxy(location.href));
                }
            });


            Mousetrap.bind('ctrl+f7', function toggleState() {
                proxyOn = !proxyOn;
                printState();
                if (confirm(`Turn DDGP unblocker ${stateStr()}?`)) {
                    GM_setValue('proxyOn', proxyOn);
                    if (proxyOn)
                        go();
                }
            });
            Mousetrap.bind('f7', function () {
                // printState();
                console.log('Sending a DDGP pulse to the document element.');

                for (const el of document.querySelectorAll(attributesSelector)) {
                    ddgReplaceAttributes(el);
                }
                // go();
            });

            Mousetrap.bind('shift+p', function addDdgHrefs() {
                console.log('addDdgpHrefs');
                (function addDdgHrefs() {
                    for (const el of document.links) { /*adds an image of the href*/
                        if (el.classList.contains('ddg-link') || isDdgUrl(el.href)) {
                            console.error('Not gonna make this into ddg cuz it is already ddg: ', el.href);
                            break;
                        }
                        const clone = el.cloneNode(false);
                        el.classList.add('ddg-link');
                        clone.href = ddgProxy(el.href);
                        clone.innerText += '(DDG)';
                        el.after(clone);
                        console.log(
                            'Adding ddgLink:', el.href,
                            '\nNew:' + clone.href
                        );
                    }
                })();
            });

        })();
    })();

    /**
     * Activates the proxy on the page
     * Process:
     * 1. Page is observed with a callback *handleElement*
     * 2. Each element will have certain elements that need attributes to be replaced (such as [href] and [src])
     * 3.
     * @see ddgReplaceAttributes() will be called for each of these elements
     * 4.
     */
    function go() {
        observeAllFrames(handleElement);
    }

    function sendPulseHardcoded() {
        for (const e of document.querySelectorAll(attributesSelector)) { //adds an mainImage of the href
            if (tokenManager.isElementReplaced(e) || isDdgUrl(e.href)) {
                console.log('Not gonna make this into ddg cuz it is already ddg:', e.href);
                return false;
            }
            tokenManager.markElementAsReplaced(e);
            // if(/^\/\//.test(e.href))
            {
                e.href = ddgProxy(e.href);
                return false;
            }
            /*const clone = e.cloneNode(false);
            clone.href = ddgProxy(e.href);
            clone.innerText += '(DDG)';
            e.after(clone);
            console.log('Adding ddgLink:', e.href);*/
        }
    }

    //working
    function handleElement(node) {
        try {
            for (const el of node.querySelectorAll(attributesSelector)) {
                ddgReplaceAttributes(el);
            }
            ddgReplaceAttributes(node);
        } catch (r) {
            console.warn('Original replace method not working', r);
            try {
                // auxilary `replace` method
                (function replaceAttributesMethod2() {
                    for (const attrName of ATTRIBUTES) {
                        for (const el of document.querySelectorAll(`[${attrName}]`)) {
                            const attr = el.getAttribute(attrName);
                            if (attr && !tokenManager.isAttributeReplaced(el, attrName) && !isDdgUrl(attr)) {
                                ddgReplaceAttribute(el, attrName, attr, url.hostname);
                                tokenManager.markAttributeAsReplaced(el, attrName);
                                tokenManager.markElementAsReplaced(el);
                            }
                        }
                    }
                })();
            } catch (rr) {
                console.error('Caught error while replacing node attributes.', rr);
            }
        }
    }

    /**
     * For a the element `el`, calls `ddgReplaceAttribute` on its attributes
     * @param el
     * @param attributeNames {String[]} which attributes apply. Setting attributeNames=undefined will run for all attributes
     * @see ddgReplaceAttribute
     */
    function ddgReplaceAttributes(el, attributeNames = ATTRIBUTES) {
        if (!el.getAttributeNames) return;
        if (tokenManager.isElementReplaced(el)) {
            // console.warn('el.classList.contains(proxyUrlToken)', el);
            return;
        }

        const elAttributes = new Set(el.getAttributeNames());

        if (attributeNames === undefined)
            attributeNames = elAttributes;

        const intersectionAttributes = attributeNames.filter(x => elAttributes.has(x));

        if (intersectionAttributes.length == 0)
            return;

       /*  console.debug(
            'ddgReplaceAttributes() with attributes: ', intersectionAttributes,
            '\nFor element:', el
        ); */

        for (const attrName of intersectionAttributes) {
            const attrValue = el.getAttribute(attrName);
            ddgReplaceAttribute(el, attrName, attrValue);
        }
        tokenManager.markElementAsReplaced(el);
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
            console.warn('The following element does not contain the attribute: "' + attrName + '", ', el);
            return;
        }

        // console.log('ddgReplaceAttribute(el, ', attrName, ', ', attrValue, ')', `attrName==='srcset': ${attrName === 'srcset'}`, el);

        // todo: saving the attribute before changing it (create an attribute node)
        // el["og-" + attrName] = attrValue;
        // if (typeof (createAndAddAttributeNode) !== 'undefined') {
        //     createAndAddAttributeNode(el, "og-" + attrName, attrValue);
        // }

        if (attrName === 'srcset') {
            const srcset = SrcSet.parse(attrValue).filter(ss => ss.url).map(ss => ({
                url: ddgProxy((ss.url)),
                width: ss.width
            }));
            console.log('srcset: ', attrValue, ' -> ', srcset);
            // for (var i = 0; i < srcset.length; i++)
            //     srcset[i].url = ddgProxy(reconstructUrl(srcset[i].url));

            el.setAttribute(attrName, SrcSet.stringify(srcset));

            console.log('srcset: ', attrValue, '->', SrcSet.stringify(srcset));
        } else {
            el.setAttribute(attrName, ddgProxy(reconstructUrl(attrValue)));
        }

        // //  adding og links to anchors
        // if (el.tagName == 'A' && !el.classList.contains('proxy-og-link')) {
        //     appendOgLink(el, attrValue);
        // }

        tokenManager.markAttributeAsReplaced(el, attrName);
    }
    // if there's a backslash at the beginning (relative URI)
    function reconstructUrl(_url) {
        var reconstructedUrl = isDdgUrl(_url) ? reverseDdgProxy(_url) : _url;
        if (!/^https?/.test(reconstructedUrl))  // add protocol if one is not found
            reconstructedUrl = `https://${reconstructedUrl}`;
        console.debug(`reconstructUrl(${_url}) -> `, reconstructedUrl);
        return reconstructedUrl;
    }

    // helper functions

    function appendOgLink(node, ogURL) {
        node.appendChild(createElement(`<a class="proxy-og-link ${proxyUrlToken}" href="${ogURL}">[OG-URL]</a>`));
    }

    function observeAllFrames(callback) {
        callback(document.body);
        callback(document.head);

        let mutationObserver = new MutationObserver(function (mutations) {
            for (const mutation of mutations) {
                if (!mutation.addedNodes.length) continue;
                callback(mutation.target);
            }
        });
        const mutationOptions = {
            childList: true, subtree: true,
            attributes: true, characterData: true
        };
        mutationObserver.observe(document, mutationOptions);
        for (const iframeBody of document.querySelectorAll('iframe > body')) {
            callback(iframeBody);
            mutationObserver.observe(iframeBody, mutationOptions);
        }
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

    /**
     * returns all the urls found in a page (gets them from the attributes: `src`, `srcset`, `href`)
     */
    function getAllUrlsInPage() {
        return [].concat.apply([], Array.from(document.querySelectorAll('[src], [href], [srcset]'))
            .map(e => [e.src, e.href].concat(e.hasAttribute('srcset') ? SrcSet.parse(e.srcset).map(ss => ss.url) : null)
                .filter(e => !!e)));
    }

    /**
     * returns the mode of the array (the element with the most frequency occurence)
     * @param {[]} arr
     * @returns
     */
    function mode(arr) {
        return arr.sort((a, b) =>
            arr.filter(v => v === a).length - arr.filter(v => v === b).length
        ).pop();
    }

    function getArrayElementFrequencyMap(arr) {
        return arr.reduce(function (countMap, word) {
            countMap[word] = ++countMap[word] || 1;
            return countMap;
        }, {});
    }

    /**Returns the href wrapped with proxy.DuckDuckGo.com */
    function reverseDdgProxy(href) {
        // if (isZscalarUrl(href)) s = getOGZscalarUrl(href); // extra functionality:
        if (!isDdgUrl(href)) {
            return href;
        }
        return new URL(location.href).searchParams.get('u');
    }
})();
