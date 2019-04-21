
JavaScript:
(function () {
    var unansweredFieldSets = Array.from(document.querySelectorAll('fieldset')).filter(fs =>
        Array.from(fs.querySelectorAll('input[type="radio"]')).filter(input => input.checked).length === 0
    );
    console.log('unanswered:', unansweredFieldSets);

    if (confirm('Randomly fill out the remaining ' + unansweredFieldSets.length + 'radio buttons?')) {
        for (const fs of unansweredFieldSets) {
            var inputs = fs.querySelectorAll('input[type="radio"]');
            var randinput = inputs[Math.floor(Math.random() * inputs.length)];
            randinput.click();
            console.log('randomly selecting:', randinput);
        }
    }
})(); void (0);