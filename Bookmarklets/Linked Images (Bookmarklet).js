(function () {
    function I(u) {
        var t = u.split('.'), e = t[t.length - 1].toLowerCase();
        return {gif: 1, jpg: 1, jpeg: 1, png: 1, mng: 1}[e]
    }

    function hE(s) {
        return s.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }


    var q, h, i, z = open().document;
    z.write(`<a>Images linked to by ${hE(location.href)}:</a><hr>`);
    for (i = 0; q = document.links[i]; ++i) {
        h = q.href;
        if (h && I(h))
            z.write(`<p>${q.innerHTML} (${hE(h)})<br><img src="${hE(h)}">`);
    }
    z.close();
})();

function collectMedia() {
    var imgsA = Array.from(document.querySelectorAll('img, video'));
    imgsA.forEach(function (img) {
        const anchor = img.parentNode;
        if (anchor && anchor.href)
            if (!img.href)
                img.href = anchor.href;
        var newImg = document.createElement('div');
        document.body.insertBefore(newImg, document.body.firstChild);
    });
}

function createLighBoxGallery() {
    console.log('Creating LighBox mainImage Gallery');
    var q, h, i, z = open().document;
    z.write(`<a>Images linked to by <a href="${location.href}">${document.body.title} :</a><hr>`);

    for (i = 0; q = document.links[i]; ++i) {
        h = q.href;
        if (h && I(h))
            z.write(`<p>${q.innerHTML} (${hE(h)})<br><img src="${hE(h)}">`);
    }
    z.close();

}


// A better way to pass function arguments:
function Person(options) {
    var defaults = {
            firstName: "John",
            lastName: "Smith",
            age: 12,
            gendre: "male",
            eyeColor: "brown"
        },
        o = $.extend(defaults, options)
}