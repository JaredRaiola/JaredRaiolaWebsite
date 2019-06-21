//Firebase connection stuff

//Auth key and configuration addresses for Firebase Database
var firebaseConfig = {
  apiKey: "AIzaSyAUSImSSuLVmng1bwaKsf-7SmMg9PKUgNU",
  authDomain: "touchscreen-app.firebaseapp.com",
  databaseURL: "https://touchscreen-app.firebaseio.com",
  projectId: "touchscreen-app",
  storageBucket: "touchscreen-app.appspot.com",
  messagingSenderId: "949468004343",
  appId: "1:949468004343:web:fa3c79797f9f7980"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

//Used to track the department it is in
var current_step = "";
//Used to globally track the newID value for a new person
var newID = 1;
//Used to globally track each individual persons key in an array
var peopleKeys = [];
//Used to calculate which column to place the person when reading in from Firebase
var loopCount = 0;
//Used to push a new person to Firebase
var createPerson;
//Used to change the color of the newPerson message
var numPerson = 0;











//ALL MAIN FUNCTIONS -------------------------------------------------------------

/*
/ Main function to set up employee deparment display
/
/ @param depName: the current department that is being displayed
*/
function rewriteDep(depName) {
  newID = 1;
  loopCount = 0;
  oddCount = 0;
  peopleKeys = [];
  current_step = depName;
  updateError("");
  $("#title").show();
  $("#duck").empty();
  $("#entries").empty();
  $("#entries2").empty();
  $("#entries3").empty();
  $("#choiceScreen").empty();
  $("#main").show();
  $("#table1").show();
  $("#table2").hide();
  $("#table3").hide();
  $("#table4").hide();
  $("#table5").hide();
  $("#locScreen").hide();
  addPeopleKeys(depName);
  displayPeople(depName);
}

/*
/ Main function that calls the functions necessary to write the admin login for the add new person page
/ This function clears out all other html in the body and rewrites the page from scratch.
*/
function displayLoginAdd() {
	$("#choiceScreen").empty();
  $("#entries").empty();
  $("#entries2").empty();
  $("#entries3").empty();
  $("#main").hide();
  $("#table1").hide();
  $("#table2").show();
  $("#locScreen").show();
  window.scrollTo(0, 0);
  $("#choiceScreen").append(writeLogin());
}

/*
/ Main function that calls the functions necessary to write the admin login for the remove person page
/ This function clears out all other html in the body and rewrites the page from scratch.
*/
function displayLoginRemove() {
	$("#choiceScreen").empty();
  $("#entries").empty();
  $("#entries2").empty();
  $("#entries3").empty();
  $("#main").hide();
  $("#table1").hide();
  $("#table3").show();
  $("#locScreen").show();
  window.scrollTo(0, 0);
  $("#choiceScreen").append(writeLogin());
}

/*
/ Main function used to display the add new person page itself
/
/ This function clears out all other html in the body
/
/ @param depName: the current department that is being displayed
/
*/
function displayAddPeople(depName) {   
    $("#choiceScreen").empty();
    $("#table2").hide();
    $("#table5").show();
    $("#locScreen").show();
    window.scrollTo(0, 0);
    
    updatePageName(depName + " Department");
    updateError('');
    $("#choiceScreen").append(writeAddPeople());
}

/*
/ Main function used to call the help functions to display the location choice page
/
/ This function clears out all of the other body html
/
/ @param id: the id value of the current person that is being written/displayed
/
/ @param name: the name of the current person that is being written/displayed
/
/ @param state: the state of the current person that is being written/displayed
*/
function displayChoice(id, name, state) {
  $("#table1").hide();
  $("#entries").empty();
  $("#entries2").empty();
  $("#entries3").empty();
  $("#choiceScreen").empty();
  $("#locScreen").show();
  $("#table2").hide();
  $("#table3").hide();
  $("#table4").show();
  $("#table5").hide();
  $("#main").hide();
  window.scrollTo(0, 0);
  
  updatePageName(current_step);
  $("#choiceScreen").append(writeChoicePage(id, name, state));
}











//rewriteDep helpers --------------------------------------------------------------------

/*
/ Main page that displays everyone, sorts by how many people you have 
/ using global variable loopCount
/
/ This function clears out all other html in the body and rewrites the page from scratch.
/
/ @param depName: the current department that is being displayed
*/
function displayPeople(depName) {
  updatePageName(depName + " Department");
  //This loop reads in from firebase
  fbRef = firebase.database().ref(depName + "/");
  fbRef.once("value", function(person) {
      person.forEach(function (inPerson){
      		//increment newID per person to handle the case when adding a new person
          newID++;
          //if first person, put in column 1
          if (loopCount == 0) {
              loopCount++;
              $("#entries").append(rowForPerson(inPerson.val()));
          //if second person, put in column 2
          } else if (loopCount == 1) {
              loopCount++;
              $("#entries2").append(rowForPerson(inPerson.val()));
          //if third person put in column three and reset to first person
          } else {
              loopCount = 0;
              $("#entries3").append(rowForPerson(inPerson.val()));
          }
          //changes the color of a persons background based off which location they picked
          //state 1 is "In"
          if (inPerson.val().state == 1) {
              document.getElementById(inPerson.val().id.toString()).style.background='rgb(152,251,152)';
          //state 2 is "Lunch"
          } else if (inPerson.val().state == 2) {
              document.getElementById(inPerson.val().id.toString()).style.background='rgb(135,206,250)';
          //state 3 is "Home"
          } else if (inPerson.val().state == 3) {
              document.getElementById(inPerson.val().id.toString()).style.background='rgb(220,20,60)';
          //state 4 is "Vacation"
          } else if (inPerson.val().state == 4) {
              document.getElementById(inPerson.val().id.toString()).style.background='rgb(255,182,193)';
          }
          //any other state just rewrites as the normal background
      });
  });
}

/*
/ Helper function used to call the function that writes the html to display the main department display page
/
/ @param person: the current person being written/displayed
*/
function rowForPerson(person) {
  return rowOfPeople(person.id, 
           person.name,
           `${person.state}`,
           person.location);
}

/*
/ Helper function used to write the main department display page
/
/ @param id: the id value of the current person that is being written/displayed
/
/ @param name: the name of the current person that is being written/displayed
/
/ @param state: the state of the current person that is being written/displayed
/
/ @param location: the location of the current person that is being written/displayed
/
/ @return html used to display the remove person screen
*/
function rowOfPeople(id, name, state, location) {
  return `
      <div class="entry" id="${id}">
          <div class="info">
            <img class="image" src="images/1.jpg">
            <div class="name">${name}</div>
            <br>
          </div>
          <div class="selection">
              <span class="attribute-button unselected" onclick=" 
                  displayChoice(id, name, ${state});" 
                  id="${id}-1">${location}</span>
          </div>
      </div>`
}











//Add Page Helpers ----------------------------------------------------------------------

/*
/ Checks to see if the admin login is correct for the add new person page,
/ grabs data from writeLogin() form
/
/ This is currently hardcoded because the application is being run on an internal server with no private data 
*/
function submitAdminAdd() {
  var user = document.getElementById('username').value;
  var pass = document.getElementById('password').value;

  if (user == "admin" && pass == "putnamcounty") {
      displayAddPeople(current_step);
  } else {
      displayLoginAdd();
      updateError("You have entered the wrong username or password");
  }
}

/*
/ Writes the html in the body for the add page
/
/ @return html input box labeled name, value grabbed by add button and pushed to Firebase as a new person
*/
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

/*
/ Function that changes the background color of each individual depending on the order they are put in
/
/ @param i: the button being interacted with
*/
function backgroundColor(i) {
  if (parseInt(i)%2!=0) {
      document.getElementById(i).style.background="rgb(250,250,250)";
  } else {
      document.getElementById(i).style.background="rgb(255,255,255)";
  }
} 

/*
/ Main function that grabs the name from the add page and sets the other values with their defaults
/ These values are then passed to newPerson and sent to Firebase
*/
function submitForm() {
  var id = newID;
  var name = document.getElementById('name').value;
  var depName = current_step;
  var location = 'In';
  var state = 1;
  var index = newID;
  document.getElementById("personForm").reset();
  createPerson = firebase.database().ref(depName);

  //save new person
  newPerson(id, name, location, state);
}

/*
/ Helper function that pushes the new person created to Firebase
/
/ @param id: the id value of the current person that is being written/displayed
/
/ @param name: the name of the current person that is being written/displayed
/
/ @param location: the location of the current person that is being written/displayed
/
/ @param state: the state of the current person that is being written/displayed
*/
function newPerson(id, name, location, state) {
  var newPerson = createPerson.push();
  newPerson.set({
      id: id,
      name: name,
      location: location,
      state: state,
  });
}











//Remove Page Helpers ----------------------------------------------------------------------

/*
/ Checks to see if the admin login is correct for the remove person page, 
/ grabs data from writeLogin() form
/
/ This is currently hardcoded because the application is being run on an internal server with no private data 
*/
function submitAdminRemove() {
  var user = document.getElementById('username').value;
  var pass = document.getElementById('password').value;

  if (user == "admin" && pass == "putnamcounty") {
		displayRemovePeople(current_step);
  } else {
    displayLoginRemove();
    updateError("You have entered the wrong username or password");
  }
}

/*
/ Main page used to display the remove person page itself
/
/ This function clears out all other html in the body
/
/ @param depName: the current department that is being displayed
/
*/
function displayRemovePeople(depName) {
  current_step = depName;
  loopCount = 0;   
  $("#choiceScreen").empty();
  $("#main").show();
  $("#entries").empty();
  $("#entries2").empty();
  $("#entries3").empty();
  $("#table3").hide();
  $("#table4").show();
  $("#locScreen").hide();
  
  updatePageName(depName + " Department");
  updateError('');
  //This loop reads in from firebase
  fbRef = firebase.database().ref(depName + "/");
  fbRef.once("value", function(person) {
    person.forEach(function (inPerson){
  		//first person is put in column 1
      if (loopCount == 0) {
        loopCount++;
        $("#entries").append(removeForPerson(inPerson.val()));
      //second person is put in column 2
      } else if (loopCount == 1) {
        loopCount++;
        $("#entries2").append(removeForPerson(inPerson.val()));
      //third person is put in column 3 and resets back to first person
      } else {
        loopCount = 0;
        $("#entries3").append(removeForPerson(inPerson.val()));
      }
    });
  });
}

/*
/ Helper function used to remove an person and shift everyone elses id
/ values in order to keep correct positions in the key array
/
/ @param index: the position of the current person in the key array
*/
function removeThisPerson(index) {
	//index - 1 because ids start at 1
  var thisKey = peopleKeys[index - 1];
  var ref = firebase.database().ref(current_step)
  //"" to turn the key into a string
  ref.child("" + thisKey).remove();
  var restKey = peopleKeys[index]
  //sets the count (aka id) to the current persons id
  var count = index;
  //loops through people keys and decrements everyones id by 1
  while (count < peopleKeys.length) {
    ref.child("" + restKey).update({id: count})
    count++;
    restKey = peopleKeys[count];
  }
  peopleKeys = []
  addPeopleKeys(current_step);
  displayRemovePeople(current_step);
}

/*
/ Helper function used to pass individual person values 
/ to the function that writes the remove person page
/
/ @param person: the current person that is being written/displayed
/
/ @return removePeople(person.id, person.name): call to the function
/ that writes the html to display the people to remove
*/
function removeForPerson(person) {
  return removePeople(
    person.id, 
    person.name);
}

/*
/ Helper function used to write the remove person page
/
/ @param id: the id value of the current person that is being written/displayed
/
/ @param name: the name of the current person that is being written/displayed
/
/ @return html used to display the remove person screen
*/
function removePeople(id, name) {
  return `
      <div class="entry" id="${id}">
          <div class="info">
        		<img class="image" src="images/1.jpg">
            <div class="name">${name}</div>
            <br>
          </div>
          <div class="selection">
              <span class="attribute-button unselected" onclick="
              removeThisPerson(${id});;" 
                  id="${id}-999">Remove</span>
          </div>
      </div>`
}











//Location Page Helpers ----------------------------------------------------------------------

/*
/ Helper function used to write the html for the location choice display
/
/ This is hardcoded due to formatting issues
/
/ @param id: the id value of the current person that is being written/displayed
/
/ @param name: the name of the current person that is being written/displayed
/
/ @param state: the state of the current person that is being written/displayed
/
/ @return html used to display and change the location of the individual clicked
*/
function writeChoicePage(id, name, state) {
  return `
      <div class="entry">
          <div class="bSpace">
              <div class="selection">
                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},1);
                      setLocation(${id},'In');
                      rewriteDep('${current_step}');" 
                      id="${id}-1">In</span>

                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},2);
                      setLocation(${id},'Lunch');
                      rewriteDep('${current_step}');" 
                      id="${id}-2">Lunch</span>

                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},3);
                      setLocation(${id},'Home');
                      rewriteDep('${current_step}');" 
                      id="${id}-3">Home</span>

                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},4);
                      setLocation(${id},'Vacation');
                      rewriteDep('${current_step}');" 
                      id="${id}-4">Vacation</span>

                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},5);
                      setLocation(${id},'Butterfield');
                      rewriteDep('${current_step}');" 
                      id="${id}-5">Butterfield</span>
              </div>
              <br>
              <br>
              <div class="selection">
                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},6);
                      setLocation(${id},'Put Valley Sr Ctr');
                      rewriteDep('${current_step}');" 
                      id="${id}-6">Put Valley Sr Ctr</span>
              
                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},7);
                      setLocation(${id},'Koehler Sr Ctr');
                      rewriteDep('${current_step}');" 
                      id="${id}-7">Koehler Sr Ctr</span>

                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},8);
                      setLocation(${id},'Hist Courthouse');
                      rewriteDep('${current_step}');" 
                      id="${id}-8">Hist Courthouse</span>
              </div>
              <br>
              <br>
              <div class="selection">
                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},10);
                      setLocation(${id},'COB');
                      rewriteDep('${current_step}');" 
                      id="${id}-10">COB</span>

                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},11);
                      setLocation(${id},'Park');
                      rewriteDep('${current_step}');" 
                      id="${id}-11">Park</span>
              
                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},13);
                      setLocation(${id},'DBS #1');
                      rewriteDep('${current_step}');" 
                      id="${id}-13">DBS #1</span>

                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},14);
                      setLocation(${id},'DBS #2');
                      rewriteDep('${current_step}');" 
                      id="${id}-14">DBS #2</span>

                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},15);
                      setLocation(${id},'DBS #3');
                      rewriteDep('${current_step}');" 
                      id="${id}-15">DBS #3</span>

              <span class="attribute-button unselected" onclick=" 
                      setState(${id},9);
                      setLocation(${id},'Law');
                      rewriteDep('${current_step}');" 
                      id="${id}-9">Law</span>
              </div>
              <br>
              <br>
              <div class="selection">
                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},16);
                      setLocation(${id},'Sherrif');
                      rewriteDep('${current_step}');" 
                      id="${id}-16">Sherrif</span>
              
                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},17);
                      setLocation(${id},'BOE');
                      rewriteDep('${current_step}');" 
                      id="${id}-17">BOE</span>

                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},18);
                      setLocation(${id},'Tops');
                      rewriteDep('${current_step}');" 
                      id="${id}-18">Tops</span>
              
                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},19);
                      setLocation(${id},'Planning Transit');
                      rewriteDep('${current_step}');" 
                      id="${id}-19">Planning Transit</span>

                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},20);
                      setLocation(${id},'Kern');
                      rewriteDep('${current_step}');" 
                      id="${id}-20">Kern</span>
              </div>
              <br>
              <br>
              <div class="selection">
                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},22);
                      setLocation(${id},'Lawlor');
                      rewriteDep('${current_step}');" 
                      id="${id}-22">Lawlor</span>
              
                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},23);
                      setLocation(${id},'Highway');
                      rewriteDep('${current_step}');" 
                      id="${id}-23">Highway</span>

                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},24);
                      setLocation(${id},'121 Main');
                      rewriteDep('${current_step}');" 
                      id="${id}-24">121 Main</span>

                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},21);
                      setLocation(${id},'Tilly');
                      rewriteDep('${current_step}');" 
                      id="${id}-21">Tilly</span>

                  <span class="attribute-button unselected" onclick=" 
                      setState(${id},12);
                      setLocation(${id},'Golf Course');
                      rewriteDep('${current_step}');" 
                      id="${id}-12">Golf Course</span>
              </div>
          </div>                                                                            
      </div>`
}

/*
/ Helper function that updates the state of the person that is currently being interacted with
/
/ @param index: the index of the current person that is being interacted with
/
/ @param stateNum: the new state number
*/
function setState(index, stateNum) {
    var thisKey = peopleKeys[index];
    var pRef = firebase.database().ref(current_step + "/" + thisKey + "/state");
    pRef.transaction(function(currentState) {
        currentState = stateNum;
        return currentState;
    });
}

/*
/ Helper function that updates the location of the person that is currently being interacted with
/
/ @param index: the index of the current person that is being interacted with
/
/ @param location: the new location
*/
function setLocation(index, location) {
  var thisKey = peopleKeys[index];
  var pRef = firebase.database().ref(current_step + "/" + thisKey + "/location");
  pRef.transaction(function(currentLocation) {
      currentLocation = location;
      return currentLocation;
  });
}











//Misc. Helpers ----------------------------------------------------------------------

/*
/ Updates the html of the page name to display a new title
/
/ @param title: the current title that is being displayed
*/
function updatePageName(title) {
  $('#step-name').text(title);
  $('#step-name2').text(title);
}

/*
/ Loop that calls Firebase and stores all the unique keys per person in an array
/
/ @param depName: the current department that is being displayed, 
/ it is used to call a reference to Firebase
*/
function addPeopleKeys(depName) {
  fbRef = firebase.database().ref(depName + "/");
  fbRef.once("value", function(person) {
      person.forEach(function (inPerson){
          peopleKeys.push(inPerson.key);
      });
  });
}

/*
/ Basic html writing function to display a simple login screen in the body, used for both add and remove
/
/ @return html input boxes that are grabbed by the submit button and passed to either submitAdminAdd() or submitAdminRemove()
*/
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

/*
/ Flashes an error message to the screen
/
/ @param txt: the text to display as an error message
*/
function updateError(txt) {
  $('#errorMSG').text(txt);
  document.getElementById("errorMSG").style.color = "black";
}

/*
/ Function used to change styling of the add, submit, back, cancel, and remove buttons
/
/ @param i: the button being interacted with
*/
function inputFocus(i) {
  if (i.value == i.defaultValue) { i.value = ""; i.style.color = "#000";}
}

/*
/ Function used to change styling of the add, submit, back, cancel, and remove buttons
/
/ @param i: the button being interacted with
*/
function inputBlur(i) {
  if (i.value == "") { i.value = i.defaultValue;}
}

/*
/ Function used by html add button to increment the newID when a person is added 
/
/ Catches error case of multiple adds at once
*/
function incrementID() {
	newID++;
}

function nPerson() {
	numPerson++;
	$('#errorMSG').text("You've added a new person!");
	if (numPerson % 4 == 0) {
		numPerson = 0;
		document.getElementById("errorMSG").style.color = "Magenta";
	} else if (numPerson % 3 == 0) {
		document.getElementById("errorMSG").style.color = "Black";
	} else if (numPerson % 2 == 0) {
		document.getElementById("errorMSG").style.color = "CornflowerBlue";
	} else {
		document.getElementById("errorMSG").style.color = "Indigo";
	}
}











/*
/ :) don't delete thx
*/
function duckDuckGoose() {
  $("#table1").hide();
  $("#title").hide();
  $("#entries").empty();
  $("#entries2").empty();
  $("#entries3").empty();
  $("#main").hide();
  $("#choiceScreen").empty();
  $("#table2").hide();
  $("#table3").hide();
  $("#table4").hide();
  $("#table5").hide();
  $("#locScreen").hide();
  window.scrollTo(0, 0);
  $("#duck").append(writeDucky())
}

/*
/ :) don't delete thx
*/
function writeDucky() {
  return `
  <br>
  <p style="text-align: center; font-family: SF-Bold;" id="love">❤️ Created with love by Jared Raiola ❤️</p>
  <br>
  <p style="text-align: center;">
  <img src="images/duck.gif" style="height:600px;width:500px" id="ducky" onclick="rewriteDep('IT')">
  </p>`
}