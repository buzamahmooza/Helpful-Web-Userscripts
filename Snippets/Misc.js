
/**
* watches for any attempt to access the property
*/
function snoopProperty(obj, props=[], onset=(val)=>null, onget=()=>null) {
    if (props.length===0) { // default to all properties
        props = Object.keys(obj);
    }

    for (const prop of props) {
        obj['__'+prop] = obj[prop]; // actual value

        obj.__defineSetter__(prop, function(val) {
            console.log('someone just set the property:', prop, 'to value:', val, '\non:', obj);

            obj['__'+prop] = val;
        });
        obj.__defineGetter__(prop, function() {
            console.log('someone just accessed', prop, '\non:', obj);
            return obj['__'+prop];
        });
    }

    return obj;
}

// == 

// in reddit you can search content from specific domains!!!! Example: https://www.reddit.com/domain/deviantart.com/
/**
@param url {string}: the domain or the url to search for in reddit
*/
function getRedditDomainUrl(url) {
    return "https://www.reddit.com/domain/" + url.trim();
}



/**
 * starting from the beginning, find the array segment that is equal
 * @param lists
 * @param equals
 * @return {Array}
 */
function findLongestCommonSegment(lists, equals) {
    if (typeof equals !== "function") equals = (a, b) => a == b;

    const minLength = lists.map(list => list.length).reduce((l1, l2) => Math.min(l1, l2));
    const result = [];

    for (var i = 0; i < minLength; i++) { // iterate elements
        var compareVal = lists[0][i];
        for (var j = 0; j < lists.length; j++) { // check this element for each list
            if (!equals(lists[j][i], compareVal)) {
                return result;
            }
        }
        result.push(compareVal);
    }
    return result;
}




function printAllUrls() {
    return Array.from(new Set(Array.from(document.links).map(a=>a.href).concat(Array.from(document.images)).map(img=>img.src).filter(x=>!!x)));
}


// print them all in the console:
JavaScript:(function printAllUrls() {
    var urls = Array.from(new Set(Array.from(document.links).map(a=>a.href).concat(Array.from(document.images)).map(img=>img.src).filter(x=>!!x)));
    console.log(urls.join('\n'));
    return urls;
})()void(0);
