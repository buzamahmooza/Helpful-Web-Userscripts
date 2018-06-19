// ==UserScript==
// @name         Downloader
// @namespace    UserscriptDownloader
// @version      0.5
// @description  try to take over the world!
// @author       Faris Hijazi
// @match        *
// @include      *
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @grant        window.close
// @grant        window.focus
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\Handy AF functions Faris.user.js
// @require      https://code.jquery.com/jquery-3.2.1.slim.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.4/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// ==/UserScript==
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\JSZip.min.js
// @require      https://raw.githubusercontent.com/Stuk/jszip/master/dist/jszip.js
// @require      https://github.com/buzamahmooza/Helpful-Web-Userscripts/raw/master/Handy%20AF%20functions%20Faris.user.js

// noinspection ES6ConvertVarToLetConst
var debug;
if (typeof debug === 'undefined') debug = false;
if (typeof log === 'undefined') log = (...msg) => (debug) ? console.log('Log:', ...msg) : false;// words in all languages
const invalidNameCharacters = '@*:"|<>\\n\\r\?';

try {
    const DELAY_BETWEEN_DOWNLOADS = 300;
    BLACK_LIST = new Set(["https://raw.githubusercontent.com/RaitaroH/DuckDuckGo-DeepDark/master/Images/BigLogo.png"]);
    MAX_DOWNLOADS = GM_getValue("MAX_DOWNLOADS", 200); // maximum number of downloads per batch
    downloadAttemptsRemaining = 2; // Default number of download attempts until giving up
    MAIN_DIRECTORY = 'GM_Downloads'; // [ ↓ ⇓ ]
    IndividualDirectoryName = "_Misc";
    NEST_DIRECTORIES = GM_getValue("NEST_DIRECTORIES", true); // if set to true: batch directories will be stored under the main tempDirectory.
    ALLOW_BASE64_IMAGE_DOWNLOADS = false;
    ALLOW_DUPES = GM_getValue("ALLOW_DUPES", true); // if set to true: batch directories will be stored under the main tempDirectory.
    IMG_MIN_WIDTH = GM_getValue("imgMinWidth", 200);
    IMG_MIN_HEIGHT = GM_getValue("imgMinHeight", 200);
    /**
     * Element attributes to get their name from (such as "alt-text" etc..)
     * @type {string[]}
     */
    NAME_ATTRIBUTES = ['download-name', 'title', 'img-title', 'subtitle', 'alt', 'content', 'description', 'name'];
    NAME_FILES_BY_NUMBER = GM_getValue("NAME_FILES_BY_NUMBER", false);
    fileNumber = 1;
} catch (declarationException) {
    console.warn("Caught exception in declaration:", declarationException);
}
var downloadSet;
if (typeof downloadSet === 'undefined') {
    downloadSet = new Set(); // a list containing all the download urls in this session (used for checking if we already downloaded this item).
    unsafeWindow.downloadSet = downloadSet;
}
var tempDirectory;
if (typeof tempDirectory === 'undefined') {
    tempDirectory = "";
}

/**abbreviation for querySelectorAll()*/
function qa(selector) {
    return document.querySelectorAll(selector);
}
/**abbreviation for querySelector()*/
function q(selector) {
    return document.querySelector(selector);
}

if (false)
    window.addEventListener('beforeunload', function (event) {
        // merge and store the download history
        storeDownloadHistory();
        return true;
    });
unsafeWindow.storeDownloadHistory = storeDownloadHistory;

function storeDownloadHistory() {
    if (downloadSet.size <= 0) return;
    const storedDlH = GM_getValue('downloadHistory', []),
        mergedDlH = Array.from(downloadSet).concat(storedDlH);
    console.debug(
        'storedDlH:', storedDlH,
        'downloadSet: ', downloadSet,
        '\nmergedDownloadHistory:', mergedDlH
    );
    return GM_setValue('downloadHistory', Array.from(new Set(mergedDlH)));
}

/**
 url - the URL from where the data should be downloaded
 name - the filename - for security reasons the file extension needs to be whitelisted at the Tampermonkey options page
 headers - see GM_xmlhttpRequest for more details
 saveAs - boolean value, show a saveAs dialog
 onerror callback to be executed if the download ended up with an error
 onload callback to be executed if the download finished
 onprogress callback to be executed if the download made some progress
 ontimeout callback to be executed if the download failed due to a timeout
 */
function setNameFilesByNumber(newValue) {
    NAME_FILES_BY_NUMBER = newValue;
    GM_getValue("NAME_FILES_BY_NUMBER", NAME_FILES_BY_NUMBER);
}

let downloadCount = 0;
unsafeWindow.MAIN_DIRECTORY = MAIN_DIRECTORY;
unsafeWindow.getDownloadCount = () => downloadCount;
unsafeWindow.setNameFilesByNumber = setNameFilesByNumber;
unsafeWindow.download = download;
unsafeWindow.GM_download = GM_download;
unsafeWindow.downloadBatch = downloadBatch;
unsafeWindow.downloadImageBatch = downloadImageBatch;
unsafeWindow.downloadImageWithCondition = downloadImageWithCondition;
unsafeWindow.getFileExtension = getFileExtension;
unsafeWindow.nameFile = nameFile;

let dimensionsCondition = function (param, minWidth, minHeight) {
    minWidth = (typeof minWidth === 'undefined') ? IMG_MIN_WIDTH : minWidth;
    minHeight = (typeof minHeight === 'undefined') ? IMG_MIN_HEIGHT : minHeight;
    let dim = param.split('x');
    let w = dim[0],
        h = dim[1];
    console.log(param, 'Dimensions:\t', w, 'x', h);
    return h >= minHeight && w >= minWidth;
};

/**@Parameter element the element containing the file url attribute.
 * Having the element could be helpful getting it's ATTRIBUTES (such as: "download-name") */
function download(fileUrl, fileName, directory, element, paramOnLoad) {
    const elementPassed = element === 'object';
    const directoryPassed = directory && directory.length > 1;
    const namePassed = fileName && fileName.length > 1;

    console.log('URL Added to downloads:', fileUrl);
    if (!fileUrl) {
        fileUrl = location.href;
        console.error("input URL is null!");
        // return;
    }
    if (typeof fileUrl === 'object') {
        downloadBatch(fileUrl);
        console.warn('The file url passed to be downloaded is an object, trying to download it as multiple urls:', fileUrl);
        return;
    }

    fileUrl = getAbsoluteURI((fileUrl).replace(/["]/gi, ''));

    if (/^data:image\/.{1,5};base64/.test(fileUrl) && !ALLOW_BASE64_IMAGE_DOWNLOADS) {
        console.error("The source is a base64-type, download was prevented:", fileUrl);
        return;
    }
    if (BLACK_LIST.has(fileUrl)) {
        console.warn("Blacklisted URL:", fileUrl);
        return;
    }
    if (downloadSet.has(fileUrl) && !ALLOW_DUPES) {
        throw ("Request to download duplicate file: " + fileUrl);
    }

    fileUrl = getAbsoluteURI(fileUrl);
    if (getHostname(fileUrl).indexOf('gfycat.com') === 0) {
        //from: https://gfycat.com/rawharmlesskiwi
        //to:   https://giant.gfycat.com/RawHarmlessKiwi.webm
        fileUrl = fileUrl.replace(/gfycat\.com/i, "giant.gfycat.com") + '.webm';
    }

    if (namePassed) { // if fileName passed
        console.log('Filename passed:', fileName);
        fileName = cleanFileName(fileName);
        console.log('Filename passed (after cleaning):', fileName);
    } else {
        if (elementPassed) { // element passed
            const nameAttribute = NAME_ATTRIBUTES[0];
            if (element.hasAttribute(nameAttribute)) {
                fileName = element.getAttribute(nameAttribute);
                console.log('Got fileName from element:', fileName, fileUrl);
            }
        } else {
            fileName = nameFile(fileUrl);
        }
    }
    if (!fileName || fileName.length < 1) {
        fileName = 'a_' + (cleanGibberish(nameFile(document.title)) || cleanGibberish(nameFile(fileName))) + ' ' + (fileNumber++);
    }
    if (directoryPassed) {// if downloadDirectory passed
        console.log('DownloadDirectory passed:', directory);
        directory = cleanFileName(directory, true);
        console.log('DownloadDirectory passed (clean):', directory);
    } else { // directory NOT passed
        const split = fileName.split(/\//);
        if (split.length > 1) {
            fileName = split.pop();
            directoryName = split.pop();
        } else {
            directory = null;
            /*cleanFileName(
                (tempDirectory.length > 1 ? tempDirectory : // use tempDirectory if valid
                    // namePassed && (/[^\/]+\/[^\/]+/).test(fileName) ? // name passed && contains "/" in middle?
                    //     fileName.split(/[\/-]/)[0] : // then, Directory = first part of passed-name
                    document.title)           // last resort: use title
            ,true);*/
        }
    }
    /*
    // makes sure that there is a maximum of one backslash "/" (to prevent having too many nested directories)
     let result = limitBackslashes(fileName);
     downloadDirectory = result[0];
     fileName = result[1];
    */
    let fileExtension = getFileExtension(fileUrl);


    let finalName = removeDoubleSpaces(
        (NEST_DIRECTORIES ? `${MAIN_DIRECTORY}/` : '') +
        (directory ? `${directory}/` : `${IndividualDirectoryName}/`) +
        (fileName + '.' + fileExtension)
    );

    // if (debug)
    console.log(
        'fileUrl:', fileUrl,
        '\ndownloadDirectory:', directory,
        '\nfileName:', fileName,
        '\nextension:', fileExtension,
        '\nFINAL_NAME:', finalName);

    // saveAs(fileUrl, finalName);
    GM_download({
        name: finalName,
        url: fileUrl,
        onload: onload,
        onerror: function (r) {
            downloadSet.delete(fileUrl); // upon failure, remove the url from the list to give it another chance.
            console.warn(
                'Download failed for link:', fileUrl,
                "\nError:", r,
                "\nDetails:", r.details);
            /*
            error - error reason
            not_enabled,
            not_whitelisted,
            not_permitted,
            not_supported,
            not_succeeded, - the download wasn't started or failed, the details attribute may provide more information
            */
            const error = r.error;

            switch (error) {
                case 'not_succeeded':
                    const errorCurrent = r.details.current;
                    switch (errorCurrent.toLowerCase()) {
                        case "server_failed": // fall-through
                        case "network_failed":
                            retry(fileUrl, finalName, downloadAttemptsRemaining);
                            break;
                        case "not_whitelisted":
                            retry(
                                fileUrl.replace(/\?.*/, ''),
                                finalName.substring(0,
                                    (finalName.lastIndexOf('?') > -1) ? finalName.lastIndexOf('?') : (finalName.length + '.oops.jpg')
                                ),
                                downloadAttemptsRemaining);
                            break;
                        case "user_canceled":
                            console.log('Download canceled by user.');
                            break;
                    }
                    break;
                case 'not_enabled':
                case 'not_permitted':
                case 'not_supported':
                    break;
                //                 case 'not_whitelisted':
                //                     break;
                default:
                    retry(fileUrl, finalName, 1);
            }
        }/*,
        onprogress: function (p) {
            console.log('Progress:', p);
        }*/
    });

    function onload() {
        console.log('Download finished', finalName, "\n" + fileUrl);
        downloadSet.add(fileUrl);

        if (paramOnLoad && paramOnLoad.call) paramOnLoad.call();
    }
}

// unsafeWindow.imageUrl2blob = imageUrl2blob;
function imageUrl2blob(url, callback, callbackParams) {
    GM_xmlhttpRequest({
        method: "GET",
        url: url || "https://i.ytimg.com/vi/RO90omga8D4/maxresdefault.jpg",
        responseType: 'arraybuffer',
        binary: true,
        onload: /** @param {XMLHttpRequest} res */ function (res) {
            try {
                const ext = getFileExtension(url);
                var blob = new Blob([res.response], {type: "image/" + ext});
                if (!!callback) {
                    callback(blob, url, callbackParams);
                } else {
                    saveAs(blob, "untitled." + ext);
                }

                console.debug('GM_xmlhttpRequest load', res, 'myblob:', blob);
                console.debug([
                    res.status,
                    res.statusText,
                    res.readyState,
                    res.responseHeaders,
                    res.responseText,
                    res.finalUrl
                ].join("\n"));
            } catch (e) {
                console.error(e);
            }
        },

        onreadystatechange: function (res) {
            console.log("Request state changed to: " + res.readyState);
            if (res.readyState === 4) {
                console.log('ret.readyState === 4');
            }
        },
        onerror: /** @param {XMLHttpRequest} res */ function (res) {
            var msg = "An error occurred."
                + "\nresponseText: " + res.responseText
                + "\nreadyState: " + res.readyState
                + "\nresponseHeaders: " + res.responseHeaders
                + "\nstatus: " + res.status
                + "\nstatusText: " + res.statusText
                + "\nfinalUrl: " + res.finalUrl;
            console.error(msg);
        },
        onprogress: function (res) {
            if (res.lengthComputable) {
                console.log("progress:", res.loaded / res.total);
            }
        }
    });
}

function retry(fileUrl, finalName, count) {
    console.log('RETRYING:', fileUrl);
    // noinspection JSUnresolvedFunction
    GM_download({
        name: finalName,
        url: fileUrl,
        onload: onload,
        onerror: function () {
            if (count > 0) {
                retry(fileUrl, finalName, --count);
            } else {
                // noinspection JSUnresolvedFunction
                GM_download({
                    name: `${MAIN_DIRECTORY}/${nameFile(fileUrl)}.${getFileExtension(fileUrl)}`,
                    url: fileUrl,
                    onload: onload,
                    onerror: onerrorFinal
                });

            }
        }
    });

    function onerrorFinal(rr) {
        if (!isDdgUrl(fileUrl)) {
            GM_download({
                name: `${finalName}.${getFileExtension(fileUrl)}`,
                url: ddgProxy(fileUrl),
                onload: onload,
                onerror: function (rrr) {
                    downloadSet.delete(fileUrl); // upon failure, remove the url from the list to give it another chance.
                    console.error('Download failed:', fileUrl, rrr);
                }
            });
        }
        downloadSet.delete(fileUrl); // upon failure, remove the url from the list to give it another chance.
        console.error('Download failed:', finalName, fileUrl, rr);
    }
}

// unsafeWindow.generateAndDownloadZip = generateAndDownloadZip;
// unsafeWindow.zip = zip;

function generateAndDownloadZip(zipName) {
    zipDl.generateAsync({type: "blob"}).then(function (content) {
            zip.zipName = zip.zipName || (tempDirectory.replace(/\/$/, "") || document.title);
            saveAs(content, zip.zipName + ".zip");
        }
    );
}

function downloadBatch(inputUrls, directory, maxDlLimit) { // download batch but with a max count limit
    if (typeof maxDlLimit === 'undefined') maxDlLimit = MAX_DOWNLOADS;
    else console.log('maxDownloadCount was passed:', maxDlLimit);
    zipImages(inputUrls, `${directory} ${directory}`);

    if (!inputUrls) throw "input URLs null!";

    directory = directory || document.title;
    console.log('MAIN_DIRECTORY:', MAIN_DIRECTORY);
    console.log('sub-tempDirectory:', tempDirectory);


    let dlCount = 0;

    let i = 0;
    var interval = setInterval(() => {
        if (i < inputUrls.length) {
            const url = inputUrls[i];
            // if (Array.isArray(url)) {
            //     downloadBatch(url, directory, maxDlLimit);
            //     return;
            // }
            // if (++dlCount >= maxDlLimit) { // recursive call in case this element is an array
            //     console.log('Exceeded maximum download size.');
            //     return;
            // }
            download(url, null, `${location.hostname} - ${document.title}`);
        } else clearInterval(interval);
    }, 200);

    // function zipImage(blob, url) {
    //     zipDl.file(`${nameFile(url)}.${(getFileExtension(url) || "gif")}`, blob, {base64: true});
    //     if (zip.zipTotal <= ++zip.current) {
    //         generateAndDownloadZip();
    //     }
    // }
}
/**@deprecated*/
function downloadImageBatch(inputUrls, directory) {
    if (!inputUrls) throw "mainImage input URLs null!";

    console.log('Image batch received:', inputUrls);
    const batchName = `${cleanFileName(cleanGibberish(document.title), true)}/`;
    zipImages(inputUrls, `${directory} ${batchName}`);

    /*let dlCount = 0;
    for (let url of inputUrls) {
        if (Array.isArray(url)) { // recursive call in case this element is an array
            downloadImageBatch(url);
            break;
        }
        if (/\.gif/.test(url)) {
            download(url, batchName, directory);
        } else {
            downloadImageWithCondition(url);
        }
    }*/
}
function downloadImageWithCondition(url, width, height, fileName, downloadDirectory, imgEl) {
    if (url instanceof Set || Array.isArray(url)) {
        downloadImageBatch(url);
        return;
    }

    downloadSet.add(url);
    // first, attempt to use the dimension ATTRIBUTES if already available

    let img = new Image();
    let dim = 'dimension not yet set';
    img.addEventListener("load", function () {
        dim = (this.naturalWidth + 'x' + this.naturalHeight);
        onLoadDim(url, function () {
            if (dimensionsCondition(dim, width, height)) {
                download(url, fileName, downloadDirectory, imgEl);
            }
        }, imgEl);
    });
    img.src = url;
    return dim;
}

function nameFile(fileUrl) {
    if (NAME_FILES_BY_NUMBER === true) return (` ${fileNumber++}`);

    let fileName = 'untitled';
    try {
        fileName = clearUrlGibberish(decodeURIComponent(fileUrl).split('/').pop())
            .split('.')[0] /*+ (' ' + fileNumber++)*/;
    } catch (e) {
        console.error('Failed to name file', fileUrl, e);
    }
    fileName = cleanFileName(new RegExp(`[${invalidNameCharacters}]`).test(fileName) ? (`${document.title} - `) : fileName);
    return fileName;
}
function getFileExtension(fileUrl) {
    const ext = clearUrlGibberish((`${fileUrl}`).split(/[.]/).pop()) //the string after the last '.'
        .replace(/[^a-zA-Z0-9].+($|\?)/gi, "") // replace everything that is non-alpha, numeric nor a '.'
        .replace(/[^\w]/gi, '');
    return !ext ? 'oops' : ext;
}

function cleanFileName(fileName, isDirectory) {
    const fileCleanerRegex = new RegExp(`[${invalidNameCharacters}${isDirectory ? '' : '\\\\/'}]|(^[\\W.]+)|(\\s\\s+)`, 'gi');
    return clearUrlGibberish(decodeURIComponent(fileName)).replace(fileCleanerRegex, ' ').trim();
}
function removeDoubleSpaces(str) {
    return str ? str.replace(/(\s\s+)/g, " ") : str;
}
function clearUrlGibberish(str) {
    return removeDoubleSpaces(decodeURIComponent(str).replace(/(^site)|www(\.?)|http(s?):\/\/|proxy\.duckduckgo|&f=1|&reload=on/gi, ""));
}

// window.addEventListener('load', () => unsafeWindow.JSZip = JSZip);

unsafeWindow.makeTextFile = makeTextFile;
unsafeWindow.anchorClick = anchorClick;
unsafeWindow.saveByAnchor = saveByAnchor;

/** creates an anchor, clicks it, then removes it
 * this is done because some actions cannot be done except in this way
 * @param downloadValue
 * @param target
 * @param href */
function anchorClick(href, downloadValue, target) {
    downloadValue = downloadValue || '_untitled';
    var a = document.createElement('a');
    a.setAttribute('href', href);
    a.download = downloadValue;
    a.target = target;
    a.click();
    a.remove();
}
function saveByAnchor(url, dlName) {
    anchorClick(url, dlName);
}

function saveBase64AsFile(base64, fileName) {

    var link = document.createElement("a");

    link.setAttribute("href", base64);
    link.setAttribute("download", fileName);
    link.click();
}
function saveBlobAsFile(blob, fileName) {
    var reader = new FileReader();

    reader.onloadend = function () {
        var base64 = reader.result;
        var link = document.createElement("a");

        link.setAttribute("href", base64);
        link.setAttribute("download", fileName);
        link.click();
    };

    reader.readAsDataURL(blob);
}

function makeTextFile(text) {
    var data = new Blob([text], {type: 'text/plain'});
    var textFile = null;
    // If we are replacing a previously generated file we need to manually revoke the object URL to avoid memory leaks.
    if (textFile !== null) window.URL.revokeObjectURL(textFile);
    textFile = window.URL.createObjectURL(data);
    return textFile;
}

function zipBeforeUnload(e) {
    var dialogText = "You still didn't download your zipped files, are you sure you want to exit?";
    e.returnValue = dialogText;
    return dialogText;
}

unsafeWindow.zipImages = zipImages;
function zipImages(imgList, zipName) {
    const zip = new JSZip();
    zip.current = 0;
    zip.activeZipThreads = 0;
    zip.totalSize = 0;
    zip.totalLoaded = 0;
    zip.responseBlobs = new Set();
    zip.zipName = (zipName ? zipName : document.title).replace(/\//g, " ");
    zip.genZip = function genZip() {
        this.generateAsync({type: "blob"}).then(function (content) {
                zip.zipName = (zipName || document.title);
                saveAs(content, `${zip.zipName} [${Object.keys(zip.files).length}].zip`);
                unsafeWindow.zipGenerated = true;

                window.removeEventListener('beforeunload', zipBeforeUnload);
            }
        );
    };
    zip.progressBar = setupProgressBar();

    const selector = `img.img-big`;
    const imgs = Array.from(imgList ? imgList : qa(selector)).map(img => {
        if (!img) return;
        if (img.slice && img.indexOf) { // if string
            img = {
                fileURL: img
            };
        }
        img.fileURL = img.fileURL || img.src || img.href;
        img.fileName = img.fileName || img.alt || img.title || nameFile(img.fileURL) || "Untitled image";
        return img;
    }).filter(img => !!img);
    zip.zipTotal = Array.from(imgs).length;

    window.addEventListener('beforeunload', zipBeforeUnload);
    console.log('zipping images:', imgs);

    for (const img of imgs)
        try {
            requestAndZipImage(img.fileURL, img.fileName);
        } catch (r) {
            console.error(r);
        }

    /**
     * Requests the image and adds it to the local zip
     * @param fileUrl
     * @param fileName
     */
    function requestAndZipImage(fileUrl, fileName) {
        var fileSize = 0;
        zip.loadedLast = 0;
        zip.activeZipThreads++;

        fileName = removeDoubleSpaces(fileName.replace(/\//g, " "));

        if (zip.files.hasOwnProperty(fileName)) {
            console.log('ZIP already contains the file: ', fileName);
            return;
        }

        function onBadResult(res) {
            console.debug('onBadResult:', 'fileURL:', fileUrl, 'response.finalURL:', res.finalUrl);
            // if not a proxyUrl, try to use a proxy
            if (!isDdgUrl(res.finalUrl)) {
                console.debug(
                    'retrying with ddgproxy',
                    '\nddgpURL:', ddgProxy(fileUrl),
                    '\nfileURL:', fileUrl,
                    '\nresponse.finalURL:', res.finalUrl
                );
                if (/<!DOCTYPE/.test(res.responseText)) {
                    console.error('Not image data!', res.responseText);
                    zip.current++;
                    return;
                }
                requestAndZipImage(ddgProxy(fileUrl), fileName);
            } else { // if is a proxy url and it failed, just give up
                return true;
            }
        }

        GM_xmlhttpRequest({
            method: "GET",
            url: fileUrl || "https://i.ytimg.com/vi/RO90omga8D4/maxresdefault.jpg",
            responseType: 'arraybuffer',
            binary: true,
            onload: function (res) {
                if (zip.files.hasOwnProperty(fileName)) {
                    console.warn('ZIP already contains the file: ', fileName);
                    return;
                }
                try {
                    console.debug(
                        "onload:"
                        + "\nreadyState:    " + res.readyState
                        + "\nresponseHeaders: " + res.responseHeaders
                        + "\nstatus:        " + res.status
                        + "\nstatusText:    " + res.statusText
                        + "\nfinalUrl:      " + res.finalUrl
                        + "\nresponseText:  " + res.responseText.slice(0, 100) + '...'
                    );
                } catch (e) {
                }

                const contentType = res.responseHeaders.match(/content-type: \w+\/\w+/)[0].replace('content-type: ', '');
                const typeSplit = contentType.split('/');
                const ext = typeSplit.pop(),
                    mimeType = typeSplit.pop()
                ;
                console.debug(`contentType: ${contentType}`);

                if (/<!DOCTYPE html PUBLIC/.test(res.responseText) || !/image/i.test(mimeType)) {
                    console.error('Not image data!', res.responseText);
                    if (onBadResult(res) || /<!DOCTYPE html PUBLIC/.test(res.responseText)) {
                        return;
                    }
                }
                var blob = new Blob([res.response], {type: contentType});

                zip.file(`${fileName.trim()}_${zip.current + 1}.${ext || contentType.split('/').pop() || "gif"}`, blob);
                console.log("Added file to zip:", fileName, fileUrl);
                zip.responseBlobs.add(blob);
                zip.current++;

                // if finished, stop
                if (zip.current < zip.zipTotal || zip.zipTotal <= 0) {
                    return;
                }

                // Completed!
                if (zip.current >= zip.zipTotal - 1) {
                    console.log("Generating ZIP...\nFile count:", Object.keys(zip.files).length);
                    zip.zipTotal = -1;
                    if (zip.progressBar.remove)
                        zip.progressBar.remove();
                    zip.genZip();
                }
                zip.activeZipThreads--;
            },
            onreadystatechange: function (res) {
                console.debug("Request state changed to: " + res.readyState);
                if (res.readyState === 4) {
                    console.debug('ret.readyState === 4');
                }
            },
            onerror: function (res) {
                if (onBadResult(res)) {
                    return;
                }
                console.error(`An error occurred.
readyState: ${res.readyState}
responseHeaders: ${res.responseHeaders}
status: ${res.status}
statusText: ${res.statusText}
finalUrl: ${res.finalUrl}
responseText: ${res.responseText}`
                );
                zip.activeZipThreads--;
            },
            onprogress: function (res) {
                if (zip.files.hasOwnProperty(fileName) || zip.current < zip.zipTotal || zip.zipTotal <= 0) {
                    //TODO: stop the GM_xmlrequest at this point
                    /*if(res.abort)
                        res.abort();
                    else
                        console.error('res.abort not defined');
                    if(this.abort)
                        this.abort();
                    else
                        console.error('this.abort not defined');
                    return;*/
                }

                if (res.lengthComputable) {
                    if (fileSize == 0) { // happens once
                        fileSize = res.total;
                        zip.totalSize += fileSize;
                    }
                    const loadedSoFar = res.loaded;
                    const justLoaded = loadedSoFar - zip.loadedLast;    // What has been added since the last progress call
                    const fileprogress = loadedSoFar / res.total;   //

                    zip.totalLoaded += justLoaded;
                    const totalProgress = zip.totalLoaded / zip.totalSize;

                    if (false) {
                        console.debug(`
loadedSoFar = ${res.loaded};
justLoaded = ${loadedSoFar - zip.loadedLast}
fileprogress = ${loadedSoFar / res.total}`);
                    }

                    if (typeof progressBar != 'undefined') {
                        progressBar.set(totalProgress);
                        progressBar.setText(`Files in ZIP: (${Object.keys(zip.files).length} / ${zip.zipTotal}) Active threads: ${zip.activeZipThreads}     (${zip.totalLoaded} / ${zip.totalSize})`);
                    }

                    zip.loadedLast = loadedSoFar;
                }
            }
        });
    }

    // give access to the zip variable by adding it to the global object

    const varName = `zip-${location.hostname.replace(/\./g, '-')}`;
    console.log(
        'zip object reference:  ', varName,
        `To access, use:    window[\`${varName}\`]\n`, zip
    );
    window[varName.toString()] = zip;

    return zip;
}


function setupProgressBar() {
    // noinspection JSUnresolvedVariable
    if (typeof(ProgressBar) == 'undefined') {
        console.warn("ProgressBar is not defined.");
        return;
    }
    if (!q('#progressbar-container'))
        document.body.firstElementChild.before(createElement(`<header id="progressbar-container" 
style="
    position: fixed !important;
    top: 0;
    left: 0;
    width: 100%;
    min-height: 30px;
    padding: 10px 0;
    background-color: #36465d;
    box-shadow: 0 0 0 1px hsla(0,0%,100%,.13);
    z-index: 100;"
    />`));

    // noinspection JSUnresolvedVariable
    var progressBar = new ProgressBar.Line('#progressbar-container', {
        easing: 'easeInOut',
        color: '#FCB03C',
        strokeWidth: 1,
        trailWidth: 1,
        text: {
            value: '0'
        }
    });
    progressBar.set(0);
    const progressbarText = q('.progressbar-text');
    progressbarText.style.display = "inline";
    progressbarText.style.position = "relative";
    return progressBar;
}
