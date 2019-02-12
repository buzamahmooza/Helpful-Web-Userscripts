//
function param(o) {
    return Object.keys(o).map(k => encodeURIComponent(k) + "=" + encodeURIComponent(o[k])).join('&');
}
/*global define:false */
/**
 * Copyright 2012-2017 Craig Campbell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SearchEngine is a simple Search engine utility that generates search engine urls
 *
 * @version 1.0
 * @url -
 */
(function (window, document, undefined) {

    // Check if SearchEngine is used inside browser, if not, return
    if (!window) {
        return;
    }

    function SearchEngine() {
        var self = this;
    }
    /**
     * you can pass a search query and an options object, or a string to use one of the templates like "images"
     */
    SearchEngine.prototype.searx = function searx(query, o) {
        // check this for url args: https://asciimoo.github.io/searx/dev/search_api.html
        var target = {
            q: query
        };

        // if string, use the templates
        if (o instanceof String) {
            switch (o) {
                case "images":
                case "image":
                    target = $.extend(target, {categories: "images"});
            }
        }

        o = $.extend(target, o);

        return "https://searx.me/?" + param(o);
    };
    SearchEngine.prototype.google = (query, o) => {
        var target = {
            q: query,
            hl: "en"
        };

        // if string, use the templates
        if (o instanceof String) {
            switch (o) {
                case "images":
                case "image":
                    target = {tbm: "isch"};
            }
        }

        o = $.extend(target, o);

        return "https://www.google.com/search?" + param(o);
    };

    SearchEngine.prototype.duckduckgo = function (query) {
        return `https://duckduckgo.com/?q=${encodeURIComponent(query)}&atb=v73-5__&iar=images&iax=images&ia=images`;
    };

    SearchEngine.prototype.yandex = function (query) {
        return `https://yandex.com/images/search?text=${encodeURIComponent(query)}`;
    };


    // scraps:
    // startpage.com search is unblocked, here is how to request a page
    function fetchStartPage(query = "bekfast") {
        return fetch("https://www.startpage.com/do/search", {
            "credentials": "omit",
            "headers": {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                "accept-language": "en-US,en;q=0.9,ar;q=0.8",
                "cache-control": "max-age=0",
                "content-type": "application/x-www-form-urlencoded",
                "upgrade-insecure-requests": "1"
            },
            "referrer": "https://www.startpage.com/",
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": "query=" + query + "&cat=web&cmd=process_search&language=english&engine0=v1all&abp=1",
            "method": "POST",
            "mode": "cors"
        });
    }


    /**
     * Init the global SearchEngine functions
     *
     * This method is needed to allow the global mousetrap functions to work
     * now that SearchEngine is a constructor function.
     */
    SearchEngine.init = function () {
        var documentSE = new SearchEngine(document);
        for (var method in documentSE) {
            if (method.charAt(0) !== '_') {
                SearchEngine[method] = (function (method) {
                    return function () {
                        return documentSE[method].apply(documentSE, arguments);
                    };
                }(method));
            }
        }
    };

    SearchEngine.init();


    // expose SearchEngine to the global object
    window.SearchEngine = SearchEngine;

    // expose as a common js module
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SearchEngine;
    }

    // expose SearchEngine as an AMD module
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return SearchEngine;
        });
    }
})(typeof window !== 'undefined' ? window : null, typeof window !== 'undefined' ? document : null);
