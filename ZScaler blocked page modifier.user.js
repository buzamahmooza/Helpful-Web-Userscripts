// ==UserScript==
// @name         Zscalar BLOCKED page modifier
// @namespace    http://github.com/buzamahmooza
// @version      0.3
// @description  Creates a clickable link to the original URL, as well as a "Google Images SiteSearch" link to see the site's pictures.
// @author       buzamahmooza
// @include      https://zscaler.kfupm.edu.sa/Default.aspx?url=*
// @grant        none
// ==/UserScript==

// @require 	 https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js

// javascript:function repl(url){console.log("original url should be: "+url); url=decodeURIComponent(url.substring("https://zscaler.kfupm.edu.sa/Default.aspx?url=".length,url.indexOf("&referer"))); console.log("original url should be: "+url); alert("Check the console for a clickable version (F12). The original URL is: "+url); return url;} repl(prompt("Enter the zscalar link to find the original URL:", "")); void (0);

// javascript:q=""+(window.getSelection?window.getSelection():document.getSelection?document.getSelection():document.selection.createRange().text);
// if(q!=null)location="http://www.google.com/search?q="+q.replace(/%5Cs+/g,"+")+"+site:"+location.HOSTNAME;void(0);

// check this element, it'll help you identify the page


'use strict';
const IMG_SEARCH_URL = 'https://www.google.com/search?&tbm=isch&q=';

Proxy = {
    fileStack: url => ("https://process.filestackapi.com/AhTgLagciQByzXpFGRI0Az/" + encodeURIComponent(url.trim())),
    steemitimages: url => ("https://steemitimages.com/0x0/" + url.trim()),
    ddg: url => /^https:\/\/proxy\.duckduckgo\.com/.test(url) || /^(javascript)/i.test(url) ? href :
        (`https://proxy.duckduckgo.com/iu/?u=${encodeURIComponent(url.trim())}&f=1`)
};

go();

function getRandomElement(bgUrls) {
    return bgUrls[Math.floor(Math.random() * bgUrls.length)];
}
function go() {
    const isZscalerUrl = RegExp("^https\\:\\/\\/zscaler\\.kfupm\\.edu\\.sa\\/Default\\.aspx\\?url", "i").test(location.href);
    const isImage = /\.(jpg|jpeg|tiff|png|gif)($|\?)/i.test(location.href);
    const urlParams = entriesToObj(new URL(location.href).searchParams.entries());
    const ogUrl = isZscalerUrl? urlParams.url:
        location.href;
    const websiteBlocked = getElementsByXPath('//p[contains(text(),\'Not allowed\')]') && document.querySelector(
        'a[href="https://zscaler.kfupm.edu.sa/aup.pdf"], ' +
        'img[src^="https://zscaler.kfupm.edu.sa/"], ' +
        '#home > h2 > img[src="http://www2.kfupm.edu.sa/eattachments/Mail_Broadcast/images/pa-response-pages/icon.png"][title="Website BLOCKED!"]'
    );

    /* urlParam will look something like this:
    {
        "url":          "http://galleries.spizoo.com/mp4/AlixLynxBlowjobPOV/mp4.php?nats=MjE2LjIuMTIuMjguMC4xMjUwNC4wLjAuMA",
        "referer":      "www.google.com/",
        "reason":       "Not allowed to browse Pornography category",
        "reasoncode":   "CATEGORY_DENIED",
        "timebound":    "1",
        "action":       "deny",
        "kind":         "category",
        "rule":         "16072",
        "cat":          "Pornography",
        "user":         "s201xxxxxx@kfupm.edu.sa",
        "lang":         "en_US",
        "zsq":          "nGsSKFQFD4QRfRZnjKFPsJbJKW7TqKFzsq"
    }
    */
   if(isImage) {
       const prx = Proxy.steemitimages(ogUrl);
       console.log('going to proxy:', prx);
       location.assign(prx);
   }

    if (!websiteBlocked) {
        console.debug('Not ZSCALAR page');
        return;
    }
    if (window['fkzscaler']) {
        void (0);
        return;
    }
    window['fkzscaler'] = true;


    (function addingCss() {
        // language=CSS
        const cssRules = `.myAnchors {
            text-align: center;
        }

        .myAnchors a img {
            transition: transform 250ms ease;
            width: 100px;
            max-width: 150px;
        translate3d(0, 0, 100);
            padding: 5px;
        }

        .myAnchors a:hover img {
            transform: scale(1.6, 1.6);
        }

        a.myAnchors:link {
            color: red;
        }

        a.myAnchors:visited {
            color: green;
        }

        a.myAnchors:hover {
            color: hotpink;
        }

        a.myAnchors:active {
            color: blue;
        }

        a.myAnchors {
            font-size: 14px;
            padding: 5px;
        }

        body {
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
            background-color: #474747;
        }`;
        const cssBlock = document.createElement('style');
        cssBlock.innerText = cssRules;
        document.head.appendChild(cssBlock);
    })();


    const card = document.querySelector('div#book');
    const p = card.querySelector('p > strong').parentNode;
    const strongs = card.querySelectorAll('p > strong');
    const reasonText = isZscalerUrl? urlParams.reason: "Some reason";
    const strong = strongs[0];


    const ssCell = document.createElement('div');
    const urlAnchor = createElement(
        `<a id="urlAnchor" class="myAnchors" href="${ogUrl}">${ogUrl}"</a>`
    );
    const siteSearchAnchor = createElement(
        `<a id="siteSearchAnchor" class="myAnchors" href="${IMG_SEARCH_URL + encodeURIComponent('site:' + getHostname(ogUrl))}">search: "site:${encodeURIComponent(getHostname(ogUrl))}"</a>`
    );
    const siteSearchUrlAnchor = createElement(
        `<a id="siteSearchUrlAnchor" class="myAnchors" href="${IMG_SEARCH_URL}site:${encodeURIComponent(ogUrl)}">Image search: "${ogUrl}"</a>`);
    const toDdgAnchor = createElement(
        '<a id="toDdgAnchor" class="myAnchors" ' +
        'href="' + ddgProxy(ogUrl) + '">' + // href
        'DDG Proxy' + // innerText
        '</a>'
    );

    p.appendChild(urlAnchor, strong);
    p.appendChild(siteSearchAnchor, strong);
    ssCell.appendChild(siteSearchAnchor);

    p.innerHTML = urlAnchor.outerHTML;
    p.appendChild(ssCell);
    p.appendChild(toDdgAnchor);
    const ssua = document.createElement('div');
    ssua.appendChild(siteSearchUrlAnchor);
    toDdgAnchor.after(ssua);
    p.style += ' text-align:left ';


    const bgUrls = {
        'doom': [
            'http://i.imgur.com/L0bKOnv.jpg',
            'https://thumbs.gfycat.com/CoordinatedWindyArrowworm-mobile.jpg',
            'http://www.blur.com/assets/uploads/2016/04/doom_tv_06.jpg'
        ],
        'porn|nud|adult': [
        	'https://st.depositphotos.com/1628578/3901/v/950/depositphotos_39016261-stock-illustration-xxx-icon.jpg',
        	'https://pngimage.net/wp-content/uploads/2018/06/18-icon-png-2.png',
        ],
        'polit': [],
        'relige': []
    };

    const reasons = Object.keys(bgUrls);
    const reason = (function () {
        for (const r of reasons) {
            if (RegExp(r, 'i').test(reasonText)) {
                return r;
            }
        }
        return 'other';
    })();

    switch (reason) {
        case "Not allowed to browse Pornography category":
        case 'porn|nud|adult':
            break;
        case 'relige':
        case 'polit':
        default:
            alert('Unkown reason: "' + reason + '"')
    }

    document.body.style.backgroundImage = 'url("' + getRandomElement(bgUrls[reason]) + '")';
    console.log('Reason:', reason);

	document.removeEventListener('load', go, true);
}
function getElementsByXPath(xpath, parent) {
    let results = [];
    let query = document.evaluate(xpath,
        parent || document,
        null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    for (let i = 0, length = query.snapshotLength; i < length; ++i) {
        results.push(query.snapshotItem(i));
    }
    return results;
}

function getHostname(href) {
    const l = document.createElement('a');
    l.href = href;
    return l.hostname;
}

/**Returns the original link that ZScalar is blocking*/
function getOGZscalarUrl(zscalarUrl) {
    return new URL(zscalarUrl).searchParams.get('url');
}
/** Create an element by HTML.
 example:   var myAnchor = createElement('<a href="https://example.com">Go to example.com</a>');*/
function createElement(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.childNodes[0];
}

function entriesToObj(entries) {
    let obj = {};
    for (let [k,v] of entries) {
        obj[k] = v;
    }
    return obj;
}
