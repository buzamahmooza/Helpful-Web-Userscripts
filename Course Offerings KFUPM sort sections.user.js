javascript:
    /* Course offerings script*/
    (function () {
        addCss(
            `.hover-click:hover,
.hover-click:focus {
    text-decoration: none;
    cursor: pointer;
}`);
        var table = document.querySelector('.table-list');
        var sections = (table.querySelectorAll('div.trow'));
        var headers = table.querySelectorAll('.thead > div.tdata');
        console.log('Sections:', sections);

        let asc = 1;
        let switching = false;

        /*Add listeners*/
        for (const head of headers) {
            head.classList.add('hover-click');
            head.addEventListener('click', function () {
                if (!switching) {
                    sections = (table.querySelectorAll('div.trow'));
                    sortSections(Array.from(headers).indexOf(head));
                }
            });
        }


        function sortSections(n) { /* Options: T: Time D or P: Proff L: Type (Lab or lecture) Code: Section Code CRN */
            var i, x, y, shouldSwitch, dir, switchcount = 0;
            /* Set the sorting direction to ascending:*/
            table = document.querySelector('.table-list');
            sections = (table.querySelectorAll('div.trow'));
            headers = table.querySelectorAll('.thead > div.tdata');
            dir = "asc";
            /*function insertSec(sec){
                /!*table.appendChild(sec);*!/
                table.insertBefore(table.firstElementChild, sec);
            }*/
            try {
                asc = (compare(sections[0], sections[1]) > 0);
                console.log('sorting:', headers[n].innerText);

                // sections = Array.from(sections).sort((a, b) => compare(a, b, n) * asc);
                switching = true;
                while (switching) {
                    /* Start by saying: no switching is done:*/
                    switching = false;
                    /* Loop through all table rows (except the
                    first, which contains table headers): */
                    for (i = 1; i < (sections.length - 1); i++) {
                        /* Start by saying there should be no switching:*/
                        shouldSwitch = false;
                        /* Get the two elements you want to compare,
                        one from current row and one from the next: */
                        x = sections[i];
                        y = sections[i + 1];
                        /* Check if the two rows should switch place,
                        based on the direction, asc or desc: */
                        if (dir == "asc") {
                            if (compare(x, y) > 0) {
                                /* If so, mark as a switch and break the loop:*/
                                shouldSwitch = true;
                                break;
                            }
                        } else if (dir == "desc") {
                            if (compare(x, y) < 0) {
                                /* If so, mark as a switch and break the loop:*/
                                shouldSwitch = true;
                                break;
                            }
                        }
                    }
                    if (shouldSwitch) {
                        /* If a switch has been marked, make the switch
                        and mark that a switch has been done: */
                        sections[i].parentNode.insertBefore(sections[i + 1], sections[i]);
                        switching = true;
                        /* Each time a switch is done, increase this count by 1:*/
                        switchcount++;
                    } else {
                        /* If no switching has been done AND the direction is "asc",
                        set the direction to "desc" and run the while loop again. */
                        if (switchcount == 0 && dir == "asc") {
                            dir = "desc";
                            switching = true;
                        }
                    }
                }
                /*sections.forEach(section => section.remove());*/
                /*sections.forEach(x => console.log(x.childNodes[n - 1].innerText));*/
            } finally {
                sections.forEach(sec => table.appendChild(sec));
                switching = false;
            }

            function compare(a, b, colIdx) {
                if (colIdx < 0) {
                    throw "Column index out of range!";
                }
                colIdx = n;
                const aText = a.childNodes[colIdx].innerText.toLowerCase();
                const bText = b.childNodes[colIdx].innerText.toLocaleLowerCase();
                var result = (aText).localeCompare(bText);
                /*if (result == 0) {
                    compare(a, b, colIdx - 1)
                }*/
                console.log(`(${aText}).compare(${bText}) = ${result}`);
                return result;
            }
        }
    })();

function addCss(css) {
    const style = document.createElement('style');
    if (style.styleSheet)
        style.styleSheet.cssText = css;
    else
        style.appendChild(document.createTextNode(css));
    document.getElementsByTagName('head')[0].appendChild(style);
}

function sortTable(n) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById("myTable2");
    switching = true;
    /* Set the sorting direction to ascending:*/
    dir = "asc";
    /* Make a loop that will continue until
    no switching has been done: */
    while (switching) {
        /* Start by saying: no switching is done:*/
        switching = false;
        rows = table.getElementsByTagName("table-list");
        /* Loop through all table rows (except the
        first, which contains table headers): */
        for (i = 1; i < (rows.length - 1); i++) {
            /* Start by saying there should be no switching:*/
            shouldSwitch = false;
            /* Get the two elements you want to compare,
            one from current row and one from the next: */
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            /* Check if the two rows should switch place,
            based on the direction, asc or desc: */
            if (dir == "asc") {
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                    /* If so, mark as a switch and break the loop:*/
                    shouldSwitch = true;
                    break;
                }
            } else if (dir == "desc") {
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                    /* If so, mark as a switch and break the loop:*/
                    shouldSwitch = true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
            /* If a switch has been marked, make the switch
            and mark that a switch has been done: */
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            /* Each time a switch is done, increase this count by 1:*/
            switchcount++;
        } else {
            /* If no switching has been done AND the direction is "asc",
            set the direction to "desc" and run the while loop again. */
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}

