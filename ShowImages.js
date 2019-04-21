/**
 * @Author Faris Hijazi - https://www.github.com/farishijazi
 * https://github.com/FarisHijazi/SuperGoogle/projects/1
 */
// TODO: - [ ] add the ability to load images via another loaderImage object
// TODO: - [ ] set a "proxy" attribute on success, identifying which proxy was used
// TODO: - [ ] image loads, it broadcasts the onload event to all other images with the same src
// TODO: - [ ] Have the option of multiple urls for an image, and you'd try to load all of them at the same time, the one that loads first wins. This makes the process faster, instead of waiting for each one to fail

/**
 * @typedef {(Element)} ImgEl
 * @property {number} handlerIndex
 * @property {HTMLAnchorElement} anchor
 * @property {string} oldSrc
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

    var debug = true;

    // Options
    const options = {
        loopReplacedVids: true,
        autoplayReplacedVids: false,
        isShouldTryProxy: true
    };

    /** returns full path, not just partial path */
    var normalizeUrl = (function () {
        var fakeLink = document.createElement('a');

        return function (url) {
            fakeLink.href = url;
            return fakeLink.href;
        }
    })();


    const PProxy = (function () {

        class ProxyInterface {
            constructor() {
                throw Error('Static class cannot be instantiated');
            }
            static get color() {
                return '#00000';
            }
            static test(url) {
            }
            static proxy(url) {
            }
            static reverse(proxyUrl) {
            }
        }

        /**Returns a DuckDuckGo proxy url (attempts to unblock the url)*/
        class DDG extends ProxyInterface {
            static get color() {
                return '#FFA500';
            }
            static test(url) {
                return /^https:\/\/proxy\.duckduckgo\.com/.test(url);
            }
            static proxy(url) {
                return DDG.test(url) || /^(javascript)/i.test(url) ? url : (`https://proxy.duckduckgo.com/iu/?u=${encodeURIComponent(url)}&f=1`);
            }
            static isDdgUrl() {
                new Error('This function "isDdgUrl()" is deprecated, use "PProxy.DDG.test()" instead');
            }
            static reverse(url) {
                // if (isZscalarUrl(url)) s = getOGZscalarUrl(url); // extra functionality:
                if (!DDG.test(url)) {
                    return url;
                }
                return new URL(location.href).searchParams.get('u');
            }
        }

        class FileStack extends ProxyInterface {
            static get color() {
                return '#acb300';
            }
            static test(url) {
                return /https:\/\/process\.filestackapi\.com\/.+\//.test(url);
            }
            static proxy(url) {
                return 'https://process.filestackapi.com/AhTgLagciQByzXpFGRI0Az/' + encodeURIComponent(url.trim());
            }
            static reverse(url) {
            }
        }

        class SteemitImages extends ProxyInterface {
            static get color() {
                return '#0074B3';
            }
            static test(url) {
                return /https:\/\/steemitimages\.com\/0x0\//.test(url);
            }
            static proxy(url) {
                return /\.(jpg|jpeg|tiff|png|gif)($|\?)/i.test(url) ? ('https://steemitimages.com/0x0/' + url.trim()) : url;
            }
            static reverse(url) {
            }
        }

        return {
            FileStack: FileStack,
            SteemitImages: SteemitImages,
            DDG: DDG,
        };
    })();

    /** * @type {number} TIMEOUT - trigger the `onerror` if the image takes too long to load */
    let TIMEOUT = 6000;


    /**
     * wait for element to load
     * @author gilly3 - https://stackoverflow.com/a/33019709/7771202
     *
     * @param {HTMLImageElement|Node|imgEl} img the image you want to load
     * @param src
     * @returns {Promise}
     */
    function loadPromise(img, src = '') {
        if (img.src && img.complete) {
            return (img.naturalWidth > 0) ?
                Promise.resolve(img) :
                Promise.reject(new Error('image failed loading'));
        }

        return new Promise(function (resolve, reject) {

            img.addEventListener('load', function (e) {
                resolve(img);
            }, false);
            img.addEventListener('error', function (e) {
                reject(new Error('image failed loading'));
            }, false);

            var loaderImage = new Image();
            if (!img.src && src)
                loaderImage.onload = (e) => {
                    img.src = src;
                    resolve(img);
                };
            loaderImage.onerror = (e) => {
                reject(new Error('image failed loading ' + img.src));
            };
            loaderImage.src = img.src;
        });
    }


    class ImageManager {
        successfulUrls;
        _images;
        parent;
        onErrorHandlers;
        onSuccess;

        /**
         * @param {Object=} opts
         * @param {ShowImages=} opts.parent - usually the ShowImage instance
         * @param {Function=} opts.onSuccess
         * @param {Function[]=} opts.onErrorHandlers - will be passed the img element
         */
        constructor(opts) {
            var self = this;

            opts = extend({
                parent: null,
                onSuccess: function (img) {
                    self.successfulUrls.add(img.src);
                    if (img.anchor && /\.(gif)($|\?)/i.test(img.anchor.href) || img.oldSrc && /\.(gif)($|\?)/i.test(img.oldSrc)) {
                        debug && console.log('that\'s a gif!:', {
                            'img.anchor': img.anchor,
                            'img.src': img.src,
                            'img.oldSrc': img.oldSrc
                        });
                        // language=CSS
                        setBorderWithColor(img, '#5d00b3');
                        img.classList.add(self.parent.ClassNames.DISPLAY_ORIGINAL_GIF);
                    } else {
                        // language=CSS
                        setBorderWithColor(img, '#04b300');
                        img.classList.add(self.parent.ClassNames.DISPLAY_ORIGINAL);
                    }
                },
                onErrorHandlers: [],
            }, opts);

            self.successfulUrls = new Set();
            self._images = new Set();
            self.parent = opts.parent;
            self.onErrorHandlers = opts.onErrorHandlers || [];
            self.onSuccess = opts.onSuccess;
        }


        /**
         * Fires the next error handler depending on imgEl.handlerIndex and increments it.
         * Also binds to the next handler
         * @this {ImageManager} the image manager
         * @param {(ImgEl|HTMLImageElement)} imgEl - the image that has failed loading
         * @param {Event} event
         * Must contain:
         *  {number} imgEl.handlerIndex
         *  {HTMLAnchorElement} imgEl.anchor
         */
        fireNextErrorHandler(imgEl, event) {
            debug && console.debug('fireNextErrorHandler', imgEl);
            // if(imgEl.getAttribute('loaded') === 'error') return;
            if (imgEl.handlerIndex < this.onErrorHandlers.length) {
                // call current handler
                if (imgEl.handlerIndex < this.onErrorHandlers.length && typeof this.onErrorHandlers[imgEl.handlerIndex] === 'function') {
                    debug && console.log('execute handler:', this.onErrorHandlers[imgEl.handlerIndex]);
                    this.onErrorHandlers[imgEl.handlerIndex].call(imgEl, event, this);
                }
                // if not at the last handler, bind the next handler and increment the index
                if (imgEl.handlerIndex !== this.onErrorHandlers.length - 1) {
                    // remove last handler
                    // bind next handler
                    imgEl.handlerIndex++;
                    var nextHandler = this.onErrorHandlers[imgEl.handlerIndex];
                    setTimeout(function () {
                        // console.warn('image timed out while loading, TIMEOUT = ', TIMEOUT, imgEl);
                        // _im.fireNextErrorHandler.call(imgEl, event, _im);
                    }, TIMEOUT);
                }
            } else {
                imgEl.setAttribute('loaded', 'error');
            }
        }

        /**
         * TODO: turn this to a promise type function (returns a promise)
         *
         * adds an attribute "load" indicating the load status
         *  load = true:     image loaded successfully
         *  load = loading:    image still loading
         *  load = "error":  image failed to load
         * @param {ImgEl|Element|HTMLImageElement|Node} imgEl
         * @param src - the new url to be used
         */
        addHandlers(imgEl, src) {
            var _im = this;
            if (!imgEl || imgEl.getAttribute('loaded') === 'loading' || imgEl.handlerIndex > 0)
                return;

            this.enhanceImg(imgEl, src);

            const _isImageOk = (img) => img.complete && img.naturalWidth !== 0;

            var onload;
            var onerror;
            function tryNextHandler(img) {
                img = img.imgEl || img;

                debug && console.warn('tryNextHandler(): index:', img.handlerIndex, 'Image:\n', img.src);

                img.handlerIndex++;
                return _im.onErrorHandlers[img.handlerIndex].call(img, event, _im).catch(tryNextHandler);
            }

            onerror = function (event) {
                const img = this.imgEl || this;
                debug && console.warn('onerror():', img.src, img);
                try {
                    tryNextHandler(img).then(onload.bind(img));
                } catch (e) {
                    console.error(e);
                }
                img.setAttribute('handler-index', img.handlerIndex.toString());
            };
            onload = function (event) {
                const img = this.imgEl || this;
                debug && console.log('image loaded :)', img.src);
                if (_isImageOk(img)) {
                    img.setAttribute('loaded', 'true');
                    img.style.display = 'block';
                    _im.onSuccess(img);
                } else { // if it didn't load or width==0:
                    onerror.call(imgEl, event);
                }
            };

            // setup the image object
            var image = new Image();
            image.src = src || imgEl.src || imgEl.anchor.href;
            image.imgEl = imgEl; // just to reference the imgEl. we don't want the callbacks to be called on the Image object, rather the IMG element
            imgEl.image = image;
            image.onerror = onerror.bind(imgEl);
            image.onload = onload.bind(imgEl);
            loadPromise(imgEl).then(imgEl => {
                onload(imgEl);
            }).catch(imgEl => {
                onerror(imgEl);
            });
            // store it (so it'll have to load)
            if (_im._images.has(image)) {
                console.warn('Duplicate image object!', image);
                image = null;
                return;
            }
            _im._images.add(image);
            imgEl.setAttribute('loaded', 'loading');
        }

        /**
         * Prepares the image and initializes the extra fields
         *
         * - Add getters and setters for "oldSrc"
         * - set handlerIndex=0
         * - img.anchor
         *
         * @param {HTMLImageElement|ImgEl} imgEl
         * @param {string=} newSrc - optional target src to set for the image
         *  (oldSrc will be the current src, and this will be the new)
         * @returns imgEl (the same object)
         */
        enhanceImg(imgEl, newSrc = '') {

            // So here's how it works:
            // 1- image object loads and calls onload
            // 2- it references imgEl and now we start working on imgEl
            // 3- for each onerror, there's an error handler, imgEl.handlerIndex indicates which handler is next
            // 4- until we get to the last handler, and that'd be to mark the image as [loaded="error"]
            var anchor = imgEl.anchor || imgEl.closest('a[href]');

            imgEl.__defineSetter__('oldSrc', function (value) {
                this._oldSrc = value;
                this.setAttribute('oldSrc', value);
            });
            imgEl.__defineGetter__('oldSrc', () => this._oldSrc);

            imgEl.oldSrc = imgEl.src;
            imgEl.handlerIndex = 0;
            imgEl.anchor = anchor;
            imgEl.src = newSrc || imgEl.src;

            return imgEl;
        }
    }


    /**
     * replace thumbnails with source
     *
     * @param {Object} options
     * @param {ImageManager=} options.imageManager
     * @returns {ShowImages}
     */
    class ShowImages {
        imageManager = new ImageManager();
        imagesFilter;
        ClassNames = {
            DISPLAY_ORIGINAL: 'display-original-' + 'mainThumbnail',
            DISPLAY_ORIGINAL_GIF: 'display-original-' + '-gif',
            FAILED: 'display-original-' + '-failed',
            FAILED_DDG: 'display-original-' + '-ddg-failed',
        };

        /**
         * @param {Object} options
         * @param {Function(img)=} options.imagesFilter
         */
        constructor(options) {
            var self = this;
            // TODO: define the options and the default values
            options = extend({
                imagesFilter: (img, anchor) => !img.classList.contains(self.ClassNames.DISPLAY_ORIGINAL) &&
                    // !img.closest('.' + this.ClassNames.DISPLAY_ORIGINAL) &&
                    // /\.(jpg|jpeg|tiff|png|gif)($|\?)/i.test(anchor.href) &&
                    !img.classList.contains('irc_mut') && // @google specific
                    !/^data:/.test(anchor.href),
            }, options);

            for (const key of Object.keys(options)) {
                self[key] = options[key];
            }
            this.imagesFilter = options.imagesFilter;

            //TODO: do dis
            self.imageManager = new ImageManager({
                parent: self,
                onErrorHandlers: (function getDefaultHandlers() {
                    function handler1(event, imageManager) {
                        const img = this;
                        img.src = img.oldSrc || img.src;

                        useProxy(img, PProxy.SteemitImages.proxy);

                        return loadPromise(img);
                    }
                    function handler2(event, imageManager) {
                        const img = this;
                        img.src = img.oldSrc || img.src;
                        useProxy(img, PProxy.DDG.proxy);
                        return loadPromise(img);
                    }
                    function useProxy(imgEl, proxy) {
                        const anchor = imgEl.anchor || imgEl.closest('a[href]');
                        const proxyUrl = proxy(anchor.href);

                        console.log('useProxy(', anchor.href, ')=', proxyUrl);
                        imgEl.classList.remove(self.ClassNames.FAILED);

                        anchor.href = proxyUrl;

                        self.replaceImgSrc(imgEl);
                        imgEl.src = proxyUrl;

                        //Make borders ORANGE
                        // language=CSS
                        setBorderWithColor(imgEl, proxy.color);
                    }
                    function handleProxyError(event) {
                        const img = this;
                        img.src = img.oldSrc || img.src; // return the src back to normal
                        markNotFound(img);
                        img.classList.add(self.ClassNames.FAILED_DDG);
                    }
                    /**puts red borders around the mainImage.
                     * @param node
                     */
                    function markNotFound(node) {
                        node.classList.add(self.ClassNames.FAILED);
                        node.setAttribute('loaded', 'error');
                        // language=CSS
                        setBorderWithColor(node, '#b90004');
                        self.imageManager.successfulUrls.delete(node.src);
                    }
                    return [handler1, handler2, handleProxyError];
                })(),
            });
        }

        static replaceThumbWithVid(vidThumb) {
            const anchor = vidThumb.closest('[href], source');
            const href = anchor.getAttribute('href');
            if (/\.(mov|mp4|avi|webm|flv|wmv)($|\?)/i.test(href)) { // if the link is to a video
                console.log('Replacing video thumbnail with original video:', href, vidThumb);
                vidThumb.src = href;
                const videoOptions = 'controls ' + (options.autoplayReplacedVids ? 'autoplay ' : '') + (options.loopReplacedVids ? 'loop ' : '');
                const vidEl = createElement(`<video ${videoOptions} name="media" src="${href}"  type="video/webm" style="width:${vidThumb.clientWidth * 2}px;">`);
                anchor.after(vidEl);
                anchor.remove();
            }
        }
        /**
         * searches for child thumbnails and replaces the ones found (calls `replaceImgSrc` and/or `replaceThumbWithVid`)
         * replaces the src, `ImageManager.addHandlers(img, img.src);`
         *
         * @param {HTMLElement} node could be an image or any node containing an image
         */
        displayOriginalImage(node) {
            var self = this;
            if (node.matches('a[href] img[src]')) {
                /** @type {ImgEl} */
                const img = node;
                const result = this.replaceImgSrc(img);
                if (result) {
                    if (/\.(gif)($|\?)/i.test(img.anchor.href)) {
                        console.log('GIF', img.anchor.href);
                        img.classList.add(self.ClassNames.DISPLAY_ORIGINAL_GIF);
                    }
                }
            }
            for (const img of node.querySelectorAll('a[href] img[src]')) {
                const result = this.replaceImgSrc(img);
                if (result) {
                    if (/\.(gif)($|\?)/i.test(img.anchor.href)) {
                        console.log('GIF', img.anchor.href);
                        img.classList.add(self.ClassNames.DISPLAY_ORIGINAL_GIF);
                    }
                }
            }
            for (const vidThumb of node.querySelectorAll('a[href] > img')) {
                ShowImages.replaceThumbWithVid(vidThumb);
            }
        }
        // TODO: turn this to a promise
        /**
         * This is the main method that takes an image and replaces its src with its anchors href
         * ShowImages.filter is applied here, only images that pass the filter will have `src` replaced
         * @param {ImgEl} img
         * @param {HTMLAnchorElement=} anchor - if the anchor isn't supplied, the closest parent anchor is used
         * @returns {boolean} false when `img` doesn't pass the filter
         */
        replaceImgSrc(img, anchor) {
            if (!anchor) anchor = img.closest('a');
            // image has already been replaced
            // if (img.getAttribute('loaded') === 'true') return false;

            if (!this.imagesFilter(img, anchor)) return false;

            debug && console.debug('replaceImgSrc()', img);

            img.src = anchor.href;
            img.classList.add(this.ClassNames.DISPLAY_ORIGINAL);

            this.imageManager.addHandlers(img);
            return true;
        }
        /**
         * general method, binds a mutationObserver and it will display original images
         */
        displayImages() {
            observeDocument(node => this.displayOriginalImage(node));
            qa('iframe').forEach(iframe => iframe.querySelectorAll('a[href] img[src]').forEach(this.replaceImgSrc));
        }
    }


    // helper functions

    function observeDocument(callback) {
        callback(document.body);
        new MutationObserver(function mutationCallback(mutationsList) {
            for (var mutation of mutationsList) {
                callback(mutation.target);
            }
        }).observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: false,
            // attributeFilter: ['src', 'href', 'srcset', 'data-src', 'datasrc']
        });
    }

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

    function setBorderWithColor(el, color = '{color: #5d00b3;}') {
        color = color.replace('{color: ', '').replace(';}', '');
        // language=CSS
        return setBorder(el, '{border-radius: 2px; border: 3px ' + color + 'aa' + ' solid}');
    }
    /**
     * Sets the CSS border property of an image or it's container if it exists
     * @param el
     * @param borderArgs
     * @return {boolean}
     */
    function setBorder(el, borderArgs) {
        if (!el.classList.contains('irc_mi')) {// Condition to improve performance only for Google.com
            var container = el.closest('div');

            if (container && !container.classList.contains('irc_mimg') && !container.classList.contains('irc_mutc')) { // @Google-Specific
                setStyleInHTML(container, borderArgs);
                // setStyleInHTML(el, "border", "none !important");
            } else {
                setStyleInHTML(el, borderArgs);
            }
        }
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
    function setStyleInHTML(el, styleProperty, styleValue = '') {
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


    // Copy all attributes from source object to destination object.
    // destination object is mutated.
    function extend(destination, source, recursive) {
        destination = destination || {};
        source = source || {};
        recursive = recursive || false;

        for (var attrName in source) {
            if (source.hasOwnProperty(attrName)) {
                var destVal = destination[attrName];
                var sourceVal = source[attrName];
                if (recursive && isObject(destVal) && isObject(sourceVal)) {
                    destination[attrName] = extend(destVal, sourceVal, recursive);
                } else {
                    destination[attrName] = sourceVal;
                }
            }
        }
        return destination;
    }


    return ShowImages;
}));
