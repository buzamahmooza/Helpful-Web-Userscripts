
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
