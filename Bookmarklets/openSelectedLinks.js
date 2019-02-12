(function() {
    function nextNode(node) {
        if (node.hasChildNodes()) {
            return node.firstChild;
        } else {
            while (node && !node.nextSibling) {
                node = node.parentNode;
            }
            if (!node) {
                return null;
            }
            return node.nextSibling;
        }
    }
    function getRangeSelectedNodes(range) {
        var node = range.startContainer;
        var endNode = range.endContainer;
        /*Special case for a range that is contained within a single node*/
        if (node == endNode) {
            return [node];
        }
        /*Iterate nodes until we hit the end container*/
        var rangeNodes = [];
        while (node && node != endNode) {
            rangeNodes.push(node = nextNode(node));
        }
        /*Add partially selected nodes at the start of the range*/
        node = range.startContainer;
        while (node && node != range.commonAncestorContainer) {
            rangeNodes.unshift(node);
            node = node.parentNode;
        }

        return rangeNodes;
    }
    function getSelectedNodes() {
        if (window.getSelection) {
            var sel = window.getSelection();
            if (!sel.isCollapsed) {
                return getRangeSelectedNodes(sel.getRangeAt(0));
            }
        }
        return [];
    }

    var links = getSelectedNodes().filter(el => !!el.href);
    console.log('links:', links, links.map(a=>a.href).join('\n'));
    if (links.length === 0) alert('No links selected');
    else if (confirm("Open " + links.length + " selected links?")) {
        for (const link of links)
            window.open(link.href, '_blank');
    }
})()