// ============================================================
// INTERVO - JOB DESCRIPTION ANALYZER
// ============================================================


// ============================================================
// API CONFIGURATION
// ============================================================

const JOB_ANALYSIS_API =
    "https://intervo-backend-okao.onrender.com/api/job-analysis";


// ============================================================
// STATE
// ============================================================

let currentJobAnalysisId = null;


// ============================================================
// GET RESUME ID
// ============================================================

function getResumeId() {

    return localStorage.getItem(
        "resume_id"
    );

}


// ============================================================
// GET TOKEN
// ============================================================

function getToken() {

    return localStorage.getItem(
        "token"
    );

}


// ============================================================
// SAFE RESPONSE READER
// ============================================================

async function getResponseData(response) {

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    if (
        contentType.includes(
            "application/json"
        )
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


// ============================================================
// INITIALIZE JOB ANALYSIS
// ============================================================

function initializeJobAnalysis() {

    const jobDescription =
        document.getElementById(
            "jobDescription"
        );


    const characterCount =
        document.getElementById(
            "jdCharacterCount"
        );


    if (!jobDescription) {

        return;

    }


    // ========================================================
    // CHARACTER COUNTER
    // ========================================================

    jobDescription.addEventListener(
        "input",
        function () {

            const length =
                jobDescription.value.length;


            if (characterCount) {

                characterCount.textContent =
                    length;

            }


            updateAnalyzeButton();

        }
    );


    // ========================================================
    // INITIAL BUTTON STATE
    // ========================================================

    updateAnalyzeButton();

}


// ============================================================
// UPDATE ANALYZE BUTTON
// ============================================================

function updateAnalyzeButton() {

    const jobDescription =
        document.getElementById(
            "jobDescription"
        );


    const analyzeButton =
        document.getElementById(
            "analyzeJDButton"
        );


    if (
        !jobDescription ||
        !analyzeButton
    ) {

        return;

    }


    const resumeId =
        getResumeId();


    const hasResume =
        !!resumeId;


    const hasJobDescription =
        jobDescription.value.trim().length > 0;


    analyzeButton.disabled =
        !hasResume ||
        !hasJobDescription;

}


// ============================================================
// SHOW JOB ANALYZER
// ============================================================

function showJobAnalyzer() {

    const jdSection =
        document.getElementById(
            "jdSection"
        );


    if (jdSection) {

        jdSection.style.display =
            "block";

    }


    updateAnalyzeButton();

}


// ============================================================
// ANALYZE JOB DESCRIPTION
// ============================================================

async function analyzeJobDescription() {

    const jobDescription =
        document.getElementById(
            "jobDescription"
        );


    const analyzeButton =
        document.getElementById(
            "analyzeJDButton"
        );


    const message =
        document.getElementById(
            "jdMessage"
        );


    // ========================================================
    // CHECK ELEMENTS
    // ========================================================

    if (
        !jobDescription ||
        !analyzeButton ||
        !message
    ) {

        console.error(
            "JD analyzer elements not found."
        );

        return;

    }


    // ========================================================
    // CHECK LOGIN
    // ========================================================

    const token =
        getToken();


    if (!token) {

        message.textContent =
            "Your session has expired. Please login again.";

        window.location.href =
            "index.html";

        return;

    }


    // ========================================================
    // GET RESUME
    // ========================================================

    const resumeId =
        getResumeId();


    if (!resumeId) {

        message.textContent =
            "Please upload your resume first.";

        return;

    }


    // ========================================================
    // GET JOB DESCRIPTION
    // ========================================================

    const jd =
        jobDescription.value.trim();


    if (!jd) {

        message.textContent =
            "Please paste a job description.";

        return;

    }


    if (jd.length > 20000) {

        message.textContent =
            "Job description must be 20,000 characters or less.";

        return;

    }


    // ========================================================
    // LOADING STATE
    // ========================================================

    analyzeButton.disabled =
        true;


    analyzeButton.textContent =
        "⏳ Analyzing...";


    message.textContent =
        "AI is comparing your resume with the job description...";


    hideJDResult();


    try {

        // ====================================================
        // SEND REQUEST
        // ====================================================

        const response =
            await fetch(
                `${JOB_ANALYSIS_API}/analyze`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        resume_id:
                            Number(resumeId),

                        job_description:
                            jd

                    })

                }
            );


        // ====================================================
        // READ RESPONSE
        // ====================================================

        const data =
            await getResponseData(
                response
            );


        console.log(
            "JD Analysis Response:",
            data
        );


        // ====================================================
        // CHECK RESPONSE
        // ====================================================

        if (!response.ok) {

            if (response.status === 401) {

                message.textContent =
                    "Your session has expired. Please login again.";

                localStorage.removeItem(
                    "token"
                );

                return;

            }


            message.textContent =
                data.message ||
                `JD analysis failed. (${response.status})`;

            return;

        }


        // ====================================================
        // VALIDATE MATCH SCORE
        // ====================================================

        const matchScore =
            Number(
                data.match_score
            );


        if (
            Number.isNaN(
                matchScore
            )
        ) {

            message.textContent =
                "AI returned an invalid match score.";

            console.error(
                "Invalid match score:",
                data.match_score
            );

            return;

        }


        // ====================================================
        // SAVE ANALYSIS ID
        // ====================================================

        currentJobAnalysisId =
            data.analysis_id ||
            null;


        if (currentJobAnalysisId) {

            localStorage.setItem(
                "job_analysis_id",
                currentJobAnalysisId
            );

        }


        // ====================================================
        // SHOW RESULT
        // ========================================================

        showJDResult(
            data
        );


        // ====================================================
        // SUCCESS MESSAGE
        // ====================================================

        message.textContent =
            "✅ Job description analyzed successfully.";

    }


    catch (error) {

        console.error(
            "JD Analysis Error:",
            error
        );


        message.textContent =
            "Unable to connect to the job analysis server.";

    }


    finally {

        updateAnalyzeButton();

        analyzeButton.textContent =
            "🔍 Analyze Job Description";

    }

}


// ============================================================
// SHOW JD RESULT
// ============================================================

function showJDResult(data) {

    const resultPreview =
        document.getElementById(
            "jdResultPreview"
        );


    const matchScore =
        document.getElementById(
            "jdMatchScore"
        );


    const matchingSkills =
        document.getElementById(
            "jdMatchingSkills"
        );


    const missingSkills =
        document.getElementById(
            "jdMissingSkills"
        );


    if (!resultPreview) {

        return;

    }


    // ========================================================
    // MATCH SCORE
    // ========================================================

    if (matchScore) {

        matchScore.textContent =
            `${Number(data.match_score)}%`;

    }


    // ========================================================
    // MATCHING SKILLS
    // ========================================================

    if (matchingSkills) {

        matchingSkills.innerHTML =
            createSkillTags(
                data.matching_skills
            );

    }


    // ========================================================
    // MISSING SKILLS
    // ========================================================

    if (missingSkills) {

        missingSkills.innerHTML =
            createSkillTags(
                data.missing_skills
            );

    }


    // ========================================================
    // SHOW RESULT
    // ========================================================

    resultPreview.style.display =
        "block";

}


// ============================================================
// CREATE SKILL TAGS
// ============================================================

function createSkillTags(skills) {

    if (
        !Array.isArray(skills) ||
        skills.length === 0
    ) {

        return `
            <span class="jd-empty-skill">
                None identified
            </span>
        `;

    }


    return skills
        .map(
            skill => {

                return `
                    <span class="jd-skill-tag">
                        ${escapeHTML(skill)}
                    </span>
                `;

            }
        )
        .join("");

}


// ============================================================
// HIDE JD RESULT
// ============================================================

function hideJDResult() {

    const resultPreview =
        document.getElementById(
            "jdResultPreview"
        );


    if (resultPreview) {

        resultPreview.style.display =
            "none";

    }

}


// ============================================================
// VIEW FULL JD ANALYSIS
// ============================================================

function viewJDAnalysis() {

    const analysisId =
        currentJobAnalysisId ||
        localStorage.getItem(
            "job_analysis_id"
        );


    if (!analysisId) {

        alert(
            "Please analyze a job description first."
        );

        return;

    }


    window.location.href =
        `jd-analysis.html?id=${encodeURIComponent(
            analysisId
        )}`;

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            text ?? ""
        );


    return div.innerHTML;

}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeJobAnalysis();


        // If a resume already exists,
        // make the JD analyzer available.

        if (getResumeId()) {

            showJobAnalyzer();

        }

    }
);