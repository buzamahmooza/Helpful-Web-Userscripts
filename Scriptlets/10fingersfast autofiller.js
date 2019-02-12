javascript: /*10fingersfast autofiller*/(function() {
    const container = document.querySelector('#words');
    const inputField = document.querySelector('#inputfield');
    interval = setInterval(function write() {
        const wordEl = container.querySelector('.highlight');
        if (!wordEl) return;
        const word = wordEl.innerText;
        console.log(word);
        inputfield.value = word;
    }, 10);
})();