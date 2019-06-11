var firebaseConfig = {
    apiKey: "AIzaSyCJInwwUFq0mom4us7Lzqyk0eXGWSn99Qg",
    authDomain: "pctouchscreen-1cf50.firebaseapp.com",
    databaseURL: "https://pctouchscreen-1cf50.firebaseio.com",
    projectId: "pctouchscreen-1cf50",
    storageBucket: "",
    messagingSenderId: "465563345097",
    appId: "1:465563345097:web:4901fdfd964a8de8"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

//States

var current_step = ""
var fbRef;
var newID = 0;
var peopleKeys = [];

function displayFP() {
    $("#entries").empty();
    $("#buttons").empty();
    updatePageName('');
    updateError('');
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
    newID = 0;
    peopleKeys = [];
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
    updateError('');
    //This loop needs to read in from firebase
    fbRef = firebase.database().ref(depName + "/");
    fbRef.once("value", function(person) {
        person.forEach(function (inPerson){
            newID++;
            peopleKeys.push(inPerson.key);
            $("#entries").append(rowForPerson(inPerson.val()));
        });
    });
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
        <button type='admin' onclick='displayLoginRemove()'>Remove</button>
    </p>`
}

function addButton() {
    return `
    <p class="full">
        <button type='admin' onclick='displayLoginAdd(); newID++;'>Add</button>
    </p>`
}

function doneButtonFP() {
    return `
    <p class="full">
        <button type='done' onclick='rewriteDep("${current_step}")'>Done</button>
    </p>`
}

function displayLoginAdd() {
    updatePageName('');
    $("#entries").empty();
    $("#buttons").empty();
    window.scrollTo(0, 0);
    $("#entries").append(writeLogin());
    $("#buttons").append(writeLoginButtonsAdd());
}

function displayLoginRemove() {
    updatePageName('');
    $("#entries").empty();
    $("#buttons").empty();
    window.scrollTo(0, 0);
    $("#entries").append(writeLogin());
    $("#buttons").append(writeLoginButtonsRemove());
}

function writeLogin() {
    return `
    <form id="adForm">
        <p>
            <label>User:</label>
            <input type="username" name="username" id="username">
        </p>
        <p>
            <label>Pass:</label>
            <input type="password" name="password" id="password">
        </p>
        <br>
    </form>`
}

function writeLoginButtonsAdd() {
    return `
    <p class="full">
        <button type='submitAdmin' onclick='submitAdminAdd()'>Submit</button>
    </p>
    <p class="full">
        <button type='backToDisp' onclick='rewriteDep("${current_step}")'>Back</button>
    </p>`
}

function writeLoginButtonsAddInsidePage() {
    return `
    <p class="full">
        <button type='submitAdmin' onclick='submitAdminAdd()'>Submit</button>
    </p>
    <p class="full">
        <button type='backToDisp' onclick='rewriteDep("${current_step}")'>Back</button>
    </p>`
}

function writeLoginButtonsRemove() {
    return `
    <p class="full">
        <button type='submitAdmin' onclick='submitAdminRemove()'>Submit</button>
    </p>
    <p class="full">
        <button type='backToDisp' onclick='rewriteDep("${current_step}")'>Back</button>
    </p>`
}

function submitAdminAdd() {
    var user = getInputVal('username');
    var pass = getInputVal('password');

    if (user == "admin" && pass == "admin") {
        displayAddPeople(current_step);
    } else {
        displayLoginAdd();
        updateError("You have entered the wrong username or password");
    }
}

function displayAddPeople(depName) {
    current_step = depName;
    $("#entries").empty();
    $("#buttons").empty();
    
    updatePageName(depName);
    updateError('');
    //This loop needs to read in from firebase
    $("#entries").append(writeAddPeople());
    $("#buttons").append(submitAdd());
    $("#buttons").append(doneButtonFP());
}

function updateError(txt) {
    $('#errorMSG').text(txt);
}

function submitAdd() {
    return `
    <p class="full">
        <button type='submit' onclick="submitForm();
        newID++;">Submit</button>
    </p>`
}

//Fix submit button!!!!
function writeAddPeople() {
    return `
    <div class="pForm">
        <form id="personForm">
            <p>
                <label>Name</label>
                <input type="text" name="name" id="name">
            </p>
        </form>
    </div>`
}

function submitAdminRemove() {
    var user = getInputVal('username');
    var pass = getInputVal('password');

    if (user == "admin" && pass == "admin") {
        displayRemovePeople(current_step);
    } else {
        displayLoginRemove();
        updateError("You have entered the wrong username or password");
    }
}

function displayRemovePeople(depName) {
    current_step = depName;
    $("#entries").empty();
    $("#buttons").empty();
    
    updatePageName(depName);
    updateError('');
    //This loop needs to read in from firebase
    fbRef = firebase.database().ref(depName + "/");
    fbRef.once("value", function(person) {
        person.forEach(function (inPerson){
            peopleKeys.push(inPerson.key);
            $("#entries").append(removeForPerson(inPerson.val()));
            if (inPerson.val().state == 1) {
                document.getElementById('${id}').style.background='rgb(152,251,152)';
            } else if (inPerson.val().state == 2) {
                document.getElementById('${id}').style.background='rgb(135,206,250)';
            } else if (inPerson.val().state == 3) {
                document.getElementById('${id}').style.background='rgb(220,20,60)';
            } else if (inPerson.val().state == 4) {
                document.getElementById('${id}').style.background='rgb(255,182,193)';
            }
        });
    });
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
    if (person.state == 1) {
        return rowOfPeopleState1(
            person.id, 
            person.name, 
            `${person.bID}`);
    } else if (person.state == 2) {
        return rowOfPeopleState2(
            person.id, 
            person.name, 
            `${person.bID}`);
    } else if (person.state == 3) {
        return rowOfPeopleState3(
            person.id, 
            person.name, 
            `${person.bID}`);
    } else if (person.state == 4) {
        return rowOfPeopleState4(
            person.id, 
            person.name, 
            `${person.bID}`);
    } else if (person.state == 5) {
        return rowOfPeopleState5(
            person.id, 
            person.name, 
            `${person.bID}`);
    } else {
        return rowOfPeople(
            person.id, 
            person.name, 
            `${person.bID}`);
    }
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

//submit new person
function submitForm() {

    var id = newID;
    var name = getInputVal('name');
    var bID = "1." + newID;
    var depName = current_step;
    var location = '';
    var state = 0;
    document.getElementById("personForm").reset();
    createPerson = firebase.database().ref(depName);

    //save new person
    newPerson(id, name, bID, location, state);
}

//todo:
//
//--Make remove button work
//
//--Make input person with less fields...
//---Fill dep, ID and bID automatically
//
//--make state value actaully affect the display when read in
//
//--Make Other field get stored for the person in the database
//
//--Make typable dropdown


function getInputVal(toFind) {
    return document.getElementById(toFind).value;
}


function newPerson(id, name, bID, location, state) {
    var newPerson = createPerson.push();
    newPerson.set({
        id: id,
        name: name,
        bID: bID,
        location: location,
        state: state,
    });
}

function setState(index, stateNum) {
    var thisKey = peopleKeys[index - 1];
    var pRef = firebase.database().ref(current_step + "/" + thisKey + "/state");
    pRef.transaction(function(currentState) {
        currentState = stateNum;
        return currentState;
    });
}