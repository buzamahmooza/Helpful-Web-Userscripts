// ==UserScript==
// @name         Zscalar BLOCKED page modifier
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Creates a clickable link to the original URL, as well as a "Google Images SiteSearch" link to see the site's pictures.
// @author       You
// @include      https://zscaler.kfupm.edu.sa/Default.aspx?url=*
// @require 	 https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @grant        unsafeWindow
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\Handy AF functions Faris.user.js
// ==/UserScript==


// javascript:function repl(url){console.log("original url should be: "+url);
// url=decodeURIComponent(url.substring("https://zscaler.kfupm.edu.sa/Default.aspx?url=".length,url.indexOf("&referer")));
// console.log("original url should be: "+url); alert("Check the console for a clickable version (F12). The original URL is: "+url); return url;}
// repl(prompt("Enter the zscalar link to find the original URL:", "")); void (0);

// javascript:q=""+(window.getSelection?window.getSelection():document.getSelection?document.getSelection():document.selection.createRange().text);
// if(q!=null)location="http://www.google.com/search?q="+q.replace(/%5Cs+/g,"+")+"+site:"+location.HOSTNAME;void(0);

'use strict';
const IMG_SEARCH_URL = "https://www.google.com/search?&tbm=isch&q=";

(function () {
    const ogLink = getOGZscalarLink(location.href);
    console.log('Link:', ogLink);

    var cssRules = '' +
        '.myAnchors { text-align: center; } ' +
        '.myAnchors a img { transition: transform 250ms ease; width:100px; max-width:150;translate3d(0, 0, 100); padding:5px 5px; } ' +
        '.myAnchors a:hover img { transform: scale(1.6, 1.6); } ' +
        'a.myAnchors:link {color: red;}' +
        'a.myAnchors:visited {color: green;}' +
        'a.myAnchors:hover {color: hotpink;}' +
        'a.myAnchors:active {color: blue;}' +
        'a.myAnchors:{font-size: 8px; padding:5px 5px;}' +
        'body {' +
        'background-color: #474747;' +
        /*     background-image: url(https://thumbs.gfycat.com/CoordinatedWindyArrowworm-mobile.jpg); */
        /*     background-image: url(http://i.imgur.com/L0bKOnv.jpg); */
        'background-image: url(http://www.blur.com/assets/uploads/2016/04/doom_tv_06.jpg);' +
        'background-size:     cover;' +
        'background-repeat:   no-repeat;' +
        'background-position: center center;' + /* optional, center the image */
        '}';

    var cssBlock = document.createElement('style');
    cssBlock.innerText = cssRules;
    document.getElementsByTagName('head')[0].appendChild(cssBlock);

    var p = document.querySelector("p>strong").parentNode;
    var strongs = document.querySelectorAll("p>strong");
    var pReason = strongs[1].parentNode,
        strong = strongs[0];

    const URL_START_INDEX = 31;
    var link = p.innerHTML.substring(URL_START_INDEX, p.innerHTML.length);
    var ssCell = document.createElement('div');

    var urlAnchor = createElement(
        '<a id="urlAnchor" class="myAnchors" style="display:"' +
        //		',text-align:center'+
        'href="' + link + '">' + // href
        (link + '\"') + // innerText
        '</a>'
    );
    var siteSearchAnchor = createElement(
        '<a id="siteSearchAnchor" class="myAnchors" style="display:" ' +
        'href="' + (IMG_SEARCH_URL + escape('site:' + getHostname(link))) + '">' + // href
        ('GOOGLE SITE SEARCH \"') + escape(getHostname(link)) + '\"' + // innerText
        '</a>'
    );
    var siteSearchUrlAnchor = createElement(
        '<a id="siteSearchUrlAnchor" class="myAnchors" style="display:" ' +
        'href="' + (IMG_SEARCH_URL + ('site:' + escape(link))) + '">' + // href
        ('image search:	' + link) + // innerText
        '</a>'
    );
    var toDdgAnchor = createElement(
        '<a id="toDdgAnchor" class="myAnchors" style="display:" ' +
        'href="' + ddgProxy(ogLink) + '">' + // href
        'To DDG Proxy' + // innerText
        '</a>'
    );

    var replacedNode = p.appendChild(urlAnchor, strong);
    var replacedNode1 = p.appendChild(siteSearchAnchor, strong);
    ssCell.appendChild(siteSearchAnchor);

    p.innerHTML = urlAnchor.outerHTML;
    p.appendChild(ssCell);
    p.appendChild(toDdgAnchor);
    let ssua = document.createElement('div');
    ssua.appendChild(siteSearchUrlAnchor);
    toDdgAnchor.after(ssua);
    p.style += ' text-align:left ';


    console.log("p: " + pReason.innerHTML);

    document.body.style.backgroundImage = "url('')"; // set background image
    document.body.style.backgroundSize = "1200px";
    document.body.style.color = "#aa0000";


    var stringReason = pReason.innerHTML.replace("<strong>Reason:</strong>&nbsp;", "");
    switch (stringReason) {
        case "Not allowed to browse Pornography category":
            // document.body.style.size = "700px 800px";
            break;
    }

//strong.remove();
})();

function getHostname(href) {
    var l = document.createElement("a");
    l.href = href;
    return l.hostname;
}
