// https://stackoverflow.com/a/4952411/7771202

// The code in the filter is based on the getStyle code from: http://www.quirksmode.org/dom/getstyles.html
// Posting a for statement version to avoid the function calls in .filter().

function getElementsWithCssProperty(styleProp, initialList=document.getElementsByTagName('*')) {
	return Array.from(initialList).filter(el => getStyle(el, styleProp) !== 'none');
}

function getStyle(el, styleProp) {
	return el.currentStyle && el.currentStyle[styleProp] ||
		window.getComputedStyle && document.defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
}
