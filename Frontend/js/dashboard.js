// ===
// INTERVO - DASHBOARD
// ===


// ===
// CHECK LOGIN
// ===

const token =
    localStorage.getItem("token");


if (!token) {

    window.location.href =
        "index.html";

}


// ===
// LOGOUT
// ===

function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("resume_id");

    localStorage.removeItem("session_id");

    localStorage.removeItem("report_id");

    localStorage.removeItem("interview_category");

    localStorage.removeItem("interview_mode");


    window.location.href =
        "index.html";

}


// ===
// SHOW CATEGORY SECTION
// ===

function showCategorySection() {

    const categorySection =
        document.getElementById(
            "categorySection"
        );


    if (categorySection) {

        categorySection.style.display =
            "block";

    }

}


// ===
// SELECT INTERVIEW TYPE
// ===

function selectInterviewType(category) {

    const allModes =
        document.querySelectorAll(
            ".interview-mode"
        );


    // Hide all other mode selections

    allModes.forEach(
        function (mode) {

            mode.style.display =
                "none";

        }
    );


    const selectedMode =
        document.getElementById(
            "mode-" + category
        );


    if (selectedMode) {

        selectedMode.style.display =
            "block";

    }

}


// ===
// START INTERVIEW
// ===

async function startInterview(
    category,
    mode
) {

    const currentToken =
        localStorage.getItem("token");


    const resumeId =
        localStorage.getItem("resume_id");


    const message =
        document.getElementById(
            "categoryMessage"
        );


    // =================
    // CHECK LOGIN
    // =================

    if (!currentToken) {

        window.location.href =
            "index.html";

        return;

    }


    // =================
    // CHECK RESUME
    // =================

    if (!resumeId) {

        if (message) {

            message.textContent =
                "Please upload your resume first.";

        }

        return;

    }


    // =================
    // VALIDATE MODE
    // =================

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


    // =================
    // SHOW STATUS
    // =================

    if (message) {

        message.textContent =
            "Creating " +
            category +
            " " +
            mode +
            " interview...";

    }


    try {


        // =============
        // CREATE INTERVIEW SESSION
        // =============

        const sessionResponse =
            await fetch(
                "http://127.0.0.1:5000/api/session/start",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " +
                            currentToken

                    },

                    body: JSON.stringify({

                        resume_id:
                            resumeId,

                        title:
                            category +
                            " Interview",

                        category:
                            category

                    })

                }
            );


        const sessionData =
            await sessionResponse.json();


        console.log(
            "Session Response:",
            sessionData
        );


        // =============
        // CHECK SESSION
        // =============

        if (!sessionResponse.ok) {

            if (message) {

                message.textContent =
                    sessionData.message ||
                    "Failed to create interview session.";

            }

            return;

        }


        // =============
        // GET SESSION ID
        // =============

        const sessionId =
            sessionData.session_id;


        if (!sessionId) {

            if (message) {

                message.textContent =
                    "Interview session ID was not returned.";

            }

            return;

        }


        // =============
        // SAVE SESSION
        // =============

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


        // =============
        // GENERATE QUESTIONS
        // =============

        if (message) {

            message.textContent =
                "Generating " +
                category +
                " questions...";

        }


        const questionResponse =
            await fetch(
                "http://127.0.0.1:5000/generate-questions",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " +
                            currentToken

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
            await questionResponse.json();


        console.log(
            "Question Response:",
            questionData
        );


        // =============
        // CHECK QUESTION GENERATION
        // =============

        if (!questionResponse.ok) {

            if (message) {

                message.textContent =
                    questionData.message ||
                    "Failed to generate questions.";

            }

            return;

        }


        // =============
        // SUCCESS
        // =============

        if (message) {

            message.textContent =
                "Questions generated successfully.";

        }


        // =============
        // REDIRECT BASED ON MODE
        // =============

        setTimeout(
            function () {

                if (mode === "voice") {

                    window.location.href =
                        "voice-interview.html";

                } else {

                    window.location.href =
                        "interview.html";

                }

            },
            700
        );

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


// ===
// CHECK EXISTING RESUME
// ===

const savedResumeId =
    localStorage.getItem(
        "resume_id"
    );


if (savedResumeId) {

    showCategorySection();

}


// ===
// UPDATE PROGRESS
// ===

document.addEventListener(
    "DOMContentLoaded",
    function () {


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


        // =============
        // RESUME UPLOADED
        // =============

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

        }


        // =============
        // RESUME NOT UPLOADED
        // =============

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
);