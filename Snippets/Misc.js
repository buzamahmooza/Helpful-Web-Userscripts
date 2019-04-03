
var sourceRegex = /^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
function parseJSFunc(jsfunc) {
	// Match the body and the return value of a javascript function source
	var parsed = jsfunc.toString().match(sourceRegex).slice(1);
	return {arguments : parsed[0], body : parsed[1], returnValue: parsed[2]}
}

// ==

function htmlToElements(html) {
    return new DOMParser().parseFromString(html, 'text/html').body.childNodes
}

// https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}
function htmlToElements(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content.childNodes;
}


// == 

// in reddit you can search content from specific domains!!!! Example: https://www.reddit.com/domain/deviantart.com/
/**
@param url {string}: the domain or the url to search for in reddit
*/
function getRedditDomainUrl(url) {
    return "https://www.reddit.com/domain/" + url.trim();
}

