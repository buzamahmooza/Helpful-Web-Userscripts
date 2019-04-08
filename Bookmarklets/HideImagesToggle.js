
JavaScript:(function hideImagesToggle() {
    const weight = 0.7; /*weight between [0,1], 1 will put all the weight on the client dimensions*/
    const isBigImg = (w, h) => ((1-weight)*Math.min(w, h) + weight*Math.min(w, h) >= 35);
    const imgs = Array.from(document.images).filter(img=>isBigImg(img.naturalWidth, img.naturalHeight));
    const bgimgs = getElementsWithCssProperty('background-image').filter(bgimg=>{
        var image = new Image();
        image.src = bgimg.style /*create an image using the src*/
              .backgroundImage
               .replace(/url\((['"])?(.*?)\1\)/gi, '$2')
                .split(',')[0];
        console.log(image.width, 'x', image.height);
        return isBigImg(image.width, image.height);
    });

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
