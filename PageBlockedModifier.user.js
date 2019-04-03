// ==UserScript==
// @name         Page Blocked
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      *
// @icon         https://alivingperson.files.wordpress.com/2010/09/blocked_200px.png
// @grant        none
// @noframes
// ==/UserScript==


// window.addEventListener("load", go, true);

Proxy = {
    fileStack: url => ("https://process.filestackapi.com/AhTgLagciQByzXpFGRI0Az/" + encodeURIComponent(url.trim())),
    steemitimages: url => ("https://steemitimages.com/0x0/" + url.trim()),
    ddg: url => /^https:\/\/proxy\.duckduckgo\.com/.test(url) || /^(javascript)/i.test(url) ? href :
        (`https://proxy.duckduckgo.com/iu/?u=${encodeURIComponent(url.trim())}&f=1`)
};


go();
function go() {
    'use strict';

    if (!isPageBlockedKSA()) {
        console.debug('Not page BLOCKED');
        return;
    }

    var getHostname = function (href) {
        var l = document.createElement("a");
        l.href = href;
        return l.hostname;
    };
    console.log("Running Page Blocked script");

    // Remove arabic
    const wrapper = q('div#wrapper');
    const tbody = q('tbody');
    // شيل
    const sheel = function (el) {
        if (el && el.style)
            el.remove();
        el.style.visibility = 'hidden';
    };

    Array.from(tbody.querySelectorAll('.arabic')).forEach(sheel);  // removing tbody
    sheel(q('#r3'));

    const proxies = createElement(`<div class="proxy">
    <h3>Proxies</h3>
    <li><a class="proxy_ddg" href="${Proxy.ddg(location.href)}">DuckDuckGo</a></li>
    <li><a class="proxy_steemitimages" href="${Proxy.steemitimages(location.href)}">SteemitImages</a></li>
    <li><a class="proxy_fileStack" href="${Proxy.fileStack(location.href)}">Filestack</a></li>
</div>`);

    const ss = (getHostname(location.href));
    const siteSearchEl = createElement(`<div><a href="${siteSearchUrl(ss)}">Google Images Site: ${ss}</a></div>`);

    const urlSearch = location.href;
    const siteUrlSearchEl = createElement(`<div><a href="${siteSearchUrl(urlSearch)}">Google Images Site: ${urlSearch}</a></div>`);
    // container.appendChild(proxies);
    // container.appendChild(siteSearchEl);

    let tdEnglish = qa('td.english'); // there are 4 of them
    tdEnglish[2].innerHTML = proxies.outerHTML;
    tdEnglish[3].innerHTML = "";
    tdEnglish[3].appendChild(siteSearchEl);
    tdEnglish[3].appendChild(siteUrlSearchEl);


    /**Returns a DuckDuckGo proxy url (attempts to unblock the url)*/
}

function isPageBlockedKSA() {
    const msgText = document.querySelector('#r4 > td[dir="ltr"].english');
    return !!msgText && msgText.innerText === "If you believe the requested page should not be blocked please click here." &&
        !!document.querySelector('[href^="http://www.internet.gov.sa/resources-ar/block-unblock-request-ar/view?set_language"]');
}

/**Returns the original link that ZScalar is blocking*/
function getOGZscalarUrl(zscalarUrl) {
    const x = new URL(zscalarUrl).searchParams.get('url');
    // const x = decodeURIComponent(('' + zscalarUrl).substring(46, zscalarUrl.indexOf('&referer')));
    log('Extracted ZScalar original link:', x);
    return x;
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


/*
var condition = document.body.innerHTML.match(`عفواً، الموقع المطلوب غير متاح.</h1></td><td dir="ltr" class="english"><h1>Sorry, the requested page is unavailable.</h1></td></tr> <tr id="r3"><td><hr></td><td><hr></td></tr> <tr id="r4">
<td dir="rtl" class="arabic">إن كنت ترى أن هذه الصفحة ينبغي أن لا تُحجب تفضل <a href="http://www.internet.gov.sa/resources-ar/block-unblock-request-ar/view?set_language=ar">بالضغط هنا</a>.</td><td dir="ltr" class="english">If you believe the requested page should not be blocked please <a href="http://www.internet.gov.sa/resources/block-unblock-request/view?set_language=en">click here</a>.</td></tr> <tr id="r5"><td dir="rtl" class="arabic">لمزيد من المعلومات عن خدمة الإنترنت في المملكة العربية السعودية، يمكنك زيارة الموقع التالي: <a href="http://www.internet.gov.sa/view?set_language=ar" class="english">www.internet.gov.sa</a></td><td dir="ltr" class="english">For more information about internet service in Saudi Arabia, please click here: <a href="http://www.internet.gov.sa/view?set_language=en">www.internet.gov.sa</a></td></tr></tbody>`);
*/