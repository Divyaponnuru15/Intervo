// 
// ATS DETAILS PAGE
// 


// 
// GET SAVED ATS DATA
// 

const atsScore =
    localStorage.getItem("ats_score");

const atsAnalysisJSON =
    localStorage.getItem("ats_analysis");


// 
// CHECK ATS DATA
// 

if (!atsScore || !atsAnalysisJSON) {

    alert(
        "No ATS analysis found. Please analyze your resume first."
    );

    window.location.href =
        "dashboard.html";

}


// 
// PARSE ATS ANALYSIS
// 

let atsAnalysis;

try {

    atsAnalysis =
        JSON.parse(atsAnalysisJSON);

} catch (error) {

    console.error(
        "Failed to parse ATS analysis:",
        error
    );

    alert(
        "Invalid ATS analysis data."
    );

    window.location.href =
        "dashboard.html";

}


// 
// HELPER — DISPLAY LIST
// 

function displayList(
    elementId,
    items
) {

    const element =
        document.getElementById(elementId);


    if (!element) {
        return;
    }


    element.innerHTML = "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        const li =
            document.createElement("li");

        li.textContent =
            "No information available.";

        element.appendChild(li);

        return;
    }


    items.forEach(function (item) {

        const li =
            document.createElement("li");

        li.textContent =
            item;

        element.appendChild(li);

    });

}


// 
// ATS SCORE
// 

const scoreElement =
    document.getElementById(
        "detailATSScore"
    );


if (scoreElement) {

    scoreElement.textContent =
        atsScore;

}


// 
// ATS STATUS
// 

const statusElement =
    document.getElementById(
        "detailATSStatus"
    );


if (statusElement) {

    const score =
        Number(atsScore);


    if (score >= 80) {

        statusElement.textContent =
            "Strong ATS compatibility.";

    }

    else if (score >= 60) {

        statusElement.textContent =
            "Good resume, but there is room for improvement.";

    }

    else {

        statusElement.textContent =
            "Your resume needs improvement for better ATS compatibility.";

    }

}


// 
// SUMMARY
// 

const summaryElement =
    document.getElementById(
        "analysisSummary"
    );


if (summaryElement) {

    summaryElement.textContent =
        atsAnalysis.summary ||
        "No summary available.";

}


// 
// SKILLS
// 

displayList(
    "skillsList",
    atsAnalysis.skills || []
);


// 
// KEYWORDS
// 

displayList(
    "keywordsList",
    atsAnalysis.keywords || []
);


// 
// MISSING KEYWORDS
// 

displayList(
    "missingKeywordsList",
    atsAnalysis.missing_keywords || []
);


// 
// STRENGTHS
// 

displayList(
    "strengthsList",
    atsAnalysis.strengths || []
);


// 
// WEAKNESSES
// 

displayList(
    "weaknessesList",
    atsAnalysis.weaknesses || []
);


// 
// IMPROVEMENTS
// 

displayList(
    "improvementsList",
    atsAnalysis.improvements || []
);


// 
// SECTION SCORES
// 

const sections =
    atsAnalysis.sections || {};


// 
// CONTACT
// 

const contactScore =
    document.getElementById(
        "contactScore"
    );


if (contactScore) {

    contactScore.textContent =
        sections.contact !== undefined
            ? sections.contact + "%"
            : "--";

}


// 
// SUMMARY SECTION
// 

const summaryScore =
    document.getElementById(
        "summaryScore"
    );


if (summaryScore) {

    summaryScore.textContent =
        sections.summary !== undefined
            ? sections.summary + "%"
            : "--";

}


// 
// EDUCATION
// 

const educationScore =
    document.getElementById(
        "educationScore"
    );


if (educationScore) {

    educationScore.textContent =
        sections.education !== undefined
            ? sections.education + "%"
            : "--";

}


// 
// SKILLS SECTION
// 

const skillsSectionScore =
    document.getElementById(
        "skillsSectionScore"
    );


if (skillsSectionScore) {

    skillsSectionScore.textContent =
        sections.skills !== undefined
            ? sections.skills + "%"
            : "--";

}


// 
// EXPERIENCE
// 

const experienceScore =
    document.getElementById(
        "experienceScore"
    );


if (experienceScore) {

    experienceScore.textContent =
        sections.experience !== undefined
            ? sections.experience + "%"
            : "--";

}


// 
// PROJECTS
// 

const projectsScore =
    document.getElementById(
        "projectsScore"
    );


if (projectsScore) {

    projectsScore.textContent =
        sections.projects !== undefined
            ? sections.projects + "%"
            : "--";

}


// 
// DOWNLOAD ATS REPORT
// 
//
// IMPORTANT:
//
// Your current Flask backend does NOT have /ats-report.
//
// Therefore this function should NOT call /ats-report yet.
//
// We will add the ATS PDF backend endpoint next.
// 

async function downloadATSReport() {

    const token =
        localStorage.getItem("token");


    // =
    // CHECK LOGIN
    // =

    if (!token) {

        alert(
            "Your session has expired. Please login again."
        );

        window.location.href =
            "index.html";

        return;

    }


    // =
    // GET RESUME ID
    // =

    const resumeId =
        localStorage.getItem("resume_id");


    if (!resumeId) {

        alert(
            "Resume information not found."
        );

        return;

    }


    try {

        console.log(
            "Downloading ATS report..."
        );


        console.log(
            "Resume ID:",
            resumeId
        );


        const response =
            await fetch(
                "https://intervo-backend-okao.onrender.com/api/pdf/ats-report/" +
                 resumeId,
                {

                    method: "GET",

                    headers: {

                        "Authorization":
                            "Bearer " + token

                    }

                }
            );


        console.log(
            "ATS PDF response status:",
            response.status
        );


        // 
        // HANDLE ERROR
        // 

        if (!response.ok) {

            let errorMessage =
                "Failed to download ATS report.";

            try {

                const errorData =
                    await response.json();

                if (errorData.message) {

                    errorMessage =
                        errorData.message;

                }

            } catch (error) {

                console.error(
                    "Could not read error response:",
                    error
                );

            }

            throw new Error(
                errorMessage
            );

        }


        // 
        // CONVERT RESPONSE TO PDF
        // 

        const blob =
            await response.blob();


        const url =
            window.URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href =
            url;


        link.download =
            "Intervo_ATS_Report.pdf";


        document.body.appendChild(link);


        link.click();


        link.remove();


        window.URL.revokeObjectURL(url);


        console.log(
            "ATS report downloaded successfully."
        );

    }


    catch (error) {

        console.error(
            "ATS PDF download error:",
            error
        );


        alert(
            error.message ||
            "Unable to download ATS report."
        );

    }

}


// 
// BACK TO DASHBOARD
// 

function goBackToDashboard() {

    window.location.href =
        "dashboard.html";

}


// 
// DEBUG
// 

console.log(
    "ATS Score:",
    atsScore
);

console.log(
    "ATS Analysis:",
    atsAnalysis
);

console.log(
    "Login Token:",
    localStorage.getItem("token")
);

console.log(
    "Resume ID:",
    localStorage.getItem("resume_id")
);

