// ==UserScript==
// @name         KFUPM Register Classes
// @namespace    http://tampermonkey.net/
// @description  This script will autofill the CRNs on http://ssbweb.kfupm.edu.sa/PROD8/bwskfreg.P_AltPin
// @description  The script will keep refreshing the page until the registration is open
// @author       Faris Hijazi
// @version      0.4
// @icon	 	 https://www.google.com/s2/favicons?domain=http://registrar.kfupm.edu.sa
// @include      http://ssbweb.kfupm.edu.sa/PROD8/bwskfreg.P_AltPin
// @include      file:///*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @run-at       document-body
// @updateURL    https://github.com/buzamahmooza/Helpful-Web-Userscripts/edit/master/KFUPM%20Register%20Classes.user.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// ==/UserScript==

/*
HOW TO USE:
1- Fill CRNs in the variable below
2- Go to http://ssbweb.kfupm.edu.sa/PROD8/bwskfreg.P_AltPin
3- The script will keep refreshing the page until the registration opens, and will autofill the CRNs and click "Submit"
4- Turn off the script after submission to make sure it doesn't mess up anything

Warning:    Repeatedly refreshing or submitting in the course registration page could lead to a an academic hold.
            By using this script, you agree that you are fully responsible for the outcomes.
*/



// The CRNs to input
// (sperate by anything that isn't a number, ie. spaces, commas, tabs, new lines, etc.. anything works)
var allCRNs = `
12345
12345
12345`; // these are just example CRNs, make sure to put real ones.


/*
────────────────────────────────
───────────────██████████───────
──────────────████████████──────
──────────────██────────██──────
──────────────██▄▄▄▄▄▄▄▄▄█──────
──────────────██▀███─███▀█──────
█─────────────▀█────────█▀──────
██──────────────────█───────────
─█──────────────██──────────────
█▄────────────████─██──████
─▄███████████████──██──██████ ──
────█████████████──██──█████████
─────────────████──██─█████──███
──────────────███──██─█████──███
──────────────███─────█████████
──────────────██─────████████▀
────────────────██████████
────────────────██████████
─────────────────████████
──────────────────██████████▄▄
────────────────────█████████▀
─────────────────────████──███
────────────────────▄████▄──██
────────────────────██████───▀
────────────────────▀▄▄▄▄▀
 */



// The code stuff

const registrationURL = "http://ssbweb.kfupm.edu.sa/PROD8/bwskfreg.P_AltPin";

var CRNs = [];
if (!!allCRNs)
    CRNs = allCRNs.match(/\d{4,}/gim);
//.split(/\D+/gim);

if (!CRNs || !CRNs.length) {
    if (typeof GM_getValue == 'function') {
        CRNs = GM_getValue("CRNs", []);
    } else {
        var input = prompt("No CRNs found, enter CRNs (sperated by commas or spaces):", "ExampleCRN1, ExampleCRN2, ...");
        if (input && input.length) {
            CRNs = input.split(/,|\s+/g);
        }
    }

}
console.log("CRNs:", CRNs);

var q = (selector) => document.querySelector(selector);
var qa = (selector) => document.querySelectorAll(selector);

(function() {
    console.log("This is the KFUPM class register script");
    observeDocument(function(mutation) {
        try {
            var finalSubmitBtn = q('form [value="Submit Changes"]');
            var boxes = Array.from(qa('.dedefault INPUT[type="text"]'));
            var submitBtn = q('button#id____UID5[value="Submit"]'); // The button after choosing which semester

            if (!!submitBtn)
                submitBtn.click();

            if (!boxes.length || !finalSubmitBtn) {
                console.log('No textboxes found reloading page...');
                setTimeout(function() {
                    location.reload();
                }, 1000);
            }

            for (var i = 0; i < Math.min(CRNs.length, boxes.length); i++) {
                console.debug('CRN:', CRNs[i]);
                boxes[i].value = CRNs[i];
            }
            if(!!finalSubmitBtn) finalSubmitBtn.click();
        } catch (e) {
            console.error(e);
        }
    });
})();


function observeDocument(callback) {
    callback(document.body);
    const mutationCallback =
        /**@param {mutation} mutationsList */
        function(mutationsList) {
            for (var mutation of mutationsList) {
                if (!mutation.addedNodes.length)
                    continue;
                callback(mutation.target);
            }
        };
    new MutationObserver(mutationCallback)
        .observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: false
        });
}
