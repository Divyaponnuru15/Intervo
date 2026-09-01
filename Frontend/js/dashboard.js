
/* =========================================================
   INTERVO DASHBOARD
========================================================= */

const API_BASE =
    "https://intervo-backend-okao.onrender.com";

const JOB_ANALYSIS_API =
    `${API_BASE}/api/job-analysis`;


/* =========================================================
   TOKEN CHECK
========================================================= */

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "index.html";
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("resume_id");
    localStorage.removeItem("session_id");
    localStorage.removeItem("report_id");
    localStorage.removeItem("interview_category");
    localStorage.removeItem("interview_mode");
    localStorage.removeItem("job_analysis_id");

    window.location.href = "index.html";
}


/* =========================================================
   SHOW INTERVIEW SECTION
========================================================= */

function showCategorySection() {

    const categorySection =
        document.getElementById("categorySection");

    if (categorySection) {
        categorySection.style.display = "block";
    }
}


/* =========================================================
   SHOW JOB DESCRIPTION SECTION
========================================================= */

function showJDSection() {

    const jdSection =
        document.getElementById("jdSection");

    if (jdSection) {
        jdSection.style.display = "block";
    }
}


/* =========================================================
   INTERVIEW CATEGORY
========================================================= */

function selectInterviewType(category) {

    const allModes =
        document.querySelectorAll(".interview-mode");

    allModes.forEach(function (mode) {
        mode.style.display = "none";
    });


    const selectedMode =
        document.getElementById(
            "mode-" + category
        );

    if (selectedMode) {
        selectedMode.style.display = "block";
    }


    const message =
        document.getElementById("categoryMessage");

    if (message) {
        message.textContent =
            `${category} interview selected. Choose your interview mode.`;
    }
}


/* =========================================================
   START INTERVIEW
========================================================= */

async function startInterview(category, mode) {

    const currentToken =
        localStorage.getItem("token");

    const resumeId =
        localStorage.getItem("resume_id");

    const message =
        document.getElementById("categoryMessage");


    /* -----------------------------------------
       TOKEN CHECK
    ----------------------------------------- */

    if (!currentToken) {

        window.location.href = "index.html";

        return;
    }


    /* -----------------------------------------
       RESUME CHECK
    ----------------------------------------- */

    if (!resumeId) {

        if (message) {
            message.textContent =
                "Please upload your resume first.";
        }

        return;
    }


    /* -----------------------------------------
       MODE CHECK
    ----------------------------------------- */

    if (
        mode !== "text" &&
        mode !== "voice"
    ) {

        console.error(
            "Invalid interview mode:",
            mode
        );

        return;
    }


    if (message) {

        message.textContent =
            `Creating ${category} ${mode} interview...`;
    }


    try {

        /* =====================================
           CREATE SESSION
        ===================================== */

        const sessionResponse =
            await fetch(
                `${API_BASE}/api/session/start`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${currentToken}`
                    },

                    body: JSON.stringify({

                        resume_id:
                            resumeId,

                        title:
                            `${category} Interview`,

                        category:
                            category
                    })
                }
            );


        const sessionData =
            await getJSONResponse(
                sessionResponse
            );


        console.log(
            "Session Response:",
            sessionData
        );


        if (!sessionResponse.ok) {

            if (
                sessionResponse.status === 401
            ) {

                localStorage.removeItem("token");

                window.location.href =
                    "index.html";

                return;
            }


            if (message) {

                message.textContent =
                    sessionData.message ||
                    "Failed to create interview session.";
            }

            return;
        }


        /* =====================================
           GET SESSION ID
        ===================================== */

        const sessionId =
            sessionData.session_id;


        if (!sessionId) {

            if (message) {

                message.textContent =
                    "Interview session ID was not returned.";
            }

            return;
        }


        /* =====================================
           SAVE SESSION DATA
        ===================================== */

        localStorage.setItem(
            "session_id",
            sessionId
        );

        localStorage.setItem(
            "interview_category",
            category
        );

        localStorage.setItem(
            "interview_mode",
            mode
        );


        if (message) {

            message.textContent =
                `Generating ${category} questions...`;
        }


        /* =====================================
           GENERATE QUESTIONS
        ===================================== */

        const questionResponse =
            await fetch(
                `${API_BASE}/generate-questions`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${currentToken}`
                    },

                    body: JSON.stringify({

                        resume_id:
                            resumeId,

                        session_id:
                            sessionId,

                        category:
                            category
                    })
                }
            );


        const questionData =
            await getJSONResponse(
                questionResponse
            );


        console.log(
            "Question Response:",
            questionData
        );


        if (!questionResponse.ok) {

            if (
                questionResponse.status === 401
            ) {

                localStorage.removeItem("token");

                window.location.href =
                    "index.html";

                return;
            }


            if (message) {

                message.textContent =
                    questionData.message ||
                    "Failed to generate questions.";
            }

            return;
        }


        if (message) {

            message.textContent =
                "Questions generated successfully.";
        }


        /* =====================================
           REDIRECT
        ===================================== */

        setTimeout(function () {

            if (mode === "voice") {

                window.location.href =
                    "voice-interview.html";

            } else {

                window.location.href =
                    "interview.html";
            }

        }, 700);

    }

    catch (error) {

        console.error(
            "Start Interview Error:",
            error
        );


        if (message) {

            message.textContent =
                "Server connection failed.";
        }
    }
}


/* =========================================================
   SAFE JSON RESPONSE
========================================================= */

async function getJSONResponse(response) {

    const contentType =
        response.headers.get("content-type") || "";


    if (
        contentType.includes("application/json")
    ) {

        return await response.json();
    }


    const text =
        await response.text();


    return {
        message:
            text ||
            "Unexpected server response."
    };
}


/* =========================================================
   JOB DESCRIPTION BUTTON
========================================================= */

function updateJDButton() {

    const textarea =
        document.getElementById(
            "jobDescription"
        );

    const button =
        document.getElementById(
            "analyzeJDButton"
        );


    if (!textarea || !button) {
        return;
    }


    const hasText =
        textarea.value.trim().length > 0;


    button.disabled =
        !hasText;
}


/* =========================================================
   JOB DESCRIPTION CHARACTER COUNT
========================================================= */

function updateJDCharacterCount() {

    const textarea =
        document.getElementById(
            "jobDescription"
        );

    const counter =
        document.getElementById(
            "jdCharacterCount"
        );


    if (!textarea || !counter) {
        return;
    }


    counter.textContent =
        textarea.value.length;
}


/* =========================================================
   ANALYZE JOB DESCRIPTION
========================================================= */

async function analyzeJobDescription() {

    const currentToken =
        localStorage.getItem("token");

    const resumeId =
        localStorage.getItem("resume_id");

    const textarea =
        document.getElementById(
            "jobDescription"
        );

    const button =
        document.getElementById(
            "analyzeJDButton"
        );

    const message =
        document.getElementById(
            "jdMessage"
        );


    /* -----------------------------------------
       TOKEN CHECK
    ----------------------------------------- */

    if (!currentToken) {

        window.location.href =
            "index.html";

        return;
    }


    /* -----------------------------------------
       RESUME CHECK
    ----------------------------------------- */

    if (!resumeId) {

        if (message) {

            message.textContent =
                "Please upload your resume first.";
        }

        return;
    }


    /* -----------------------------------------
       TEXTAREA CHECK
    ----------------------------------------- */

    if (!textarea) {

        console.error(
            "Job description textarea not found."
        );

        return;
    }


    const jobDescription =
        textarea.value.trim();


    /* -----------------------------------------
       EMPTY CHECK
    ----------------------------------------- */

    if (!jobDescription) {

        if (message) {

            message.textContent =
                "Please paste a job description.";
        }

        return;
    }


    /* -----------------------------------------
       LENGTH CHECK
    ----------------------------------------- */

    if (jobDescription.length > 20000) {

        if (message) {

            message.textContent =
                "Job description must be under 20,000 characters.";
        }

        return;
    }


    /* -----------------------------------------
       DISABLE BUTTON
    ----------------------------------------- */

    if (button) {

        button.disabled = true;

        button.textContent =
            "Analyzing...";
    }


    if (message) {

        message.textContent =
            "Comparing your resume with the job description...";
    }


    try {

        /* =====================================
           CALL BACKEND
        ===================================== */

        const response =
            await fetch(
                `${JOB_ANALYSIS_API}/analyze`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${currentToken}`
                    },

                    body: JSON.stringify({

                        resume_id:
                            resumeId,

                        job_description:
                            jobDescription
                    })
                }
            );


        const data =
            await getJSONResponse(
                response
            );


        console.log(
            "Job Analysis Response:",
            data
        );


        /* =====================================
           ERROR HANDLING
        ===================================== */

        if (!response.ok) {

            if (
                response.status === 401
            ) {

                localStorage.removeItem(
                    "token"
                );

                window.location.href =
                    "index.html";

                return;
            }


            if (message) {

                message.textContent =
                    data.message ||
                    `Unable to analyze job description. (${response.status})`;
            }

            return;
        }


        /* =====================================
           GET ANALYSIS ID
        ===================================== */

        const analysisId =
            data.analysis_id;


        if (!analysisId) {

            console.error(
                "Analysis ID missing from response:",
                data
            );


            if (message) {

                message.textContent =
                    "Analysis completed, but no analysis ID was returned.";
            }

            return;
        }


        /* =====================================
           SAVE ANALYSIS ID
        ===================================== */

        localStorage.setItem(
            "job_analysis_id",
            analysisId
        );


        if (message) {

            message.textContent =
                "Analysis completed successfully.";
        }


        /* =====================================
           OPEN ANALYSIS PAGE
        ===================================== */

        window.location.href =
            "jd-analysis.html?id=" +
            encodeURIComponent(
                analysisId
            );
    }


    catch (error) {

        console.error(
            "Job Description Analysis Error:",
            error
        );


        if (message) {

            message.textContent =
                "Unable to connect to the job analysis server.";
        }
    }


    finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "🔍 Analyze Job Description";
        }
    }
}


/* =========================================================
   VIEW PREVIOUS JD ANALYSIS
========================================================= */

function viewJDAnalysis() {

    const analysisId =
        localStorage.getItem(
            "job_analysis_id"
        );


    if (!analysisId) {

        console.error(
            "No job analysis ID found."
        );

        return;
    }


    window.location.href =
        "jd-analysis.html?id=" +
        encodeURIComponent(
            analysisId
        );
}


/* =========================================================
   UPDATE DASHBOARD PROGRESS
========================================================= */

function updateProgress() {

    const resumeId =
        localStorage.getItem(
            "resume_id"
        );


    const progressBar =
        document.getElementById(
            "progressBar"
        );

    const progressStatus =
        document.getElementById(
            "progressStatus"
        );

    const progressResume =
        document.getElementById(
            "progressResume"
        );

    const progressInterview =
        document.getElementById(
            "progressInterview"
        );


    if (!progressBar) {
        return;
    }


    /* -----------------------------------------
       RESUME EXISTS
    ----------------------------------------- */

    if (resumeId) {

        progressBar.style.width =
            "100%";


        if (progressStatus) {

            progressStatus.textContent =
                "Ready to start your interview";
        }


        if (progressResume) {

            progressResume.classList.add(
                "active"
            );
        }


        if (progressInterview) {

            progressInterview.classList.add(
                "active"
            );
        }


        showCategorySection();
        showJDSection();

    }


    /* -----------------------------------------
       NO RESUME
    ----------------------------------------- */

    else {

        progressBar.style.width =
            "50%";


        if (progressStatus) {

            progressStatus.textContent =
                "Upload your resume to get started";
        }


        if (progressResume) {

            progressResume.classList.add(
                "active"
            );
        }


        if (progressInterview) {

            progressInterview.classList.remove(
                "active"
            );
        }
    }
}


/* =========================================================
   INITIALIZE DASHBOARD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* -------------------------------------
           UPDATE PROGRESS
        ------------------------------------- */

        updateProgress();


        /* -------------------------------------
           JOB DESCRIPTION TEXTAREA
        ------------------------------------- */

        const textarea =
            document.getElementById(
                "jobDescription"
            );


        if (textarea) {

            textarea.addEventListener(
                "input",
                function () {

                    updateJDCharacterCount();

                    updateJDButton();
                }
            );


            updateJDCharacterCount();

            updateJDButton();
        }
    }
);

