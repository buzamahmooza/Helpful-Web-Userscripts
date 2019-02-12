JavaScript:(function() {
	console.log('Add background style to code');
	codeStyle = document.createElement('style');
	codeStyle.innerHTML = `code, pre {
	background: darkgrey;
	border-radius: 4px;
	padding: 2px;
}`;
	document.head.appendChild(codeStyle);
})();