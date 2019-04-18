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
        root.PProxy = factory();
    }
}(this, function () {

    function removeReloadEverywhere() {
        for (const a of document.querySelectorAll('a[href^="https://proxy.duckduckgo.com/iu"]')) {
            a.href = a.href.replace(/&reload=on|%26reload%3Don/g, '');
        }
        for (const x of document.querySelectorAll('[src^="https://proxy.duckduckgo.com/iu"]')) {
            x.src = x.src.replace(/&reload=on|%26reload%3Don/g, '');
        }
    }

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
            return '#c8c800';
        }
        static test(url) {
            return /https:\/\/process\.filestackapi\.com\/.+\//.test(url);
        }
        static proxy(url) {
            return 'https://process.filestackapi.com/AhTgLagciQByzXpFGRI0Az/' + encodeURIComponent(url.trim())
                .replace(/&reload=on|%26reload%3Don/g, '');
        }
        static reverse(url) {
        }
    }

    class SteemitImages extends ProxyInterface {
        static get color() {
            return '#0074b3';
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

    DDG.removeReloadEverywhere = removeReloadEverywhere;

    return {
        FileStack: FileStack,
        SteemitImages: SteemitImages,
        DDG: DDG,
    };

}));