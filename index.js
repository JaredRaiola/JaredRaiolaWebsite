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

var createPerson; 

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
//---this will be done by looping through current database and seeing
//   how many employees are already in
//---1.1 2.1 3.1 ... n.1 will be ID
//---1.2 2.2 3.2 ... n.2 will be bID
//
//--make an entry box that asks for department name from dropdown
//  and rewrites page with that specific departments people on the page
//
//--auto reload page after adding new person, rewriting page with
//  new person added to bottom
//
//--

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