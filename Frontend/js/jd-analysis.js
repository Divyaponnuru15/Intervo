const JOB_ANALYSIS_API =
    "https://intervo-backend-okao.onrender.com/api/job-analysis";


// ============================================================
// GET TOKEN
// ============================================================

function getToken() {

    return localStorage.getItem("token");

}


// ============================================================
// GET ANALYSIS ID FROM URL
// ============================================================

function getAnalysisId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");

}


// ============================================================
// SAFE RESPONSE READER
// ============================================================

async function getResponseData(response) {

    const contentType =
        response.headers.get("content-type") || "";


    if (
        contentType.includes("application/json")
    ) {

        try {

            return await response.json();

        } catch (error) {

            return {
                message:
                    "Invalid JSON response from server."
            };

        }

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


    // --------------------------------------------------------
    // CHECK ANALYSIS ID
    // --------------------------------------------------------

    if (!analysisId) {

        showError(
            "No job analysis ID was provided."
        );

        return;

    }


    // --------------------------------------------------------
    // CHECK TOKEN
    // --------------------------------------------------------

    if (!token) {

        showError(
            "Your session has expired. Please login again."
        );

        return;

    }


    console.log(
        "Loading job analysis:",
        analysisId
    );


    try {

        const response =
            await fetch(

                `${JOB_ANALYSIS_API}/${encodeURIComponent(analysisId)}`,

                {

                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"

                    }

                }

            );


        const data =
            await getResponseData(
                response
            );


        console.log(
            "Job Analysis Response:",
            data
        );


        // ----------------------------------------------------
        // HANDLE ERROR
        // ----------------------------------------------------

        if (!response.ok) {

            console.error(
                "Job Analysis API Error:",
                response.status,
                data
            );


            // JWT expired / invalid
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


        // ----------------------------------------------------
        // DISPLAY RESULT
        // ----------------------------------------------------

        displayAnalysis(
            data
        );


    } catch (error) {

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

function displayAnalysis(data) {

    console.log(
        "Displaying analysis:",
        data
    );


    // --------------------------------------------------------
    // MATCH SCORE
    // --------------------------------------------------------

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


    if (
        matchScore &&
        !Number.isNaN(score)
    ) {

        matchScore.textContent =
            `${score}%`;

    }


    if (
        matchScoreLabel &&
        !Number.isNaN(score)
    ) {

        matchScoreLabel.textContent =
            getScoreLabel(
                score
            );

    }


    // --------------------------------------------------------
    // MISSING SKILLS
    // --------------------------------------------------------

    setMissingSkills(
        data.missing_skills
    );


    // --------------------------------------------------------
    // RESUME SUGGESTIONS
    // --------------------------------------------------------

    setResumeSuggestions(
        data.resume_suggestions
    );


    // --------------------------------------------------------
    // OPTIONAL: MATCHING SKILLS
    // --------------------------------------------------------

    setMatchingSkills(
        data.matching_skills
    );


    // --------------------------------------------------------
    // OPTIONAL: PARTIAL SKILLS
    // --------------------------------------------------------

    setPartialSkills(
        data.partial_skills
    );


    // --------------------------------------------------------
    // OPTIONAL: PRIORITY SKILLS
    // --------------------------------------------------------

    setPrioritySkills(
        data.priority_skills
    );


    // --------------------------------------------------------
    // OPTIONAL: OVERALL ASSESSMENT
    // --------------------------------------------------------

    setOverallAssessment(
        data.overall_assessment
    );

}


// ============================================================
// SET MISSING SKILLS
// ============================================================

function setMissingSkills(skills) {

    const element =
        document.getElementById(
            "missingSkills"
        );


    if (!element) {

        return;

    }


    if (
        !Array.isArray(skills) ||
        skills.length === 0
    ) {

        element.innerHTML = `

            <span class="jd-empty-skill">

                No major skill gaps found 🎉

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
// SET MATCHING SKILLS
// ============================================================

function setMatchingSkills(skills) {

    const element =
        document.getElementById(
            "matchingSkills"
        );


    if (!element) {

        return;

    }


    if (
        !Array.isArray(skills) ||
        skills.length === 0
    ) {

        element.innerHTML = `

            <span class="jd-empty-skill">

                No matching skills found.

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
// SET PARTIAL SKILLS
// ============================================================

function setPartialSkills(skills) {

    const element =
        document.getElementById(
            "partialSkills"
        );


    if (!element) {

        return;

    }


    if (
        !Array.isArray(skills) ||
        skills.length === 0
    ) {

        element.innerHTML = `

            <span class="jd-empty-skill">

                No partial matches found.

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
// SET PRIORITY SKILLS
// ============================================================

function setPrioritySkills(skills) {

    const element =
        document.getElementById(
            "prioritySkills"
        );


    if (!element) {

        return;

    }


    if (
        !Array.isArray(skills) ||
        skills.length === 0
    ) {

        element.innerHTML = `

            <span class="jd-empty-skill">

                No priority skills identified.

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
// SET RESUME SUGGESTIONS
// ============================================================

function setResumeSuggestions(
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
        !Array.isArray(suggestions) ||
        suggestions.length === 0
    ) {

        element.innerHTML = `

            <p class="jd-empty-suggestion">

                No specific resume improvements available.

            </p>

        `;

        return;

    }


    element.innerHTML =
        suggestions
            .map(
                suggestion => `

                    <div class="jd-suggestion-item">

                        ${escapeHTML(suggestion)}

                    </div>

                `
            )
            .join("");

}


// ============================================================
// SET OVERALL ASSESSMENT
// ============================================================

function setOverallAssessment(
    assessment
) {

    const element =
        document.getElementById(
            "overallAssessment"
        );


    if (!element) {

        return;

    }


    if (
        !assessment ||
        String(assessment).trim() === ""
    ) {

        element.textContent =
            "No overall assessment available.";

        return;

    }


    element.textContent =
        String(assessment);

}


// ============================================================
// SCORE LABEL
// ============================================================

function getScoreLabel(score) {

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

function showError(message) {

    console.error(
        "JD Analysis Error:",
        message
    );


    // --------------------------------------------------------
    // SCORE
    // --------------------------------------------------------

    const matchScore =
        document.getElementById(
            "matchScore"
        );


    if (matchScore) {

        matchScore.textContent =
            "--%";

    }


    // --------------------------------------------------------
    // SCORE LABEL
    // --------------------------------------------------------

    const matchScoreLabel =
        document.getElementById(
            "matchScoreLabel"
        );


    if (matchScoreLabel) {

        matchScoreLabel.textContent =
            "Unable to load";

    }


    // --------------------------------------------------------
    // MISSING SKILLS
    // --------------------------------------------------------

    const missingSkills =
        document.getElementById(
            "missingSkills"
        );


    if (missingSkills) {

        missingSkills.innerHTML = `

            <span class="jd-empty-skill">

                Unable to load results.

            </span>

        `;

    }


    // --------------------------------------------------------
    // MATCHING SKILLS
    // --------------------------------------------------------

    const matchingSkills =
        document.getElementById(
            "matchingSkills"
        );


    if (matchingSkills) {

        matchingSkills.innerHTML = `

            <span class="jd-empty-skill">

                Unable to load results.

            </span>

        `;

    }


    // --------------------------------------------------------
    // RESUME SUGGESTIONS
    // --------------------------------------------------------

    const suggestions =
        document.getElementById(
            "resumeSuggestions"
        );


    if (suggestions) {

        suggestions.innerHTML = `

            <p class="jd-empty-suggestion">

                ${escapeHTML(message)}

            </p>

        `;

    }


    // --------------------------------------------------------
    // ACTION MESSAGE
    // --------------------------------------------------------

    const actionMessage =
        document.getElementById(
            "jdActionMessage"
        );


    if (actionMessage) {

        actionMessage.textContent =
            message;

    }

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
// GO TO DASHBOARD
// ============================================================

function goToDashboard() {

    window.location.href =
        "dashboard.html";

}


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadJobAnalysis();

    }
);