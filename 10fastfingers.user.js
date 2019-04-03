// ==UserScript==
// @name         10fastfingers.com/anticheat
// @namespace    https://github.com/buzamahmooza
// @author       Faris Hijazi
// @version      0.1
// @icon         https://www.google.com/s2/favicons?domain=10fastfingers.com
// @match        https://10fastfingers.com*
// @include      https://10fastfingers.com*
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
// @require      https://cdn.jsdelivr.net/gh/naptha/tesseract.js@v1.0.14/dist/tesseract.min.js
// ==/UserScript==
// @require      https://raw.githubusercontent.com/antimatter15/ocrad.js/master/ocrad.js

var start_time = Date.now();

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

unsafeWindow.Tesseract = Tesseract;

var isOnAnticheat = /10fastfingers.com\/anticheat\/view/.test(location.href);
var hackitBtn = null;
var busyWorking = false;

if(isOnAnticheat) {
    document.querySelector('#on-top').innerHTML = 
        `<button id="hackit-btn" class="btn btn-large btn-info" tabindex="1" style="width: 80px; margin-left: 332px;">HACK IT!!</button>`;
    hackitBtn = document.querySelector('#on-top').childNodes[0];
    hackitBtn.onclick = antianticheat;
}

window.addEventListener('keyup', function (e) {
    switch (e.keyCode) {
        case 192: // `
            if (isOnAnticheat) {
                start_time = Date.now();
                antianticheat();
            } else {
                typeIt(250);
            }
            break;
    }
});

function typeIt(wpm = 250) {
    const interval_per_word = 1000 * 60 / wpm; // in milliseconds
    var word_idx = 0;

    function hackit() {
        if (word_idx < words.length) {
            $('#inputfield').val(words[word_idx] + ' ');
            var keyup = jQuery.Event('keyup');
            keyup.which = 32;
            $('#inputfield').trigger(keyup);
            word_idx++;
            setTimeout(hackit, interval_per_word);
        }
    }
    setTimeout(hackit, interval_per_word);
}

function antianticheat() {
    const startBtn = $('#start-btn')[0];

    var div = document.createElement('div');
    hackitBtn.after(div);
    div.innerHTML = `<span>status: </span><span></span><br><span>progress: </span><span>0%</span>`;
    var els = div.childNodes;
    var statusText = els[1];
    var progressText = els[4];

    function fillText() {
        if(busyWorking) return;
        busyWorking = true;

        console.log('fillText()');
        getImageData($('#word-img img')[0]).then((imageData) => {
            console.log('imageData:', imageData);
            Tesseract.recognize(imageData, {
                tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY,.'
            }).progress(function (p) {
                statusText.innerText = p.status;
                progressText.innerText = (p.progress*100).toString() + '%';
                console.log('progress', p);
            }).then(function (result) {
                console.log('result', result);
                console.log('image text:', result.text);
                var text = result.text;

                typeString(text.split(/[\s\n]/).filter(word=>!!word), {
                    wpm: 0,
                    inputField: '#word-input',
                    callback: function () {
                        submitBtn = $('button#submit-anticheat')[0];
                        submitBtn.click();
                        console.log('submit', submitBtn);
                        var msg = 'Submitted! Time taken: ' + (Date.now() - start_time);
                        console.log(msg);
                    }
                });
            });
        });
    }

    if (startBtn) {
        console.log('click startBtn', startBtn);
        startBtn.click();

        var interval = setInterval(() => {
            var img = $('#word-img img')[0];
            if (img) {
                if (img.complete) {
                    fillText();
                    clearInterval(interval);
                } else {
                    img.onload = fillText;
                }

            }
        }, 50);
    } else {
        fillText();
    }
}

/**
 * 
 * @param {string[]} words - the words to type
 * @param {Object} options
 * @param {Element|string} options.inputField - the input field DOM element
 * @param {function} options.callback
 * @param {number} options.wpm - words per minute, positive integer, if wpm<=0 will have infinite wpm and will set delay interval to 0
 * 
 */
function typeString(words = window.words, options = {}) {
    options = $.extend({
        wpm: 250,
        inputField: '#word-input',
        callback: function () { console.log('typing complete'); }
    }, options);

    const interval_per_word = options.wpm > 0 ? 1000 * 60 / options.wpm : 0; // in milliseconds
    var word_idx = 0;
    var timeout = setTimeout(hackit, interval_per_word);


    function hackit() {
        if (word_idx < words.length) {
            $(options.inputField).val($(options.inputField).val() + words[word_idx] + ' ');
            var keyup = jQuery.Event('keyup');
            keyup.which = 32;
            $(options.inputField).trigger(keyup);
            word_idx++;
            setTimeout(hackit, interval_per_word);
        } else {
            if (typeof (options.callback) === 'function') {
                options.callback();
            }
            clearTimeout(timeout);
        }
    }
}

//

function getImageData(bimg) {
    var b64url = getBase64Image(bimg);
    console.log('base64url:', b64url);
    return uriToImageData(b64url);
}

function uriToImageData(uri) {
    return new Promise(function (resolve, reject) {
        if (uri == null) return reject();
        var canvas = document.createElement('canvas'),
            context = canvas.getContext('2d'),
            image = new Image();
        image.addEventListener('load', function () {
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(context.getImageData(0, 0, canvas.width, canvas.height));
        }, false);
        image.src = uri;
    });
}

function getBase64Image(img, excludeUrlProtocol = false) {
    // Create an empty canvas element
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to
    // guess the original format, but be aware the using "image/jpg"
    // will re-encode the image.
    var dataURL = canvas.toDataURL('image/png');

    return excludeUrlProtocol && dataURL.replace(/^data:image\/(png|jpg);base64,/, '') || dataURL;
}

function imageToImageData(srcImg) {
    var img = $(srcImg);
    var context = document.createElement('canvas').getContext('2d');
    context.drawImage(img[0], 0, 0);

    return context.getImageData(0, 0, img.width(), img.height());
}

function imagedataToimage(imagedata) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = imagedata.width;
    canvas.height = imagedata.height;
    ctx.putImageData(imagedata, 0, 0);

    var image = new Image();
    image.src = canvas.toDataURL();
    return image;
}
