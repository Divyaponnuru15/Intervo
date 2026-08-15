// 
// INTERVO - INTERVIEW MODE
// 

const category 
    localStorage.getItem("interview_category");


// 
// GET ELEMENTS
// 

const selectedInterview 
    document.getElementById("selectedInterview");

const textInterviewButton 
    document.getElementById("textInterviewButton");

const voiceInterviewButton 
    document.getElementById("voiceInterviewButton");


// 
// CHECK CATEGORY
// 

if (!category) {

    window.location.href 
        "dashboard.html";

}


// 
// DISPLAY CATEGORY
// 

selectedInterview.textContent 
    `${category} Interview`;


// 
// TEXT INTERVIEW
// 

textInterviewButton.addEventListener(
    "click",
    function () {

        localStorage.setItem(
            "interview_mode",
            "text"
        );

        window.location.href 
            "interview.html";

    }
);


// 
// VOICE INTERVIEW
// 

voiceInterviewButton.addEventListener(
    "click",
    function () {

        localStorage.setItem(
            "interview_mode",
            "voice"
        );

        window.location.href 
            "voice.html";

    }
);