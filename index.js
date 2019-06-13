var firebaseConfig = {
    apiKey: "AIzaSyAUSImSSuLVmng1bwaKsf-7SmMg9PKUgNU",
    authDomain: "touchscreen-app.firebaseapp.com",
    databaseURL: "https://touchscreen-app.firebaseio.com",
    projectId: "touchscreen-app",
    storageBucket: "",
    messagingSenderId: "949468004343",
    appId: "1:949468004343:web:fa3c79797f9f7980"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

//States

var current_step = ""
var fbRef;
var newID = 1;
var peopleKeys = [];
var loopCount = 0;

// function displayFP() {
//     $("#entries").empty();
//     $("#entries2").empty();
//     $("#entries3").empty();
//
//     $("#buttons").empty();
//     $("#locScreenButtons").empty();
//     $("#choiceScreen").empty();
//     $("#main").show();
//     $("#entries").hide();
//     $("#locScreen").hide();
//     $("#add").hide();
//     $("#remove").hide();
//     $("#step-name").hide();
//     updateError('');
//     window.scrollTo(0, 0);
//     $("#buttons").append(writeFP());
// }

// function writeFP() {
//     return `
//     <div class="dropdown">
//         <button class="dropbtn">Departments</button>
//         <div class="dropdown-content">
//             <a onclick="rewriteDep('IT')">IT</a>
//             <a onclick="rewriteDep('Personnel')">Personnel</a>
//         </div>
//     </div>`
// }

//depPage setup
//WHEN YOU CLICK A LINK IT NEEDS TO CALL THIS
function rewriteDep(depName) {
    newID = 1;
    loopCount = 0;
    oddCount = 0;
    peopleKeys = [];
    addPeopleKeys(depName);
    displayPeople(depName);
}

//changes the subtitle of Location Tracker
//This shows which department it is
function updatePageName(title) {
    $('#step-name').text(title);
    $('#step-name2').text(title);
}

function displayPeople(depName) {
    current_step = depName;
    updateError("");
    $("#entries").empty();
    $("#entries2").empty();
    $("#entries3").empty();
    $("#buttons").empty();
    $("#locScreenButtons").empty();
    $("#choiceScreen").empty();
    $("#main").show();
    $("#table1").show();
    $("#add").show();
    $("#remove").show();
    $("#table2").hide();
    $("#table3").hide();
    $("#table4").hide();
    $("#table5").hide();
    $("#locScreen").hide();
    
    updatePageName(depName + " Department");
    //This loop needs to read in from firebase
    fbRef = firebase.database().ref(depName + "/");
    fbRef.once("value", function(person) {
        person.forEach(function (inPerson){
            newID++;
            if (loopCount == 0) {
                loopCount++;
                $("#entries").append(rowForPerson(inPerson.val()));
            } else if (loopCount == 1) {
                loopCount++;
                $("#entries2").append(rowForPerson(inPerson.val()));
            } else {
                loopCount = 0;
                $("#entries3").append(rowForPerson(inPerson.val()));
            }
            if (inPerson.val().state == 1) {
                document.getElementById(inPerson.val().id.toString()).style.background='rgb(152,251,152)';
            } else if (inPerson.val().state == 2) {
                document.getElementById(inPerson.val().id.toString()).style.background='rgb(135,206,250)';
            } else if (inPerson.val().state == 3) {
                document.getElementById(inPerson.val().id.toString()).style.background='rgb(220,20,60)';
            } else if (inPerson.val().state == 4) {
                document.getElementById(inPerson.val().id.toString()).style.background='rgb(255,182,193)';
            }
        });
    });
    // $("#buttons").append(backButtonFP());
}

function addPeopleKeys(depName) {
    fbRef = firebase.database().ref(depName + "/");
    fbRef.once("value", function(person) {
        person.forEach(function (inPerson){
            peopleKeys.push(inPerson.key);
        });
    });
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

// function backButtonFP() {
//     return `
//     <p class="full">
//         <button type='back' onclick='displayFP()'>Back</button>
//     </p>`
// }

function addButton() {
    return `
    <p class="full">
        <button type='add' onclick='displayLoginAdd();'>Add</button>
    </p>`
}

function doneButtonFP() {
    return `
    <p class="full">
        <button type='done' onclick='rewriteDep("${current_step}")'>Done</button>
    </p>`
}

function displayLoginAdd() {
    $("#entries").empty();
    $("#entries2").empty();
    $("#entries3").empty();
    $("#buttons").empty();
    $("#locScreenButtons").empty();
    $("#choiceScreen").empty();
    $("#main").hide();
    $("#table1").hide();
    $("#table2").show();
    $("#table3").hide();
    $("#table4").hide();
    $("#table5").hide();
    $("#locScreen").show();
    window.scrollTo(0, 0);
    $("#choiceScreen").append(writeLogin());
}

function displayLoginRemove() {
    $("#entries").empty();
    $("#entries2").empty();
    $("#entries3").empty();
    $("#buttons").empty();
    $("#locScreenButtons").empty();
    $("#choiceScreen").empty();
    $("#main").hide();
    $("#table1").hide();
    $("#table2").hide();
    $("#table3").show();
    $("#table4").hide();
    $("#table5").hide();
    $("#locScreen").show();
    window.scrollTo(0, 0);
    $("#choiceScreen").append(writeLogin());
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

function writeLoginButtonsAddInsidePage() {
    return `
    <p class="full">
        <button type='submitAdmin' onclick='submitAdminAdd()'>Submit</button>
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
    $("#table1").hide();
    $("#entries").empty();
    $("#entries2").empty();
    $("#entries3").empty();
    $("#buttons").empty();
    $("#locScreenButtons").empty();
    $("#choiceScreen").empty();
    $("#main").hide();
    $("#add").hide();
    $("#remove").hide();
    $("#table2").hide();
    $("#table3").hide();
    $("#table4").hide();
    $("#table5").show();
    $("#locScreen").show();
    window.scrollTo(0, 0);
    
    updatePageName(depName + " Department");
    updateError('');
    //This loop needs to read in from firebase
    $("#choiceScreen").append(writeAddPeople());
    $("#locScreenButtons").append(submitAdd());
    $("#locScreenButtons").append(doneButtonFP());
}

function updateError(txt) {
    $('#errorMSG').text(txt);
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
    loopCount = 0;
    $("#table1").hide();
    $("#entries").empty();
    $("#entries2").empty();
    $("#entries3").empty();
    $("#buttons").empty();
    $("#locScreenButtons").empty();
    $("#choiceScreen").empty();
    $("#main").show();
    $("#add").hide();
    $("#remove").hide();
    $("#table2").hide();
    $("#table3").hide();
    $("#table4").show();
    $("#table5").hide();
    $("#locScreen").hide();
    
    updatePageName(depName + " Department");
    updateError('');
    //This loop needs to read in from firebase
    fbRef = firebase.database().ref(depName + "/");
    fbRef.once("value", function(person) {
        person.forEach(function (inPerson){
            if (loopCount == 0) {
                loopCount++;
                $("#entries").append(removeForPerson(inPerson.val()));
            } else if (loopCount == 1) {
                loopCount++;
                $("#entries2").append(removeForPerson(inPerson.val()));
            } else {
                loopCount = 0;
                $("#entries3").append(removeForPerson(inPerson.val()));
            }
        });
    });
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
    return rowOfPeople(person.id, 
             person.name, 
             `${person.bID}`,
             `${person.state}`,
             person.location);
}

function rowOfPeople(id, name, bID, state, location) {
    return `
        <div class="entry" id="${id}">
            <div class="info">
                <img class="image" src="images/${id}.jpg">
                <div class="name">${name}</div>
                <br>
            </div>
            <div class="selection">
                <span class="attribute-button unselected" onclick="valueSelected(this); 
                    displayChoice(name, ${state}, id);" 
                    id="${id}-1">${location}</span>
            </div>
        </div>`
}

function displayChoice(name, state, id) {
    $("#table1").hide();
    $("#entries").empty();
    $("#entries2").empty();
    $("#entries3").empty();
    $("#buttons").empty();
    $("#locScreenButtons").empty();
    $("#choiceScreen").empty();
    $("#locScreen").show();
    $("#table2").hide();
    $("#table3").hide();
    $("#table4").show();
    $("#table5").hide();
    $("#main").hide();
    window.scrollTo(0, 0);
    
    updatePageName(current_step);
    $("#choiceScreen").append(writeChoicePage(name, state, id));
}
function writeChoicePage(name, state, id) {
    return `
        <div class="entry">
            <div class="bSpace">
                <div class="selection">
                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},1);
                        setLocation(${id},'In');
                        rewriteDep('${current_step}');" 
                        id="${id}-1">In</span>

                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},2);
                        setLocation(${id},'Lunch');
                        rewriteDep('${current_step}');" 
                        id="${id}-2">Lunch</span>

                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},3);
                        setLocation(${id},'Home');
                        rewriteDep('${current_step}');" 
                        id="${id}-3">Home</span>

                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},4);
                        setLocation(${id},'Vacation');
                        rewriteDep('${current_step}');" 
                        id="${id}-4">Vacation</span>

                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},5);
                        setLocation(${id},'Butterfield');
                        rewriteDep('${current_step}');" 
                        id="${id}-5">Butterfield</span>
                </div>
                <br>
                <br>
                <div class="selection">
                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},6);
                        setLocation(${id},'Put Valley Sr Ctr');
                        rewriteDep('${current_step}');" 
                        id="${id}-6">Put Valley Sr Ctr</span>
                
                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},7);
                        setLocation(${id},'Koehler Sr Ctr');
                        rewriteDep('${current_step}');" 
                        id="${id}-7">Koehler Sr Ctr</span>

                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},8);
                        setLocation(${id},'Hist Courthouse');
                        rewriteDep('${current_step}');" 
                        id="${id}-8">Hist Courthouse</span>
                </div>
                <br>
                <br>
                <div class="selection">
                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},10);
                        setLocation(${id},'COB');
                        rewriteDep('${current_step}');" 
                        id="${id}-10">COB</span>

                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},11);
                        setLocation(${id},'Park');
                        rewriteDep('${current_step}');" 
                        id="${id}-11">Park</span>
                
                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},13);
                        setLocation(${id},'DBS #1');
                        rewriteDep('${current_step}');" 
                        id="${id}-13">DBS #1</span>

                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},14);
                        setLocation(${id},'DBS #2');
                        rewriteDep('${current_step}');" 
                        id="${id}-14">DBS #2</span>

                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},15);
                        setLocation(${id},'DBS #3');
                        rewriteDep('${current_step}');" 
                        id="${id}-15">DBS #3</span>

                <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},9);
                        setLocation(${id},'Law');
                        rewriteDep('${current_step}');" 
                        id="${id}-9">Law</span>
                </div>
                <br>
                <br>
                <div class="selection">
                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},16);
                        setLocation(${id},'Sherrif');
                        rewriteDep('${current_step}');" 
                        id="${id}-16">Sherrif</span>
                
                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},17);
                        setLocation(${id},'BOE');
                        rewriteDep('${current_step}');" 
                        id="${id}-17">BOE</span>

                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},18);
                        setLocation(${id},'Tops');
                        rewriteDep('${current_step}');" 
                        id="${id}-18">Tops</span>
                
                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},19);
                        setLocation(${id},'Planning Transit');
                        rewriteDep('${current_step}');" 
                        id="${id}-19">Planning Transit</span>

                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},20);
                        setLocation(${id},'Kern');
                        rewriteDep('${current_step}');" 
                        id="${id}-20">Kern</span>
                </div>
                <br>
                <br>
                <div class="selection">
                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},22);
                        setLocation(${id},'Lawlor');
                        rewriteDep('${current_step}');" 
                        id="${id}-22">Lawlor</span>
                
                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},23);
                        setLocation(${id},'Highway');
                        rewriteDep('${current_step}');" 
                        id="${id}-23">Highway</span>

                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},24);
                        setLocation(${id},'121 Main');
                        rewriteDep('${current_step}');" 
                        id="${id}-24">121 Main</span>

                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},21);
                        setLocation(${id},'Tilly');
                        rewriteDep('${current_step}');" 
                        id="${id}-21">Tilly</span>

                    <span class="attribute-button unselected" onclick="valueSelected(this); 
                        setState(${id},12);
                        setLocation(${id},'Golf Course');
                        rewriteDep('${current_step}');" 
                        id="${id}-12">Golf Course</span>
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

//submit new person
function submitForm() {

    var id = newID;
    var name = getInputVal('name');
    var bID = "1." + newID;
    var depName = current_step;
    var location = 'In';
    var state = 1;
    document.getElementById("personForm").reset();
    createPerson = firebase.database().ref(depName);

    //save new person
    newPerson(id, name, bID, location, state);
}

//todo:
//
//--Make remove button work
//
//--Make ability to change admin password from the website
//
//--Sanitize inputs?
//
//--Make remove button unselect if you click it again.
//
//--Make submit button for remove page


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
    var thisKey = peopleKeys[index];
    var pRef = firebase.database().ref(current_step + "/" + thisKey + "/state");
    pRef.transaction(function(currentState) {
        currentState = stateNum;
        return currentState;
    });
}

function setLocation(index, location) {
    var thisKey = peopleKeys[index];
    var pRef = firebase.database().ref(current_step + "/" + thisKey + "/location");
    pRef.transaction(function(currentLocation) {
        currentLocation = location;
        return currentLocation;
    });
}