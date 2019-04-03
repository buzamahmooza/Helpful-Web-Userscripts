// ==UserScript==
// @name         Search highlighter for ADHD kids and retards
// @namespace    https://github.com/buzamahmooza
// @author       Faris Hijazi
// @version      0.1
// @icon         https://d29fhpw069ctt2.cloudfront.net/icon/image/84763/preview.svg
// @match        *
// @include      *
// @run-at       document-end
// @connect      *
// ==/UserScript==

// @grant        unsafeWindow
// @grant        window.close
// @grant        window.focus
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard

// @require      https://code.jquery.com/jquery-3.2.1.slim.min.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js


// todo: Saeed Surki loves tomatoes:  add shortcut to navigate between matches

(function () {
    'use strict';
    const urlParamName = "highlighterResults";

    // object of search engines as keys, and the getter function as the value
    // the getter will return an object
    /*
    {
        "query": "",
        "results": [
            {
                "element":,
                "matches": ["word1", "word2"],
                "link": ,
            }
        ],
    }
    */
    const searchEngines = {
        "google": () => {
            const resultEls = Array.from(document.querySelectorAll('#rso > div > div > div > div[data-hveid]'))
                .concat(document.querySelector('#rso > div:nth-child(1) > div > div')).filter(e => !!e); // adding the top result
            return {
                "query": "", // todo: add this
                "results": resultEls.map(el => ({
                    "element": el,
                    "matches": Array.from(el.querySelectorAll('em')).map(em => em.innerText)
                    // .map(match => match.split(' ')).reduce((words, words2) => words.concat(words2), [])
                    // .filter(e => !!e)
                    ,
                    "link": el.querySelector('a')
                })
                )
            }
        },
        "duckduckgo": () => {
        },
        "yandex": () => {
        },
        "bing": () => {
        },
        "baidu": () => {
        },
        "yahoo": () => {
        }
    };

    const searchEngine = (function () {
        for (const se of Object.keys(searchEngines))
            if (location.hostname.search(se) !== -1)
                return se;
    })();

    const referrer = (function () {
        if (!document.referrer) return "";

        const referrerHostname = new URL(document.referrer).hostname;
        for (const se of Object.keys(searchEngines))
            if (referrerHostname.search(se) !== -1)
                return true;
    })();

    const url = new URL(location.href);

    if (!searchEngine) { // if not on a search engine page
        if (url.searchParams.has(urlParamName) && referrer) { // could be on a results page from a search engine

            // addCss('.highlight { background-color: yellow; }');

            const highlighterResults = JSON.parse(url.searchParams.get(urlParamName));
            console.log('Found highlighterResults:', highlighterResults);

            // now it's time to highlight stuff in the page
            const textEls = Array.from(document.body.querySelectorAll('*')).filter(e => e.text && e.innerText);
            for (const textEl of textEls) {
                for (const r of highlighterResults)
                    highlight(textEl, r);    //todo: don't use the body, only pass text elements
            }
        }
    } else { // when on search engine page
        const o = searchEngines[searchEngine].call();

        // injecting the info in url params
        console.log("searchEngine:", searchEngine, o);

        for (const r of o.results.filter(r => !!r.matches)) {
            const rUrl = new URL(r.link.href);
            console.debug('Matches for result:\n', r.link, '\n', r.matches, '\nJSON.stringify', JSON.stringify(r.matches));
            rUrl.searchParams.set(urlParamName, JSON.stringify(r.matches));
            r.link.href = rUrl.toString();
        }
    }
})();

function highlight(el, text) {
    const innerHTML = el.innerHTML;
    // todo: try using regex, advantage is that we wouldn't have a partial match inside a word, we can match full words only (which is what we want)
    // const match = innerHTML.match(new RegExp('(' + el + ')', 'i'));
    // if(match) el.innerHTML = innerHTML.replace(match, '<span class="highlight">$1<span>');

    // todo: use the inverted color of the element
    // var color = window.getComputedStyle(el).getPropertyValue("color");
    // var rgb = color.match(/\d+/g);
    // var hlcolor = invertColor(rgbToHex(rgb[0], rgb[1], rgb[2]));
    hlcolor = 'yellow';

    const index = innerHTML.indexOf(text);
    if (index >= 0) {
        el.innerHTML = innerHTML.substring(0, index) + '<span style="background-color: ' + hlcolor + ';">' + innerHTML.substring(index, index + text.length) + '</span>' + innerHTML.substring(index + text.length);
    }
}

function invertColor(hex, bw) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);
    if (bw) {
        // http://stackoverflow.com/a/3943023/112731
        return (r * 0.299 + g * 0.587 + b * 0.114) > 186
            ? '#000000'
            : '#FFFFFF';
    }
    // invert color components
    r = (255 - r).toString(16);
    g = (255 - g).toString(16);
    b = (255 - b).toString(16);
    // pad each with zeros and return
    return "#" + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}