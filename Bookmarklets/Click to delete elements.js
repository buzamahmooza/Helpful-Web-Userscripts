
/*
TODO:	Add a key listener for ESC to end the delete session
TODO:	Add hover listener to highlight the elements that will be deleted
*/
function deleteElementMouseIsOver(){
	window.addEventListener('click', removeOnClick);
}

function removeOnClick(event) {
    const el = elementUnderMouse(event);
	console.log('removing:', el);
    el.remove();
	window.removeEventListener('click', removeOnClick);
}

function elementUnderMouse(wheelEvent) {
    return document.elementFromPoint(wheelEvent.clientX, wheelEvent.clientY);
}

