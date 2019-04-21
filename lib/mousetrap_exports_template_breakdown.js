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
 */
(function(window, document, undefined) {

    // Check if used inside browser, if not, return
    if (!window) {
        return;
    }

    // == defining functions

    function _addEvent(object, type, callback) {
    }
    function _characterFromEvent(e) {
    }

    // defining base constructor/class/object

    function Mousetrap(targetElement) {
        var self = this;

        if (!(self instanceof Mousetrap)) {
            return new Mousetrap(targetElement);
        }

        self.target = targetElement;


        self._privateMethod = function(character, modifiers, e) {
        };

        function _hiddenPrivateMethod(e) {
        }

        self._privateMethod = function() {
        };

        // start!
        // stuff here...
    }


    Mousetrap.prototype.somePublicStaticMethod = function() {
        var self = this;
        // ...
    };

    Mousetrap.somePublicMemberMethod = function() {
        // ...
    };

    Mousetrap.init = function() {
        var documentMousetrap = Mousetrap(document);
        for (var method in documentMousetrap) {
            if (method.charAt(0) !== '_') {
                Mousetrap[method] = (function(method) {
                    return function() {
                        return documentMousetrap[method].apply(documentMousetrap, arguments);
                    };
                } (method));
            }
        }
    };

    Mousetrap.init();

    // expose mousetrap to the global object
    window.Mousetrap = Mousetrap;

    // expose as a common js module
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Mousetrap;
    }

    // expose mousetrap as an AMD module
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return Mousetrap;
        });
    }
}) (typeof window !== 'undefined' ? window : null, typeof  window !== 'undefined' ? document : null);
