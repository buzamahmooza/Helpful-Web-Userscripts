/* course offerings script*/
var tbList = document.querySelector('.table-list');
var sections = (tbList.querySelectorAll('div.trow'));

console.log('Sections:', sections);
sortSections();

function sortSections(){
	/*
		Options:
		T:		Time
		D or P:	Proff
		L:		Type (Lab or lecture)
		Code:		Section Code
		CRN
	*/
	while(true){
        var option = prompt("Enter the option [1 - 9]", "1:Course-Sec, 2:Activity, 3:CRN, 4:Course Name, etc...");
		if(option === null){
			console.log("Null input recieved");
			return;
		}
        if(!(option>0&&option<=9 &&/[\d]+/g.test(option)))
            alert('"'+option+'" is not a valid option!');
		else
        	break;
    }


	sections.forEach(section=>section.remove());

	var compare = function (a, b){
		var aChild = a.childNodes[option-1];
		var bChild = b.childNodes[option-1];
		var result = (aChild.innerText).localeCompare(bChild.innerText);
		return result;
	};
	sections = Array.from(sections).sort(compare);
	sections.forEach(x => console.log(x.childNodes[option-1].innerText));
	sections.forEach(sec => tbList.appendChild(sec));
}