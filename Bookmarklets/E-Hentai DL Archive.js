
const pageUrls = Array.from(document.querySelectorAll('#gdt a[href]')).map(link => link.href);
console.log(pageUrls);
// pageUrl = "https://e-hentai.org/s/ec033a0994/1194244-77";

if (confirm('Download ' + pageUrls.length + ' images from the archive?'))
    pageUrls.forEach(pageUrl => dlImageFromPage(pageUrl));


function dlImageFromPage(pageUrl) {
    fetchElement(pageUrl, function (doc, url, opts) {
        const image = doc.querySelector('#img');
        let name;
        try {
            name = doc.querySelector('#i1 > h1').innerText;
        } catch (e) {
        }
        console.log(name + ' :', image.src);
        download(image.src, name ? name : image.src, undefined, image);
    });
}
