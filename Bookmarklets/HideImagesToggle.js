
JavaScript:(function hideImagesToggle() {
    const w = 0.7; /*weight between [0,1], 1 will put all the weight on the client dimensions*/
    const isBigImg = img => ((1-w)*Math.min(img.naturalHeight, img.naturalWidth) + w*Math.min(img.clientWidth, img.clientHeight) >= 35);
    const imgs = Array.from(document.images).filter(isBigImg);
    const bgimgs = getElementsWithCssProperty('background-image').filter(isBigImg);
    const combined = imgs.concat(bgimgs);
    
    console.log(
        'images:', imgs,
        '\nbackground-images:', bgimgs
    );
    
    if(!combined.length){
        console.log("No images large enough");
        return;
    }
    
    const newVisibility = combined[0].style.visibility==='hidden'? 'visible' : 'hidden';
    for(const img of combined) {
        img.style.visibility = newVisibility;
    }
    console.log('set visibility of images to:', newVisibility);
    return combined;

    function getElementsWithCssProperty(styleProp, initialList=document.getElementsByTagName('*')) {
        return Array.from(initialList).filter(el => getStyle(el, styleProp) !== 'none');
    }

    function getStyle(el, styleProp) {
        return el.currentStyle && el.currentStyle[styleProp] ||
            window.getComputedStyle && document.defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
    }
})();
void(0);
