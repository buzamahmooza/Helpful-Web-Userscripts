
JavaScript:(function toggleHideImages() {
	const imgs = document.images;
	const newVisibility = imgs[0].style.visibility==='hidden'? 'visible' : 'hidden';
	for(const img of imgs)
		img.style.visibility = newVisibility;
	for(const bgimg of getElementsWithCssProperty('background-image'))
		bgimg.style.visibility = newVisibility;

	function getElementsWithCssProperty(styleProp, initialList=document.getElementsByTagName('*')) {
		return Array.from(initialList).filter(el => getStyle(el, styleProp) !== 'none');
	}

	function getStyle(el, styleProp) {
		return el.currentStyle && el.currentStyle[styleProp] ||
			window.getComputedStyle && document.defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
	}
})()
