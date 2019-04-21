

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


/* getters:

- title
- images (images, )
- screenshots
- video
*/

/**
@param {HTMLElement} given an element
@returns {{key, title, url}}
*/
function getElSummary(el, key) {
    return {
        key: key || el.id
        title: el.title||el.alt||el.innerText
        url: el.src||el.href||el.srcset||el.getAttribute('data-src')
    }
}

// given a key, gives back the selector
// a trailing 's' will make it plural (returns iterable)
map = {
    'mainImg': {
        selector: 'img#PIMainImg',
        attr: [
            'src', //img
            'alt' // title
            ],
        },
    // 'title': {
    //     selector: '#wph > tbody > tr:nth-child(1) > td:nth-child(2) > h1',
    //     attr: ['innerText'],
    // },
    'studio': {
        selector: '#studiolink',
        attr: ['innerText'],
    },
    'screenshots': {
        selector: '#ScreenShotsHidden > div > img',
        attr: ['src'],
    },
    'director': {
        selector: '#ScreenShotsHidden > div > img',
        attr: ['src'],
    },
    'category': {
        selector: '#PITable > tbody > tr:nth-child(1) > td:nth-child(2) > a',
        attr: ['innerText'],
    },
    'trailer': {
        selector: '#JSVidWrapper [src]',
        attr: ['src'],
    },
    'stars': {
        selector: '#PITable > tbody > tr:nth-child(3) > td:nth-child(2) > div > a > img',
        attr: ['src', 'alt']
    }
};


var table = document.querySelector('#PDTable > tbody');

function tableToDict(table) {
    return Array.from(table.querySelectorAll('tr')).map(tr => {
        var c = tr.childNodes;
        if(c.length>1){
            var o={};
            o[c[0].innerText] = c[1].href || c[1].innerText;
            return o;
        }
    });
}

function getStuff(map) {
    o = {};
    for(const k in map) {
        if(!map.hasOwnProperty(k)) {
            console.log('map doesn\'t have property', map, k);
            continue;
        }
        o[k] = {};
        o[k].els = document.querySelectorAll(map[k].selector);
        for(const attr of map[k].attr) { // for each attr
            for(const el of o[k].els){
                o[k][attr] = el[attr] || el.getAttribute(attr);
            }
        }
    }
    return o;
}

class CdUniverseParser() {
    constructor (document=window.document) {
        this.document=document
    }
    get screenshotUrls() {

    }
}




