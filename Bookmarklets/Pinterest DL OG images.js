/*Download all original images on pinterest page*/
(function() {
    if (!/www\.pinterest\./.test(location.hostname)) {
        alert('The site you are on is not Pinterest.com, this script will not work on other websites.');
        void(0);
    }

    if (typeof download !== 'function') {
        alert("The download function was not found on this page, please run the 'downoader' script using tampermonkey.");
        void(0);
    }

    var pinwrappers = document.querySelectorAll('div.pinWrapper');
    var directoryName = document.title.trim();
    var dlLimit = -1;

    if (!confirm('Download all original images on Pinterest page?\n(' + pinwrappers.length + ' found).'))
        return;

    var array = [];

    var index = 0;
    for (const wrapper of pinwrappers) {
        if (dlLimit > index) {
            console.log('Downloads limited to:', dlLimit);
            return;
        }
        var img = wrapper.querySelector('div a div div div div img');
        var name = "Pinterest pic " + (++index) + "_" + img.altText;
        var bestSrc = "";
        var bigimgSrc = img.src.replace(/\.com\/[\d]{1,3}x\//i, ".com/originals/");
        console.log('Getting bigimg url from src:', bigimgSrc);

        try {
            name = img.parentNode.parentNode
                .parentNode.parentNode.parentNode
                .parentNode.nextSibling.firstElementChild
                .firstElementChild.firstElementChild
                .firstElementChild.firstElementChild
                .innerText;
            console.log('name:', name);
        } catch (e) {}
        bestSrc = extractFromSrcset(img);

        array.push({
        	src: bestSrc.length > 1 ? bestSrc : bigImgSrc,
        	name: directoryName + "/" + name
        });

        console.log('bestsrc:', bestSrc);
    }
    if(typeof(zipImages)!=="undefined")
    	zipImages(array);
    else
    	for(const imgo of array) download(imgo.src, imgo.name);


    function extractFromSrcset(img) {
        var bestSrc = "_";
        try {
            var srcset = img.getAttribute('srcset').split(/\s*?\dx\,*\s*/);
            var topSrc = srcset.pop();
            bestSrc = topSrc.length > 0 ? topSrc : srcset.pop();
        } catch (e) {}
        return bestSrc;
    }
})();