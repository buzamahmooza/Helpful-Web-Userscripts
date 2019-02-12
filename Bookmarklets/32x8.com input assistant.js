JavaScript:(function(){
	if(!/www\.32x8\.com/.test(location.href)){ alert("This script only works on 32x8.com"); return; }
	stringInput(prompt("Enter the minterms/maxterms in order from top to bottom (0,1,x):", "1 x 1 0 1 0 x 0"));
	function stringInput(inputStr) {
		const rows = Array.from(document.querySelectorAll('body > form > table > tbody tr')).slice(2, -1);
		const terms = inputStr.match(/(1|0|x)/gmi);
		console.log('terms:', terms);
		for(let i=0; i<terms.length; i++){
			if(i>=terms.length || i>=rows.length) break;
			var idx=0;
			switch(terms[i].toLowerCase()) {
				case "0": idx=0; break;
				case "1": idx=1; break;
				case "x": idx=2; break;
			}
			const radioBtn = rows[i].querySelectorAll('input')[idx];
			radioBtn.click();
		}
	}
	alert("The inputs have been entered.\nAuthor: Faris Hijazi         www.github.com/buzamahmooza");
})();