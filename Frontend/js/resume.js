
// ====
// RESUME FILE SELECTION
// ====

const resumeFile =
    document.getElementById("resumeFile");

const selectedFileName =
    document.getElementById("selectedFileName");


if (resumeFile) {

    resumeFile.addEventListener(
        "change",
        function () {

            if (this.files.length > 0) {

                selectedFileName.textContent =
                    this.files[0].name;

            } else {

                selectedFileName.textContent = "";

            }

        }
    );

}


// ====
// UPDATE ATS RESULT
// ====

function updateATSResult(
    atsScore,
    atsAnalysis
) {

    console.log(
        "Updating ATS result:",
        atsScore,
        atsAnalysis
    );


    // 
    // ATS SCORE
    // 

    const atsScoreElement =
        document.getElementById("atsScore");

    if (atsScoreElement) {

        atsScoreElement.textContent =
            atsScore;

    }


    // 
    // KEYWORDS
    // 

    const keywordsElement =
        document.getElementById("atsKeywords");

    if (keywordsElement) {

        const keywords =
            atsAnalysis.keywords || [];

        keywordsElement.textContent =
            keywords.length > 0
                ? Math.min(
                    100,
                    keywords.length * 5
                ) + "%"
                : "0%";

    }


    // 
    // SKILLS
    // 

    const skillsElement =
        document.getElementById("atsSkills");

    if (skillsElement) {

        const skills =
            atsAnalysis.skills || [];

        skillsElement.textContent =
            skills.length > 0
                ? Math.min(
                    100,
                    skills.length * 8
                ) + "%"
                : "0%";

    }


    // 
    // PROJECTS
    // 

    const projectsElement =
        document.getElementById("atsProjects");

    if (projectsElement) {

        const projectScore =
            atsAnalysis.sections &&
            atsAnalysis.sections.projects !== undefined
                ? atsAnalysis.sections.projects
                : 0;

        projectsElement.textContent =
            projectScore + "%";

    }


    // 
    // STRUCTURE
    // 

    const structureElement =
        document.getElementById("atsStructure");

    if (structureElement) {

        const sections =
            atsAnalysis.sections || {};

        const sectionScores = [

            sections.contact || 0,

            sections.summary || 0,

            sections.education || 0,

            sections.skills || 0,

            sections.experience || 0,

            sections.projects || 0

        ];


        const total =
            sectionScores.reduce(
                (sum, score) =>
                    sum + score,
                0
            );


        const structureScore =
            Math.round(
                total /
                sectionScores.length
            );


        structureElement.textContent =
            structureScore + "%";

    }

}


// ====
// UPLOAD RESUME
// ====
//
// IMPORTANT:
// This function ONLY uploads the resume.
//
// It does NOT call Gemini.
//
// Gemini is called by analyzeResume() below.
//
// ====

async function uploadResume() {

    const fileInput =
        document.getElementById("resumeFile");

    const uploadMessage =
        document.getElementById("uploadMessage");

    const file =
        fileInput.files[0];


    // 
    // CHECK FILE
    // 

    if (!file) {

        uploadMessage.textContent =
            "Please select a resume.";

        return;
    }


    // 
    // CHECK FILE TYPE
    // 

    const allowedTypes = [

        "application/pdf",

        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    ];


    if (!allowedTypes.includes(file.type)) {

        uploadMessage.textContent =
            "Only PDF and DOCX files are allowed.";

        return;
    }


    // 
    // CHECK FILE SIZE
    // 

    const maxSize =
        10 * 1024 * 1024;


    if (file.size > maxSize) {

        uploadMessage.textContent =
            "File size must be 10MB or less.";

        return;
    }


    // 
    // GET TOKEN
    // 

    const token =
        localStorage.getItem("token");


    if (!token) {

        window.location.href =
            "index.html";

        return;
    }


    // 
    // PREPARE FORM DATA
    // 

    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    try {

        // =================================================
        // UPLOADING
        // =================================================

        uploadMessage.textContent =
            "Uploading resume...";


        const uploadResponse =
            await fetch(
                "http://127.0.0.1:5000/upload-resume",
                {

                    method: "POST",

                    headers: {

                        "Authorization":
                            "Bearer " + token

                    },

                    body: formData

                }
            );


        const uploadData =
            await uploadResponse.json();


        console.log(
            "Upload response:",
            uploadData
        );


        // =================================================
        // CHECK RESPONSE
        // =================================================

        if (!uploadResponse.ok) {

            uploadMessage.textContent =
                uploadData.message ||
                "Resume upload failed.";

            return;
        }


        // =================================================
        // SAVE RESUME ID
        // =================================================

        const resumeId =
            uploadData.resume_id;


        localStorage.setItem(
            "resume_id",
            resumeId
        );


        // =================================================
        // RESET PREVIOUS ATS DATA
        // =================================================

        localStorage.removeItem(
            "ats_score"
        );

        localStorage.removeItem(
            "ats_analysis"
        );


        // =================================================
        // RESET ATS UI
        // =================================================

        const atsScoreElement =
            document.getElementById("atsScore");

        if (atsScoreElement) {

            atsScoreElement.textContent =
                "--";

        }


        const atsKeywords =
            document.getElementById("atsKeywords");

        if (atsKeywords) {

            atsKeywords.textContent =
                "--%";

        }


        const atsSkills =
            document.getElementById("atsSkills");

        if (atsSkills) {

            atsSkills.textContent =
                "--%";

        }


        const atsProjects =
            document.getElementById("atsProjects");

        if (atsProjects) {

            atsProjects.textContent =
                "--%";

        }


        const atsStructure =
            document.getElementById("atsStructure");

        if (atsStructure) {

            atsStructure.textContent =
                "--%";

        }


        // =================================================
        // SUCCESS
        // =================================================

        uploadMessage.textContent =
            "Resume uploaded successfully.";


        // =================================================
        // ENABLE ANALYZE BUTTON
        // =================================================

        const analyzeButton =
            document.getElementById("analyzeResumeButton");


        if (analyzeButton) {

            analyzeButton.disabled =
                false;

            analyzeButton.style.display =
                "inline-flex";

        }


        // =================================================
        // UPDATE PROGRESS
        // =================================================

        const progressBar =
            document.getElementById("progressBar");

        const progressStatus =
            document.getElementById("progressStatus");


        if (progressBar) {

            progressBar.style.width =
                "100%";

        }


        if (progressStatus) {

            progressStatus.textContent =
                "Resume uploaded. Analyze it when you're ready.";

        }


        // =================================================
        // SHOW INTERVIEW SECTION
        // =================================================

        const categorySection =
            document.getElementById(
                "categorySection"
            );


        if (categorySection) {

            categorySection.style.display =
                "block";

        }

    }


    catch (error) {

        console.error(
            "Resume Upload Error:",
            error
        );


        uploadMessage.textContent =
            "Server connection failed.";

    }

}


// ====
// ANALYZE RESUME
// ====
//
// This function is called ONLY when the user clicks:
//
//              "Analyze Resume"
//
// ====

async function analyzeResume() {

    const resumeId =
        localStorage.getItem("resume_id");


    const token =
        localStorage.getItem("token");


    const uploadMessage =
        document.getElementById("uploadMessage");


    // 
    // CHECK LOGIN
    // 

    if (!token) {

        window.location.href =
            "index.html";

        return;
    }


    // 
    // CHECK RESUME
    // 

    if (!resumeId) {

        uploadMessage.textContent =
            "Please upload your resume first.";

        return;
    }


    try {

        // =================================================
        // ANALYZING
        // =================================================

        uploadMessage.textContent =
            "Analyzing your resume with AI...";


        const analyzeButton =
            document.getElementById(
                "analyzeResumeButton"
            );


        if (analyzeButton) {

            analyzeButton.disabled =
                true;

            analyzeButton.textContent =
                "Analyzing...";

        }


        // =================================================
        // CALL BACKEND
        // =================================================

        const response =
            await fetch(

                `http://127.0.0.1:5000/analyze-resume/${resumeId}`,

                {

                    method: "POST",

                    headers: {

                        "Authorization":
                            "Bearer " + token

                    }

                }

            );


        const data =
            await response.json();


        console.log(
            "ATS Analysis Response:",
            data
        );


        // =================================================
        // CHECK RESPONSE
        // =================================================

        if (!response.ok) {

            uploadMessage.textContent =
                data.message ||
                "Resume analysis failed.";

            return;
        }


        // =================================================
        // CHECK ATS DATA
        // =================================================

        if (
            data.ats_score === undefined ||
            !data.ats_analysis
        ) {

            uploadMessage.textContent =
                "ATS analysis data was not returned.";

            return;
        }


        // =================================================
        // SAVE ATS DATA
        // =================================================

        localStorage.setItem(
            "ats_score",
            data.ats_score
        );


        localStorage.setItem(
            "ats_analysis",
            JSON.stringify(
                data.ats_analysis
            )
        );


        // =================================================
        // UPDATE ATS UI
        // =================================================

        updateATSResult(

            data.ats_score,

            data.ats_analysis

        );


        // =================================================
        // SUCCESS
        // =================================================

        uploadMessage.textContent =
            "Resume analyzed successfully.";


        // =================================================
        // SHOW VIEW DETAILS BUTTON
        // =================================================

        const viewDetailsButton =
            document.getElementById(
                "viewATSDetailsButton"
            );


        if (viewDetailsButton) {

            viewDetailsButton.style.display =
                "inline-flex";

        }

    }


    catch (error) {

        console.error(
            "ATS Analysis Error:",
            error
        );


        uploadMessage.textContent =
            "Server connection failed.";

    }


    finally {

        const analyzeButton =
            document.getElementById(
                "analyzeResumeButton"
            );


        if (analyzeButton) {

            analyzeButton.disabled =
                false;

            analyzeButton.textContent =
                "Analyze Resume";

        }

    }

}


// ====
// VIEW ATS DETAILS
// ====
//
// This opens the detailed ATS result page.
//
// ====

function viewATSDetails() {

    const resumeId =
        localStorage.getItem("resume_id");


    if (!resumeId) {

        return;
    }


    window.location.href =
        "ats-details.html";

}

