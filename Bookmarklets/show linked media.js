

JavaScript:
const imgs = [];
const vids = [];
Array.from(document.querySelectorAll('a[href]')).forEach(a => {
	if( a.classList.contains('show-linked-media') || a.parentNode.querySelector(`[src~="${a.href}"]`) )
		return;
	if(/\.(jpg|png|gif|tiff)($|\?)/i.test(a.href)) {
		let img = document.createElement('img');
		img.src = a.href;
		img.href = a.href;
		a.after(img);
		imgs.push(a);
	} else if(/\.(mp4|mpeg4|mov|wmv)($|\?)/i.test(a.href)) {
		let vid = document.createElement('video');
		vid.src = a.href;
		vid.loop = true;
		a.after(vid);
		vids.push(a);
	}
	a.classList.add('show-linked-media');
});
console.log('Showed linked media: imgs [' +imgs.length+ ']', imgs, '\nvids: ['+vids.length+']', vids);

