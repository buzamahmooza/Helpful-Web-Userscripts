

(function () {
    var anchors = document.querySelectorAll('a.full-size-container');
    anchors.forEach(function (a) {
        var iframe = document.createElement('iframe');
        iframe.src = a.href;
        iframe.addEventListener('load', function () {
            new MutationObserver(function (mutations) {
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length) {
                        replaceImage(iframe);
                    } else {
                        console.debug("mutation.addedNodes.length:", mutation.addedNodes.length);
                    }
                }
            }).observe(getIframeDoc(iframe), {
                childList: true, subtree: true,
                attributes: false, characterData: false
            });
        });
        a.appendChild(iframe);
    });

    function replaceImage(iframe) {
        var img = getIframeDoc(iframe).querySelector('img');
        if (!!img) {
            console.log('this iframe has no images', iframe);
            return;
        }

        console.debug('iframe:', iframe);
        iframe.outerHTML = `<img class="ogImg" src="${img.src}"/>`;
    }

    function getIframeDoc(iframe) {
        return iframe.contentDocument || iframe.contentWindow.document;
    }
})();
