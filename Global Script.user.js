// ==UserScript==
// @name         Global Script
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Contains general functions that could be handy on any site
// @description  Small basic functions such as clicking the "sign-in" button or removing ".sa" from google.com
// @author       Faris Hijazi
// @include      *
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @require      http://code.jquery.com/jquery-latest.min.js
// @require      https://gist.githubusercontent.com/sukima/5613286/raw/fe8f354b97fc578cbd7d4af8514a515e1a9f4639/XORCipher.js
// @run-at		 document-start
// ==/UserScript==
// @require      file://C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\GlobalScript.user.js

const onDirectlyOpenImage = (document.images.length == 1 && document.images[0].src == window.location.href);
const ENABLE_MUTATION_OBSERVERS = true;
/** if true, left and right arrow keys will try to find the "next page" and "prev page" buttons*/
const bindPageNavigators = false;

/* mousetrap v1.6.2 craig.is/killing/mice */
/*(function (p, t, h) {
    function u(a, b, d) {
        a.addEventListener ? a.addEventListener(b, d, !1) : a.attachEvent("on" + b, d)
    }
    function y(a) {
        if ("keypress" == a.type) {
            var b = String.fromCharCode(a.which);
            a.shiftKey || (b = b.toLowerCase());
            return b
        }
        return m[a.which] ? m[a.which] : q[a.which] ? q[a.which] : String.fromCharCode(a.which).toLowerCase()
    }
    function E(a) {
        var b = [];
        a.shiftKey && b.push("shift");
        a.altKey && b.push("alt");
        a.ctrlKey && b.push("ctrl");
        a.metaKey && b.push("meta");
        return b
    }
    function v(a) {
        return "shift" == a || "ctrl" == a || "alt" == a ||
            "meta" == a
    }
    function z(a, b) {
        var d, e = [];
        var c = a;
        "+" === c ? c = ["+"] : (c = c.replace(/\+{2}/g, "+plus"), c = c.split("+"));
        for (d = 0; d < c.length; ++d) {
            var k = c[d];
            A[k] && (k = A[k]);
            b && "keypress" != b && B[k] && (k = B[k], e.push("shift"));
            v(k) && e.push(k)
        }
        c = k;
        d = b;
        if (!d) {
            if (!n) {
                n = {};
                for (var h in m) 95 < h && 112 > h || m.hasOwnProperty(h) && (n[m[h]] = h)
            }
            d = n[c] ? "keydown" : "keypress"
        }
        "keypress" == d && e.length && (d = "keydown");
        return {key: k, modifiers: e, action: d}
    }
    /!**
     * @return {boolean}
     *!/
    function C(a, b) {
        return null === a || a === t ? !1 : a === b ? !0 : C(a.parentNode, b)
    }
    function e(a) {
        function b(a) {
            a =
                a || {};
            var b = !1, l;
            for (l in n) a[l] ? b = !0 : n[l] = 0;
            b || (w = !1)
        }
        function d(a, b, r, g, F, e) {
            var l, D = [], h = r.type;
            if (!f._callbacks[a]) return [];
            "keyup" == h && v(a) && (b = [a]);
            for (l = 0; l < f._callbacks[a].length; ++l) {
                var d = f._callbacks[a][l];
                if ((g || !d.seq || n[d.seq] == d.level) && h == d.action) {
                    var c;
                    (c = "keypress" == h && !r.metaKey && !r.ctrlKey) || (c = d.modifiers, c = b.sort().join(",") === c.sort().join(","));
                    c && (c = g && d.seq == g && d.level == e, (!g && d.combo == F || c) && f._callbacks[a].splice(l, 1), D.push(d))
                }
            }
            return D
        }
        function h(a, b, d, g) {
            f.stopCallback(b,
                b.target || b.srcElement, d, g) || !1 !== a(b, d) || (b.preventDefault ? b.preventDefault() : b.returnValue = !1, b.stopPropagation ? b.stopPropagation() : b.cancelBubble = !0)
        }
        function c(a) {
            "number" !== typeof a.which && (a.which = a.keyCode);
            var b = y(a);
            b && ("keyup" == a.type && x === b ? x = !1 : f.handleKey(b, E(a), a))
        }
        function k(a, d, r, g) {
            function l(d) {
                return function () {
                    w = d;
                    ++n[a];
                    clearTimeout(p);
                    p = setTimeout(b, 1E3)
                }
            }
            function e(d) {
                h(r, d, a);
                "keyup" !== g && (x = y(d));
                setTimeout(b, 10)
            }
            for (var c = n[a] = 0; c < d.length; ++c) {
                var f = c + 1 === d.length ? e : l(g ||
                    z(d[c + 1]).action);
                m(d[c], f, g, a, c)
            }
        }
        function m(a, b, c, g, e) {
            f._directMap[a + ":" + c] = b;
            a = a.replace(/\s+/g, " ");
            var h = a.split(" ");
            1 < h.length ? k(a, h, b, c) : (c = z(a, c), f._callbacks[c.key] = f._callbacks[c.key] || [], d(c.key, c.modifiers, {type: c.action}, g, a, e), f._callbacks[c.key][g ? "unshift" : "push"]({
                callback: b,
                modifiers: c.modifiers,
                action: c.action,
                seq: g,
                level: e,
                combo: a
            }))
        }
        var f = this;
        a = a || t;
        if (!(f instanceof e)) return new e(a);
        f.target = a;
        f._callbacks = {};
        f._directMap = {};
        var n = {}, p, x = !1, q = !1, w = !1;
        f._handleKey = function (a,
                                 c, e) {
            var g = d(a, c, e), f;
            c = {};
            var l = 0, k = !1;
            for (f = 0; f < g.length; ++f) g[f].seq && (l = Math.max(l, g[f].level));
            for (f = 0; f < g.length; ++f) g[f].seq ? g[f].level == l && (k = !0, c[g[f].seq] = 1, h(g[f].callback, e, g[f].combo, g[f].seq)) : k || h(g[f].callback, e, g[f].combo);
            g = "keypress" == e.type && q;
            e.type != w || v(a) || g || b(c);
            q = k && "keydown" == e.type
        };
        f._bindMultiple = function (a, b, c) {
            for (var d = 0; d < a.length; ++d) m(a[d], b, c)
        };
        u(a, "keypress", c);
        u(a, "keydown", c);
        u(a, "keyup", c)
    }
    if (p) {
        var m = {
            8: "backspace",
            9: "tab",
            13: "enter",
            16: "shift",
            17: "ctrl",
            18: "alt",
            20: "capslock",
            27: "esc",
            32: "space",
            33: "pageup",
            34: "pagedown",
            35: "end",
            36: "home",
            37: "left",
            38: "up",
            39: "right",
            40: "down",
            45: "ins",
            46: "del",
            91: "meta",
            93: "meta",
            224: "meta"
        }, q = {
            106: "*",
            107: "+",
            109: "-",
            110: ".",
            111: "/",
            186: ";",
            187: "=",
            188: ",",
            189: "-",
            190: ".",
            191: "/",
            192: "`",
            219: "[",
            220: "\\",
            221: "]",
            222: "'"
        }, B = {
            "~": "`",
            "!": "1",
            "@": "2",
            "#": "3",
            $: "4",
            "%": "5",
            "^": "6",
            "&": "7",
            "*": "8",
            "(": "9",
            ")": "0",
            _: "-",
            "+": "=",
            ":": ";",
            '"': "'",
            "<": ",",
            ">": ".",
            "?": "/",
            "|": "\\"
        }, A = {
            option: "alt", command: "meta", "return": "enter",
            escape: "esc", plus: "+", mod: /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "meta" : "ctrl"
        }, n;
        for (h = 1; 20 > h; ++h) m[111 + h] = "f" + h;
        for (h = 0; 9 >= h; ++h) m[h + 96] = h.toString();
        e.prototype.bind = function (a, b, d) {
            a = a instanceof Array ? a : [a];
            this._bindMultiple.call(this, a, b, d);
            return this
        };
        e.prototype.unbind = function (a, b) {
            return this.bind.call(this, a, function () {
            }, b)
        };
        e.prototype.trigger = function (a, b) {
            if (this._directMap[a + ":" + b]) this._directMap[a + ":" + b]({}, a);
            return this
        };
        e.prototype.reset = function () {
            this._callbacks = {};
            this._directMap = {};
            return this
        };
        e.prototype.stopCallback = function (a, b) {
            return -1 < (" " + b.className + " ").indexOf(" mousetrap ") || C(b, this.target) ? !1 : "INPUT" == b.tagName || "SELECT" == b.tagName || "TEXTAREA" == b.tagName || b.isContentEditable
        };
        e.prototype.handleKey = function () {
            return this._handleKey.apply(this, arguments)
        };
        e.addKeycodes = function (a) {
            for (var b in a) a.hasOwnProperty(b) && (m[b] = a[b]);
            n = null
        };
        e.init = function () {
            var a = e(t), b;
            for (b in a) "_" !== b.charAt(0) && (e[b] = function (b) {
                return function () {
                    return a[b].apply(a,
                        arguments)
                }
            }(b))
        };
        e.init();
        p.Mousetrap = e;
        "undefined" !== typeof module && module.exports && (module.exports = e);
        "function" === typeof define && define.amd && define(function () {
            return e
        })
    }
})("undefined" !== typeof window ? window : null, "undefined" !== typeof window ? document : null);*/
// unsafeWindow.Mousetrap = Mousetrap;


(function start() {
    try {
        addListenersToPages();
        // removeClickListeners();

        (function executeUrlParamsEval() {
            if (typeof URL !== 'function') return;
            const evalStr = new URL(location.href).searchParams.get('eval');
            if (evalStr) {
                console.log('evaluating URL searchParams:', `"${evalStr}"`);
                eval(evalStr);
            }
        })();
    } catch (e) {
        console.error(e);
    }
})();

function removeClickListeners(selector) {
    if (!!$) {
        $(!selector ? "*" : selector)
            .unbind("click")
            .off("click")
            .removeAttr("onclick");
    } else {
        console.error('$ is not defined, cannot removeClickListeners().');
    }
}

/**abbreviation for querySelectorAll()
 * @param selector
 * @param node
 * @return {set<HTMLElement>} */
function qa(selector, node = document) { return node.querySelectorAll(selector); }
/**abbreviation for querySelector()
 * @param selector
 * @param node
 * @return {HTMLElement} */
function q(selector, node = document) { return node.querySelector(selector); }

function addListenersToPages() {
    // press ctrl+shift click an image to download it
    window.addEventListener('click', (e) => {
        if (!(e.ctrlKey && e.shiftKey)) return;

        var img,
            el = elementUnderMouse(e);
        if (el.tagName === "IMG") {
            img = el;
        } else {
            img = el.querySelector('img');
            if (nodeDepth(img, el) > 2) {
                img = null;
            }
        }
        if (!img) {
            img = {};
            var bgImg = el.querySelector('[style*="background-image"]');
            if (nodeDepth(bgImg, el) <= 2)
                if (bgImg)
                    img.src = bgImg.style["background-image"].replace(/(['"]?\)$)|(^url\(["']?)/g, '');
        }
        console.log('image under mouse:', img);
        download(img.src, img.alt);
    });

    bindKeys();
    function bindKeys() {

        Mousetrap.bind(["o o"], (keyEvent) => {
            console.log('o o: displayImages();');
            showImages.displayImages();
        });

        // navigate to next & previous page
        if (bindPageNavigators) {
            Mousetrap.bind(["left"], () => navigatePage(true));
            Mousetrap.bind(["right"], () => navigatePage(false));
        }

        // Ctrl + Numpad- or just Numpad- (if on DirectlyOpenImage)
        Mousetrap.bind(["-", "alt+-"], (keyEvent) => {
            if (onDirectlyOpenImage || keyEvent.altKey) {
                location.assign(getIncrementedUrl(location.href, -1));
                keyEvent.preventDefault();
                console.debug('incr URL down');
            }
        });
        // Ctrl + Numpad+ or just Numpad+ (if on DirectlyOpenImage)
        Mousetrap.bind(["+", "alt++"], (keyEvent) => {
            if (onDirectlyOpenImage || keyEvent.altKey) {
                location.assign(getIncrementedUrl(location.href, 1));
                keyEvent.preventDefault();
                console.debug('incr URL up');
            }
        });

        // execute selection as JavaScript
        Mousetrap.bind(["ctrl+shift+r"], function evaluateSelection() {
            const selection = window.getSelection ? window.getSelection() : document.getSelection(),
                selectionText = selection.toString();
            eval(selection);
        });

        // open longest video
        function getLongestVideoUrl() {
            const videos = qa('video');
            if (videos) {
                const sortedByDuration = Array.from(videos).sort((a, b) => a.duration > b.duration);
                return sortedByDuration[0].src || sortedByDuration[0].querySelector('source').src;
            }
        }
        Mousetrap.bind(["o v"], () => {
            const longestVideoUrl = getLongestVideoUrl();
            if (!longestVideoUrl) {
                console.warn("No videos found on this page :(");
                return;
            }
            window.open(longestVideoUrl, "_blank");
        });
        // collect and open images in new page
        Mousetrap.bind("o i", (keyEvent) => {
            console.log('Collect images');
            keyEvent.preventDefault();

            // language=HTML
            var html = `<head>
<style>
	
	* {
       	font-family: sans-serif;
    }
    body {
        background: grey;
	}
    .img-container {
        margin: 10px;
    }
    .img-dimensions {
        display: block;
        font-size: 15px;
    }

</style>
</head>
<body>
	<p1>Collected images from <a href="${location.href}">${document.title}</a></p1>
</body>`;
            for (const img of qa('img')) {
                html +=
                    `<div class="img-container">
    <a href="${img.src}" target="_blank">${img.outerHTML}</a>
    <strong class="img-dimensions">${img.getAttribute('img-dim')}</strong><strong>${img.title || img.name}</strong>
</div>`;
            }

            html += `<button action="JavaScript:console.log('bekfast button');">Download</button>`;
            // var win = window.open(location.href, `Collected images from ${document.title}`, `toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${screen.width},height=${screen.height}`);
            // win.document.body.innerHTML = html;
            document.write(html);
            document.close();
        });
        // Site search
        Mousetrap.bind("alt+shift+;", function globalSiteSearch() {
            const selection = window.getSelection ? window.getSelection() : document.getSelection(),
                selectionText = selection.toString();
            var qq = selectionText ? encodeURIComponent(selectionText) : `site:${encodeURIComponent(location.hostname)}`;

            const noConfirm = true;
            if (noConfirm || confirm(`Would you like to site search? "${qq}"`)) {
                window.open(`https://encrypted.google.com/search?&hl=en&tbm=isch&q=${qq}`, "_blank");
            }
        });

        Mousetrap.bind("?", () => {
            // todo:	fix this, make a universla function to expose the function names or at least the function code
            console.log('show shortcuts!');
        });
        /*Mousetrap.bind("ctrl+shift+`", () => {
            const input = prompt(`Enter JavaScript to evaluate`, `console.log('Hello, World!');`);
            if (input && input.length > 1) {
                console.log('JavaScript input:', `"${input}"`);
                console.log(eval(input));
            }
        });*/
        Mousetrap.bind("alt+up", () => {
            const href = location.href;

            // file:/// URLs (local page)
            var parentDir = document.querySelector('#parentDirText');
            if (parentDir) {
                parentDir.click();
                return;
            }
            // remove hash
            if (location.hash) {
                location.assign(href.substr(0, href.indexOf(location.hash)));
                return;
            }

            var newLoc = href;
            // remove a "/"
            try {
                var split = href.split("/");
                if (!split.pop()) split.pop(); // if the last string popped was "", pop another string
                newLoc = split.join("/");
            } catch (err) {
            }
            console.debug('location after removing the last "/":\n', href, " -> \n", newLoc);
            location.assign(newLoc);
        });
        Mousetrap.bind("alt+h", () => {
            var el = document.body;
            if (/google/.test(location.hostname)) el = document.querySelector('#rcnt, #main');
            console.debug('hiding el:', el);
            el.style.visibility = (el.style.visibility == 'hidden') ? 'visible' : 'hidden';
        });

        // knowyourmeme
        if (matchSite("knowyourmeme.com/photos/")) {
            function _knowyourmeme_DlPost() {
                const title = q('#media-title').innerText, anchors = qa('div#photo_wrapper > a[href]');
                for (var i = 0; i < anchors.length; i++) {
                    download(anchors[i].href, `${title}${anchors.length > 1 ? ` ${++i}` : ""}`, 'knowyourmeme');
                }
            }
            function _knowyourmeme_DlAll(confirmWithUser) {
                if (!confirmWithUser || confirm(`Download [${document.querySelectorAll('img[data-src]').length}] images?`)) {
                    var dls = Array.from(document.querySelectorAll('img[data-src]')).map(
                        img => ({ url: img.getAttribute('src').replace('masonry', 'original'), name: img.alt })
                    );
                    for (const dl of dls) {
                        download(dl.url, dl.name, `${location.hostname} - ${document.title}`);
                    }
                }
            }
            function _knowyourmeme_ShowNsfwThumbnails() {
                try {
                    for (const el of document.querySelectorAll('[data-original-image-url][src]')) {
                        el.setAttribute('src', el.getAttribute('data-original-image-url'));
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            function _knowyourmeme_addDlButton() {
                const dlAnchor = createElement(`<a href="JavaScript:void(0);" class="large red button download-media-button" rel="nofollow">Download</a>`);
                dlAnchor.addEventListener('click', _knowyourmeme_DlPost);
                q('#media_arrows > tbody > tr > td.middle').after(dlAnchor);
            }
            Mousetrap.bind(["enter", "d"], _knowyourmeme_DlPost);
            Mousetrap.bind(["alt+s"], () => _knowyourmeme_DlAll(true));
            _knowyourmeme_addDlButton();

            observeDocument(_knowyourmeme_ShowNsfwThumbnails);
        }
        // youtube
        else if (matchSite("youtube.com")) {
            Mousetrap.bind(["r 1"], function () {
                console.warn('"r 1" hotkey NOT IMPLEMENTED');
            });
        }
        // tumblr
        else if (matchSite("tumblr.com")) {
            if (matchSite('tumblr.com/archive')) {
                Mousetrap.bind(["alt+s"], function downloadTumblrArchive() {
                    (function downloadTumblrArchive() {
                        var urls = Array.from(document.querySelectorAll('div.post')).map(post => {
                            try {
                                return post.querySelector('div[data-imageurl]').getAttribute('data-imageurl').replace(/_250\./, '_1280.');
                            } catch (r) {
                                console.error(r);
                            }
                        }).filter(url => !!url);

                        if (confirm(`Download ${urls.length} images?`)) {
                            zipImages(urls);
                        }
                    })();
                }
                );
            }
        }
        else if (matchSite("audioblocks.com")) {
            Mousetrap.bind(["d"], () => {
                download(q('audio').src);
                console.log('Download post');
            });
        }
        else if (matchSite("gfycat.com")) {
            Mousetrap.bind(["d"], () => {
                download(q('video').src);
                console.log('Download post');
            });
        }
        // imgur
        else if (matchSite('imgur.com/')) {
            Mousetrap.bind(["d"], () => {
                q('a.post-action-option > .icon-download').parentElement.click();
                console.log('Download post');
            });
        }
        else if (matchSite("betterfap.com")) {
            Mousetrap.bind(["alt+s", "enter"], (e) => {
                e.preventDefault();
                download(q('#embed-container-new').querySelector('img, source').src, q("#item-title").innerText);
            });
        }
        else if (matchSite('deviantart.com')) {
            function deviantartDownloadFromDownloadBtn(keyEvent) {
                var downloadEl = document.querySelector('a.dev-page-button.dev-page-button-with-text.dev-page-download[href]');
                if (!downloadEl) {
                    return;
                }
                var data_download_url = downloadEl.getAttribute("data-download_url");
                if (downloadEl.href !== data_download_url) {
                    download(data_download_url, null, null, 'deviantart.com');
                    keyEvent.preventDefault();
                    return true;
                }
            }
            function downloadPost() {
                const postTitle = q('div.dev-title-container > h1').innerText;
                const downloadBtn = q('a.dev-page-button.dev-page-button-with-text.dev-page-download');
                const img = q('div.dev-view-deviation > img.dev-content-normal');
                download(downloadBtn ? downloadBtn.href : img.src, postTitle, 'deviantart.com');
            }
            if (matchSite('deviantart.com/art/')) {
                // makes main images click-able
                for (const mainImage of qa('div.dev-view-deviation > img.dev-content-normal')) {
                    mainImage.addEventListener('click', function openInNewTab() {
                        window.open(mainImage.src, "_blank")
                    }, true)
                }
                (function _addPreviewDownloadLinks() {
                    for (const e of qa('a.dl-anchor')) e.remove();
                    for (const preview of qa('div.deviation-mlt-preview.deviation-mlt-preview-b')) {
                        var usernameSpan = preview.querySelector('span.username-with-symbol');
                        console.log(preview);

                        var dlAnc = createElement(`<a href="JavaScript:void(0);" class="dl-anchor smbutton smbutton-textonly">Download thumbnails</a>`);
                        dlAnc.addEventListener('click', () => {
                            console.log('download thumbnails');
                            for (const thumb of preview.querySelectorAll('div.tinythumb')) {
                                const fileUrl = thumb.style["background-image"].replace(/(['"]?\)$)|(^url\(["']?)/g, '');
                                download(
                                    fileUrl,
                                    `${preview.querySelector('h3, h4').innerText} - ${fileUrl.split('/').pop()}`,
                                    'deviantart.com/thumbs'
                                );
                            }
                        });
                        preview.appendChild(dlAnc);
                    }
                })();
                Mousetrap.bind(["alt+s", "d"], () => deviantartDownloadFromDownloadBtn() ? null : downloadPost());
                Mousetrap.bind(["enter"], downloadPost);
            }
            // go to gallery
            Mousetrap.bind(["g"], () => {
                var galleryAnchor = q('a[gpage_name="gallery"], a[href*=".deviantart.com/gallery/"]');
                if (galleryAnchor && galleryAnchor.href != location.href) {
                    location.assign(galleryAnchor.href);
                    console.debug('we gallery anchor exists and we aren\'t on the gallery');
                }
            });
        }
        else if (matchSite("www.artstation.com/artwork/")) {
            Mousetrap.bind(["d"], () => Array.from(qa('.artwork [href$="&dl=1"]')).forEach(a => download(a.href, null, `..${location.hostname}`)));
        }
        else if (hostIs('reddit')) { // expand expandos for reddit
            Mousetrap.bind(["`"], () => {
                for (const expando of qa('.icon-expandoArrowExpand, .collapsedExpando, .expando-button, .Post__expandoIcon, .icon-expand-image, .Media__obfuscationGate')) {
                    expando.click();
                }
                console.log("expand expandos for reddit");
            });
            Mousetrap.bind(["alt+s"], function reddit_downloadExpandedPosts() {
                var dlData = new Set();
                document.querySelectorAll('div.thing.linkflair').forEach(function (e, i, array) {
                    try {
                        var mediaEl = e.querySelector('a img[src].res-image-media:not([src^="data"]), a source[src]'),
                            url = !(mediaEl) ? "" : mediaEl.src;

                        if (!mediaEl) console.error(`mediaEl "e.querySelector('a img[src].res-image-media, a source[src]')" is null for thing:`, e);

                        const dataHrefUrl = e.querySelector('a.thumbnail')["data-href-url"];
                        if (/\.(jpg|png|gif)($|\?)/i.test(dataHrefUrl)) {
                            url = dataHrefUrl;
                        }
                        dlData.add({
                            url: url,
                            name: e.querySelector('.title').innerText
                        });
                    } catch (e) {
                        console.error(e);
                    }
                });
                console.log(Array.from(dlData));

                for (const dlD of dlData) {
                    download(dlD.url, dlD.name, `..${location.hostname}/${document.title}`);
                }
            });
        }
        else if (matchSite("simply-hentai.com")) {
            Mousetrap.bind("alt+s", () => {
                zipImages(
                    Array.from(
                        document.querySelectorAll('.image-row picture > img[data-src*="vertical/medium_thumb/"]'))
                        .map(img => img.getAttribute('data-src').replace('/medium_thumb/', '/full/')
                        )
                );

            });
        }
        else if (matchSite("freesound.org/")) {
            Mousetrap.bind("enter", () => {
                download(document.querySelector('#single_sample_player > div > div.metadata > a.mp3_file').href, document.title);
            });
        } else if (matchSite("https://www.pinterest.com")) {
            function dlPinterest() {
                if (typeof download !== 'function') {
                    alert("The download function was not found on this page, please run the 'downoader' script using tampermonkey.");
                    void (0);
                }
                var imgBoxes = document.querySelectorAll('div.pinWrapper');
                console.log('ImgBoxes:', imgBoxes);
                if (confirm(`Download ${imgBoxes.length} images?`))
                    imgBoxes.forEach(imgBox => {
                        try {
                            let img = imgBox.querySelector('img[srcset]');
                            let srcSet = img.getAttribute('srcset');
                            let src = srcSet.match(new RegExp(`(/{1,2}|http(s?:))[\d\w?%-_/\=.]*?.(jpg|png|jpeg|gif|tiff)(&f=1)?`, "gim")).pop();
                            let name = imgBox.querySelector('._nv._ms._mt._mu._nx._5k._mv._n5._n3._my span span').innerHTML;
                            console.log('src:', src, 'name:', name);
                            if (typeof download === 'function') download(src, name); else window.open(src, "_blank");
                        } catch (exc) {
                            console.warn(exc);
                        }
                    });
            }
            function dlBoard() {
                var pinWrappers = document.querySelectorAll('div.pinWrapper');
                var dlLimit = -1;
                if (confirm(`Download all original iamges on Pinterest page?\n(${pinWrappers.length} found).`))
                    pinWrappers.forEach(function (wrapper, index, array) {
                        if (dlLimit > index) {
                            console.log('Downloads limited to:', dlLimit);
                            return;
                        }
                        var img = wrapper.querySelector('img');
                        var name = `${index}_${wrapper.innerText.trim()}`;
                        var bigImgSrc = img.src.replace(/\.com\/[\d]{1,3}x\//i, ".com/originals/");
                        console.log('Getting bigImg url from src:', bigImgSrc);
                        var bestSrc = extractFromSrcSet(img);
                        download(bestSrc.length > 1 ? bestSrc : bigImgSrc, name, `${location.hostname}/${document.title}`);
                        console.log('bestsrc:', bestSrc);
                    });
                function extractFromSrcSet(img) {
                    var bestSrc = "_";
                    try {
                        var srcset = img.getAttribute('srcset').split(/\s*?\dx,*\s*/);
                        var topSrc = srcset.pop();
                        bestSrc = topSrc.length > 0 ? topSrc : srcset.pop();
                    } catch (e) {
                    }
                    return bestSrc;
                }
            }
            Mousetrap.bind(["alt+s", "d"], dlBoard);
        }
        else if (matchSite("http://spritedatabase.net/file/")) {
            Mousetrap.bind(["alt+s", "d"], function (e) {
                var a = q('a[rel="lightbox"]');
                var game = q('body > div.column > table > tbody > tr > td:nth-child(2) > a:nth-child(2)');
                download(a.href, `${a.title} - ${game ? game.innerText : ""} ${location.hostname}`);
            });
        }
        // github
        else if (hostIs('github.com')) {
            // github edit file
            // https://github.com/*/edit/*.*
            Mousetrap.bind(["e"], () => q('a[aria-label^="Edit"]').click());
            // Mousetrap.bind(["??? idk what this does"], () => document.querySelectorAll('div.edit.container > div.form-actions > button, #submit-file, .btn-primary').forEach(elt => elt.click())
        }
        else if (matchSite(/https:\/\/(docs|sheets).google.com/)) {
            var hidePanel = function(){
                if (document.querySelector('button[name="returnToDrive"]')) {
                    const panel = document.querySelector('body > div.modal-dialog.docs-dialog.docs-restore-dialog');
                    const dim = document.querySelector('body > div.modal-dialog-bg.docs-restore-dialog-bg');
                    // panel && panel.remove();
                    // dim && dim.remove();
                    if(panel) panel.style.display = 'none';
                    if(dim) dim.style.display = 'none';
                }
            }

            var getter = () => {
                string = `File is in trash
To access this file, take it out of the trash.

If this file is shared, collaborators can still make a copy of it until it's permanently deleted. Learn more
Go to Docs home screen
Take out of trash`.replace(/\n/g, '');
                return getElementsByXPath(`/html/body/div[contains(., "${string}")]`);
            }
            waitForElement('button[name="returnToDrive"]', function (els) {
                var el = els.length ? els[0] : els;
                var escBtn = el.cloneNode();
                escBtn.innerText = 'Cancel';
                escBtn.setAttribute('name', 'CancelTrash');
                el.parentElement.appendChild(escBtn);
                escBtn.onclick = hidePanel;
            });
            // window.addEventListener('keyup', function (e) {
            //     if (e.key === 27) { // escape
            //         e.preventDefault();
            //         e.stopImmediatePropagation();
            //     }
            // });

        } else if (matchSite("https://photos.google.com")) {
            Mousetrap.bind(["del"], () => {
                // var selected = document.querySelectorAll('.WjVZdb .R1sU4e');
                // var threeDotsBtn = document.querySelector('#ow651 > content > span > svg');
                var delBtn = document.querySelector('[data-tooltip="Delete"]');
                if (delBtn) delBtn.click();

                let confirmationPopup = document.querySelector(`div[title="Remove from Google account, synced devices, and places it's shared?"]`),
                    confirmDelBtn = confirmationPopup.childNodes[2];
                if (confirmDelBtn) confirmDelBtn.click();
            });
        }
        // hackerrank
        else if (matchSite("www.hackerrank.com/challenges")) {
            Mousetrap.bind(["ctrl+enter"], () => q('[data-analytics="Compile and Test"]').click());
        }
        else if (matchSite("m.drtuber.com")) {
            Mousetrap.bind(["alt+s"], () => {
                if (confirm('Download video thumbnail previews?')) {
                    for (var relImg of document.querySelectorAll('#related_videos img')) {
                        if (relImg.hasAttribute('data-webm')) {
                            var src = relImg.getAttribute('data-webm');
                            download(src, `VidThumb ${document.title}`, `..${location.hostname}`);
                        }
                    }
                }
            });
        }
        else if (matchSite("yourporn.sexy")) {
            Mousetrap.bind(["alt+s"], function f_youporn() {
                (function () {
                    var containers = document.querySelectorAll('div.post_el_small');

                    var dlThumbs = confirm(`Download ${containers.length} vidThumbs?`);
                    var dlOgs = confirm("Open site pages and download the full videos too?");

                    containers.forEach(function (container) {
                        try {
                            const videoThumbnail = container.querySelector('video').src,
                                anchor = container.querySelector('a');
                            console.log(
                                'videoThumbnail:', videoThumbnail,
                                '\ntitle:', anchor.title,
                                '\npage:', anchor.href
                            );

                            if (dlThumbs)
                                download(videoThumbnail, `VidThumb ${container.querySelector('.post_text').innerText}`, `${location.hostname}/VidThumbs`);

                            if (dlOgs)
                                fetchElement(anchor.href, function (doc, url, opts) {
                                    //var matches = doc.innerHTML.match(vidRegex);
                                    //if(!matches) { console.warn('First vid not found :('); return; }
                                    const firstVid = doc.querySelector('.main_content video');
                                    var title = doc.querySelector('title').innerText;
                                    download(firstVid.src, title, `${location.hostname}`);
                                });
                        } catch (e) {
                            console.warn(e);
                        }
                    });
                })();
            });
            if (matchSite("yourporn.sexy/post")) {
                Mousetrap.bind(["d"], function f_youporn() {
                    console.log(`Oh hey! I noticed you're on ${location.hostname}`, "The downloader script has special behaviour for this website.");
                    var vid = document.querySelector('#player_el');
                    console.log('vid:', vid);
                    var url = vid.src ? vid.src : vid.querySelector('source').src;
                    var name = document.querySelector('[itemprop="description"]').getAttribute('content') || document.title;
                    download(url, name, location.hostname);
                });
            }
        }
        else if (matchSite("sex.com/user")) {
            function displayOriginals() {
                const containers = Array.from(qa('.masonry_box.small_pin_box'));
                for (const bx of containers) {
                    const img = bx.querySelector('img');
                    const bigSrc = img.src.replace('/300/', '/620/');
                    img.src = bigSrc;

                    const a = img.closest('a');
                    if (a) a.href = bigSrc;

                    const title = bx.querySelector('.title > a');
                    if (title) img.alt = title.innerText;
                }
                return containers;
            }
            Mousetrap.bind("`", displayOriginals);
            Mousetrap.bind("alt+s", () => zipImages(displayOriginals().map(bx => bx.querySelector('img'))));
        }
    }
}

// redirect immediately if the website is asking you to wait for a countdown
const loadAnchor = document.querySelector('a[rel][href="javascript:;"]');
if (!!loadAnchor) {
    console.log(`Website is asking you to wait? No problem, fuck that website.\nHere, take this: ${loadAnchor.getAttribute('rel')}`);
    location.assign(loadAnchor.getAttribute('rel'));
}

if (matchSite("m.drtuber.com")) {
    window.addEventListener('load', function load() {
        console.log('on m.drtuber.com, replacing images with vidthumbs');
        for (var relImg of qa('#related_videos img')) {
            if (relImg.classList.contains('vidThumb')) {
                continue;
            }
            if (relImg.hasAttribute('data-webm')) {
                var vidThumb = document.createElement('vid');
                var src = relImg.getAttribute('data-webm');
                console.debug('data-webm = ', src);
                vidThumb.src = src;
                relImg.parentNode.appendChild(vidThumb);

                // relImg.style.display = 'none';
                relImg.classList.add('vidThumb');
            }
        }
    });
}
if (matchSite("twitter.com")) {
    var translateAllBtn = document.createElement("button");
    translateAllBtn.innerText = "Translate Tweets";
    translateAllBtn.style.float = "left";
    translateAllBtn.onclick = function () {
        for (const btn of qa('button.js-translate-tweet')) {
            btn.click();
        }
    };
    q(".js-follow-btn").parentElement.parentElement.before(translateAllBtn);
}

if (/\.google\./i.test(location.hostname)) {
    const change2Eng = q('#Rzn5id > div > a:nth-child(3)');
    if (change2Eng) change2Eng.click(); // click on "Change to English"
}

function navigatePage(goLeft) {
    function getElWithAttrVal(searchAttrValue, startingNodes) {
        if (!startingNodes) startingNodes = qa('*');
        for (const startingNode of startingNodes) {
            const querySelectorAll = startingNode.querySelectorAll("*");
            if (querySelectorAll) {
                for (const el of querySelectorAll) {
                    var resultEl = elementContainsAttrValue(el, searchAttrValue);
                    if (resultEl) return resultEl;
                }
            }
        }
    }
    function elementContainsAttrValue(el, searchAttrValue) {
        for (const attrName of el.getAttributeNames()) {
            const attrValue = el.getAttribute(attrName);
            if (!attrValue) continue;

            if (attrValue.toLowerCase().indexOf(searchAttrValue.toLowerCase()) > -1) {
                console.log(`element containing: "${searchAttrValue}" found:`, el);
                return el;
            }
        }
    }
    console.debug(`navigatePage(${goLeft})`);
    let prev = q('.prev'),
        next = q('.next');
    if (!prev) prev = getElWithAttrVal("prev", qa("a, a *"));
    if (!next) next = getElWithAttrVal("next", qa("a, a *"));

    if (!prev && !next) {
        next = getElementsWithText('Next');
        if (next) next = next[0];

        prev = getElementsWithText('Prev');
        if (prev) prev = prev[0];
    }

    // only swap if both elements exist, without this check, it would perform a false-swap when only one exists
    if (prev && next) {
        if (getOffset(prev).left > getOffset(next).left) { // if prev is actually on the right side
            goLeft = !goLeft;
        }
    }

    console.debug(
        'prev:', prev,
        '\nnext:', next
    );

    goTo(goLeft ? prev : next);

    function goTo(navEl) {
        if (!navEl) {
            console.error("navEl is null:", navEl);
            return false;
        }
        var finalEl = navEl;

        if (navEl.parentNode) {
            const parentAnchor = navEl.closest("a");
            if (parentAnchor) {
                finalEl = parentAnchor;
            }
        } else {
            const childAnchor = navEl.querySelector('a');
            if (childAnchor) {
                finalEl = childAnchor;
            }
        }
        finalEl.click();
        console.log("clicking element:", finalEl);
    }
}


// google photos
if (hostIs('photos.google.com')) {
    //auto-click confirmation upon deletion
    new MutationObserver(function (mutations) {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                var confirmDel = node.querySelectorAll('.ZFr60d.CeoRYc')[3].nextSibling;
                confirmDel.click();
                console.log('Confirmed delete button');
            }
        }
    }).observe(document.body, {
        childList: true, subtree: true,
        attributes: false, characterData: false
    });
}
if (/oncesearch\.com\/details\//.test(location.href)) { // provide a Google search link for the torrent title
    let title = q('h1[itemprop="name"]');
    if (title) {
        console.log('found title:', title);
        title.innerText = title.innerText.replace(/(Direct Download )|( torrent)/g, '');
        title.setAttribute('href', gImgSearchURL + encodeURIComponent(title.innerText));
        title.setAttribute('target', '_blank');
        title.outerHTML = title.outerHTML.replace(/h1/g, 'a');
    }
}
if (matchSite('neogaf.com')) {
    for (const e of document.querySelectorAll('.is-expandable')) {
        e.classList.add('is-expanded');
    }
}


if (matchSite('imgur.com/')) {
    addCss(`
.comment-img {
    max-width: 300px;
    max-height: 300px;
    display: block;
}`
    );
    observeDocument(function (node) {
        for (const link of node.querySelectorAll('span.linkified > a')) {
            if (link.parentElement.querySelector('img.comment-img')) continue;
            const img = document.createElement(/\.gifv$/.test(link.href) ? 'iframe' : 'img');
            img.src = link.href;
            img.classList.add('comment-img');
            link.after(img);
        }
    });
}
//furaffinity download big image
if (matchSite('d.facdn.net/art/')) {
    download(location.href, document.title.split('.').slice(1).join('.'));
    window.close();
}
if (matchSite('furaffinity.net/(view|full)/')) { // furaffinity click images to get fullview
    const img = q('img#submissionImg');

    //preload the image
    var image = new Image();
    image.addEventListener('load', function onLoad() {
        console.debug('Just loaded fullview image ahead of time:', this);
    });
    image.src = img.getAttribute('data-fullview-src');
    unsafeWindow["_tempImage"] = image;

    if (img.getAttribute('data-fullview') == 0)
        if (img.complete) img.click();
        else img.addEventListener('load', function clickOnLoad() {
            img.click();
            img.removeEventListener('load', clickOnLoad);
        });
    Mousetrap.bind('d', () =>
        download(
            img.getAttribute('data-fullview-src'),
            q('#page-submission > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td.cat').innerText,
            location.hostname
        )
    );
}

// reddit.com
if (hostIs('reddit.com')) {
    let confirmBtn = q('body > div.content > div > form > div > button:nth-child(2)');
    if (!!confirmBtn) confirmBtn.click();
}
if (hostIs('mediafire.com')) {
    const downloadBtn = q('a[onclick="DLP_mOnDownload(this); return true;"]');
    console.debug('click downloadBtn:', downloadBtn);
    if (downloadBtn) downloadBtn.click();
}


// NEEDS WORK!!!
if (matchSite('https://blackboard.kfupm.edu.sa') || matchSite('login.kfupm.edu.sa')) {
    var interval = setInterval(() => {
        var confirmBtn = q('#entry-login, #lognbtn > input');
        if (confirmBtn) {
            confirmBtn.click();
            console.log('clicking submit button');
            clearInterval(interval);
        }
    }, 500);
    // observeDocument(function(node){if(node.querySelector('#entry-login')!==null)node.click();});
    // clickWhenBtnAppears('#entry-login');
    // if(confirmBtn!==null) confirmBtn.click();
}


if (hostIs('pcworld.com')) {
    observeDocument(function (node) {
        if (node.tag === 'vid') {
            node.remove();
        }
    });
}
const Mirrors = {
    pornleech: ['pornleech.tormi.bid', 'pornleech.torrentzmirror.org', 'pornleech.mrunlock.bid', 'pornleech.proxme.download'],
    rarbg: ['rarbg.unblocker.win']
};

if (ENABLE_MUTATION_OBSERVERS) {
    observeDocument(node => {
        try {
            if (/rarbg\./i.test(node.href)) {
                node.href = node.href.replace(getHostname(node.href), Mirrors.rarbg[0]);
            } else if (/pornleech\./i.test(node.href)) {
                node.href = node.href.replace(getHostname(node.href), Mirrors.pornleech[0]);
            }
            if (/m\.drtuber\.com/.test(location.href)) {
                if (node.hasAttribute('data-webm') && node.tagName == "VIDEO") {
                    console.log('on m.drtuber.com, replacing images with vidthumbs');
                    node.src = node.getAttribute('data-webm');
                }
            }
        } catch (e) {
            console.error(e);
        }
    });
}

function hostIs(hostname) {
    return !!~location.hostname.indexOf(hostname);
}
// if the current location matches this website
function matchSite(siteRegex) {
    const compareHost = (typeof siteRegex === 'string');
    let result = new RegExp(siteRegex).test(location.href);
    if (compareHost) result = result && new RegExp(siteRegex.split('/')[0]).test(location.hostname);
    if (result) {
        console.log("Site matched regex: " + siteRegex);
    }
    return result;
}

// var x = getOffset(document.getElementById('yourElId')).left;
function getOffset(el) {
    var _x = 0;
    var _y = 0;
    while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}
// when you're done with the link, be sure to clean it for garbage collection (link=null;)
function urlToAnchor(url) {
    var link = document.createElement('a'); // Create an anchor element
    link.setAttribute('href', url);

    // Get any piece of the url you're interested in
    // in the url = 'http://example.com:12345/blog/foo/bar?startIndex=1&pageSize=10' :
    let hostname = link.hostname,  //  'example.com'
        port = link.port,          //  12345
        search = link.search,      //  '?startIndex=1&pageSize=10'
        pathname = link.pathname,  //  '/blog/foo/bar'
        protocall = link.protocol; //  'http:'
    return link;
}

/** @param callback  callback(mutation.target)
 * @param options
 */
function observeDocument(callback, options) {
    elementReady('body').then((body) => {
        callback(document.body);
        new MutationObserver(function (mutations) {
            for (var mutation of mutations) {
                if (!mutation.addedNodes.length) continue;
                callback(mutation.target);
            }
        }).observe(document.body, options || {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
    });
}

function elementReady(selector, timeoutInMs = -1) {
    return new Promise((resolve, reject) => {
        var getter = typeof selector === 'function' ?
            () => selector() :
            () => document.querySelectorAll(selector)
        ;
        var els = getter();
        if (els && els.length) {
            resolve(els[0]);
        }
        if (timeoutInMs > 0)
            var timeout = setTimeout(() => {
                reject(`elementReady(${selector}) timed out at ${timeoutInMs}ms`);
                console.debug(`elementReady(${selector}) timed out at ${timeoutInMs}ms`);
            }, timeoutInMs);


        new MutationObserver((mutationRecords, observer) => {
            Array.from(getter() || []).forEach((element) => {
                clearTimeout(timeout);
                resolve(element);
                observer.disconnect();
            });
        }).observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    });
}

function clickWhenBtnAppears(selector) {
    observeDocument(function (node) {
        var btns = node.querySelectorAll(selector);
        for (var i = 0; i < btns.length; i++)
            btns[i].click();
    });
}
