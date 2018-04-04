// https://anybunny.mobi/search/madison-ivy-sexaholic-keiran-lee.html

var plinks = Array.from(document.querySelectorAll('.rolik>a[href]'));

plinks.forEach(function (plink) {
    fetchElement(plink.href, function (doc, url) {
            let vid = doc.querySelector('video, #player_el');
            console.log('video:', vid);
            if (vid) {
                var vidSource = vid.querySelector('source').src;
                console.log('video href:', vidSource);
                /*console.log('url:', url);*/
                console.log('title:', doc.title);
                /*if(confirm('download video?\n' + title + " from "+url.hostname))*/
                download(vidSource, doc.title);
            } else alert("Vid not found );");
        }
    );
});


var plinks = Array.from(document.querySelectorAll('.rolik>a[href]'));
plinks = Array.from(document.querySelectorAll('.rolik>a[href]'));

plinks.forEach(plink => fetchElement(plink.href, handleVid, plink));

function handleVid(doc, url, plink) {
    try {
        let vid = doc.querySelector('video, #player_el');
        console.log('video:', vid);
        if (!!vid) {
            var vidSource = vid.querySelector('source').src;
            console.log('video href:', vidSource);
            /*console.log('url:', url);*/
            console.log('title:', doc.title);
            /*if(confirm('download video?\n' + title + " from "+url.hostname))*/
            //                 download(vidSource, doc.title);
            var vidClone = vid.cloneNode();
            plink.childNodes[0].remove();
            plink.appendChild(vidClone);
        } else alert("Vid not found );");
    } catch (e) {
        console.warn(e);
    }
}
