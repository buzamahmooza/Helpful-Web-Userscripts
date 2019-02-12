JavaScript:
(function() {
    const vidRegex = new RegExp(`(/{1,2}|http(s?:))[\d\w?%-_/\=.]*?.(webm|mp4|wmv|ts|mov)((&f=1)?)`, "gim");
    var vid_container = document.querySelectorAll('div.vid_container');

    var dl = confirm("Download " + vid_container.length + " vids?");
    var dlOgs = confirm("Open the site pages and download the full videos too?");

    vid_container.forEach(function(block, index, array) {
        try {
            const vidthumb = block.querySelector('video').src;

            const anchor = block.querySelector('a.tdn');
            const title = anchor.title;
            const page = anchor.href;

            console.log('Vidthumb:', vidthumb,
                '\ntitle:', title,
                '\npage:', page);

            if (dl)
                download(vidthumb, "VidThumb_" + title, location.hostname + "/_VidThumbs");

            if (dlOgs)
                fetchElement(page, function(doc, url, opts) {
                    var firstVid = doc.querySelector('video');
                    download(firstVid.src,
                        doc.querySelector('[itemprop="description"]').getAttribute('content'),
                        location.hostname);
                });

        } catch (e) {
            console.warn(e);
        }
    });


    function dlFirstVid(doc, url) {
        var vid = doc.querySelector('#player_el');
        console.log('vid:', vid);
        var url = vid.src ? vid.src : vid;
        if (!url) url = vid.querySelector('source').src;
        var name = doc.querySelector('[itemprop="description"]').getAttribute('content');
        /*if(confirm("download "+name+"?"))*/
        download(url, name, location.hostname);
    }
})()