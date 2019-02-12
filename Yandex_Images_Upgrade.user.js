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


/*
* fun fact: there's an object called Ya which is the main js object of the yandex page
* Ya.Images.ThumbsStore._data contains the data of the images, an object containing keys, those keys correspond to the element
* id on each imagebox,
*
*
IMAGE_ID:
    dups: {
        broken: {
            http://www##example2##com/image##jpg: true
            https://##example1##com/image##jpg: true
        }
    }
    fittedItem: {
        crop: null
        height: 190
        newHeight: 170
        newWidth: 226
        rowHeight: 169
        width: 253.53125
    }
    images: Array(3)
        0: {url: "https://example1.com/image.jpg", fileSizeInBytes: 230007, w: 1500, h: 1125}
        1: {url: "https://example1.com/image.jpg", fileSizeInBytes: 230007, w: 1500, h: 1125}
        2: {url: "https://example2.com/image.jpg", fileSizeInBytes: 94852, w: 1500, h: 1125}

* */
/**/
if (typeof unsafeWindow == "undefined") unsafeWindow = window;

const imagePreloader = {
    images: new Set(),
    handleImg: function (img) {
        if (!img || img.classList.contains("preloaded"))
            return;
        img.classList.add("preloaded");
        const image = new Image(img.src);
        image.img = img;    // save a reference to the img element
        image.addEventListener('error', function (event) {
            this.handleLoadError(event);
        });
        imagePreloader.images.add(image)
    },
    handleLoadError: function (event) {
        const oldSrc = this.img.src;
        this.img.src = Proxy.steemitimages(this.img.src);
        console.log('Image wasn\'t loading, switching to proxy:', oldSrc, this.src, event);
    }
};

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
    invertWheelRelativeImageNavigation: true
};

class YandexUtils {
    static get oList() {
        var list = [];
        for (const bx of this.imgBxs) {
            const json = getImgJson(bx);
            list.push({'src': json.img_href, 'title': json.snippet.title.replace("&quot;", '"')});
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
    static makeDirectImageLinks() {
        for (const bx of YandexUtils.imgBxs) {
            const a = bx.querySelector('a');
            const imgSrc = (bx.json || getImgJson(bx))["img_href"];
            if (a.href != imgSrc)
                a.href = imgSrc;
        }
    }
}

unsafeWindow.YandexUtils = YandexUtils;

let panel = null;


function onImageChange() {
    console.log('onImageChange(target)');
}
function initPanel() {
    panel = q('[data-bem^="{\\"pane"]');
    unsafeWindow.panel = panel;

    panel.__defineGetter__('buttonsPanel', function () {
        return this.querySelector('div.pane2__buttons2.pane2-sidebar__section');
    });
    panel.__defineGetter__('mainThumbnail', function () {
        return this.querySelector("img.preview2__thumb.preview2__thumb_visible_yes[src]")
    });

    panel.__defineGetter__('titlePanel', function () {
        const titlePanel = this.querySelector('div.snippet2.snippet2_query');
        titlePanel.pTitleEl = titlePanel.querySelector('a.link_theme_normal');
        titlePanel.sTitleEl = titlePanel.querySelector('div.snippet2__text');
        titlePanel.hostnameEl = titlePanel.querySelector('a.link_theme_outer');
        return titlePanel;
    });
    panel.__defineGetter__('risDiv', function () {
        return q('div.tiled-images__container');
    });

    panel.__defineGetter__('imagePanel', function () {
        return this.querySelector('div.pane2__column_type_main > div.preview2_crop-position_right-bottom');
    });

    panel.__defineGetter__('buttons', function () {
        /** 0: Open
         * 1:   Other sizes and similiar
         * 2:   Save
         * 3:   Share */
        const children = panel.buttonsPanel.childNodes;
        return {
            open: panel.buttonsPanel.querySelector('div.sizes > a'),
            otherSizes: panel.buttonsPanel.querySelector('div.sizes > div'),
            diskButton: panel.buttonsPanel.querySelector('button.disk-button__button')
        };
    });
    panel.__defineGetter__('thumbnailErrorDiv', function () {
        return q('div.preview2__error');
    });
    panel.__defineGetter__('compoundTitle', function compoundTitle() {
        return [
            panel.titlePanel.pTitleEl.innerText,
            panel.titlePanel.sTitleEl.innerText,
            panel.titlePanel.hostnameEl.innerText
        ].join(' - ');
    });


    // making the down arrow clickable
    function downloadMainImage() {
        download(downloadLink.href, panel.compoundTitle, null, {
            onerror: function () {
                console.log('onerror called, downloading mainThumbnail instead:', panel.mainThumbnail);
                download(Proxy.steemitimages(downloadLink.href), panel.compoundTitle);
            },
            fileExtension: getFileExtension(downloadLink.href)
        });
    }
    let downloadLink = panel.buttons.open;
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

observeDocument(function () {
    if (!panel)
        initPanel();

    modifyImageBoxes();
    for (const img of qa('img:not(.preloaded)')) {
        imagePreloader.handleImg(img);
    }

    if (YandexUtils.loadMoreImagesLink) {
        YandexUtils.loadMoreImagesLink.click();
    }
});


// wait for mainThumbnail
waitForElement("img.preview2__thumb.preview2__thumb_visible_yes[src]", function (element) {
    new MutationObserver(onImageChange).observe(panel.mainThumbnail, {
        childList: false,
        subtree: false,
        attributes: true,
        characterData: true
    });
});

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

    Mousetrap.bind("k", () => panel.buttons.diskButton.click());
    Mousetrap.bind('x', downloadThumbnail);

    Mousetrap.bind("numpad2", () => panel.navigateRis(), 'keydown');
    Mousetrap.bind("numpad8", () => panel.navigateRis(false), 'keydown');
}

// todo: there are 2 download methods, merge them or delete one
function downloadThumbnail() {
    download(panel.mainThumbnail.src, panel.compoundTitle);
}

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
    YandexUtils.makeDirectImageLinks();

    // now even typing in the searchbar can trigger hotkeys
    const searchInputEl = q('input[id^="uniq"]');
    if (searchInputEl)
        searchInputEl.classList.add('mousetrap');

    var imgHrefs = Array.from(YandexUtils.imgBxs).map(bx => bx.json["img_href"]);
    console.log('imgHrefs:', imgHrefs);
})();


/*
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