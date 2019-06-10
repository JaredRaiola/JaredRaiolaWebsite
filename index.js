var firebaseConfig = {
    apiKey: "AIzaSyCtH0XQ0J-ppAStYDb_8jT0hzf7d9BOSjU",
    authDomain: "touchscreen-40d56.firebaseapp.com",
    databaseURL: "https://touchscreen-40d56.firebaseio.com",
    projectId: "touchscreen-40d56",
    storageBucket: "touchscreen-40d56.appspot.com",
    messagingSenderId: "1042306702206",
    appId: "1:1042306702206:web:a9b8016d6055faba"
  };
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

//States

var currState = "FRONT_PAGE"

function displayFP() {
    $("#entries").empty();
    $("#buttons").empty();
    updatePageName('');
    window.scrollTo(0, 0);
    $("#buttons").append(writeFP());
}

function writeFP() {
    return `
    <div class="dropdown">
        <button class="dropbtn">Departments</button>
        <div class="dropdown-content">
            <a onclick="rewriteDep('IT')">IT</a>
            <a onclick="rewriteDep('Personnel')">Personnel</a>
        </div>
    </div>`
}

//depPage setup
//WHEN YOU CLICK A LINK IT NEEDS TO CALL THIS
function rewriteDep(depName) {
    window.scrollTo(0, 0);
    displayPeople(depName);
}

//changes the subtitle of Location Tracker
//This shows which department it is
function updatePageName(title) {
    $('#step-name').text(title);
}

function displayPeople(depName) {
    current_step = depName;
    $("#entries").empty();
    $("#buttons").empty();
    
    updatePageName(depName);
    //This loop needs to read in from firebase
    for (var person of people) {
        $("#entries").append(rowForPerson(person));
    }
    $("#buttons").append(addButton());
    $("#buttons").append(removeButton());
    $("#buttons").append(backButtonFP());
}


// User Interaction

function valueSelected(button) {
    var buttonId = $(button).attr("id");
    var entryId = buttonId.split("-")[0];
    var buttonValue = parseInt(buttonId.split("-")[1]);

    // reset all of the other buttons to unselected
    for (var buttonToReset of ["1", "2", "3", "4", "5"]) {
        var resetId = "#" + entryId + "-" + buttonToReset;
        $(resetId).attr("class", "attribute-button unselected");
    }
    
    // mark this button as selected
    $(button).attr("class", "attribute-button selected");
}

function backButtonFP() {
    return `
    <p class="full">
        <button type='back' onclick='displayFP()'>Back</button>
    </p>`
}

function removeButton() {
    return `
    <p class="full">
        <button type='admin' onclick='displayLogin(2)'>Remove</button>
    </p>`
}

function addButton() {
    return `
    <p class="full">
        <button type='admin' onclick='displayLogin(1)'>Add</button>
    </p>`
}

function doneButtonFP() {
    return `
    <p class="full">
        <button type='done' onclick='displayFP()'>Done</button>
    </p>`
}

function displayLogin() {
    updatePageName('');
    $("#entries").empty();
    $("#buttons").empty();
    window.scrollTo(0, 0);
    $("#entries").append(writeLogin());
    $("#buttons").append(writeLoginButtons());
}

function writeLogin() {
    return `
    <div id="incorr" class="title"></div>
    <form id="adForm">
        <p>
            <label>User:</label>
            <input type="text" name="username" id="username">
        </p>
        <p>
            <label>Pass:</label>
            <input type="text" name="password" id="password">
        </p>
        <br>
    </form>`
}

function writeLoginButtons() {
    return `
    <p class="full">
        <button type='submitAdmin' onclick='submitAdmin()'>Submit</button>
    </p>
    <p class="full">
        <button type='backToDisp' onclick='rewriteDep("${current_step}")'>Back</button>
    </p>`
}

function submitAdmin(num) {
    var user = getInputVal('username');
    var pass = getInputVal('password');

    if (user == "admin" && pass == "admin") {
        if (num == 1) {

        }
        else {
            displayRemovePeople(current_step);
        }
    } else {
        displayLogin();
        $('#incorr').text("You have entered the wrong username or password");
    }
}

function displayRemovePeople(depName) {
    current_step = depName;
    $("#entries").empty();
    $("#buttons").empty();
    
    updatePageName(depName);
    //This loop needs to read in from firebase
    for (var person of people) {
        $("#entries").append(removeForPerson(person));
    }
    $("#buttons").append(doneButtonFP());
}

function removeForPerson(person) {
    return removePeople(
        person.id, 
        person.name, 
        `${person.bID}`);
}

//write function to remove person from the DB
function removePeople(id, name, bID) {
    return `
        <div class="entry" id="${id}">
            <div class="info">
            <img class="image" src="images/${id}.jpg">
                <div class="name">${name}</div>
                <br>
            </div>
            <div class="selection">
                <span class="attribute-button unselected" onclick="valueSelected(this);" 
                    id="${id}-999">Remove</span>
            </div>
        </div>`
}

// People Row

function rowForPerson(person) {
    return rowOfPeople(
        person.id, 
        person.name, 
        `${person.bID}`);
}



//YOU NEED TO STILL UPDATE STATES ON CLICK IN DB

function rowOfPeople(id, name, bID) {
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
                    document.getElementById('${id}').style.background='rgb(152,251,152)';" 
                    id="${id}-1">In</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(135,206,250)';" 
                    id="${id}-2">Lunch</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(220,20,60)';" 
                    id="${id}-3">Sick</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='hidden';
                    document.getElementById('${bID}').value='Enter Location Here';
                    document.getElementById('${id}').style.background='rgb(255,182,193)';" 
                    id="${id}-4">Vacation</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    document.getElementById('${bID}').style.visibility='visible';
                    document.getElementById('${bID}').value='Enter Location Here';
                    backgroundColor('${id}');" 
                    id="${id}-5">Other</span>

                <input type="text" id="${bID}" style="visibility:hidden" 
                    value="Enter Location Here" onfocus="inputFocus(this)" onblur="inputBlur(this)" />
                </div>
            </div>
        </div>`
}

function inputFocus(i) {
    if (i.value == i.defaultValue) { i.value = ""; i.style.color = "#000";}
}
function inputBlur(i) {
    if (i.value == "") { i.value = i.defaultValue;}
}

function backgroundColor(i) {
    if (parseInt(i)%2!=0) {
        document.getElementById(i).style.background="rgb(250,250,250)";
    } else {
        document.getElementById(i).style.background="rgb(255,255,255)";
    }
}






//New person
var createPerson; 

//Listens for submit input
//DONT FORGET IT DOESNT WORK BECAUSE YOU DELETED PERSON FORM
document.getElementById('personForm').addEventListener('submit', submitForm);

//submit new person
function submitForm(e) {
    e.preventDefault();

    var id = getInputVal('inputID');
    var name = getInputVal('name');
    var bID = getInputVal('buttonID');
    var depName = getInputVal('depName');
    createPerson = firebase.database().ref(depName);

    //save new person
    newPerson(id, name, bID);
}

//todo:
//
//--learn how to read in from firebase
//
//--auto make ID and bID
//
//---this will be done by looping through current database and seeing
//   how many employees are already in
//
//---1.1 2.1 3.1 ... n.1 will be ID
//
//---1.2 2.2 3.2 ... n.2 will be bID
//
//
//--make an entry box that asks for department name from dropdown
//  and rewrites page with that specific departments people on the page
//
//
//--auto reload page after adding new person, rewriting page with
//  new person added to bottom
//
//
//--after they click submit it needs to loop through that specific dep
//  in order to see how many people are in it for id and bID
//
//
//--you're not doing multiple pages, you're just using JS to rewrite 
//  one page
//
//
//
//--Tomorrow, clean up index.html 
//
//---write a rewrite function for the person form (make it
//  require a specifc username and password
//
//---write a rewrite func for standardized dep employee display that
//   sets depname
//
//---Make a back button
//
//--make front page dropdown a typable dropdown


function getInputVal(toFind) {
    return document.getElementById(toFind).value;
}


function newPerson(id, name, bID) {
    var newPerson = createPerson.push();
    newPerson.set({
        id: id,
        name: name,
        bID: bID,
    });
}