// ==UserScript==
// @name         Yandex images upgrade
// @namespace    http://tampermonkey.net/
// @author       Faris Hijazi
// @version      0.1
// @icon         https://www.google.com/s2/favicons?domain=yandex.com
// @exclude      *www.kfupm.edu*
// @exclude      *blackboard*
// @exclude      *youtube.com*
// @exclude      *www.saudirailways.org*
// @exclude      *www.webassign.net*
// @match        *yandex.com/images/*
// @include      *yandex.com/images/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @grant        window.close
// @grant        window.focus
// @run-at       document-end
// @connect      *
// @require      https://code.jquery.com/jquery-3.2.1.slim.min.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// ==/UserScript==

/**
*   Adds functionality to yandex.com/images.
*   -Extra buttons for the image panel (download, download related, DuckDuckGo proxy, ... and more)
*   -Display original images (by replacing image anchors links with the original image links).
*   -Hotkeys
*/


/**/
if (typeof unsafeWindow == "undefined") unsafeWindow = window;
if (typeof debug == 'undefined') debug = false;
if (typeof log == 'undefined') log = (...msg) => (debug) ? console.log('Log:', ...msg) : false;

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

const Settings = {
    invertWheelRelativeImageNavigation: false
};

class P {
    static get panel() {
        return q('[data-bem^="{\\"pane"]');
    }
    static get buttonsPanel() {
        return P.panel.querySelector('div.pane2__buttons2.pane2-sidebar__section');
    }
    static get buttons() {
        /** 0: Open
         * 1:   Other sizes and similiar
         * 2:   Save
         * 3:   Share */
        const children = P.buttonsPanel.childNodes;
        return {
            open: P.buttonsPanel.querySelector('div.sizes > a'),
            otherSizes: P.buttonsPanel.querySelector('div.sizes > div'),
            save: children[2],
            share: children[3]
        };
    }
}

class YandexUtils {
    static get oList() {
        var list = [];
        for (const bx of this.imgBxs) {
            const json = getImgJson(bx);
            const src = json.img_href;
            const title = json.snippet.title.replace("&quot;", '"');
            list.push({src: src, title: title});
        }
        return list;
    }
    static get main() {
        return document.querySelector('div.page-layout__content-wrapper[role="main"]');
    }
    static get imgsContainer() {
        return this.main.querySelector('div.serp-list');
    }
    static get imgBxs() {
        return document.querySelectorAll('div.page-layout__content-wrapper[role="main"] div.serp-item[data-bem]');
    }
    static get loadMoreImagesLink() {
        return q('div.more.more_direction_next.more_last_yes a');
    }
    static replaceWithOriginals() {
        for (const bx of this.imgBxs) {
            var img = bx.querySelector('img.serp-item__thumb');
            img.src = getImgJson(bx)["img_href"];
        }
    }
    static directImageLinks() {
        for (const bx of YandexUtils.imgBxs) {
            const a = bx.querySelector('a');
            a.href = (bx.json || getImgJson(bx))["img_href"];
        }
    }
}

unsafeWindow.YandexUtils = YandexUtils;
let panel = null;

observeDocument(function () {
    if (P.panel && !panel)
        initPanel();

    modifyImageBoxes();

    if (P.loadMoreImagesLink) {
        P.loadMoreImagesLink.click();
    }
});
function initPanel() {
    panel = P.panel;
    panel.__defineGetter__('buttonsPanel', function () {
        return this.querySelector('div.pane2__buttons2.pane2-sidebar__section');
    });
    panel.__defineGetter__('mainThumbnail', function () {
        return this.querySelector("img.preview2__thumb.preview2__thumb_visible_yes[src]")
    });

    panel.__defineGetter__('saveButton',
        /** this is that button with 3 dots that has the options for different resolutions
         * @return {Element | SVGElementTagNameMap[string] | HTMLElementTagNameMap[string]} */
        function () {
            return q('button.button2_pin_brick-brick.button2_size_m');
        });
    panel.__defineGetter__('titlePanel', function () {
        const titlePanel = this.querySelector('div.snippet2.snippet2_query');
        titlePanel.pTitleEl = titlePanel.querySelector('a.link_theme_normal');
        titlePanel.sTitleEl = titlePanel.querySelector('div.snippet2__text');
        titlePanel.hostnameEl = titlePanel.querySelector('a.link_theme_outer');
        return titlePanel;
    });
    panel.__defineGetter__('risDiv', () => q('div.tiled-images__container'));

    panel.__defineGetter__('buttons', function () {
        /** 0: Open
         * 1:   Other sizes and similiar
         * 2:   Save
         * 3:   Share */
        const children = this.buttonsPanel.childNodes;
        return {
            open: children[0],
            otherSizes: children[1],
            save: children[2],
            share: children[3]
        };
    });
    panel.__defineGetter__('isHasUnableToDownloadImage', function () {
        return !!q('body > div.page-layout.page-layout_page_search.page-layout_layout_serp.serp-controller.serp-controller_infinite_yes.serp-controller_navigation_yes.serp-controller_complain_yes.serp-controller_prefetch_yes.serp-controller_height_full.navigation-controller.pane2-controller.pane2-controller_crop_yes.pane2-controller_scrollable-info_yes.pane2-controller_preload_yes.trimmer-controller.incut-controller.cbir-counter.serp-counter.i-bem.navigation-controller_js_inited.page-layout_js_inited.serp-controller_page_search.serp-controller_js_inited.pane2-controller_js_inited.incut-controller_js_inited > div.pane2.pane2_visibility_visible.pane2_flexbox_yes.pane2_color-position_yes.pane2_fullscreen_no.pane2_scrollable-info_yes.pane2_scrollable-info-everywhere.pane2_customized.pane2_direct-type_no.pane2_market_no.pane2_ajax-direct_yes.pane2-controller__pane.pane2-api.advice-controller.i-bem.pane2-api_js_inited.pane2_js_inited.pane2_rim-shown > div.pane2__wrapper > div.pane2__column.pane2__column_type_main > div.preview2.preview2_crop-position_right-bottom.preview2_like-fullscreen.pane2__preview.i-bem.preview2_js_inited.preview2_error_yes > div.preview2__error > div');
    });
    // making the down arrow clickable
    let downloadLink = panel.buttons.open.querySelector('a');
    panel.__defineGetter__('compoundTitle', function compoundTitle() {
        return [
            panel.titlePanel.pTitleEl.innerText,
            panel.titlePanel.sTitleEl.innerText,
            panel.titlePanel.hostnameEl.innerText
        ].join(' - ');
    });
    function downloadMainImage() {
        download(downloadLink.href, panel.compoundTitle, null, {
            onerror: function () {
                console.log('onerror called, downloading mainThumbnail instead:', panel.mainThumbnail);
                download(Proxy.steemitimages(downloadLink.href), panel.compoundTitle);
            },
            fileExtension: getFileExtension(downloadLink.href)
        });
    }
    downloadLink.addEventListener('click', function (e) {
        downloadMainImage();

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    });
    console.log('added click listener to OPEN button:', downloadLink);


    panel.navigateRis = function (next = true) {
        let selectedImg = q('.tiled-images__item_selected', panel);
        if (!selectedImg) selectedImg = panel.risDiv.childNodes[0];

        const sibling = next ? selectedImg.nextElementSibling : selectedImg.previousElementSibling;
        if (sibling) {
            console.log('click:', sibling);
            sibling.querySelector('img').click();
        }
    };

    panel.addEventListener("wheel", function handleScroll(wheelEvent) {
        if (!wheelEvent.ctrlKey && !wheelEvent.metaKey && !wheelEvent.shiftKey && !wheelEvent.altKey) {
            const elUnderMouse = elementUnderMouse(wheelEvent),
                delta = getWheelDelta(wheelEvent);

            if (Math.abs(delta) < 0.1) { // Do nothing if didn't scroll
                log("Mousewheel didn't move");
                return false;
            }
            let wheelUp = Settings.invertWheelRelativeImageNavigation ? (delta > 0.1) : (delta < 0.1);

            if (panel.risDiv === elUnderMouse || panel.risDiv.contains(elUnderMouse)) {
                console.log('mousewheel over ris');

                // if wheelUp: go to previous, wheelDown: go to next
                panel.navigateRis(!wheelUp);
            }
        }
    });


    bindKeys();
}
function bindKeys() {

    if (typeof Mousetrap === "undefined") {
        console.error("Mousetrap is not defined!!");
        return;
    }

    Mousetrap.addKeycodes({
        96: 'numpad0',
        97: 'numpad1',
        98: 'numpad2',
        99: 'numpad3',
        100: 'numpad4',
        101: 'numpad5',
        102: 'numpad6',
        103: 'numpad7',
        104: 'numpad8',
        105: 'numpad9'
    });

    Mousetrap.bind("v", () => panel.saveButton.click());
    Mousetrap.bind('x', downloadThumbnail);

    Mousetrap.bind("numpad2", () => panel.navigateRis(), 'keydown');
    Mousetrap.bind("numpad8", () => panel.navigateRis(false), 'keydown');
}

// todo: there are 2 download methods, merge them or delete one
function downloadThumbnail() {
    download(panel.mainThumbnail.src, panel.compoundTitle);
}

unsafeWindow.P = P;
unsafeWindow.panel = panel;

function addImgBoxJson(bx) {
    if (!bx.hasOwnProperty('json'))
        bx.json = getImgJson(bx);
}
function modifyImageBoxes() {
    for (const bx of YandexUtils.imgBxs) {
        addImgBoxJson(bx);

        // making the link reference the image (so we can do Display Original Image)
        var anchor = bx.querySelector('a.serp-item__link');
        anchor.href = bx.json["img_href"];
    }
}
//TODO: create downloadRelatedImages()
(function () {
    YandexUtils.directImageLinks();

    // now even typing in the searchbar can trigger hotkeys
    const searchInputEl = q('input[id^="uniq"]');
    if (searchInputEl)
        searchInputEl.classList.add('mousetrap');

    var imgHrefs = Array.from(YandexUtils.imgBxs).map(bx => bx.json["img_href"]);
    console.log('imgHrefs:', imgHrefs);
})();


/**
 {
     reqid: ,
     freshness: ,
     preview: [{url: , fileSizeInBytes: , w: , h: }, {url: , fileSizeInBytes: , w: , h: }],
     dups: ,
     thumb: {url: , size: {width: , height: , }, microImg: },
     snippet: {title: , hasTitle: , text: , url: , domain: , redirUrl: , },
     detail_url: ,
     img_href: ,
     useProxy: ,
     pos: ,
     id: ,
     timeQuery: ,
     rimId: ,
     tags: ,
     docid: ,
     moreLink: {type: , url: , },
     greenUrlCounterPath: ,
     counterPath: ,
 }
 */
function getImgJson(imgBox) {
    const jsonText = imgBox.getAttribute('data-bem');
    return JSON.parse(jsonText)["serp-item"];
}


