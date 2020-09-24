//keeps track of picture being displayed
var myIndex = 0;

function carousel() {
  var i;
  var x = document.getElementsByClassName("mySlides");
  for (i = 0; i < x.length; i++) {
    x[i].style.display = "none";
  }
  myIndex++;
  if (myIndex > x.length) {myIndex = 1}
  x[myIndex-1].style.display = "block";
  setTimeout(carousel, 7000);
}

function loadPage() {
	$("#pictureRotation").append(writePictureRotation());
	carousel();
	displayMain();
}

function displayMain() {
	window.scroll(0,0);
	$("#reverseProgBar").attr("style", "width: 100%");
	$("#home").show();
	$("#resume").hide();
	$("#projectsPage").hide();
	$("#titleBlock").empty();
	$("#titleBlock").append(writeTitleBlock1());
	$("#frontPageTextBody").empty();
	$("#frontPageTextBody").append(writeFrontPageTextBody1());
	$("#frontPageTextBody").append(writeFrontPageTextBody2());
}

function displayProjects() {
	window.scroll(0,0);
	$("#home").hide();
	$("#resume").hide();
	$("#projectsPage").show();
	$("#projects").empty();
	$("#projects").append(writeProjectsTitle());
	$("#projects").append(writeProjectsContent1());
	$("#classCode").empty();
	$("#classCode").append(writeCodeTitle());
	$("#classCode").append(writeCodeContent1());
	$("#classCode").append(writeCodeContent2());
	$("#classCode").append(writeCodeContent3());

	$("#reverseProgBar").attr("style", "width: 0%");
}

function displayResume() {
	window.scroll(0,0);
	$("#reverseProgBar").attr("style", "width: 100%");
	$("#home").hide();
	$("#resume").show();
	$("#resume").empty();
	$("#projectsPage").hide();
	$("#resume").append(writeResumeTitle());
	$("#resume").append(writeObjective());
	$("#resume").append(writeWorkExperience());
	$("#resume").append(writeEducation());
	$("#resume").append(writeLeadershipExperience());
	$("#resume").append(writeResumeProjects());
	$("#resume").append(writeSkillsInterests());
	$("#resume").append(writeFooters());
}



//Front Page Functions
function writePictureRotation() {
	return '<br><br><img class="mySlides roundedDiv" src="./Photos/webpic1.jpg" align="middle"><img class="mySlides roundedDiv" src="./Photos/webpic2.jpg" align="middle"><img class="mySlides roundedDiv" src="./Photos/webpic3.jpg" align="middle"><img class="mySlides roundedDiv" src="./Photos/webpic4.jpg" align="middle">'
}

function writeTitleBlock1() {
	return '<h2>Jared Raiola</h2>'
}

function writeFrontPageTextBody1() {
	return "<div id='bodyText1' class='card roundedDiv' style='background-color: white;'><h3>About Me</h3><p>I am a Senior attending <b>Georgia Institute of Technology</b> majoring in <b>computer science</b>. My hobbies include hiking, skiing, traveling, playing music and playing with dogs! Throughout my life, I've been raised to help others and dedicate myself fully to any project that is at hand. This has led to my participation in leadership programs in Washington D.C.'s People To People, and having performed community service in Boston and New Orleans, rebuilding communities in both areas. Throughout my career at Mahopac High School I've led my school's sax quartet, participated in the jazz and marching bands, created a taco club, and was the captain of the tennis team. In college, I've joined the iOS development club, orgT caving, and Delta Upsilon fraternity. I actively participate in all of these organizations and have taken a leadership role in my fraternity as Assistant House Manager. One of my major goals in life is to travel the world, because it's very important to learn about and be appreciative of other cultures and idealogies.Thank you for taking the time to check out my website and learn a little bit more about me! Here you'll find links to my GitHub, LinkedIn, Resume, and my Projects.</p></div>"
}

function writeFrontPageTextBody2() {
	return "<div id='bodyText1' class='card roundedDiv' style='background-color: rgb(245,245,245);'><h3>Why I Chose Computer Science</h3><p>I’ve been interested in computers ever since childhood, but I really decided upon it as a career choice in my senior year at Mahopac High School when I took my first programming class in C++. Since then, I’ve been hooked. I love the challenge of learning new languages and how machines communicate with each other. I'm very interested in delving further into the field of Cyber Security, web and mobile development, perhaps even a combination of the three. I'm excited to further my education in these subjects and broaden my knowledge of the field of Computer Science.</p></div>"
}



//projects page functions
function writeProjectsTitle() {
	return "<br><br><div id='projectsPage' class='card dropDivGoodPadding clickable' onclick=listForOpenSesame('projPageTitle',['firstProjTitle'],['firstProjBody']); style='max-width:975px; text-align: left;'><h2><div id='projPageTitle'>Personal Projects ▼</div></h2></div>"
}

function writeProjectsContent1() {
	return "<div class='card dropDivCode' style='max-width:975px; background-color: white; text-align: left;'><h3><div onclick=openSesame('firstProjTitle','firstProjBody',600,true); id='firstProjTitle' class='clickable'>Simple formatting GUI ▼</div></h3><div id='firstProjBody' style='display: none;'><p>This is a simple program designed to format word documents and calculate prices. It works by allowing users to input labor hours, price per unit, and number of units. The program then takes these elements, calculates the job cost and formats it into a word document (.docx file), allowing for easy editing of the final product. This project was originally designed to be a personalized system for a small construction company to help streamline the time taken to create proposals and deliver them to customers.</p></div></div><br>"
}

function writeProjectsContent2() {
	return ""
}



//class code page functions
function writeCodeTitle() {
	return "<div id='classCodePage' class='card dropDivGoodPadding clickable' onclick=listForOpenSesame('workCodeTitle',['firstCodeTitle','secondCodeTitle','thirdCodeTitle'],['firstCodeBody','secondCodeBody','thirdCodeBody']); style='max-width:975px; text-align: left;'><h2><div id='workCodeTitle'>Work Projects ▼</div></h2></div>"
}

function writeCodeContent1() {
	return "<div class='card dropDivCode' style='max-width:975px; background-color: white; text-align: left;'><h3><div onclick=openSesame('firstCodeTitle','firstCodeBody',600,true); id='firstCodeTitle' class='clickable'>Locator ▼</div></h3><div id='firstCodeBody' style='display: none;'><p><b>Locator</b> is a web application created using PHP, HTML, CSS, SQL and JavaScript designed to allow users to interact with a dynamic sign out sheet. It is currently being used on an IIS server for the Putnam County Office of IT/GIS.</p><p>Notable Features:</p><p><blockquote>o Ability to change user picture</blockquote><blockquote>o Ability to track sign out of company car, including mileage, time/date, user who signed out the car, and destination</blockquote><blockquote>o Ability to allow user to enter location not specified on preset buttons</blockquote></p><button class='codeDownloadButton' onclick=window.open('https://github.com/JaredRaiola/PC/tree/master/Locator')>Open Me!</button></div></div>"
}

function writeCodeContent2() {
	return "<div class='card dropDivCode' style='max-width:975px; background-color: rgb(245,245,245); text-align: left;'><h3><div onclick=openSesame('secondCodeTitle','secondCodeBody',600,true);  id='secondCodeTitle' class='clickable'>Observe ▼</div></h3><div id='secondCodeBody' style='display: none;'><p><b>Observe</b> is a python application designed to allow users to download the html of a webpage, create a local file, and take a screenshot of that local file. This is essentially the same thing as taking a screenshot of a webpage. However, recreating the page locally is currently preferred, due to circumventing loading errors.</p><p>Notable Features:</p><p><blockquote>o Ability to change login per website</blockquote><blockquote>o Ability to attempt a screenshot multiple times</blockquote><blockquote>o Continuously will reaccess the page over a set period of time until application is exited</blockquote></p><button class='codeDownloadButton' onclick=window.open('https://github.com/JaredRaiola/PC/tree/master/Observe')>Open Me!</button></div></div>"
}

function writeCodeContent3() {
	return "<div class='card dropDivCode' style='max-width:975px; background-color: white; text-align: left;'><h3><div onclick=openSesame('thirdCodeTitle','thirdCodeBody',600,true); id='thirdCodeTitle' class='clickable'>ClassroomCopy and ClassroomDelete ▼</div></h3><div id='thirdCodeBody' style='display: none;'><p><b>ClassroomCopy</b> is a powershell application designed to allow users to input a specific file path source, copy all files from that location, and paste them in a specified destination.</p><p>Notable Features:</p><p><blockquote>o Ability to change source and destination based off input in a .txt file. This will soon change to selecting paths using powershell OpenFileDialog) </blockquote></p><p><b>ClassroomDelete</b> is a powershell application designed to allow users to input a specific file path source and delete all files from that location.</p><p>Notable Features:</p><p><blockquote>o Ability to change source based off input in a .txt file. This will soon change to selecting paths using powershell OpenFileDialog) </blockquote></p><button class='codeDownloadButton' onclick=window.open('https://github.com/JaredRaiola/PC/tree/master/Copy%20and%20Delete')>Open Me!</button></div></div>"
}









//Resume Page Functions
function writeResumeTitle() {
	return '<br><br><div id="resumePage" class="dropDivGoodPadding card clickable" onclick=listForOpenSesame("resTitle",["objTitle","workTitle","eduTitle","leadTitle","resProjTitle","skillTitle"],["objBody","workBody","eduBody","leadBody","resProjBody","skillBody"]); style="max-width:975px;background-color: white; text-align: left;"><h2><gara><strong><div id="resTitle">Jared Raiola ▼</div></strong></gara></h2><p>jraiola3@gatech.edu ✦ (845) 490-7692 ✦ Mahopac, New York</p></div></div>'
}

function writeObjective() {
	return '<div id="resObj" class="dropDiv card" style="max-width:975px;background-color: rgb(245, 245, 245); text-align: left;"><p><strong><div onclick=openSesame("objTitle","objBody",600,true); id="objTitle" class="clickable">OBJECTIVE ▼</div></strong><div id="objBody" style="display: none;"><hr></p><p>Undergraduate student looking to obtain employment that enables my knowledge of computer science along with use of communication, creativity, and teamwork to help provide a competitive advantage, as well as help provide continued company success</p></div></div>'
}
function writeWorkExperience() {
	return '<div id="resWork" class="dropDiv card" style="max-width:975px;background-color: white; text-align: left;"><p><strong><div onclick=openSesame("workTitle","workBody",600,true); id="workTitle" class="clickable">WORK EXPERIENCE ▼</div></strong><div id="workBody" style="display: none;"><hr></p><p><strong>Putnam County PILOT Program (June – August 2019)</strong></p><p>➤ <em>Office of IT/GIS Intern (Mahopac, NY)</em></p><p> <blockquote>o	Created workplace applications to perform a variety of tasks. <blockquote>■ <u>Locator:</u> Web application created using PHP, JavaScript, SQL, HTML and CSS to create a dynamic sign out application to show the location of everyone in the office.</blockquote> <blockquote>■ <u>Observe:</u> Simple screenshot application in python that logs into a website and copies the html to a local file in order to create a proper page screenshot of that local file.</blockquote> <blockquote>■ <u>ClassroomCopy and ClassroomDelete:</u> Simple powershell scripts to access a source file path, copy all files in that region, paste them at a specific destination and delete them from original source.</blockquote></blockquote></p><p><strong>Total Concept Builders (Summers 2013 – 2019)</strong></p><p>➤ <em>General Laborer (Mahopac, NY)</em></p><p> <blockquote>o Performed interior and exterior renovations, installed windows, doors, cabinets, worked with team of people, also responsible for transportation and organization of construction materials</blockquote></p><p><strong>Kobu Asian Bistro (May 2015 – August 2019)</strong></p><p>➤ <em>Bartender/Waiter (Mahopac, NY)</em></p><p><blockquote>o Coordinated seating, serving, interacting with customers, served drinks, general foodstuff and restaurant goods maintenance and replenishment</blockquote></p></div></div>'
}

function writeEducation() {
	return '<div id="resEdu" class="dropDiv card" style="max-width:975px;background-color: rgb(245, 245, 245); text-align: left;"><p><strong><div onclick=openSesame("eduTitle","eduBody",600,true);  id="eduTitle" class="clickable">EDUCATION ▼</div></strong><div id="eduBody" style="display: none;"><hr></p><p><strong></strong></p><p><strong>Georgia Institute of Technology (May 2021) </strong></p><p><em>Bachelor of Science, Computer Science Atlanta, GA</em></p><p>➤ Focus Curriculum</p><blockquote>o Information Infonetworks: Capturing, representing, organizing, transforming, communicating, and presenting data so that it becomes information.</blockquote><blockquote>o Systems and Architecture: The organization of computer systems and how they are built.</blockquote><p>Coursework: Databases, Project Design and Implementation, Computer Networking, Algorithms, Web Application design, Compilers and Interpreters design, Processor Design, Object Oriented Programming, Discrete Mathematics, Combinatorics</p><p><strong>Mahopac National Honor Society, Top 10% (June 2017) </strong></p></div></div>'
}

function writeLeadershipExperience() {
	return '<div id="resLead" class="dropDiv card" style="max-width:975px;background-color: white; text-align: left;"><p><strong><div onclick=openSesame("leadTitle","leadBody",600,true); id="leadTitle" class="clickable">LEADERSHIP EXPERIENCE ▼</div></strong><div id="leadBody" style="display: none;"><hr></p><p>➤ <strong>People to People Leadership Ambassador Program (2009-2011)</strong></p><p>    <blockquote>o Volunteer work in various underserved communities, trained to take on leadership role</blockquote></p><p>➤ <strong>Delta Upsilon Fraternity Regional Leadership Academy</strong></p><p>➤ <strong>Delta Upsilon Fraternity Assistant House Manager</strong></p></div></div>'
}

function writeResumeProjects() {
	return '<div id="resProj" class="dropDiv card"  style="max-width:975px;background-color: rgb(245, 245, 245); text-align: left;"><p><strong><div onclick=openSesame("resProjTitle","resProjBody",600,true); id="resProjTitle" class="clickable">PROJECTS ▼</div></strong><div id="resProjBody" style="display: none;"><hr></p><p>➤ <strong>GUI Format Files Program:</strong></p><p><blockquote>o Small project, created to help a small construction company format work proposal forms</blockquote></p><p><blockquote>o Written in Python, this program will take user input and calculate labor hours, unit cost, and format it into a word document for easy access and    use</blockquote></p><p>➤ <strong>Kotlin Framework (in Progress):</strong></p><p><blockquote>o Creating own person web development framework with Kotlin</blockquote></p></div></div>'
}

function writeSkillsInterests() {
	return '<div id="resSkill" class="dropDiv card"  style="max-width:975px;background-color: white; text-align: left;"><p><strong><div onclick=openSesame("skillTitle","skillBody",600,true); id="skillTitle" class="clickable">SKILLS &amp; INTERESTS ▼</div></strong><div id="skillBody" style="display: none;"><hr></p><p>➤ <strong> Skills: </strong>Java; C++; Python; Swift; (currently learning) Scala; Microsoft Office; general public</p><p>➤ <strong> Interests:</strong> iOS development; cyber security; video game development; musician; traveling; skiing; hiking; tennis</p><p><strong></strong></p></div></div>'
}

function writeFooters() {
	return '<div id="resFoot" class="dropDiv card smallfoot" style="max-width:975px;background-color: rgb(245, 245, 245); text-align: center;"><p>LinkedIn:<a href="https://www.linkedin.com/in/jared-raiola/">https://www.linkedin.com/in/jared-raiola/</a>✦ GitHub:<a href="https://github.com/JaredRaiola">https://github.com/JaredRaiola</a>✦ My Website: <a href="http://jaredraiola.me/">http://jaredraiola.me/</a></p></div><div id="resumeButton" class="resFooter"><a href="./Jared-Raiola-Resume.pdf" class="downloadButton" download><i class="fa fa-cloud-download"></i>&nbsp;&nbsp;Click here to download the most current resume as a PDF!&nbsp;&nbsp;<i class="fa fa-cloud-download"></i></a><br><br><br></div>'
}








function listForOpenSesame(pageTitleDiv, titleList, sectionList) {
	var tf = true;
	for (var section of sectionList) {
		if (!($("#" + section).is(":hidden"))) {
			tf = false;
		}
	}
	var currHTML = $("#" + pageTitleDiv).html();
	if (tf) {
		var newHTML = currHTML.replace("▼", "▲");
	} else {
		var newHTML = currHTML.replace("▲", "▼");
	}
	$("#" + pageTitleDiv).html(newHTML);
	for (var i = 0; i < titleList.length; i++) {
		openSesame(titleList[i], sectionList[i], 400, tf)
	}
}

function openSesame(parentDiv, divToOpen, speed, tf) {
	var currHTML = $("#" + parentDiv).html();
	var div = "#" + divToOpen;
  if (tf && $(div).is(":hidden")) {
    $(div).slideDown(speed);
    var newHTML = currHTML.replace("▼", "▲");
  } else {
    $(div).slideUp(speed);
    var newHTML = currHTML.replace("▲", "▼");
  }
  $("#" + parentDiv).html(newHTML);
}


//creating progress bar automatically
$(document).scroll(function() { 
  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  var scrolled = 100 - ((winScroll / height) * 100);
  if (scrolled < .05) {
  	scrolled = 0;
  }
  document.getElementById("reverseProgBar").style.width = scrolled + "%";
});