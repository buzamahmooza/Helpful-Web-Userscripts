

javascript: 
var x = document.querySelectorAll('a[onclick]');

if(!x){ 
	alert("No files found.");  
} else if(confirm('Open all files on Blackboard page?\n'+x.length+" files found.")) {
	x.forEach(function(e){
		var link = e.getAttribute('onclick');
		try{
			link = link.toString().match(/this\.href\=\'(.+)\'/)[1];
			console.log(link);
			window.open(link, "_blank");
			/*action(link);*/
		} catch(exception) {} 
	});
}

var action = (link) => { window.open(link.href, "_blank"); };
/*if(typeof download === 'function') {
	action = download
} else {
	console.log("download() is not defined, so I'll just open the files instead.");
		action = (link) => { window.open(link.href, "_blank");};

	
}
*/


/*

javascript: 
var x = document.querySelectorAll('a[onclick]');

if(!x){ 
	alert("No files found.");  
} else if(confirm('Open all files on Blackboard page?\n'+x.length+" files found.")) {
	x.forEach(function(e){
		var url = e.getAttribute('onclick');
		try{
			url = url.toString().match(/this\.href\=\'(.*)\'/)[1];
			console.log(url);
			fetchElement(url, function(doc, url, opts){
				const files = Array.from(doc.querySelectorAll('#containerdiv a[href]'));
				console.log('Files fetched:', files);
				files.forEach(function(file){
					console.log('file html:', file.outerHTML);
 					window.open(file.href, '_blank');
				});
			});
			//window.open(url, "_blank");
		} catch(exception) {} 
	});
}
*/


/*
On the file page,
the link is:			https://blackboard.kfupm.edu.sa/webapps/blackboard/execute/content/file?cmd=view&content_id=_770339_1&course_id=_44488_1&launch_in_new=true
location redirected:	https://blackboard.kfupm.edu.sa/bbcswebdav/pid-770339-dt-content-rid-5615475_1/courses/172-EE-203-merged-mkulaib/320Lecture25%20MOSFET.pdf
*/