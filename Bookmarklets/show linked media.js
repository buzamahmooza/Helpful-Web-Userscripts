

JavaScript:
links = document.querySelectorAll('a[href]');
Array.from(links).forEach(a => {
	if(a.classList.contains('show-linked-media') ||
		a.parentNode.querySelector(`[src~="${a.href}"]`)
	) 
		return;
	if(/\.(jpg|png|gif|tiff)($|\?)/i.test(a.href)) {
		let img = document.createElement('img');
		img.src = a.href;
		img.href = a.href;
		a.after(img);
	} else if(/\.(mp4|mpeg4|mov|wmv)($|\?)/i.test(a.href)) {
		let vid = document.createElement('video');
		vid.src = a.href;
		vid.loop = true;
		a.after(vid);
	}
	a.classList.add('show-linked-media');
});

