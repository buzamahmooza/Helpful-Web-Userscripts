


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


