
// ============================================================
// INTERVO - JOB DESCRIPTION ANALYSIS RESULT PAGE
// ============================================================


// ============================================================
// API CONFIGURATION
// ============================================================

const JOB_ANALYSIS_API =
    "https://intervo-backend-okao.onrender.com/api/job-analysis";


// ============================================================
// GET TOKEN
// ============================================================

function getToken() {

    return localStorage.getItem(
        "token"
    );

}


// ============================================================
// GET ANALYSIS ID FROM URL
// ============================================================

function getAnalysisId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get(
        "id"
    );

}


// ============================================================
// SAFE RESPONSE READER
// ============================================================

async function getResponseData(
    response
) {

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
// LOAD JOB ANALYSIS
// ============================================================

async function loadJobAnalysis() {

    const analysisId =
        getAnalysisId();

    const token =
        getToken();


    // ========================================================
    // CHECK ANALYSIS ID
    // ========================================================

    if (!analysisId) {

        showError(
            "No job analysis ID was provided."
        );

        return;

    }


    // ========================================================
    // CHECK TOKEN
    // ========================================================

    if (!token) {

        window.location.href =
            "index.html";

        return;

    }


    try {

        console.log(
            "Loading job analysis:",
            analysisId
        );


        const response =
            await fetch(

                `${JOB_ANALYSIS_API}/${encodeURIComponent(analysisId)}`,

                {

                    method:
                        "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    }

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
            "Job Analysis Response:",
            data
        );


        // ====================================================
        // HANDLE ERROR
        // ====================================================

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


            showError(

                data.message ||
                `Unable to load analysis. (${response.status})`

            );

            return;

        }


        // ====================================================
        // DISPLAY DATA
        // ====================================================

        displayAnalysis(
            data
        );

    }


    catch (error) {

        console.error(
            "Job Analysis Loading Error:",
            error
        );


        showError(
            "Unable to connect to the job analysis server."
        );

    }

}


// ============================================================
// DISPLAY ANALYSIS
// ============================================================

function displayAnalysis(
    data
) {

    // ========================================================
    // MATCH SCORE
    // ========================================================

    const matchScore =
        document.getElementById(
            "matchScore"
        );


    const matchScoreLabel =
        document.getElementById(
            "matchScoreLabel"
        );


    const score =
        Number(
            data.match_score
        );


    if (matchScore) {

        matchScore.textContent =
            `${score}%`;

    }


    if (matchScoreLabel) {

        matchScoreLabel.textContent =
            getScoreLabel(
                score
            );

    }


    // ========================================================
    // OVERALL ASSESSMENT
    // ========================================================

    const overallAssessment =
        document.getElementById(
            "overallAssessment"
        );


    if (overallAssessment) {

        overallAssessment.textContent =

            data.overall_assessment ||

            "No overall assessment available.";

    }


    // ========================================================
    // MATCHING SKILLS
    // ========================================================

    setSkills(

        "matchingSkills",

        data.matching_skills

    );


    // ========================================================
    // PARTIAL SKILLS
    // ========================================================

    setSkills(

        "partialSkills",

        data.partial_skills

    );


    // ========================================================
    // MISSING SKILLS
    // ========================================================

    setSkills(

        "missingSkills",

        data.missing_skills

    );


    // ========================================================
    // PRIORITY SKILLS
    // ========================================================

    setSkills(

        "prioritySkills",

        data.priority_skills

    );


    // ========================================================
    // RESUME SUGGESTIONS
    // ========================================================

    setSuggestions(

        data.resume_suggestions

    );


    // ========================================================
    // JOB DESCRIPTION
    // ========================================================

    const jobDescription =
        document.getElementById(
            "jobDescription"
        );


    if (jobDescription) {

        jobDescription.textContent =

            data.job_description ||

            "No job description available.";

    }

}


// ============================================================
// DISPLAY SKILLS
// ============================================================

function setSkills(
    elementId,
    skills
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    if (
        !Array.isArray(
            skills
        )
        ||
        skills.length === 0
    ) {

        element.innerHTML = `

            <span class="jd-empty-skill">

                None identified

            </span>

        `;

        return;

    }


    element.innerHTML =

        skills
            .map(
                skill => `

                    <span class="jd-skill-tag">

                        ${escapeHTML(skill)}

                    </span>

                `
            )
            .join("");

}


// ============================================================
// DISPLAY SUGGESTIONS
// ============================================================

function setSuggestions(
    suggestions
) {

    const element =
        document.getElementById(
            "resumeSuggestions"
        );


    if (!element) {

        return;

    }


    if (
        !Array.isArray(
            suggestions
        )
        ||
        suggestions.length === 0
    ) {

        element.innerHTML = `

            <p class="jd-empty-suggestion">

                No specific resume suggestions available.

            </p>

        `;

        return;

    }


    element.innerHTML =

        suggestions
            .map(
                suggestion => `

                    <div
                        class="jd-suggestion-item"
                    >

                        ${escapeHTML(
                            suggestion
                        )}

                    </div>

                `
            )
            .join("");

}


// ============================================================
// SCORE LABEL
// ============================================================

function getScoreLabel(
    score
) {

    if (score >= 80) {

        return "Excellent match";

    }


    if (score >= 60) {

        return "Good match";

    }


    if (score >= 40) {

        return "Moderate match";

    }


    return "Needs improvement";

}


// ============================================================
// SHOW ERROR
// ============================================================

function showError(
    message
) {

    console.error(
        "JD Analysis Error:",
        message
    );


    // ========================================================
    // ASSESSMENT
    // ========================================================

    const overallAssessment =
        document.getElementById(
            "overallAssessment"
        );


    if (overallAssessment) {

        overallAssessment.textContent =
            message;

    }


    // ========================================================
    // SCORE
    // ========================================================

    const matchScore =
        document.getElementById(
            "matchScore"
        );


    const matchScoreLabel =
        document.getElementById(
            "matchScoreLabel"
        );


    if (matchScore) {

        matchScore.textContent =
            "--%";

    }


    if (matchScoreLabel) {

        matchScoreLabel.textContent =
            "Unable to load";

    }


    // ========================================================
    // SKILLS
    // ========================================================

    [

        "matchingSkills",

        "partialSkills",

        "missingSkills",

        "prioritySkills"

    ].forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.innerHTML = `

                    <span class="jd-empty-skill">

                        Unable to load results.

                    </span>

                `;

            }

        }
    );


    // ========================================================
    // SUGGESTIONS
    // ========================================================

    const suggestions =
        document.getElementById(
            "resumeSuggestions"
        );


    if (suggestions) {

        suggestions.textContent =
            message;

    }


    // ========================================================
    // JOB DESCRIPTION
    // ========================================================

    const jobDescription =
        document.getElementById(
            "jobDescription"
        );


    if (jobDescription) {

        jobDescription.textContent =
            message;

    }

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    text
) {

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
// GO TO DASHBOARD
// ============================================================

function goToDashboard() {

    window.location.href =
        "dashboard.html";

}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadJobAnalysis();

    }
);

