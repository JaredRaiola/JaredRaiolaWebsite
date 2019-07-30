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
	$("#projects").hide();
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
	$("#projects").show();
	$("#projects").empty();
	$("#projects").append(writeProjectsTitle());
	$("#projects").append(writeProjectsContent1());
	$("#projects").append(writeProjectsContent2());

	$("#reverseProgBar").attr("style", "width: 0%");
}

function displayResume() {
	window.scroll(0,0);
	$("#reverseProgBar").attr("style", "width: 100%");
	$("#home").hide();
	$("#resume").show();
	$("#resume").empty();
	$("#projects").hide();
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
	return "<div id='bodyText1' class='card roundedDiv' style='background-color: white;'><h3>About Me</h3><p>I am a sophomore attending <b>Georgia Institute of Technology</b> majoring in <b>computer science</b>. My hobbies include hiking, skiing, traveling, playing music and playing with dogs! Throughout my life, I've been raised to help others and dedicate myself fully to any project that is at hand. Due to this, I've taken a leadership program in Washington D.C. (People To People), and have performed community service in Boston and New Orleans, to help rebuild communities in both areas. Throughout my high school career at Mahopac High School I've led my school's sax quartet, participated in the jazz and marching bands, created a taco club, and became the captain of the tennis team. In college, I've joined the iOS development club, orgT caving, and Delta Upsilon fraternity. I actively participate in all of these organizations and have taken a leadership role in my fraternity as Assistant House Manager. One of my major goals in life is to travel the world, as I believe it's very important to learn about and be appreciative of other cultures and idealogies.Thank you for taking the time to check out my website and learn a little bit more about me! Here you you'll find links my GitHub, LinkedIn, Resume, and my Projects.</p></div>"
}

function writeFrontPageTextBody2() {
	return "<div id='bodyText1' class='card roundedDiv' style='background-color: rgb(245,245,245);'><h3>Why I Chose to Major in Computer Science</h3><p>I’ve been interested in computers ever since childhood, but I really decided upon it as a career choice in my senior year at Mahopac High School, where I took my first programming class in C++. Since then, I’ve been hooked. I love the challenge of learning new languages and how machines communicate with each other. I'm very interested in delving further into the field of Cyber Security and mobile development, perhaps even a combination of the two. I believe that mobile devices are the future, as technology advances. </p></div>"
}



//projects page functions
function writeProjectsTitle() {
	return "<br><br><div id='projectsPage' class='card dropDivGoodPadding' onclick=listForOpenSesame('projPageTitle',['firstProjTitle','secondProjTitle'],['firstProjBody','secondProjBody']); style='max-width:975px; text-align: left;'><h2><div id='projPageTitle'>My Projects ▲</div></h2></div>"
}
function writeProjectsContent1() {
	return "<div class='card dropDivGoodPadding' onclick=openSesame('firstProjTitle','firstProjBody',600,true); style='max-width:975px; background-color: white; text-align: left;'><h3><div id='firstProjTitle'>8-Bit RPG iOS Application ▲</div></h3><div id='firstProjBody'><p>  I'm currently working on an iOS application that is in it's very early development stages. The reason I chose this project was to stretch my creative muscles and   put my knowledge of the Swift language into pratice and test my ability to create a game that is multifaceted.  This game will take the style of the typical dungeon clearing game, with a main storyline that the player can progress through in  a closed world format. </p></div></div>"
}

function writeProjectsContent2() {
	return "<div class='card dropDivGoodPadding' onclick=openSesame('secondProjTitle','secondProjBody',600,true); style='max-width:975px; background-color: rgb(245, 245, 245); text-align: left;'><h3><div id='secondProjTitle'>Simple formatting GUI ▲</div></h3><div id='secondProjBody'><p>I'm also working on a simple GUI in python, specifically designed to format word documents and calculate prices. It will work by allowing users to input labor hours, price per unit, and number of units. The program will then take these elements, calculate the job cost and format it into a word document (.docx file), allowing for easy editing of the final product. This project is originally designed to be a personalized system for a small construction company to help streamline the time taken to create proposals and deliver them to customers. After completetion, I intend to make this project more generalized,creating a way to choose between preset styles and create personalized styles and formats.</p></div></div>"
}













//Resume Page Functions
function writeResumeTitle() {
	return '<br><br><div id="resumePage" class="dropDivGoodPadding card" onclick=listForOpenSesame("resTitle",["objTitle","workTitle","eduTitle","leadTitle","resProjTitle","skillTitle"],["objBody","workBody","eduBody","leadBody","resProjBody","skillBody"]); style="max-width:975px;background-color: white; text-align: left;"><h2><gara><strong><div id="resTitle">Jared Raiola ▼</div></strong></gara></h2><p>jraiola3@gatech.edu ✦ (845) 490-7692 ✦ Mahopac, New York</p></div></div>'
}

function writeObjective() {
	return '<div id="resObj" class="dropDiv card" onclick=openSesame("objTitle","objBody",600,true); style="max-width:975px;background-color: rgb(245, 245, 245); text-align: left;"><p><strong><div id="objTitle">OBJECTIVE ▼</div></strong><div id="objBody" style="display: none;"><hr></p><p><strong></strong></p><p>Undergraduate student looking to obtain employment that enables my knowledge of computer science along with use of communication, creativity, and teamwork to help provide a competitive advantage, as well as help provide continued company success</p><p><strong></strong></p></div></div>'
}
function writeWorkExperience() {
	return '<div id="resWork" class="dropDiv card" onclick=openSesame("workTitle","workBody",600,true); style="max-width:975px;background-color: white; text-align: left;"><p><strong><div id="workTitle">WORK EXPERIENCE ▼</div></strong><div id="workBody" style="display: none;"><hr></p><p><strong><u></u></strong></p><p><strong>Total Concept Builders Summers 2013 – 2018</strong></p><p><em>General Laborer</em><em> Mahopac, NY</em></p><p>➤ Performed interior and exterior renovations, installed windows, doors, cabinets, worked with team of people, also responsible for transportation and organization of construction materials</p><p><strong>Kobu Asian Bistro May 2015 – June 2017</strong></p><p><em>Waiter</em><em> Mahopac, NY</em></p><p>➤ Coordinated seating, serving, interacting with customers, general foodstuff and restaurant goods maintenance and replenishment</p><p><strong></strong></p></div></div>'
}

function writeEducation() {
	return '<div id="resEdu" class="dropDiv card" onclick=openSesame("eduTitle","eduBody",600,true); style="max-width:975px;background-color: rgb(245, 245, 245); text-align: left;"><p><strong><div id="eduTitle">EDUCATION ▼</div></strong><div id="eduBody" style="display: none;"><hr></p><p><strong></strong></p><p><strong>Georgia Institute of Technology May, 2021 </strong></p><p><em>BS, Computer Science Sophomore Atlanta, GA</em></p><p>➤ Delta Upsilon Fraternity Assistant House Manager</p><p><strong>Mahopac National Honor Society, Top 10% June 2017 </strong><strong></strong></p></div></div>'
}

function writeLeadershipExperience() {
	return '<div id="resLead" class="dropDiv card" onclick=openSesame("leadTitle","leadBody",600,true); style="max-width:975px;background-color: white; text-align: left;"><p><strong><div id="leadTitle">LEADERSHIP EXPERIENCE ▼</div></strong><div id="leadBody" style="display: none;"><hr></p><p><u></u></p><p>➤ <strong>People to People Leadership Ambassador Program (2009-2011)</strong></p><p>    <blockquote>o Volunteer work in various underserved communities, trained to take on leadership role</blockquote></p><p>➤ <strong>Leader of Mahopac High School Sax Quartet</strong></p><p><blockquote>o Managed musical gigs and practice schedules</blockquote></p><p>➤ <strong>Delta Upsilon Fraternity Regional Leadership Academy</strong></p></div></div>'
}

function writeResumeProjects() {
	return '<div id="resProj" class="dropDiv card" onclick=openSesame("resProjTitle","resProjBody",600,true); style="max-width:975px;background-color: rgb(245, 245, 245); text-align: left;"><p><strong><div id="resProjTitle">PROJECTS ▼</div></strong><div id="resProjBody" style="display: none;"><hr></p><p><u></u></p><p>➤ <strong>8-Bit RPG iOS Application(In Progress):</strong></p><p><blockquote>o Closed World dungeon clearing game with a main storyline written in Swift</blockquote></p><p>➤ <strong>GUI Format Files Program(In Progress):</strong></p><p><blockquote>o Small project, created to help a small construction company format work proposal forms</blockquote></p><p><blockquote>o Written in Python, this program will take user input and calculate labor hours, unit cost, and format it into a word document for easy access and    use</blockquote></p></div></div>'
}

function writeSkillsInterests() {
	return '<div id="resSkill" class="dropDiv card" onclick=openSesame("skillTitle","skillBody",600,true); style="max-width:975px;background-color: white; text-align: left;"><p><strong><div id="skillTitle">SKILLS &amp; INTERESTS ▼</div></strong><div id="skillBody" style="display: none;"><hr></p><p><u></u></p><p>➤ <strong> Skills: </strong>Java; C++; Python; Swift; (currently learning) Scala; Microsoft Office; general public</p><p>➤ <strong> Interests:</strong> iOS development; cyber security; video game development; musician; traveling; skiing; hiking; tennis</p><p><strong></strong></p><p><u></u></p></div></div>'
}

function writeFooters() {
	return '<div id="resFoot" class="dropDiv card smallfoot" style="max-width:975px;background-color: rgb(245, 245, 245); text-align: center;"><p>LinkedIn:<a href="https://www.linkedin.com/in/jared-raiola/">https://www.linkedin.com/in/jared-raiola/</a>✦ GitHub:<a href="https://github.com/JaredRaiola">https://github.com/JaredRaiola</a>✦ My Website: <a href="http://jaredraiola.me/">http://jaredraiola.me/</a></p></div><div id="resumeButton" class="resFooter"><a href="./Jared-Raiola-Resume.pdf" class="downloadButton" download><i class="fa fa-cloud-download"></i>&nbsp;&nbsp;Click here to download this resume as a PDF!&nbsp;&nbsp;<i class="fa fa-cloud-download"></i></a><br><br><br></div>'
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