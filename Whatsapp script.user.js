






console.log('HELLO!');

// make a hot-key to reply to the last message
var contextMenu = document.querySelector('._2uLFU');
var getMessages = function(){
	return document.querySelectorAll('div.msg');
};


window.addEventListener("keyup", onkeydown, true);

// hot-keys
var KeyEvent;
if (typeof KeyEvent === "undefined") { KeyEvent = {
        DOM_VK_SPACE: 32,
		
        DOM_VK_LEFT: 37,
        DOM_VK_UP: 38,
        DOM_VK_RIGHT: 39,
        DOM_VK_DOWN: 40,
		
        DOM_VK_A: 65,
        DOM_VK_B: 66,
        DOM_VK_C: 67,
        DOM_VK_D: 68,
		
        DOM_VK_P: 80,
        DOM_VK_Q: 81,
        DOM_VK_R: 82,
        DOM_VK_S: 83,
        DOM_VK_T: 84,
        DOM_VK_U: 85,
        DOM_VK_V: 86,
        DOM_VK_W: 87,
        DOM_VK_X: 88,
        DOM_VK_Y: 89,
        DOM_VK_Z: 90,
        
		DOM_VK_COMMA: 188,
        DOM_VK_DOT: 190,
		
        DOM_VK_NUMPAD1: 97,
        DOM_VK_NUMPAD2: 98,
        DOM_VK_NUMPAD3: 99,
        DOM_VK_NUMPAD4: 100,
        DOM_VK_NUMPAD_LEFT: 100,
        DOM_VK_NUMPAD5: 101,
        DOM_VK_NUMPAD6: 102,
        DOM_VK_NUMPAD_RIGHT: 102,
        DOM_VK_NUMPAD7: 103,
        DOM_VK_NUMPAD8: 104,
        DOM_VK_NUMPAD9: 105,
        DOM_VK_NUMPAD_DIVIDE: 106,
        DOM_VK_NUMPAD_MULTIPLY: 111,
        DOM_VK_NUMPAD_ENTER: 113,
		
        DOM_VK_F5: 116
    };
}

function onkeydown(b) {
    const a = (window.event) ? b.keyCode : b.which;
    /** @type {{CTRL_ONLY: boolean, SHIFT_ONLY: boolean, ALT_ONLY: boolean, NONE: boolean}} */
    const ModifierKeys = {
        CTRL_ONLY: b.ctrlKey && !b.altKey && !b.shiftKey && !b.metaKey,
        SHIFT_ONLY: !b.ctrlKey && !b.altKey && b.shiftKey && !b.metaKey,
        ALT_ONLY: !b.ctrlKey && b.altKey && !b.shiftKey && !b.metaKey,
        NONE: !b.ctrlKey && !b.shiftKey && !b.altKey && !b.metaKey
    };

	console.log('key pressed:', a, String.fromCharCode(a));
    switch (a) {
        case KeyEvent.DOM_VK_R:
			if(ModifierKeys.ALT_ONLY)
				replyToLastMessage();
			break;
        case KeyEvent.DOM_VK_V:
        case KeyEvent.DOM_VK_COMMA:
        case KeyEvent.DOM_VK_DOT:
        case KeyEvent.DOM_VK_S:
            break;
    }
}


var contextMenu = document.querySelector('._2uLFU');


var getMessages = function(){
	return document.querySelectorAll('div.msg');
};

replyToLastMessage();
function replyToLastMessage(){
	var msgs = getMessages();
	console.log('msgs:', msgs);
	if(!msgs){
		console.error("No messages found."); return;
	}
	let lastMsg = msgs[msgs.length-1];
}

function replyToMessage(msg){
	console.log('Last message:', lastMsg);
	lastMsg.click();
}



simulateCssEvent = function(target, type){
    var generateEvent = function(selector){
        var style = "";
        for (var i in document.styleSheets) {
            var rules = document.styleSheets[i].cssRules;
            for (var r in rules) {
                if(rules[r].cssText && rules[r].selectorText){
                    if(rules[r].selectorText.indexOf(selector) > -1){
                        var regex = new RegExp(selector,"g")
                        var text = rules[r].cssText.replace(regex,"");
                        style += text+"\n";
                    }
                }
            }
        }
        document.querySelector("head").append("<style id="+id+">"+style+"</style>");
    };

    var stopEvent = function(){
        (target).remove();
    };

    switch(type) {
        case "hover":
            return generateEvent(":hover");
        case "stop":
            return stopEvent();
    }
}




// this part is in charge of replacing underscores with italicised text

/**
 * @param targetElement
 * @param callback
 * @param options   mutationObserver options{ childList: boolean, subtree: boolean, attributes: boolean, characterData: boolean }
 * @returns the mutationObserver object
 */
function observe(targetElement, callback, options) {
    if (!targetElement) targetElement = document.body;
    if (!options) options = {
        childList: true, subtree: true,
        attributes: false, characterData: true
    };
    const mutationsHandler = function (mutations) {
        for (const mutation of mutations) {
            if (mutation.type == 'characterData' && mutation && mutation.length){
				console.log('characterData mutation:', mutation.target);
                callback(mutation.target);
            }
            callback();
        }
    };
    callback(targetElement);
    const mutationObserver = new MutationObserver(mutationsHandler);
    mutationObserver.observe(targetElement, options);
    return mutationObserver;
}
var txtBx = document.querySelector('#main > footer > div > div > div > div.copyable-text.selectable-text');
observe(txtBx, function(el){
	var matches = el.innerText.match(/(?<=(\_))(.+?)(?=(\_))/gim);
	console.log('matches:', matches);
	var newHTML=""
	if(matches)
        [].forEach.call(matches, function(match){try{
			var repl = `<em class="selectable-text invisible-space copyable-text" data-app-text-template="_\${appText}_">${match}</em>`;
			if(!!repl) console.log('replacement:', repl);
            newHTML = el.innerText.replace(match, repl);
        }catch(e){}});
	txtBx.innerHTML = newHTML;
});