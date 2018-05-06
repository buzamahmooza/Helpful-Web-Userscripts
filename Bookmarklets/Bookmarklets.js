

// download all original images on pinterest page:

var pinwrappers = document.querySelectorAll('div.pinWrapper div a div div div div img');
var directoryName = document.title.trim();
var dlLimit = -1;

if(confirm('Download all original iamges on Pinterest page?\n('+pinwrappers.length+' found).'))
	pinwrappers.forEach(function(img, index, array) {
		if(dlLimit > index) {
			console.log('Downloads limited to:', dlLimit);
			return;
		}
		var name = "Pinterest pic "+index +"_"+ img.altText;
		var bestSrc = "";
		var bigimgSrc = img.src.replace(/\.com\/[\d]{1,3}x\//i,".com/originals/");
		console.log('Getting bigimg url from src:', bigimgSrc);
		
		try{
			name = img.parentNode.parentNode
				.parentNode.parentNode.parentNode
				.parentNode.nextSibling.firstElementChild
				.firstElementChild.firstElementChild
				.firstElementChild.firstElementChild
				.innerText;
			console.log('name:', name);
		}catch(e){}
		bestSrc = extractFromSrcset(img);

		download(bestSrc.length>1?bestSrc:bigImgSrc, directoryName+"/"+name);
		
		console.log('bestsrc:', bestSrc);
	});


function extractFromSrcset(img){
	var bestSrc = "_";
	try{
		var srcset = img.getAttribute('srcset').split(/\s*?\dx\,*\s*/);
		var topSrc = srcset.pop();
		bestSrc = topSrc.length>0?topSrc:srcset.pop();
	}catch(e){}
	return bestSrc;
}





/*OpenGameArt.org download files*/
var fileAnchors = document.querySelectorAll('.file a');
const directory = location.hostname +"_"+ location.href.split('/').pop();
if(confirm("Download "+fileAnchors.length+" files to?\nDirectory: "+directory))
    fileAnchors.forEach(function(elt, i, array){
        var url = elt.href;
		download(url, directory + "/" + elt.download);
        console.log('url:', url);
    });
console.log('files:', files);




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




/* Clear all styles */
(function(){
    for(const style of document.querySelectorAll('style')){
        style.innerHTML = "";
    }
})();

