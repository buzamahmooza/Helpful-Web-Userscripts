(function () {
    var imgLinks = new Set(Array.from(document.querySelectorAll('a.project-image[artstation-open-project]'))
                                .map(a => a.href));
    if(confirm('Open all ' + imgLinks.size + ' images?')) {
        if(imgLinks) {
            var i = 0;
            for (const imgLink of imgLinks) {
                i++;

                window.open(imgLink + "?&dl=1", "_blank");
            }
        }
    }
})();


(function () {
    var imgLinks = document.querySelectorAll('[artstation-open-project]');
    if(imgLinks && imgLinks.length) {
        for (const imgLink of imgLinks) {
            try {
                if(imgLink.classList.contains('dliframe')) continue;

                const iframe = document.createElement('iframe');

                iframe.src = imgLink.href;

                imgLink.classList.add('dliframe');
                imgLink.appendChild(iframe);

                observeIframe(iframe, function (mutations, me) {
                    function dlImageOnPage(doc) {
                        var imgs = doc.querySelectorAll('.artwork-image');
                        console.log(
                            'helloooo, opened page' +
                            '\nimgs:', imgs,
                            '\ndoc:', doc
                        );

                        if(imgs && imgs.length) {
                            for (const img of imgs) {
                                var nameEl = doc.querySelector('body > div.wrapper > div > div > aside > div > h3');
                                var name = nameEl ? nameEl.innerHTML : doc.title;
                                var url = img.src;
                                console.log('url:', url);
                                download(url, name);
                            }
                        }
                    }

                    var img = iframe.contentDocument.querySelector('[ng-src]');
                    if(!!img) {
                        dlImageOnPage(iframe.contentDocument || iframe.contentWindow.document);
                    }
                });
            } catch (e) {
                console.warn(e);
            }
        }
    }
})();
function observeIframe(iframe, observerInit, observerOptions) {
    // older browsers don't get responsive iframe height, for now
    if(!window.MutationObserver) return;
    console.debug('Attaching an iframe observer...', iframe, '\n\n');
    var iframeObserver = new MutationObserver(function (mutations, observer) {
        console.debug(
            'Observed mutation in iframe:', iframe,
            '\nmutations:', mutations
        );
        observerInit(mutations, observer);
    });

    var interval = setInterval(function () {
        if(iframe.contentWindow && iframe.contentWindow.document) {
            iframeObserver.observe(iframe.contentWindow.document, observerOptions || {
                attributes: true,
                subtree: true,
                childList: true,
                characterData: true
            });
            console.log('Successfully added observer to iframe!', iframe);

            clearInterval(interval);
        }
    }, 100);
}
