const JOB_ANALYSIS_API =
"https://intervo-backend-okao.onrender.com/api/job-analysis";

function getToken() {


return localStorage.getItem("token");


}

function getAnalysisId() {


const params =
    new URLSearchParams(
        window.location.search
    );

return params.get("id");


}

async function getResponseData(response) {


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

async function loadJobAnalysis() {


const analysisId =
    getAnalysisId();

const token =
    getToken();


if (!analysisId) {

    showError(
        "No job analysis ID was provided."
    );

    return;

}


if (!token) {

    showError(
        "Your session has expired. Please login again."
    );

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
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
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


    displayAnalysis(data);

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

function displayAnalysis(data) {


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
        getScoreLabel(score);

}


setMissingSkills(
    data.missing_skills
);


setResumeSuggestions(
    data.resume_suggestions
);


}

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

function setResumeSuggestions(suggestions) {


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

function showError(message) {


console.error(
    "JD Analysis Error:",
    message
);


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


const actionMessage =
    document.getElementById(
        "jdActionMessage"
    );


if (actionMessage) {

    actionMessage.textContent =
        message;

}


}

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

function goToDashboard() {


window.location.href =
    "dashboard.html";


}

document.addEventListener(
"DOMContentLoaded",
function () {

    loadJobAnalysis();

}
);
