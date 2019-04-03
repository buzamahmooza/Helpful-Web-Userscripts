javascript: /*10fingersfast autofiller*/(function () {
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
void (0);


/*
* BOT for 10fastfingers, automatic typing with adjustable speed
* ================================================================
*
* bored in my apartment and decided to hack this game: http://indonesian-speedtest.10fastfingers.com/
* just start the game, when you're ready to type, DON'T TYPE ANYTHING, open up
* your Developer Tools in Chrome (CTRL+SHIFT+J) and click Console tab, and
* then paste the whole code below, then press enter, and enjoy the show.
*
* twitter.com/kecebongsoft
*/
(function () {
    var wpm = 250;
    var word_idx = 0;
    var interval_per_word = 1000 * 60/wpm; // in milliseconds
    function hackit() {
        if (word_idx < words.length) {
            $('#inputfield').val(words[word_idx] + ' ');
            var keyup = jQuery.Event('keyup');
            keyup.which = 32;
            $('#inputfield').trigger(keyup);
            word_idx++;
            setTimeout(hackit, interval_per_word);
        }
    }
    setTimeout(hackit, interval_per_word);
})
