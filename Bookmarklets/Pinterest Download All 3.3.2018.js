if(typeof download !== 'function') {
	alert("The download function was not found on this page, please run the 'downoader' script using tampermonkey."); void(0);
}
if(/www\.pinterest\./.test(location.href)){
    var imgBoxes = document.querySelectorAll('._qk._2h._ql');
    console.log('ImgBoxes:', imgBoxes);
    if(confirm('Download '+imgBoxes.length+' images?'))
        imgBoxes.forEach(function(imgBox, index, array){
            try{
                let img = imgBox.querySelector('img[srcset]');
                let srcset = img.getAttribute('srcset');
                let src = srcset.match(new RegExp(`(/{1,2}|http(s?:))[\d\w?%-_/\=.]*?.(jpg|png|jpeg|gif|tiff)(&f=1)?`, "gim")).pop();
                let name = imgBox.querySelector('._nv._ms._mt._mu._nx._5k._mv._n5._n3._my span span').innerHTML;
                console.log('src:', src, 'name:', name);
				
				if(typeof download === 'function')
					download(src, name);
				else
					window.open(src, "_blank");
            }catch(exc){console.warn(exc);}
        });
} else 
	alert('The site you are on is not Pinterest.com, this script will not work on other websites.');

/*Not needed, but could be handy*/
function extractFromSrcset(img){
	var bestSrc = "_";
	try{
		var srcset = img.getAttribute('srcset').split(/\s*?\dx\,*\s*/);
		var topSrc = srcset.pop();
		bestSrc = topSrc.length>0?topSrc:srcset.pop();
	}catch(e){}
	return bestSrc;
}
