
/*spriters-resource download all*/
var dlAll = confirm("Would you like to download everything on this page?");
document.querySelectorAll('.iconbody').forEach(function(elt, index, array){
	try{
        var img = elt.firstElementChild;
        var dlUrl = "https://www.spriters-resource.com/download/" + img.src.match(/(?<=\/)(\d+?)(?=\.)/)[0]+"/";
		var dlLink = document.createElement('a');

		dlLink.href = dlUrl;
		dlLink.id = "dlLink";
		dlLink.target = "_blank";
		dlLink.innerHTML = "Download";
		if(!elt.parentNode.querySelectorAll('#dlLink'))
			elt.parentNode.appendChild(dlLink);
        console.log('dl url:', dlUrl);
		
		if(dlAll)
			window.open(dlUrl, "_blank");
    }catch(j){}
});
