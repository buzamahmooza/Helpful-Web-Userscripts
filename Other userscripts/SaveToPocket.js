
// https://getpocket.com/developer/docs/authentication

/*
Consumer keys:

In Development
NAME    PLATFORM    CONSUMER KEY
Saver userscript    iPhone             85051-2260f7d5fff1ae25caa8a95d
Saver userscript    iPad               85051-e68ed0109ab57796e37fb85d
Saver userscript    Mac                85051-2592aa77a10eed88dd3108a5
Saver userscript    Android - Mobile   85051-e4ec382a01e81b0b561a4380
Saver userscript    Android - Tablet   85051-ba682fdcee37eafa0c107073
Saver userscript    Extension          85051-f037ea3ae03d69e255e2e7ae
Saver userscript    Windows - Mobile   85051-348ef6049cc1b0bd9d65f327
Saver userscript    Windows - Desktop  85051-fbfcf2c3a1f1a0a723cf3eb9
Saver userscript    Web                85051-a14ec6ef1da336b1eeb1f334
Saver userscript    Mobile (other)     85051-762dd0e8d703e7b5f87366a1
Saver userscript    Desktop (other)    85051-fdcc5103740f4726cd6c14bc
*/

/* 
Parameters
consumer_key	string		The consumer key for your application (see Step 1).
redirect_uri	string		The URL to be called when the authorization process has been completed. This URL should direct back to your application. See the Platform Specific Notes section for details about setting up custom urls for the redirect_uri on iOS and Android.
state	string	optional	A string of metadata used by your app. This string will be returned in all subsequent authentication responses.
 */

consumer_key = '85051-a14ec6ef1da336b1eeb1f334'

https://getpocket.com/v3/oauth/request


// POST / v3 / oauth / request HTTP / 1.1
// Host: getpocket.com
// Content - Type: application / x - www - form - urlencoded; charset = UTF - 8
// X - Accept: application / x - www - form - urlencoded

eee = {
    "consumer_key": consumer_key,
    "redirect_uri": "pocketapp1234:authorizationFinished"
}

pocketUrl = 'bekfastation.com';

fetch("https://getpocket.com/a/x/itemAction.php", {
    "credentials": "include",
    "headers": {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-US,en;q=0.9,ar;q=0.8",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "x-requested-with": "XMLHttpRequest"
    },
    "referrer": "https://getpocket.com/a/queue/list/",
    "referrerPolicy": "no-referrer-when-downgrade",
    "body": "action=add&url=" + encodeURIComponent(pocketUrl) + "&formCheck=8c4cb5075b8b27b259c2ff876100fa22",
    "method": "POST",
    "mode": "cors"
});



function getPocketSaveUrl(saveUrl, saveTitle = '', tags = []) {
    return 'https://getpocket.com/save?url=' + encodeURIComponent(saveUrl) + '&title=' + encodeURIComponent(saveTitle) + '&tags=' + encodeURIComponent(tags.join(','));
}
function saveToPocket(saveUrl, saveTitle = '', tags = []) {
    var pocketUrl = getPocketSaveUrl(saveUrl, saveTitle, tags) + '&autoclose=true';

}



function getPocketSaveUrl(saveUrl, saveTitle = '', tags = []) {
    return 'https://getpocket.com/save?url=' + encodeURIComponent(saveUrl) + '&title=' + encodeURIComponent(saveTitle) + '&tags=' + encodeURIComponent(tags.join(','));
}
function saveToPocket(saveUrl, saveTitle = '', tags = []) {
    var pocketUrl = getPocketSaveUrl(saveUrl, saveTitle, tags) + '&autoclose=true';
	console.log('pocketUrl', pocketUrl);
//     iframe = document.createElement('iframe');
// 	document.body.appendChild(iframe);
// 	iframe.onload = function(){
// 		console.log('iframe loaded');
// 	}
// 	iframe.src = pocketUrl;

	window.open(pocketUrl, '_blank')
}


saveToPocket('https://www.google.com/search?hl=en&tbm=isch&sa=1&ei=_HejXLC6NMiugwea7JLIDw&q=gfycat.com+xxx', 'oh ya', 'anal, ubl'.split(', '))

