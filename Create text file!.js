

//	http://jsfiddle.net/UselessCode/qm5AG/
function makeTextFile(text) {
	var textFile = null;
	var data = new Blob([text], {type: 'text/plain'});

	// If we are replacing a previously generated file we need to
	// manually revoke the object URL to avoid memory leaks.
	if (textFile !== null) { window.URL.revokeObjectURL(textFile); }
	textFile = window.URL.createObjectURL(data);

	return textFile;
};


var link = document.createElement('a');
link.href = makeTextFile(textbox.value);
link.style.display = 'block';


//	 post to http://pastebin.com
function postToPasteBin(data){
	GM_xmlhttpRequest({
	  method: "POST",
	  url: "http://pastebin.com/post.php",
	  data: data,
	  headers: {
		"Content-Type": "application/x-www-form-urlencoded"
	  },
	  onload: function(response) {
		alert("posted");
	  }
	});
}








