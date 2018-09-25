
// download all original images on Pinterest page:
var pinwrappers = document.querySelectorAll('div.pinWrapper div a div div div div img');
var directoryName = document.title.trim();
var dlLimit = -1;

if (confirm(`Download all original iamges on Pinterest page?\n(${pinwrappers.length} found).`))
    pinwrappers.forEach(function (img, index) {
        if (dlLimit > index) {
            console.log('Downloads limited to:', dlLimit);
            return;
        }
        var name = `Pinterest pic ${index}_${img.alt}`;
        var bigImgSrc = img.src.replace(/\.com\/[\d]{1,3}x\//i, ".com/originals/");
        console.log('Getting bigimg url from src:', bigImgSrc);

        try {
            name = img.parentElement.parentElement
                .parentElement.parentElement.parentElement
                .parentElement.nextElementSibling.firstElementChild
                .firstElementChild.firstElementChild
                .firstElementChild.firstElementChild
                .innerText;
            console.log('name:', name);
        } catch (e) {
        }
        var bestSrc = extractFromSrcset(img);

        download(bestSrc.length > 1 ? bestSrc : bigImgSrc, `${directoryName}/${name}`);

        console.log('bestsrc:', bestSrc);
    });


function extractFromSrcset(img) {
    var bestSrc = "_";
    try {
        var srcset = img.getAttribute('srcset').split(/\s*?\dx,*\s*/);
        var topSrc = srcset.pop();
        bestSrc = topSrc.length > 0 ? topSrc : srcset.pop();
    } catch (e) {
    }
    return bestSrc;
}


/*OpenGameArt.org download files*/
var fileAnchors = document.querySelectorAll('.file a');
const directory = `${location.hostname}_${location.href.split('/').pop()}`;
if (confirm(`Download ${fileAnchors.length} files to?\nDirectory: ${directory}`))
    for (const el of fileAnchors) {
        var url = el.href;
        download(url, `${directory}/${el.getAttribute("download")}`);
        console.log('url:', url);
    }


/*spriters-resource download all*/
(function () {
    var dlAll = confirm("Would you like to download everything on this page?");
    for (const elt of document.querySelectorAll('.iconbody')) {
        try {
            var img = elt.firstElementChild;
            var dlUrl = `https://www.spriters-resource.com/download/${img.src.match(/(?<=\/)(\d+?)(?=\.)/)[0]}/`;
            var dlLink = document.createElement('a');

            dlLink.href = dlUrl;
            dlLink.id = "dlLink";
            dlLink.target = "_blank";
            dlLink.innerHTML = "Download";
            if (!elt.parentElement.querySelectorAll('#dlLink'))
                elt.parentElement.appendChild(dlLink);
            console.log('dl url:', dlUrl);

            if (dlAll)
                window.open(dlUrl, "_blank");
        } catch (error) {
            console.error(error);
        }
    }
})();

/** Clear all styles */
(function () {
    for (const style of document.querySelectorAll('style')) {
        style.disabled = true;
    }
})();


/**Open all torrents*/
(function () {
    openAllTorrentLinks();
    for (const mURI of getMagnetURIs()) {
        window.open(mURI, "_blank");
    }
})();
function openAllTorrentLinks() {
    for (const link of document.links) {
        const isTorrentLink = link.href.search("/torrent/") != -1 ||
            link.href.search("http://itorrents.org/torrent/") != -1 ||
            link.href.search("https://rarbg.to/download.php?") != -1;
        if (isTorrentLink) {
            window.open(link.href, "_blank");
        }
    }
}
function getMagnetURIs() {
    const mURIs = [];
    for (const link of document.links) if (/magnet[:_\-+%?=&;.0-9a-zA-Z]*/mi.test(link.href)) mURIs.push(link.href);
    return mURIs;
}



/**
*   gfycat, page-url to content-url
*   @deprecated won't work cuz the url is case-sensitive, and the page url never has the same caps as the content url
*/
// https://gfycat.com/gifs/detail/FearfulPlaintiveGrison
// https://thumbs.gfycat.com/FearfulPlaintiveGrison-size_restricted.gif
function gfycatPage2GifUrl(gfycatPageUrl) {
    return "https://thumbs.gfycat.com/" + gfycatPageUrl.split('/').pop() + "-size_restricted.gif";
}