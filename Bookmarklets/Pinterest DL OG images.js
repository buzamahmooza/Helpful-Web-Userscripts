

/*Download all original images on pinterest page*/

var pinwrappers = document.querySelectorAll('div.pinWrapper div a div div div div img');
var directoryName = document.title.trim();
var dlLimit = -1;

if(confirm('Download all original images on Pinterest page?\n('+pinwrappers.length+' found).'))
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
