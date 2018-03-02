








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