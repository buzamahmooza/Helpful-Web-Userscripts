/*
 *  GM_download polyfill
 *  
 *  @description  A polyfill to make your userscript supports GM_download
 *  @author       ccloli
 *  @version      1.0
 */

// to use this polyfill, you must add "@grant GM_xmlhttpRequest" at userscript metadata block

// Original Documentation: http://tampermonkey.net/documentation.php?ext=dhdg#GM_download

function anchorClick(url, name) {
    // fake anchor click
    var a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', name != null ? name : 'filename');
    document.documentElement.appendChild(a);
    // call download
    // a.click() or CLICK the download link can't modify filename in Firefox (why?)
    // Solution from FileSaver.js, https://github.com/eligrey/FileSaver.js/
    var e = new MouseEvent('click');
    a.dispatchEvent(e);
    document.documentElement.removeChild(a);
}

if (typeof GM_download !== 'function') {
    if (typeof GM_xmlhttpRequest !== 'function') {
        throw new Error('GM_xmlhttpRequest is undefined. Please set @grant GM_xmlhttpRequest at metadata block.');
    }

    function GM_download(url, name) {
        if (url == null) return;

        var data = {
            method: 'GET',
            responseType: 'arraybuffer',

            onload: function (res) {
                if(/<!DOCTYPE html PUBLIC/.test(res.responseText)) {
                    console.error("Response was in XML:", url);
                    return;
                }

                var blob = new Blob([res.response], {type: 'application/octet-stream'});
                var objectUrl = URL.createObjectURL(blob); // blob url

                anchorClick(objectUrl, data.name);

                setTimeout(function () {
                    // reduce memory usage
                    URL.revokeObjectURL(objectUrl);
                    if ('close' in blob) blob.close(); // File Blob.close() API, not supported by all the browser right now
                    blob = undefined;
                }, 1000);

                if (typeof data.onafterload === 'function') data.onafterload(); // call onload function
            }

            // error object of onerror function is not supported right now
        };

        if (typeof url === 'string') {
            data.url = url;
            data.name = name;
        } else {
            if (url instanceof Object === false) return;

            // as documentation, you can only use [url, name, headers, saveAs, onload, onerror] function, but we won't check them
            // Notice: saveAs is not supported
            if (url.url == null) return;

            for (var i in url) {
                if (i === 'onload') data.onafterload = url.onload; // onload function support
                else data[i] = url[i];
            }
        }

        // it returns this GM_xhr, thought not mentioned in documentation
        return GM_xmlhttpRequest(data);
    }
}