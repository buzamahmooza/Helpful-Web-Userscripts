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
            
            addCss(`.highlight { background-color: yellow; }`);

            const highlighterResults = JSON.parse(url.searchParams.get(urlParamName));
            console.log('Found highlighterResults:', highlighterResults);

            // now it's time to highlight stuff in the page
            for(const r of highlighterResults)
                highlight(document.body, r);
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
    var innerHTML = el.innerHTML;
    var index = innerHTML.indexOf(text);
    if (index >= 0) { 
        innerHTML = innerHTML.substring(0,index) + "<span class='highlight'>" + innerHTML.substring(index, index+text.length) + "</span>" + innerHTML.substring(index + text.length);
        el.innerHTML = innerHTML;
    }
}