// ============================================================
// INTERVO - RESUME
// ============================================================


// ============================================================
// API CONFIGURATION
// ============================================================

const RESUME_API_BASE_URL =
    "https://intervo-backend-okao.onrender.com";


// ============================================================
// RESUME FILE SELECTION
// ============================================================

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

                selectedFileName.textContent =
                    "";

            }

        }
    );

}


// ============================================================
// UPDATE ATS RESULT
// ============================================================

function updateATSResult(
    atsScore,
    atsAnalysis
) {

    console.log(
        "Updating ATS result:",
        atsScore,
        atsAnalysis
    );


    // ========================================================
    // ATS SCORE
    // ========================================================

    const atsScoreElement =
        document.getElementById("atsScore");


    if (atsScoreElement) {

        atsScoreElement.textContent =
            atsScore;

    }


    // ========================================================
    // KEYWORDS
    // ========================================================

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


    // ========================================================
    // SKILLS
    // ========================================================

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


    // ========================================================
    // PROJECTS
    // ========================================================

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


    // ========================================================
    // STRUCTURE
    // ========================================================

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


// ============================================================
// RESET ATS UI
// ============================================================

function resetATSUI() {

    const atsScore =
        document.getElementById(
            "atsScore"
        );


    const atsKeywords =
        document.getElementById(
            "atsKeywords"
        );


    const atsSkills =
        document.getElementById(
            "atsSkills"
        );


    const atsProjects =
        document.getElementById(
            "atsProjects"
        );


    const atsStructure =
        document.getElementById(
            "atsStructure"
        );


    if (atsScore) {

        atsScore.textContent =
            "--";

    }


    if (atsKeywords) {

        atsKeywords.textContent =
            "--%";

    }


    if (atsSkills) {

        atsSkills.textContent =
            "--%";

    }


    if (atsProjects) {

        atsProjects.textContent =
            "--%";

    }


    if (atsStructure) {

        atsStructure.textContent =
            "--%";

    }

}


// ============================================================
// SHOW INTERVIEW SECTION
// ============================================================

function showInterviewSection() {

    const categorySection =
        document.getElementById(
            "categorySection"
        );


    if (categorySection) {

        categorySection.style.display =
            "block";

    }

}


// ============================================================
// SHOW JOB DESCRIPTION ANALYZER
// ============================================================

function showJDAnalyzer() {

    const jdSection =
        document.getElementById(
            "jdSection"
        );


    if (jdSection) {

        jdSection.style.display =
            "block";

    }


    // Tell job_analysis.js that the
    // resume is now available.

    if (
        typeof updateAnalyzeButton ===
        "function"
    ) {

        updateAnalyzeButton();

    }

}


// ============================================================
// UPLOAD RESUME
// ============================================================

async function uploadResume() {

    const fileInput =
        document.getElementById(
            "resumeFile"
        );


    const uploadMessage =
        document.getElementById(
            "uploadMessage"
        );


    if (!fileInput || !uploadMessage) {

        console.error(
            "Resume upload elements not found."
        );

        return;
    }


    const file =
        fileInput.files[0];


    // ========================================================
    // CHECK FILE
    // ========================================================

    if (!file) {

        uploadMessage.textContent =
            "Please select a resume.";

        return;
    }


    // ========================================================
    // CHECK FILE TYPE
    // ========================================================

    const allowedTypes = [

        "application/pdf",

        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    ];


    if (!allowedTypes.includes(file.type)) {

        uploadMessage.textContent =
            "Only PDF and DOCX files are allowed.";

        return;
    }


    // ========================================================
    // CHECK FILE SIZE
    // ========================================================

    const maxSize =
        10 * 1024 * 1024;


    if (file.size > maxSize) {

        uploadMessage.textContent =
            "File size must be 10MB or less.";

        return;
    }


    // ========================================================
    // GET TOKEN
    // ========================================================

    const token =
        localStorage.getItem(
            "token"
        );


    if (!token) {

        window.location.href =
            "index.html";

        return;
    }


    // ========================================================
    // PREPARE FORM DATA
    // ========================================================

    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    try {

        // ====================================================
        // UPLOADING
        // ====================================================

        uploadMessage.textContent =
            "Uploading resume...";


        const uploadResponse =
            await fetch(
                `${RESUME_API_BASE_URL}/upload-resume`,
                {
                    method: "POST",

                    headers: {

                        "Authorization":
                            "Bearer " + token

                    },

                    body:
                        formData
                }
            );


        // ====================================================
        // READ RESPONSE SAFELY
        // ====================================================

        const contentType =
            uploadResponse.headers.get(
                "content-type"
            ) || "";


        let uploadData;


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            uploadData =
                await uploadResponse.json();

        }

        else {

            const text =
                await uploadResponse.text();


            uploadData = {

                message:
                    text ||
                    "Unexpected server response."

            };

        }


        console.log(
            "Upload response:",
            uploadData
        );


        // ====================================================
        // CHECK RESPONSE
        // ====================================================

        if (!uploadResponse.ok) {

            uploadMessage.textContent =
                uploadData.message ||
                "Resume upload failed.";

            return;
        }


        // ====================================================
        // GET RESUME ID
        // ====================================================

        const resumeId =
            uploadData.resume_id;


        if (!resumeId) {

            uploadMessage.textContent =
                "Resume uploaded, but resume ID was not returned.";

            return;
        }


        // ====================================================
        // SAVE RESUME ID
        // ====================================================

        localStorage.setItem(
            "resume_id",
            resumeId
        );


        // ====================================================
        // RESET OLD ATS DATA
        // ====================================================

        localStorage.removeItem(
            "ats_score"
        );


        localStorage.removeItem(
            "ats_analysis"
        );


        resetATSUI();


        // ====================================================
        // RESET ATS DETAILS BUTTON
        // ====================================================

        const viewDetailsButton =
            document.getElementById(
                "viewATSDetailsButton"
            );


        if (viewDetailsButton) {

            viewDetailsButton.style.display =
                "none";

        }


        // ====================================================
        // ENABLE ATS ANALYSIS
        // ====================================================

        const analyzeButton =
            document.getElementById(
                "analyzeResumeButton"
            );


        if (analyzeButton) {

            analyzeButton.disabled =
                false;

            analyzeButton.style.display =
                "inline-flex";

            analyzeButton.textContent =
                "Analyze Resume";

        }


        // ====================================================
        // UPDATE PROGRESS
        // ====================================================

        const progressBar =
            document.getElementById(
                "progressBar"
            );


        const progressStatus =
            document.getElementById(
                "progressStatus"
            );


        if (progressBar) {

            progressBar.style.width =
                "100%";

        }


        if (progressStatus) {

            progressStatus.textContent =
                "Resume uploaded. Analyze it when you're ready.";

        }


        // ====================================================
        // SHOW INTERVIEW SECTION
        // ====================================================

        showInterviewSection();


        // ====================================================
        // SHOW JD ANALYZER
        // ====================================================

        showJDAnalyzer();


        // ====================================================
        // SUCCESS
        // ====================================================

        uploadMessage.textContent =
            "Resume uploaded successfully.";

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


// ============================================================
// ANALYZE RESUME
// ============================================================

async function analyzeResume() {

    const resumeId =
        localStorage.getItem(
            "resume_id"
        );


    const token =
        localStorage.getItem(
            "token"
        );


    const uploadMessage =
        document.getElementById(
            "uploadMessage"
        );


    // ========================================================
    // LOGIN CHECK
    // ========================================================

    if (!token) {

        window.location.href =
            "index.html";

        return;
    }


    // ========================================================
    // RESUME CHECK
    // ========================================================

    if (!resumeId) {

        uploadMessage.textContent =
            "Please upload your resume first.";

        return;
    }


    const analyzeButton =
        document.getElementById(
            "analyzeResumeButton"
        );


    try {

        // ====================================================
        // ANALYZING
        // ====================================================

        uploadMessage.textContent =
            "Analyzing your resume with AI...";


        if (analyzeButton) {

            analyzeButton.disabled =
                true;

            analyzeButton.textContent =
                "Analyzing...";

        }


        // ====================================================
        // CALL BACKEND
        // ====================================================

        const response =
            await fetch(

                `${RESUME_API_BASE_URL}/analyze-resume/${resumeId}`,

                {

                    method:
                        "POST",

                    headers: {

                        "Authorization":
                            "Bearer " + token

                    }

                }

            );


        // ====================================================
        // READ RESPONSE
        // ====================================================

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        let data;


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        }

        else {

            const text =
                await response.text();


            data = {

                message:
                    text ||
                    "Unexpected server response."

            };

        }


        console.log(
            "ATS Analysis Response:",
            data
        );


        // ====================================================
        // CHECK RESPONSE
        // ====================================================

        if (!response.ok) {

            uploadMessage.textContent =
                data.message ||
                "Resume analysis failed.";

            return;
        }


        // ====================================================
        // CHECK ATS DATA
        // ====================================================

        if (
            data.ats_score === undefined ||
            !data.ats_analysis
        ) {

            uploadMessage.textContent =
                "ATS analysis data was not returned.";

            return;
        }


        // ====================================================
        // SAVE ATS DATA
        // ====================================================

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


        // ====================================================
        // UPDATE ATS UI
        // ====================================================

        updateATSResult(
            data.ats_score,
            data.ats_analysis
        );


        // ====================================================
        // SHOW VIEW DETAILS BUTTON
        // ====================================================

        const viewDetailsButton =
            document.getElementById(
                "viewATSDetailsButton"
            );


        if (viewDetailsButton) {

            viewDetailsButton.style.display =
                "inline-flex";

        }


        // ====================================================
        // SUCCESS
        // ====================================================

        uploadMessage.textContent =
            "Resume analyzed successfully.";

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

        if (analyzeButton) {

            analyzeButton.disabled =
                false;

            analyzeButton.textContent =
                "Analyze Resume";

        }


        // Refresh JD button state.

        if (
            typeof updateAnalyzeButton ===
            "function"
        ) {

            updateAnalyzeButton();

        }

    }

}


// ============================================================
// VIEW ATS DETAILS
// ============================================================

function viewATSDetails() {

    const resumeId =
        localStorage.getItem(
            "resume_id"
        );


    if (!resumeId) {

        return;
    }


    window.location.href =
        "ats-details.html";

}


// ============================================================
// INITIALIZE EXISTING RESUME STATE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const storedResumeId =
            localStorage.getItem(
                "resume_id"
            );


        if (storedResumeId) {

            showInterviewSection();

            showJDAnalyzer();

        }

    }
);