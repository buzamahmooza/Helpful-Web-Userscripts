

JavaScript:
(function() {
    const imgs = [];
    const vids = [];
    const waiting = [];

    function showRelated(a, type='img') {
        const mediaEl = document.createElement(type);
        mediaEl.src = a.href;
        mediaEl.href = a.href;
        mediaEl.style.display = 'none';
        mediaEl.onload = function(e) {
            console.debug(mediaEl.tagName + ' loaded!', mediaEl.src);
            mediaEl.style.display = 'inline';
        };
        a.after(mediaEl);
        return mediaEl;
    }

    for(const a of document.links) {
        if(a.classList.contains('')) {
            console.log('already showing media for', a.href);
            continue;
        }
        if(/\.(jpg|png|gif|tiff)($|\?)/i.test(a.href)) {
            showRelated(a, 'img');
            imgs.push(a);
        } else if(/\.(mp4|mpeg4|mov|wmv)($|\?)/i.test(a.href)) {
            showRelated(a, 'vid');
            vids.push(a);
        } else { /* try both and keep whichever works*/
            console.debug('not pic nor vid:', a.href);
            
            showRelated(a, 'img');
            showRelated(a, 'vid');
            
            waiting.push(a);
        }

        a.classList.add('show-linked-media');
    }
    console.log(
        'Showed linked media: imgs [' +imgs.length+ ']', imgs,
        '\nvids: ['+vids.length+']', vids,
        '\nAttempts:', waiting
    );
})();
