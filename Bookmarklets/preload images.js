JavaScript:
    (function () {
        preloader(document.links);
        preloader(document.images);
    })();

function preloader(imgEls) {
    console.log('imgs passed:', imgEls);
    for (const imgEl of imgEls) {
        let imgObj = new Image();
        if (imgEl.hasAttribute('loaded')) {
            return;
        }

        createAndAddAttribute(imgEl, 'loaded', false);

        imgObj.onerror = function () {
            imgEl.setAttribute('loaded', 'error');
        };

        imgObj.onload = function () {
            imgEl.setAttribute('loaded', true);
            console.log('ImageLoaded:', this.src, this);
        };
        imgObj.src = imgEl.src | imgEl.href;
    }
}

function createAndAddAttribute(node, attributeName, attributeValue) {
    if (!node) {
        console.error('Node is null, cannot add attribute.');
        return;
    }
    let att = document.createAttribute(attributeName);
    att.value = attributeValue;
    node.setAttributeNode(att);
}
