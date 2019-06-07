

// States

var current_step = FRONT_PAGE
var FRONT_PAGE = "FRONT_PAGE"
var timerVar;


// Step Setup

function displayPeople() {
    current_step = FRONT_PAGE
    $("#entries").empty()
    
    for (var person of people) {
        $("#entries").append(ratingRowForPerson(person));
    }
}



// User Interaction

function valueSelected(button) {
    var buttonId = $(button).attr("id")
    var entryId = buttonId.split("-")[0]
    var buttonValue = parseInt(buttonId.split("-")[1])

    // reset all of the other buttons to unselected
    for (var buttonToReset of ["1", "2", "3", "4", "5"]) {
        var resetId = "#" + entryId + "-" + buttonToReset
        $(resetId).attr("class", "attribute-button unselected")
    }
    
    // mark this button as selected
    $(button).attr("class", "attribute-button selected")
}



// Rating Row

function ratingRowForPerson(person) {
    return ratingRow(
        person.id, 
        person.name, 
        `${person.bID}`,
        `${person.tID}`)
}

function ratingRow(id, name, bID) {
    return `
        <div class="entry" id="${id}">
            <div class="info">
            <img class="image" src="images/${id}.jpg">
                <div class="name">${name}</div>
                <br>
            </div>
            <div class="selection">

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                	document.getElementById('${bID}').style.visibility='hidden';
                	document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(152,251,152)';;" id="${id}-1">In</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                	document.getElementById('${bID}').style.visibility='hidden';
                	document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(135,206,250)';" id="${id}-2">Lunch</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                	document.getElementById('${bID}').style.visibility='hidden';
                	document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(220,20,60)';" id="${id}-3">Sick</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                	document.getElementById('${bID}').style.visibility='hidden';
                	document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(255,182,193)';" id="${id}-4">Vacation</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                	document.getElementById('${bID}').style.visibility='visible';
                	document.getElementById('${bID}').value='Enter Location Here';
                    backgroundColor('${id}')" id="${id}-5">Other</span>

                <input type="text" id="${bID}" style="visibility:hidden" 
                	value="Enter Location Here" onfocus="inputFocus(this)" onblur="inputBlur(this)" />
                </div>
            </div>
        </div>`
}

function inputFocus(i) {
    if (i.value == i.defaultValue) { i.value = ""; i.style.color = "#000"; }
}
function inputBlur(i) {
    if (i.value == "") { i.value = i.defaultValue;}
}

function backgroundColor(i) {
    if (parseInt(i)%2!=0){
        document.getElementById(i).style.background="rgb(250,250,250)";
    } else {
        document.getElementById(i).style.background="rgb(255,255,255)";
    }
}

//document.getElementById('${tID}').style.visibility='hidden';
//                	startTimer(0, ${tID}, 0);
//make timerVar an array with a different index per person so clear 
//interval doesn't stop every timer when it hits 0
// function startTimer(duration, display, mode) {
// 	if (mode == 1) {
// 		display.textContent = "60:00"
//     var timer = duration, minutes, seconds;
//     timerVar = setInterval(function () {
//         minutes = parseInt(timer / 60, 10);
//         seconds = parseInt(timer % 60, 10);

//         minutes = minutes < 10 ? "0" + minutes : minutes;
//         seconds = seconds < 10 ? "0" + seconds : seconds;

//         display.textContent = minutes + ":" + seconds;

//         if (--timer < 0) {
//         	display.textContent = "End!"
//         	clearInterval(timerVar)
//           return
//         }
//     }, 1000);
//   } else {
//   	clearInterval(timerVar);
//   }
// }


// List Row

function listRowForPerson(person) {
    return listRow(
        person.id, 
        person.name, 
        `${person.year} · ${person.major}`)
}

function listRow(id, name, description,) {
    return `
        <div class="info" style="padding: 5px; margin-left: 15px;">
            <img class="image" src="images/${id}.jpg">
            <div class="name">${name}</div>
            <div class="subtitle">${description}</div>
        </div>`
}

//add and remove functions