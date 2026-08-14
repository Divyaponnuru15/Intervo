// =========================================================
// DASHBOARD
// =========================================================


// =========================================================
// CHECK LOGIN
// =========================================================

const token =
    localStorage.getItem("token");

if (!token) {

    window.location.href =
        "index.html";

}


// =========================================================
// LOGOUT
// =========================================================

function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("resume_id");
    localStorage.removeItem("session_id");
    localStorage.removeItem("report_id");
    localStorage.removeItem("interview_category");

    window.location.href =
        "index.html";
}


// =========================================================
// SHOW CATEGORY SECTION
// =========================================================

function showCategorySection() {

    const categorySection =
        document.getElementById("categorySection");

    if (categorySection) {

        categorySection.style.display =
            "block";

    }

}


// =========================================================
// START INTERVIEW
// =========================================================

async function startInterview(category) {

    const token =
        localStorage.getItem("token");

    const resumeId =
        localStorage.getItem("resume_id");

    const message =
        document.getElementById("categoryMessage");


    // =====================================================
    // CHECK LOGIN
    // =====================================================

    if (!token) {

        window.location.href =
            "index.html";

        return;

    }


    // =====================================================
    // CHECK RESUME
    // =====================================================

    if (!resumeId) {

        message.textContent =
            "Please upload your resume first.";

        return;

    }


    // =====================================================
    // SHOW STATUS
    // =====================================================

    message.textContent =
        "Creating " +
        category +
        " interview...";


    try {

        // =================================================
        // CREATE INTERVIEW SESSION
        // =================================================

        const sessionResponse =
            await fetch(
                "http://127.0.0.1:5000/api/session/start",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token

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


        // =================================================
        // CHECK SESSION
        // =================================================

        if (!sessionResponse.ok) {

            message.textContent =
                sessionData.message ||
                "Failed to create interview session.";

            return;

        }


        // =================================================
        // SAVE SESSION
        // =================================================

        const sessionId =
            sessionData.session_id;


        if (!sessionId) {

            message.textContent =
                "Interview session ID was not returned.";

            return;

        }


        localStorage.setItem(
            "session_id",
            sessionId
        );


        localStorage.setItem(
            "interview_category",
            category
        );


        // =================================================
        // GENERATE QUESTIONS
        // =================================================

        message.textContent =
            "Generating " +
            category +
            " questions...";


        const questionResponse =
            await fetch(
                "http://127.0.0.1:5000/generate-questions",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token

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


        // =================================================
        // CHECK QUESTION GENERATION
        // =================================================

        if (!questionResponse.ok) {

            message.textContent =
                questionData.message ||
                "Failed to generate questions.";

            return;

        }


        // =================================================
        // SUCCESS
        // =================================================

        message.textContent =
            "Questions generated successfully.";


        // =================================================
        // OPEN INTERVIEW
        // =================================================

        setTimeout(
            function () {

                window.location.href =
                    "interview.html";

            },
            700
        );

    }


    catch (error) {

        console.error(
            "Start Interview Error:",
            error
        );


        message.textContent =
            "Server connection failed.";

    }

}


// =========================================================
// CHECK EXISTING RESUME
// =========================================================

const savedResumeId =
    localStorage.getItem("resume_id");


if (savedResumeId) {

    showCategorySection();

}


// =========================================================
// UPDATE PROGRESS
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const resumeId =
            localStorage.getItem("resume_id");


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


        // =================================================
        // RESUME UPLOADED
        // =================================================

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


        // =================================================
        // RESUME NOT UPLOADED
        // =================================================

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
