/**
 * @Author Faris Hijazi - https://www.github.com/farishijazi
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.ShowImages = factory();
    }
}(this, function () {
    'use strict';

    // Options
    const options = {
        loopReplacedVids: true,
        autoplayReplacedVids: false,
        isShouldTryProxy: true
    };

    const ClassNames = {
        DISPLAY_ORIGINAL: "display-original-" + "mainThumbnail",
        DISPLAY_ORIGINAL_GIF: "display-original-" + "-gif",
        FAILED: "display-original-" + "-failed",
        FAILED_DDG: "display-original-" + "-ddg-failed",
    };


    const PProxy = (function () {
        function isDdgUrl(url) {
            return /^https:\/\/proxy\.duckduckgo\.com/.test(url);
        }
        /**Returns a DuckDuckGo proxy url (attempts to unblock the url)*/
        var ddgProxy = function(url) {
            return isDdgUrl(url) || /^(javascript)/i.test(url) ? url : (`https://proxy.duckduckgo.com/iu/?u=${encodeURIComponent(url)}&f=1`);
        };
        ddgProxy.isDdgUrl = isDdgUrl;

        return {
            fileStack: url => ('https://process.filestackapi.com/AhTgLagciQByzXpFGRI0Az/' + encodeURIComponent(url.trim())),
            steemitimages: url => /\.(jpg|jpeg|tiff|png|gif)($|\?)/i.test(url) ? ('https://steemitimages.com/0x0/' + url.trim()) : url,
            ddg: ddgProxy,
            ddgProxy: ddgProxy,
        }
    })();


    let ImageManager = (function () {
        const successfulUrls = new Set();
        const _images = new Set();

        const isImageOk = function(img) {
            return img.complete && img.naturalWidth !== 0;
        };

        const imgOnError = function () {
            if (isImageOk(this)) {
                this.setAttribute('loaded', 'true');
            } else if (this.classList.contains(ClassNames.DISPLAY_ORIGINAL)) {
                handleError(this);
            } else {
                this.setAttribute('loaded', 'error');
            }
        };

        const imgOnLoad = function () {
            this.setAttribute('loaded', 'true');
            // console.debug('Image loaded! :D', this.alt, !isBase64ImageData(this.src) ? this.src : "Base64ImageData");
            successfulUrls.add(this.src);
        };
        /**
         * adds an attribute "load" indicating the load status
         *  load = true:     image loaded successfully
         *  load = false:    image still loading
         *  load = "error":  image failed to load
         * @param imgUrl
         * @param imgEl
         * @param onError
         * @param onLoad
         */
        const markImageOnLoad = function (imgEl, imgUrl, onError, onLoad) {
            if (!imgEl)
                return;

            if (imgEl.hasAttribute('loaded')) {
                /* console.debug('Img already has "loaded" attr:', imgEl);*/
                return;
            }
            if (!imgEl.hasAttribute('loaded')) {
                createAndAddAttribute(imgEl, 'loaded');
            } else {
                imgEl.setAttribute('loaded', 'false');
            }
            var imgObj = new Image();
            imgObj.onerror = onError || imgOnError;
            imgObj.onload = onLoad || imgOnLoad;
            imgObj.src = imgUrl || imgEl.src || imgEl.href;
            if (_images.has(imgObj)) {
                console.warn('Duplicate image object!', imgObj);
                imgObj = null;
                return;
            }
            _images.add(imgObj);
        };

        return {
            markImageOnLoad: markImageOnLoad,
            isImageOk: isImageOk,
            imgOnLoad: imgOnLoad,
            imgOnError: imgOnError,
            successfulUrls: successfulUrls,
            _images: _images
        };
    })();


    /** @param selector
     * @return {NodeListOf<HTMLElement>}*/
    function qa(selector) {
        return document.querySelectorAll(selector);
    }
    /** @param selector
     * @return {HTMLElement} */
    function q(selector) {
        return document.querySelector(selector);
    }

    function displayImages() {
        observeDocument(displayOriginalImage);
        qa('iframe').forEach(iframe =>
            iframe.querySelectorAll("a[href] img[src]").forEach(img =>
                replaceImgSrc(img, img.closest('a[href]'))
            )
        );
        console.debug("Displaying originals\nOriginal Images Displayed:", Array.from(qa(`.${ClassNames.DISPLAY_ORIGINAL}`)));
    }

    function observeDocument(callback) {
        callback(document.body);
        new MutationObserver(
            /**@param {mutation} mutationsList */
            function mutationCallback(mutationsList) {
                for (var mutation of mutationsList) {
                    if (!mutation.addedNodes.length) continue;
                    callback(mutation.target);
                }
            }
        ).observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: false
        });
    }
    function displayOriginalImage(node) {
        /*
        for (const img of node.querySelectorAll("a[href] > img[src]")) {
            replaceImgSrc(img, img.parentNode);
            ImageManager.markImageOnLoad(img);
        }
        */
        for (const img of node.querySelectorAll("a[href] img[src]")) {
            replaceImgSrc(img, img.closest('a'));
            ImageManager.markImageOnLoad(img);
        }
        for (const vidThumb of node.querySelectorAll("a[href] > img")) {
            replaceThumbWithVid(vidThumb);
        }
    }


    function addClass(el, className) {
        el.classList.add(className);
    }

    function handleError() {
        this.removeEventListener("error", handleError);
        this.setAttribute("loaded", "");
        if (options.isShouldTryProxy) {
            tryDdgProxy(this);
        } else {
            markNotFound(this);
            this.src = this.oldSrc;
        }
    }
    function handleErrorDdg() {
        this.src = this.oldSrc;
        markNotFound(this);
        this.removeEventListener("error", handleErrorDdg);
        // this.classList.add(Tokens.FAILED_DDG);
        addClass(this, ClassNames.FAILED_DDG);
    }
    function tryDdgProxy(imgEl) {
        // If it already failed ddgProxy, don't even try
        if (imgEl.classList.contains(ClassNames.FAILED_DDG)) return;
        // if (imgEl.hasAttribute('loaded')) imgEl.setAttribute('loaded', '');

        imgEl.addEventListener("error", handleErrorDdg);

        //Make borders ORANGE
        // language=CSS
        setBorder(imgEl, "{border: 2px #FFA500 solid}");

        let ddgProxyUrl = PProxy.ddgProxy(imgEl.src);
        let anchor = imgEl.closest('a[href]');
        imgEl.anchor.href = ddgProxyUrl;
        // console.log('imgEl.anchor: '+imgEl.anchor);
        replaceImgSrc(imgEl, anchor);
        imgEl.src = ddgProxyUrl;

        // replace(imgEl, createElement('<a anchor='+ddgProxyUrl+'></a>'));
        imgEl.classList.remove(ClassNames.FAILED);
        ImageManager.markImageOnLoad(imgEl, imgEl.src, function () {
            this.setAttribute('loaded', 'error');
        }, function () {
            this.setAttribute('loaded', 'true-ddgp')
        });
    }

    function replaceThumbWithVid(vidThumb) {
        const anchor = vidThumb.closest('[href], source');
        const href = anchor.href;
        if (/\.(mov|mp4|avi|webm|flv|wmv)($|\?)/i.test(href)) { // if the link is to a video
            console.log('Replacing video thumbnail with original video:', href, vidThumb);
            vidThumb.src = href;
            const videoOptions = 'controls ' + (options.autoplayReplacedVids ? 'autoplay ' : '') + (options.loopReplacedVids ? 'loop ' : '');
            const vidEl = createElement(`<video ${videoOptions} name="media" src="${href}"  type="video/webm" style="width:${vidThumb.clientWidth * 2}px;">`);
            anchor.after(vidEl);
            anchor.remove();
        }
    }
    function replaceImgSrc(img, anchor) {
        if (
            img.classList.contains(ClassNames.DISPLAY_ORIGINAL) ||
            !/\.(jpg|jpeg|tiff|png|gif)($|\?)/i.test(anchor.href)
        ) {
            return;
        }

        img.addEventListener('error', handleError);
        img.oldSrc = img.src;
        img.src = anchor.href;
        img.anchor = anchor; // Storing the anchor object in case we need it later
        addClass(img, ClassNames.DISPLAY_ORIGINAL);

        const imageObj = new Image();
        imageObj.src = img.src;
        ImageManager._images.add(imageObj);

        if (/\.(gif)($|\?)/i.test(anchor)) {
            setBorder(img, "{border: 3px #6800FF solid !important;}"); //Purple for GIFs
            addClass(img, ClassNames.DISPLAY_ORIGINAL_GIF);
        }
    }

    /**
     * Sets the CSS border property of an image or it's container if it exists
     * @param el
     * @param borderArgs
     * @return {boolean}
     */
    function setBorder(el, borderArgs) {
        if (!el.classList.contains("irc_mi")) {// Condition to improve performance only for Google.com
            var container;

            if (container && !container.classList.contains("irc_mimg") && !container.classList.contains("irc_mutc")) { // @Google-Specific
                setStyleInHTML(container, borderArgs);
                setStyleInHTML(el, "border", "none !important");
            } else {
                setStyleInHTML(el, borderArgs);
            }
        }
    }

    /**puts red borders around the mainImage.
     * @param node
     */
    function markNotFound(node) {
        addClass(node, ClassNames.FAILED);
        node.setAttribute('loaded', 'error');
        ImageManager.successfulUrls.delete(node.src);
    }


    /**
     * This will set the style of an element by force, by manipulating the style HTML attribute.
     * This gives you more control, you can set the exact text you want in the HTML element (like giving a style priority via "!important").
     * Example calls:
     *  setStyleByHTML(el, "background-image", "url(http://www.example.com/cool.png)")
     *  setStyleByHTML(el, "{ background-image : url(http://www.example.com/cool.png) }")
     * @param {HTMLElement} el
     * @param {String} styleProperty
     * @param {String} [styleValue='']
     * @return {HTMLElement} el
     */
    function setStyleInHTML(el, styleProperty, styleValue = "") {
        styleProperty = styleProperty.trim().replace(/^.*{|}.*$/g, '');

        const split = styleProperty.split(':');
        if (!styleValue && split.length > 1) {
            styleValue = split.pop();
            styleProperty = split.pop();
        }

        if (el.hasAttribute('style')) {
            const styleText = el.getAttribute('style');
            const styleArgument = `${styleProperty}: ${styleValue};`;

            let newStyle = new RegExp(styleProperty, 'i').test(styleText) ?
                styleText.replace(new RegExp(`${styleProperty}:.+?;`, 'im'), styleArgument) :
                `${styleText} ${styleArgument}`;

            el.setAttribute('style', newStyle);
        }
        return el;
    }

    /**
     * Creates and adds an attributeNode to the element (if the element doesn't have that attribute)
     * sets the attribute value
     * @param node
     * @param attributeName
     * @param attributeValue
     */
    function createAndAddAttribute(node, attributeName, attributeValue) {
        if (!node) {
            console.error('Node is null, cannot add attribute.');
            return;
        }

        if (!node.hasAttribute(attributeName)) {
            var attr = document.createAttribute(attributeName);
            attr.value = attributeValue;
            node.setAttributeNode(attr);
        }
        if (attributeValue) {
            node.setAttribute(attributeName, attributeValue);
        }
    }

    return {
        ClassNames: ClassNames,
        displayImages: displayImages,
        replaceImgSrc: replaceImgSrc,
    };
}));
