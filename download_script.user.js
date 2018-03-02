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
// @require      https://github.com/buzamahmooza/Helpful-Web-Userscripts/raw/master/Handy%20AF%20functions%20Faris.user.js
// ==/UserScript==
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\Handy AF functions Faris.user.js

// 'use strict';
// noinspection ES6ConvertVarToLetConst
var debug;
if (typeof debug === 'undefined') {
    debug = false;
}
if (typeof log === 'undefined') {
    log = function (msg) {
        if (debug) console.log('Log:', msg);
    };
}
try {
    DELAY_BETWEEN_DOWNLOADS = 300;
    BLACK_LIST = new Set(["https://raw.githubusercontent.com/RaitaroH/DuckDuckGo-DeepDark/master/Images/BigLogo.png"]);
    MAX_DOWNLOADS = GM_getValue("MAX_DOWNLOADS", 200); // maximum number of downloads per batch
    DOWNLOAD_ATTEMPTS = 5; // Default number of download attempts until giving up
    MAIN_DIRECTORY = 'GM_Downloads'; //'↓GM_Downloads';
    NEST_DIRECTORIES = GM_getValue("NEST_DIRECTORIES", true); // if set to true: batch directories will be stored under the main tempDirectory.
    ALLOW_BASE64_IMAGE_DOWNLOADS = false;
    ALLOW_DUPES = GM_getValue("ALLOW_DUPES", true); // if set to true: batch directories will be stored under the main tempDirectory.
    IMG_MIN_WIDTH = GM_getValue("imgMinWidth", 200);
    IMG_MIN_HEIGHT = GM_getValue("imgMinHeight", 200);
    /**
     * Element attributes to get their name from (such as "alt-text" etc..)
     * @type {string[]}
     */
    NAME_ATTRIBUTES = ["download-name", "alt", "content", "description", "name"];
    NAME_FILES_BY_NUMBER = GM_getValue("NAME_FILES_BY_NUMBER", false);
    fileNumber = 1;
} catch (declarationException) {
    console.log("Caught exception in declaration:", declarationException);
}

if (typeof downloadSet === 'undefined')
    downloadSet = new Set(); // a list containing all the download urls in this session (used for checking if we already downloaded this item).
if (typeof tempDirectory === 'undefined')
    tempDirectory = "";


// console.log("IMG_MIN_WIDTH: " + IMG_MIN_WIDTH + "\nIMG_MIN_HEIGHT: " + IMG_MIN_HEIGHT);
// console.log('NAME_FILES_BY_NUMBER=', NAME_FILES_BY_NUMBER);
function setNameFilesByNumber(newValue) {
    NAME_FILES_BY_NUMBER = newValue;
    GM_getValue("NAME_FILES_BY_NUMBER", NAME_FILES_BY_NUMBER);
}

// console.log('NAME_FILES_BY_NUMBER=', NAME_FILES_BY_NUMBER);
unsafeWindow.setNameFilesByNumber = setNameFilesByNumber;
unsafeWindow.download = download;
unsafeWindow.GM_download = GM_download;
unsafeWindow.downloadBatch = downloadBatch;
unsafeWindow.downloadImageBatch = downloadImageBatch;
unsafeWindow.downloadImageWithCondition = downloadImageWithCondition;
unsafeWindow.getFileExtension = getFileExtension;

unsafeWindow.nameFile = nameFile;
let condition = function (param, minWidth, minHeight) {
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
function download(fileUrl, fileName, downloadDirectory, element) {
    const elementPassed = typeof element !== 'undefined';
    const directoryPassed = typeof downloadDirectory !== 'undefined' && downloadDirectory.length > 1;
    const namePassed = typeof fileName !== 'undefined' && fileName.length > 1;

    console.log('URL Added to downloads:', fileUrl);
    if (!fileUrl) {
        console.error("input URL is null!");
        return;
    }
    fileUrl = getAbsoluteURI(('' + fileUrl).replace(/['"]/gi, ''));

    if (/data:image\/jpeg;/.test(fileUrl) && !ALLOW_BASE64_IMAGE_DOWNLOADS) {
        console.error("The source is a base64-type, download was prevented:", fileUrl);
        return;
    }
    if (BLACK_LIST.has(fileUrl)) {
        console.warn("Blacklisted URL:", fileUrl);
        return;
    }
    if (downloadSet.has(fileUrl) && !ALLOW_DUPES) {
        console.warn("Request to download duplicate file.", fileUrl);
        return;
    }

    fileUrl = "" + getAbsoluteURI(fileUrl); // cast to string

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

    if (directoryPassed) {// if downloadDirectory passed
        console.log('DownloadDirectory passed:', downloadDirectory);
        downloadDirectory = cleanDirectoryName(downloadDirectory) + "/";
        console.log('DownloadDirectory passed (clean):', downloadDirectory);
    } else { // dirctory NOT passed
        downloadDirectory = cleanDirectoryName(
            tempDirectory.length > 1 ? tempDirectory : // use tempDirectory if valid
                namePassed && (/[^\/]+\/[^\/]+/).test(fileName) ? // name passed && contains "/" in middle?
                    fileName.split(/[\/-]/)[0] : // then, Directory = first part of passed-name
                    document.title               // last resort: use title
        );
    }
    let limitBackslashes = function (inputFileName) {
        const oldFileName = inputFileName;
        let segments = inputFileName.replace(/https|www|com/g, "").split("/");
        console.log('segments:', segments);
        if (typeof segments !== 'undefined' && segments.length > 1)
            for (let i = 0; i < segments.length; i++) {
                if (/[\w\d]+/.test(segments[i])) {
                    const firstSegment = segments[i];
                    inputFileName = firstSegment;
                    while (i++ < segments.length) {
                        if (/[\w\d]+/.test(segments[i])) {
                            console.log("limiting backslashes for:", oldFileName);
                            console.log("result:", inputFileName);
                            if (directoryPassed) {
                                inputFileName = firstSegment + " " + segments[i];
                                console.log('We are in the bullshit place (it thinks we passed the directory name)');
                                console.log('Directory name inside backslash function:', downloadDirectory);
                            } else {
                                downloadDirectory = firstSegment + "/";
                                console.log('Directory name inside backslash function:', downloadDirectory);
                                inputFileName = segments[i];
                                fileName = inputFileName;
                            }
                            return [firstSegment + "/", inputFileName];
                        }
                    }
                }
            }
        return [downloadDirectory, oldFileName];
    };

    /*
 // makes sure that there is a maximum of one backslash "/" (to prevent having too many nested directories)
     let result = limitBackslashes(fileName);
     downloadDirectory = result[0];
     fileName = result[1];
*/
    let fileExtension = getFileExtension(fileUrl);

    if (debug) console.log(
        'fileUrl:\t' + fileUrl +
        '\ndownloadDirectory:\t' + downloadDirectory +
        '\nfileName:\t' + fileName +
        '\nextension:\t' + fileExtension
    );

    let finalName = removeDoubleSpaces(
        (NEST_DIRECTORIES ? (MAIN_DIRECTORY + '/') : '') +
        (downloadDirectory.length > 1 ? downloadDirectory + "/" : "") +
        fileName + '.' + fileExtension
    );

    console.log('finalName:', finalName);
    GM_download({
        name: finalName,
        url: fileUrl,
        onload: function (r) {
            console.log('Download finished', fileUrl, "\n" + finalName, r);
            downloadSet.add(fileUrl);
        },
        onerror: function (r) {
            downloadSet.delete(fileUrl); // upon failure, remove the url from the list to give it another chance.
            console.warn('Download failed for link:', fileUrl,
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
                    switch (errorCurrent) {
                        case "SERVER_FAILED":
                        case "NETWORK_FAILED":
                            retry(fileUrl, finalName, DOWNLOAD_ATTEMPTS);
                            break;
                        case "USER_CANCELED":
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
        },
    });
}

function retry(fileUrl, finalName, count) {
    console.log('RETRYING:', fileUrl);
    // noinspection JSUnresolvedFunction
    GM_download({
        name: finalName,
        url: fileUrl,
        onload: function (r) {
            console.log('Download finished', r);
        },
        onerror: function (r) {
            if (count > 0)
                retry(fileUrl, --count);
            else {
                // noinspection JSUnresolvedFunction
                GM_download({
                    name: MAIN_DIRECTORY + '/' + '_failed' + '/' + nameFile(fileUrl) + '.' + getFileExtension(fileUrl) + '.oops',
                    url: fileUrl,
                    onload: function (rr) {
                        console.log('Download finished', fileUrl, rr);
                    },
                    onerror: function (rr) {
                        downloadSet.delete(fileUrl); // upon failure, remove the url from the list to give it another chance.
                        console.error('Download failed:\t' + fileUrl, rr);
                    }
                });
            }
        }
    });
}

function downloadBatch(inputUrls, maxDlCount) { // download batch but with a max count limit
    if (typeof maxDlCount === 'undefined')
        maxDlCount = MAX_DOWNLOADS;
    else
        console.log('maxDownloadCount was passed:', maxDlCount);
    if (!inputUrls) {
        console.error("input URLs null!");
        return;
    }

    tempDirectory = nameBatchDirectory(inputUrls);
    console.log('MAIN_DIRECTORY:', MAIN_DIRECTORY);
    console.log('sub-tempDirectory:', tempDirectory);

    let dlCount = 0;
    for (let url of inputUrls) {
        if (Array.isArray(url)) {
            downloadBatch(inputUrls, maxDlCount);
            break;
        }
        if (++dlCount >= maxDlCount) { // recursive call in case this element is an array
            console.log('Exceeded maximum download size.');
            break;
        }
        // setTimeout(function(){
        download(url);
        // }, DELAY_BETWEEN_DOWNLOADS);
    }
    console.log(dlCount + ' downloads.');
    tempDirectory = "";
}

function downloadImageBatch(inputUrls) {
    if (!inputUrls) {
        console.error("image input URLs null!");
        return;
    }
    console.log('Image batch received:', inputUrls);
    nameBatchDirectory(inputUrls);
    let dlCount = 0;
    for (let url of inputUrls) {
        if (Array.isArray(url)) { // recursive call in case this element is an array
            downloadImageBatch(inputUrls);
            break;
        }
        if (++dlCount >= MAX_DOWNLOADS) {
            console.log('Exceeded maximum download size:', dlCount + ' downloads.');
            break;
        }
        // setTimeout(function(){
        if (/\.gif/.test(url))
            download(url);
        else
            downloadImageWithCondition(url);
        // }, DELAY_BETWEEN_DOWNLOADS);
    }
}

function downloadImageWithCondition(url, width, height, fileName) {
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
        if (condition(dim)) {
            download(url, fileName);
        }
    });
    img.src = url;
    return dim;
}

function nameBatchDirectory(inputUrls) {
    let directoryName = document.title;
    // 'TM_Batch (';
    /*inputUrls.forEach(function(name, i, array){
        name = nameFile(inputUrls[i]);
        if(name){ directoryName += name+')'; return; }
    });*/
    tempDirectory = cleanDirectoryName(directoryName) + '/';
    console.log('Directory name:', tempDirectory);
    return directoryName;
}

function nameFile(fileUrl) {
    if (NAME_FILES_BY_NUMBER === true) return ("" + fileNumber++);

    let fileName = 'untitled';
    try {
        fileName = clearUrlGibberish(decodeURIComponent(fileUrl).split('/').pop())
                .split('.')[0] + ' ' +
            fileNumber++;
    } catch (e) {
        console.error('Failed to name file', fileUrl, e);
    }
    fileName = cleanFileName(/^[\w\-. ]+$/.test(fileName) ? fileName : (document.title) + '_');
    return fileName;
}

function getFileExtension(fileUrl) {
    const ext = clearUrlGibberish(('' + fileUrl).split('.').pop()) //the string after the last '.'
        .replace(/[^a-zA-Z0-9].*$/gi, "") // replace everything that is non-alpha, numeric nor a '.'
        .replace(/[^\w]/gi, '');
    return ext ? ext : 'oops';
}

function matchGibberish(str) {
    const matches = str.match(/[\d]{3,}/gi);
    return matches ? matches : '';
}

function getGibberishCount(str) {
    return matchGibberish(str).length;
}

function printList(list) {
    let str = '[';
    for (let i = 0; i < list.length; i++)
        str += (list[i] + (i < list.length - 1 ? ",\n" : ""));
    console.log(str + "]");
}

function cleanFileName(fileName) {
    return clearUrlGibberish(decodeURIComponent(fileName)).replace(/[^\w().\-_]|(\s\s+)/gi, ' ').trim();
}

function removeDoubleSpaces(str) {
    return str ? str.replace(/(\s\s+)/, " ") : "";
}

function cleanDirectoryName(directoryName) {
    return clearUrlGibberish(decodeURIComponent("" + directoryName)).replace(/[^\w]|\r|(\s\s+)/gi, ' ').trim();
}

function clearUrlGibberish(str) {
    return decodeURIComponent(str).replace(/(^site)|www(\.?)|http(s?):\/\/|proxy\.duckduckgo|&\f=\1|&reload=on/gi, "");
}

