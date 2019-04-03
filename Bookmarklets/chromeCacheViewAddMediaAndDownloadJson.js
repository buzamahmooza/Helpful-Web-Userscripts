
JavaScript:(function chromeCacheViewAddMediaAndDownloadJson() {
	try{
		if(confirm("Adding the links and images, would you also like to download as JSON?")) {
			anchorClick(makeTextFile(JSON.stringify(getDataAsObject(), null, 4)), 'chromecacheview-'+Date.now()+'.json');
		}
	}catch(e){console.error(e);}

	if(document.querySelector('.media')) return;

	for(const tr of document.querySelectorAll('body > p > table > tbody > tr')){
	    try {
			const children = tr.childNodes;
			if(!children) continue;

		    const nameCell = children[0];
		    const urlCell = children[1];
		    const typeCell = children[2];
		    const url = urlCell.innerText;

			const media = document.createElement(/^image/.test(typeCell.innerText)?'img':'video');
			media.src = url;
			
			media.classList.add('media');

			const anchor = document.createElement('a');
			anchor.href = url;
			anchor.appendChild(media);
			anchor.target = "_blank";
			
			urlCell.innerText = "";
			urlCell.appendChild(anchor);

			nameCell.innerHTML = '<a href="'+url+'">' + nameCell.innerHTML + '</a>';
		} catch(e) { console.error(e); }
	}

	addCss(`media { max-height: 400px; max-width: 400px; }`);

	function addCss(cssStr, id) {
	    const style = document.createElement('style');
	    if (style.styleSheet) {
	        style.styleSheet.cssText = cssStr;
	    } else {
	        style.appendChild(document.createTextNode(cssStr));
	    }
	    if (!!id) style.id = id;
	    style.classList.add('addCss');
	    return document.getElementsByTagName('head')[0].appendChild(style);
	}

	function anchorClick(href, downloadValue, target) {
	    var a = document.createElement('a');
	    a.setAttribute('href', href);
	    a.setAttribute('download', downloadValue);
	    a.target = target;
	    document.body.appendChild(a);
	    a.click();
	    a.remove();
	}
	function makeTextFile(text) {
	    var data = new Blob([text], {type: 'text/plain'});
	    var textFile = null;
	    if (textFile !== null) window.URL.revokeObjectURL(textFile);
	    textFile = window.URL.createObjectURL(data);
	    return textFile;
	}

	function getDataAsObject() {
		const rowTexts = Array.from(document.querySelectorAll('body > p > table > tbody > tr')).map(row=>Array.from(row.childNodes).map(child=>child.innerText));
		const headers = rowTexts[0].slice(1);
		console.log(headers);

		const list = [];
		for(const childrenText of rowTexts.slice(1)){
			const o = {};
		    for(var i=0;i<headers.length;i++) o[headers[i]] = childrenText[i];
			list.push(o);
		}
		return list;
	}
})()
