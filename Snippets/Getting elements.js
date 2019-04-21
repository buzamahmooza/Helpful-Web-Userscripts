
//## mutaionObserver example

    // Select the node that will be observed for mutations
    var targetNode = document.getElementById('some-id');

    // Options for the observer (which mutations to observe)
    var config = { attributes: true, childList: true, subtree: true };

    // Callback function to execute when mutations are observed
    var callback = function(mutationsList, observer) {
        for(var mutation of mutationsList) {
            if (mutation.type == 'childList') {
                console.log('A child node has been added or removed.');
            }
            else if (mutation.type == 'attributes') {
                console.log('The ' + mutation.attributeName + ' attribute was modified.');
            }
        }
    };

    // Create an observer instance linked to the callback function
    var observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);

    // Later, you can stop observing
    observer.disconnect();

// ##
function getElementContainingString(xpath, string='') {
    string = string.replace(/\n/g, '');
    
    function getElementsByXPath(xpath, parent) {
        let results = [];
        let query = document.evaluate(xpath,
            parent || document,
            null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        for (let i = 0, length = query.snapshotLength; i < length; ++i) {
            results.push(query.snapshotItem(i));
        }
        return results;
    }

    return getElementsByXPath(`${xpath}[contains(., "${string}")]`)
}

