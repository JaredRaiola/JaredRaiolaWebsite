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

// States


var createPerson = firebase.database().ref('People');

//submit new person
function submitForm(i) {
    i.preventDefault();

    var id = getInputVal('inputID');
    var name = getInputVal('name');
    var bID = getInputVal('buttonID');

    //save new person
    newPerson(id, name, bID);
}

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

//add and remove functions