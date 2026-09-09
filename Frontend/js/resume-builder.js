/*
==================================================
INTERVO AI RESUME BUILDER
==================================================
*/


/*
==================================================
API CONFIGURATION
==================================================
*/

const API_BASE =
    "https://intervo-backend-okao.onrender.com";

const RESUME_BUILDER_API =
    `${API_BASE}/api/resume-builder`;


/*
==================================================
TOKEN CHECK
==================================================
*/

const token =
    localStorage.getItem("token");

if (!token) {
    window.location.href = "index.html";
}


/*
==================================================
LOGOUT
==================================================
*/

function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("resume_id");
    localStorage.removeItem("session_id");
    localStorage.removeItem("report_id");
    localStorage.removeItem("interview_category");
    localStorage.removeItem("interview_mode");

    localStorage.removeItem("job_analysis_id");
    localStorage.removeItem("job_description");

    localStorage.removeItem("generated_resume");
    localStorage.removeItem("generated_resume_analysis_id");

    window.location.href = "index.html";
}


/*
==================================================
GET ELEMENT
==================================================
*/

function getElement(id) {
    return document.getElementById(id);
}


/*
==================================================
GET ANALYSIS ID FROM URL
==================================================
*/

function getAnalysisIdFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");
}


/*
==================================================
SYNC ANALYSIS ID
==================================================
*/

function syncAnalysisId() {

    const urlAnalysisId =
        getAnalysisIdFromURL();

    if (urlAnalysisId) {

        localStorage.setItem(
            "job_analysis_id",
            urlAnalysisId
        );

        console.log(
            "Analysis ID from URL:",
            urlAnalysisId
        );

        return urlAnalysisId;
    }

    const savedAnalysisId =
        localStorage.getItem(
            "job_analysis_id"
        );

    if (savedAnalysisId) {

        console.log(
            "Analysis ID from localStorage:",
            savedAnalysisId
        );
    }

    return savedAnalysisId;
}


/*
==================================================
SHOW MAIN MESSAGE
==================================================
*/

function showMessage(
    message,
    type = ""
) {

    const messageElement =
        getElement(
            "resumeBuilderMessage"
        );

    if (!messageElement) {
        return;
    }

    messageElement.textContent =
        message;

    messageElement.className =
        "dashboard-message";

    if (type) {
        messageElement.classList.add(type);
    }
}


/*
==================================================
SHOW JD MESSAGE
==================================================
*/

function showJDMessage(message) {

    const messageElement =
        getElement(
            "jdMessage"
        );

    if (messageElement) {
        messageElement.textContent =
            message;
    }
}


/*
==================================================
SAFE JSON RESPONSE
==================================================
*/

async function getJSONResponse(response) {

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        contentType.includes(
            "application/json"
        )
    ) {

        try {

            return await response.json();

        }

        catch (error) {

            console.error(
                "JSON parsing error:",
                error
            );

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


/*
==================================================
GET SAVED DATA
==================================================
*/

function getSavedData() {

    const analysisId =
        getAnalysisIdFromURL() ||
        localStorage.getItem(
            "job_analysis_id"
        );

    if (analysisId) {

        localStorage.setItem(
            "job_analysis_id",
            analysisId
        );
    }

    return {

        resumeId:
            localStorage.getItem(
                "resume_id"
            ),

        analysisId:
            analysisId,

        jobDescription:
            localStorage.getItem(
                "job_description"
            )

    };
}


/*
==================================================
EXTRACT JOB DESCRIPTION
==================================================

Supports multiple possible backend
response structures.
==================================================
*/

function extractJobDescription(result) {

    if (!result) {
        return "";
    }

    const possibleValues = [

        result.job_description,

        result.jobDescription,

        result.analysis?.job_description,

        result.analysis?.jobDescription,

        result.data?.job_description,

        result.data?.jobDescription,

        result.result?.job_description,

        result.result?.jobDescription,

        result.result?.analysis?.job_description,

        result.result?.analysis?.jobDescription,

        result.job_analysis?.job_description,

        result.job_analysis?.jobDescription,

        result.jobAnalysis?.job_description,

        result.jobAnalysis?.jobDescription

    ];

    for (
        const value of possibleValues
    ) {

        if (
            typeof value === "string" &&
            value.trim()
        ) {

            return value.trim();
        }
    }

    return "";
}


/*
==================================================
LOAD JOB DESCRIPTION
==================================================

1. Try localStorage.
2. If missing, fetch Job Analysis.
3. Extract JD from backend response.
4. Display and save it.
==================================================
*/

async function loadJobDescription() {

    const textarea =
        getElement(
            "jobDescription"
        );

    if (!textarea) {

        console.error(
            "Job description textarea not found."
        );

        return;
    }


    /*
    GET CURRENT ANALYSIS ID
    */

    const analysisId =
        syncAnalysisId();


    /*
    TRY LOCAL STORAGE FIRST
    */

    const savedJobDescription =
        localStorage.getItem(
            "job_description"
        );


    if (
        savedJobDescription &&
        savedJobDescription.trim()
    ) {

        textarea.value =
            savedJobDescription;

        updateJDCharacterCount();

        showJDMessage(
            "✓ Job description loaded from your JD analysis."
        );

        console.log(
            "JD loaded from localStorage."
        );

        return;
    }


    /*
    NO ANALYSIS ID
    */

    if (!analysisId) {

        updateJDCharacterCount();

        showJDMessage(
            "No job analysis found. Please analyze a job description first."
        );

        console.error(
            "Missing job_analysis_id."
        );

        return;
    }


    /*
    FETCH JOB ANALYSIS
    */

    try {

        showJDMessage(
            "Loading job description..."
        );

        console.log(
            "Fetching Job Analysis:",
            analysisId
        );


        const response =
            await fetch(

                `${API_BASE}/api/job-analysis/${encodeURIComponent(
                    analysisId
                )}`,

                {

                    method:
                        "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    }

                }
            );


        const result =
            await getJSONResponse(
                response
            );


        console.log(
            "Job Analysis Response:",
            result
        );


        /*
        AUTH ERROR
        */

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


        /*
        BACKEND ERROR
        */

        if (!response.ok) {

            console.error(
                "Job Analysis API Error:",
                response.status,
                result
            );

            showJDMessage(
                result.message ||
                result.error ||
                "Unable to load the job description."
            );

            return;
        }


        /*
        EXTRACT JD
        */

        const jobDescription =
            extractJobDescription(
                result
            );


        console.log(
            "Extracted Job Description:",
            jobDescription
        );


        /*
        JD FOUND
        */

        if (jobDescription) {

            localStorage.setItem(
                "job_description",
                jobDescription
            );

            textarea.value =
                jobDescription;

            updateJDCharacterCount();

            showJDMessage(
                "✓ Job description loaded from your JD analysis."
            );

            console.log(
                "Job description loaded successfully."
            );

            return;
        }


        /*
        JD NOT FOUND
        */

        updateJDCharacterCount();

        showJDMessage(
            "No job description was found for this analysis."
        );

        console.error(
            "Could not find job_description in response:",
            result
        );

    }

    catch (error) {

        console.error(
            "Load Job Description Error:",
            error
        );

        showJDMessage(
            "Unable to connect to the job analysis server."
        );
    }
}


/*
==================================================
JD CHARACTER COUNT
==================================================
*/

function updateJDCharacterCount() {

    const textarea =
        getElement(
            "jobDescription"
        );

    const counter =
        getElement(
            "jdCharacterCount"
        );

    if (
        !textarea ||
        !counter
    ) {
        return;
    }

    counter.textContent =
        textarea.value.length;
}


/*
==================================================
SAVE JOB DESCRIPTION
==================================================
*/

function saveJobDescription() {

    const textarea =
        getElement(
            "jobDescription"
        );

    if (!textarea) {
        return;
    }

    const jobDescription =
        textarea.value.trim();

    if (jobDescription) {

        localStorage.setItem(
            "job_description",
            jobDescription
        );

    }
    else {

        localStorage.removeItem(
            "job_description"
        );
    }
}


/*
==================================================
VALIDATE BUILDER
==================================================
*/

function validateBuilder() {

    const data =
        getSavedData();


    /*
    RESUME CHECK
    */

    if (!data.resumeId) {

        showMessage(
            "Please upload your resume first.",
            "error"
        );

        console.error(
            "Missing resume_id."
        );

        return false;
    }


    /*
    ANALYSIS CHECK
    */

    if (!data.analysisId) {

        showMessage(
            "Job analysis ID is missing. Please analyze the job description again.",
            "error"
        );

        console.error(
            "Missing job_analysis_id."
        );

        return false;
    }


    /*
    TEXTAREA CHECK
    */

    const textarea =
        getElement(
            "jobDescription"
        );

    if (!textarea) {

        showMessage(
            "Job description field was not found.",
            "error"
        );

        return false;
    }


    /*
    JD CHECK
    */

    const jobDescription =
        textarea.value.trim();


    if (!jobDescription) {

        showMessage(
            "Job description is required.",
            "error"
        );

        return false;
    }


    /*
    LENGTH CHECK
    */

    if (
        jobDescription.length >
        20000
    ) {

        showMessage(
            "Job description must be under 20,000 characters.",
            "error"
        );

        return false;
    }


    return true;
}


/*
==================================================
CREATE TAILORED RESUME
==================================================
*/

async function createResume() {

    const button =
        getElement(
            "createResumeButton"
        );


    /*
    VALIDATION
    */

    if (!validateBuilder()) {
        return;
    }


    /*
    GET LATEST DATA
    */

    const data =
        getSavedData();


    const textarea =
        getElement(
            "jobDescription"
        );


    const jobDescription =
        textarea.value.trim();


    /*
    SAVE DATA
    */

    localStorage.setItem(
        "resume_id",
        data.resumeId
    );

    localStorage.setItem(
        "job_analysis_id",
        data.analysisId
    );

    localStorage.setItem(
        "job_description",
        jobDescription
    );


    /*
    DISABLE BUTTON
    */

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "✨ Generating Resume...";
    }


    showMessage(
        "Intervo is analyzing the job description and tailoring your resume...",
        ""
    );


    try {

        console.log(
            "Sending Resume Builder Request:",
            {

                resume_id:
                    data.resumeId,

                analysis_id:
                    data.analysisId,

                job_description_length:
                    jobDescription.length

            }
        );


        const response =
            await fetch(

                RESUME_BUILDER_API,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body:
                        JSON.stringify({

                            resume_id:
                                data.resumeId,

                            analysis_id:
                                data.analysisId,

                            job_description:
                                jobDescription

                        })

                }
            );


        const result =
            await getJSONResponse(
                response
            );


        console.log(
            "Resume Builder Response:",
            result
        );


        /*
        AUTH ERROR
        */

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


        /*
        API ERROR
        */

        if (!response.ok) {

            console.error(
                "Resume Builder API Error:",
                {

                    status:
                        response.status,

                    response:
                        result

                }
            );


            showMessage(

                result.message ||
                result.error ||
                `Resume generation failed. (${response.status})`,

                "error"

            );

            return;
        }


        /*
        GET GENERATED RESUME
        */

        const generatedResume =
            result.resume ||
            result.generated_resume;


        if (!generatedResume) {

            console.error(
                "Generated resume missing:",
                result
            );

            showMessage(
                "The server responded, but no generated resume was returned.",
                "error"
            );

            return;
        }


        /*
        SAVE GENERATED RESUME
        */

        localStorage.setItem(
            "generated_resume",
            JSON.stringify(
                generatedResume
            )
        );


        /*
        SAVE WHICH ANALYSIS
        GENERATED THIS RESUME
        */

        localStorage.setItem(
            "generated_resume_analysis_id",
            data.analysisId
        );


        /*
        DISPLAY
        */

        displayResumePreview(
            generatedResume
        );


        /*
        SUCCESS
        */

        showMessage(
            "✓ Your tailored resume was created successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Resume Builder Error:",
            error
        );

        showMessage(
            "Unable to connect to the resume builder server. Please try again.",
            "error"
        );

    }

    finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "✨ Generate Tailored Resume";
        }
    }
}


/*
==================================================
DISPLAY GENERATED RESUME
==================================================
*/

function displayResumePreview(resume) {

    const previewSection =
        getElement(
            "resumePreviewSection"
        );

    const preview =
        getElement(
            "resumePreview"
        );

    if (
        !previewSection ||
        !preview
    ) {

        console.error(
            "Resume preview elements not found."
        );

        return;
    }


    previewSection.style.display =
        "block";


    preview.contentEditable =
        "false";


    preview.classList.remove(
        "resume-preview-editing"
    );


    const saveButton =
        getElement(
            "saveResumeButton"
        );


    if (saveButton) {
        saveButton.style.display =
            "none";
    }


    /*
    STRING RESUME
    */

    if (
        typeof resume ===
        "string"
    ) {

        preview.innerHTML =
            `<p>${formatResumeText(
                resume
            )}</p>`;

        return;
    }


    /*
    OBJECT RESUME
    */

    if (
        typeof resume === "object" &&
        resume !== null
    ) {

        preview.innerHTML =
            formatResumeObject(
                resume
            );

        return;
    }


    preview.innerHTML =
        "<p>Unable to display generated resume.</p>";
}


/*
==================================================
FORMAT RESUME TEXT
==================================================
*/

function formatResumeText(text) {

    if (!text) {
        return "";
    }

    const escaped =
        escapeHTML(text);

    return escaped
        .replace(
            /\n\n+/g,
            "</p><p>"
        )
        .replace(
            /\n/g,
            "<br>"
        );
}


/*
==================================================
FORMAT RESUME OBJECT
==================================================
*/

function formatResumeObject(resume) {

    let html = "";


    /*
    CONTACT
    */

    const contact =
        resume.contact &&
        typeof resume.contact === "object"

            ? resume.contact

            : {};


    /*
    NAME
    */

    if (contact.name) {

        html +=
            `<h2 class="resume-name">
                ${escapeHTML(
                    contact.name
                )}
            </h2>`;
    }


    /*
    CONTACT INFORMATION
    */

    const contactFields = [

        "email",
        "phone",
        "linkedin",
        "github",
        "portfolio"

    ];


    const contacts = [];


    contactFields.forEach(
        function (field) {

            const value =
                contact[field];

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim()
            ) {

                contacts.push(
                    escapeHTML(
                        String(value)
                    )
                );
            }
        }
    );


    if (contacts.length > 0) {

        html +=
            `<p class="resume-contact">
                ${contacts.join(" | ")}
            </p>`;
    }


    /*
    SUMMARY
    */

    if (
        resume.summary &&
        String(
            resume.summary
        ).trim()
    ) {

        html +=
            createResumeSection(
                "Professional Summary",
                resume.summary
            );
    }


    /*
    SKILLS
    */

    if (
        Array.isArray(
            resume.skills
        ) &&
        resume.skills.length
    ) {

        html +=
            createResumeSection(
                "Skills",
                resume.skills
            );
    }


    /*
    EXPERIENCE
    */

    if (
        Array.isArray(
            resume.experience
        ) &&
        resume.experience.length
    ) {

        html +=
            createExperienceSection(
                resume.experience
            );
    }


    /*
    PROJECTS
    */

    if (
        Array.isArray(
            resume.projects
        ) &&
        resume.projects.length
    ) {

        html +=
            createProjectsSection(
                resume.projects
            );
    }


    /*
    EDUCATION
    */

    if (
        Array.isArray(
            resume.education
        ) &&
        resume.education.length
    ) {

        html +=
            createEducationSection(
                resume.education
            );
    }


    /*
    CERTIFICATIONS
    */

    if (
        Array.isArray(
            resume.certifications
        ) &&
        resume.certifications.length
    ) {

        html +=
            createCertificationSection(
                resume.certifications
            );
    }


    /*
    ACHIEVEMENTS
    */

    if (
        Array.isArray(
            resume.achievements
        ) &&
        resume.achievements.length
    ) {

        html +=
            createAchievementSection(
                resume.achievements
            );
    }


    /*
    FALLBACK
    */

    if (!html) {

        html =
            `<pre>${escapeHTML(
                JSON.stringify(
                    resume,
                    null,
                    2
                )
            )}</pre>`;
    }


    return html;
}


/*
==================================================
CREATE GENERIC RESUME SECTION
==================================================
*/

function createResumeSection(
    title,
    content
) {

    let formattedContent = "";


    if (Array.isArray(content)) {

        formattedContent =
            "<ul>";


        content.forEach(
            function (item) {

                if (
                    item === null ||
                    item === undefined
                ) {
                    return;
                }


                if (
                    typeof item === "object"
                ) {

                    formattedContent +=
                        `<li>${escapeHTML(
                            formatObjectInline(
                                item
                            )
                        )}</li>`;

                }

                else {

                    formattedContent +=
                        `<li>${escapeHTML(
                            String(item)
                        )}</li>`;
                }
            }
        );


        formattedContent +=
            "</ul>";

    }

    else {

        formattedContent =
            `<p>${formatResumeText(
                String(content)
            )}</p>`;
    }


    return `

        <section class="resume-preview-section">

            <h3>
                ${escapeHTML(title)}
            </h3>

            ${formattedContent}

        </section>

    `;
}


/*
==================================================
EXPERIENCE SECTION
==================================================
*/

function createExperienceSection(experience) {

    let html = `

        <section class="resume-preview-section">

            <h3>Experience</h3>

    `;


    experience.forEach(
        function (item) {

            if (
                !item ||
                typeof item !== "object"
            ) {
                return;
            }


            const jobTitle =
                String(
                    item.job_title || ""
                ).trim();


            const company =
                String(
                    item.company || ""
                ).trim();


            const location =
                String(
                    item.location || ""
                ).trim();


            const dates =
                String(
                    item.dates || ""
                ).trim();


            const headingParts = [];


            if (jobTitle) {
                headingParts.push(jobTitle);
            }


            if (company) {
                headingParts.push(company);
            }


            const heading =
                headingParts.join(" — ");


            if (heading) {

                html +=
                    `<h4>
                        ${escapeHTML(
                            heading
                        )}
                    </h4>`;
            }


            if (
                location ||
                dates
            ) {

                html +=
                    `<p class="resume-meta">
                        ${escapeHTML(
                            [
                                location,
                                dates
                            ]
                            .filter(
                                value => value
                            )
                            .join(" | ")
                        )}
                    </p>`;
            }


            if (
                Array.isArray(
                    item.bullets
                ) &&
                item.bullets.length
            ) {

                html += "<ul>";


                item.bullets.forEach(
                    function (bullet) {

                        if (
                            bullet !== null &&
                            bullet !== undefined
                        ) {

                            html +=
                                `<li>
                                    ${escapeHTML(
                                        String(
                                            bullet
                                        )
                                    )}
                                </li>`;
                        }
                    }
                );


                html += "</ul>";
            }
        }
    );


    html +=
        "</section>";


    return html;
}


/*
==================================================
PROJECTS SECTION
==================================================
*/

function createProjectsSection(projects) {

    let html = `

        <section class="resume-preview-section">

            <h3>Projects</h3>

    `;


    projects.forEach(
        function (project) {

            if (
                !project ||
                typeof project !== "object"
            ) {
                return;
            }


            const name =
                String(
                    project.name || ""
                ).trim();


            const description =
                String(
                    project.description || ""
                ).trim();


            if (name) {

                html +=
                    `<h4>
                        ${escapeHTML(name)}
                    </h4>`;
            }


            if (
                Array.isArray(
                    project.technologies
                ) &&
                project.technologies.length
            ) {

                html +=
                    `<p class="resume-technologies">
                        <strong>Technologies:</strong>
                        ${escapeHTML(
                            project.technologies.join(
                                ", "
                            )
                        )}
                    </p>`;
            }


            if (description) {

                html +=
                    `<p>
                        ${formatResumeText(
                            description
                        )}
                    </p>`;
            }


            if (
                Array.isArray(
                    project.bullets
                ) &&
                project.bullets.length
            ) {

                html += "<ul>";


                project.bullets.forEach(
                    function (bullet) {

                        if (
                            bullet !== null &&
                            bullet !== undefined
                        ) {

                            html +=
                                `<li>
                                    ${escapeHTML(
                                        String(
                                            bullet
                                        )
                                    )}
                                </li>`;
                        }
                    }
                );


                html += "</ul>";
            }
        }
    );


    html +=
        "</section>";


    return html;
}


/*
==================================================
EDUCATION SECTION
==================================================
*/

function createEducationSection(education) {

    let html = `

        <section class="resume-preview-section">

            <h3>Education</h3>

    `;


    education.forEach(
        function (item) {

            if (
                !item ||
                typeof item !== "object"
            ) {
                return;
            }


            const degree =
                String(
                    item.degree || ""
                ).trim();


            const institution =
                String(
                    item.institution || ""
                ).trim();


            const location =
                String(
                    item.location || ""
                ).trim();


            const dates =
                String(
                    item.dates || ""
                ).trim();


            const headingParts = [];


            if (degree) {
                headingParts.push(degree);
            }


            if (institution) {
                headingParts.push(institution);
            }


            if (headingParts.length) {

                html +=
                    `<h4>
                        ${escapeHTML(
                            headingParts.join(
                                " — "
                            )
                        )}
                    </h4>`;
            }


            if (
                location ||
                dates
            ) {

                html +=
                    `<p class="resume-meta">
                        ${escapeHTML(
                            [
                                location,
                                dates
                            ]
                            .filter(
                                value => value
                            )
                            .join(" | ")
                        )}
                    </p>`;
            }


            if (
                Array.isArray(
                    item.details
                ) &&
                item.details.length
            ) {

                html += "<ul>";


                item.details.forEach(
                    function (detail) {

                        if (
                            detail !== null &&
                            detail !== undefined
                        ) {

                            html +=
                                `<li>
                                    ${escapeHTML(
                                        String(
                                            detail
                                        )
                                    )}
                                </li>`;
                        }
                    }
                );


                html += "</ul>";
            }
        }
    );


    html +=
        "</section>";


    return html;
}


/*
==================================================
CERTIFICATIONS SECTION
==================================================
*/

function createCertificationSection(
    certifications
) {

    let html = `

        <section class="resume-preview-section">

            <h3>Certifications</h3>

            <ul>

    `;


    certifications.forEach(
        function (item) {

            /*
            Support both object and string
            certification formats.
            */

            if (
                typeof item === "string"
            ) {

                html +=
                    `<li>
                        ${escapeHTML(item)}
                    </li>`;

                return;
            }


            if (
                !item ||
                typeof item !== "object"
            ) {
                return;
            }


            const name =
                String(
                    item.name || ""
                ).trim();


            const issuer =
                String(
                    item.issuer || ""
                ).trim();


            const date =
                String(
                    item.date || ""
                ).trim();


            const parts = [];


            if (name) {
                parts.push(name);
            }


            if (issuer) {
                parts.push(issuer);
            }


            if (date) {
                parts.push(date);
            }


            if (parts.length) {

                html +=
                    `<li>
                        ${escapeHTML(
                            parts.join(
                                " — "
                            )
                        )}
                    </li>`;
            }
        }
    );


    html += `

            </ul>

        </section>

    `;


    return html;
}


/*
==================================================
ACHIEVEMENTS SECTION
==================================================
*/

function createAchievementSection(
    achievements
) {

    let html = `

        <section class="resume-preview-section">

            <h3>Achievements</h3>

            <ul>

    `;


    achievements.forEach(
        function (item) {

            /*
            Support string achievements.
            */

            if (
                typeof item === "string"
            ) {

                html +=
                    `<li>
                        ${escapeHTML(item)}
                    </li>`;

                return;
            }


            if (
                !item ||
                typeof item !== "object"
            ) {
                return;
            }


            const title =
                String(
                    item.title || ""
                ).trim();


            const description =
                String(
                    item.description || ""
                ).trim();


            const text =
                [title, description]
                    .filter(
                        value => value
                    )
                    .join(" — ");


            if (text) {

                html +=
                    `<li>
                        ${escapeHTML(text)}
                    </li>`;
            }
        }
    );


    html += `

            </ul>

        </section>

    `;


    return html;
}


/*
==================================================
FORMAT OBJECT INLINE
==================================================
*/

function formatObjectInline(object) {

    if (
        !object ||
        typeof object !== "object"
    ) {

        return String(
            object || ""
        );
    }


    return Object.values(object)

        .filter(
            value =>
                value !== null &&
                value !== undefined &&
                String(value).trim()
        )

        .map(
            value =>
                Array.isArray(value)
                    ? value.join(", ")
                    : String(value)
        )

        .join(" — ");
}


/*
==================================================
ESCAPE HTML
==================================================
*/

function escapeHTML(value) {

    return String(
        value ?? ""
    )

    .replace(
        /&/g,
        "&amp;"
    )

    .replace(
        /</g,
        "&lt;"
    )

    .replace(
        />/g,
        "&gt;"
    )

    .replace(
        /"/g,
        "&quot;"
    )

    .replace(
        /'/g,
        "&#039;"
    );
}


/*
==================================================
EDIT RESUME
==================================================
*/

function editResume() {

    const preview =
        getElement(
            "resumePreview"
        );

    if (!preview) {
        return;
    }


    preview.contentEditable =
        "true";


    preview.classList.add(
        "resume-preview-editing"
    );


    const saveButton =
        getElement(
            "saveResumeButton"
        );


    if (saveButton) {

        saveButton.style.display =
            "inline-flex";
    }


    showMessage(
        "✏️ You can now edit the resume directly. Click Save Changes when finished.",
        ""
    );


    preview.focus();
}


/*
==================================================
SAVE EDITED PREVIEW
==================================================
*/

function saveEditedPreview() {

    const preview =
        getElement(
            "resumePreview"
        );

    if (!preview) {
        return;
    }


    const savedResume =
        localStorage.getItem(
            "generated_resume"
        );


    if (!savedResume) {

        showMessage(
            "No generated resume was found.",
            "error"
        );

        return;
    }


    let resumeData;


    try {

        resumeData =
            JSON.parse(
                savedResume
            );

    }

    catch (error) {

        console.error(
            "Saved Resume JSON Error:",
            error
        );

        showMessage(
            "Unable to read the saved resume.",
            "error"
        );

        return;
    }


    /*
    UPDATE DATA
    */

    if (
        typeof resumeData ===
        "string"
    ) {

        resumeData =
            getEditedResumeText(
                preview
            );

    }

    else {

        resumeData =
            updateResumeObjectFromPreview(
                resumeData,
                preview
            );
    }


    /*
    SAVE
    */

    localStorage.setItem(
        "generated_resume",
        JSON.stringify(
            resumeData
        )
    );


    /*
    EXIT EDIT MODE
    */

    preview.contentEditable =
        "false";


    preview.classList.remove(
        "resume-preview-editing"
    );


    const saveButton =
        getElement(
            "saveResumeButton"
        );


    if (saveButton) {

        saveButton.style.display =
            "none";
    }


    showMessage(
        "✓ Your resume changes have been saved.",
        "success"
    );
}


/*
==================================================
GET EDITED RESUME TEXT
==================================================
*/

function getEditedResumeText(preview) {

    return preview.innerText.trim();
}


/*
==================================================
UPDATE RESUME OBJECT FROM PREVIEW
==================================================
*/

function updateResumeObjectFromPreview(
    resumeData,
    preview
) {

    const updatedResume =
        JSON.parse(
            JSON.stringify(
                resumeData
            )
        );


    /*
    CONTACT
    */

    const nameElement =
        preview.querySelector(
            ".resume-name"
        );


    const contactElement =
        preview.querySelector(
            ".resume-contact"
        );


    if (!updatedResume.contact) {
        updatedResume.contact = {};
    }


    /*
    NAME
    */

    if (nameElement) {

        updatedResume.contact.name =
            nameElement.innerText.trim();
    }


    /*
    CONTACT INFORMATION
    */

    if (contactElement) {

        const contactText =
            contactElement.innerText.trim();


        const parts =
            contactText
                .split("|")
                .map(
                    item =>
                        item.trim()
                )
                .filter(
                    item =>
                        item
                );


        const fields = [

            "email",
            "phone",
            "linkedin",
            "github",
            "portfolio"

        ];


        fields.forEach(
            function (
                field,
                index
            ) {

                if (
                    parts[index] !==
                    undefined
                ) {

                    updatedResume.contact[field] =
                        parts[index];
                }
            }
        );
    }


    /*
    RESUME SECTIONS
    */

    const sections =
        preview.querySelectorAll(
            ".resume-preview-section"
        );


    sections.forEach(
        function (section) {

            const heading =
                section.querySelector(
                    "h3"
                );


            if (!heading) {
                return;
            }


            const title =
                heading.innerText
                    .trim()
                    .toLowerCase();


            /*
            SUMMARY
            */

            if (
                title ===
                "professional summary"
            ) {

                const paragraph =
                    section.querySelector(
                        "p"
                    );


                if (paragraph) {

                    updatedResume.summary =
                        paragraph.innerText.trim();
                }
            }


            /*
            SKILLS
            */

            else if (
                title === "skills"
            ) {

                updatedResume.skills =
                    Array.from(
                        section.querySelectorAll(
                            "li"
                        )
                    )
                    .map(
                        item =>
                            item.innerText.trim()
                    )
                    .filter(
                        item =>
                            item
                    );
            }


            /*
            EXPERIENCE
            */

            else if (
                title === "experience"
            ) {

                updatedResume.experience =
                    readExperienceFromPreview(
                        section
                    );
            }


            /*
            PROJECTS
            */

            else if (
                title === "projects"
            ) {

                updatedResume.projects =
                    readProjectsFromPreview(
                        section
                    );
            }


            /*
            EDUCATION
            */

            else if (
                title === "education"
            ) {

                updatedResume.education =
                    readEducationFromPreview(
                        section
                    );
            }


            /*
            CERTIFICATIONS
            */

            else if (
                title === "certifications"
            ) {

                updatedResume.certifications =
                    readSimpleListFromPreview(
                        section
                    );
            }


            /*
            ACHIEVEMENTS
            */

            else if (
                title === "achievements"
            ) {

                updatedResume.achievements =
                    readAchievementsFromPreview(
                        section
                    );
            }

        }
    );


    return updatedResume;
}


/*
==================================================
READ EXPERIENCE
==================================================
*/

function readExperienceFromPreview(section) {

    const result = [];


    const headings =
        section.querySelectorAll(
            "h4"
        );


    headings.forEach(
        function (heading) {

            const item = {};


            const headingParts =
                heading.innerText
                    .split("—")
                    .map(
                        value =>
                            value.trim()
                    )
                    .filter(
                        value =>
                            value
                    );


            if (headingParts[0]) {
                item.job_title =
                    headingParts[0];
            }


            if (headingParts[1]) {
                item.company =
                    headingParts[1];
            }


            let next =
                heading.nextElementSibling;


            /*
            META
            */

            if (
                next &&
                next.classList.contains(
                    "resume-meta"
                )
            ) {

                const metaParts =
                    next.innerText
                        .split("|")
                        .map(
                            value =>
                                value.trim()
                        )
                        .filter(
                            value =>
                                value
                        );


                if (metaParts[0]) {
                    item.location =
                        metaParts[0];
                }


                if (metaParts[1]) {
                    item.dates =
                        metaParts[1];
                }


                next =
                    next.nextElementSibling;
            }


            /*
            BULLETS
            */

            while (next) {

                if (
                    next.tagName ===
                    "UL"
                ) {

                    item.bullets =
                        Array.from(
                            next.querySelectorAll(
                                "li"
                            )
                        )
                        .map(
                            li =>
                                li.innerText.trim()
                        )
                        .filter(
                            value =>
                                value
                        );

                    break;
                }


                if (
                    next.tagName ===
                    "H4"
                ) {

                    break;
                }


                next =
                    next.nextElementSibling;
            }


            result.push(item);
        }
    );


    return result;
}


/*
==================================================
READ PROJECTS
==================================================
*/

function readProjectsFromPreview(section) {

    const result = [];


    const headings =
        section.querySelectorAll(
            "h4"
        );


    headings.forEach(
        function (heading) {

            const project = {};


            project.name =
                heading.innerText.trim();


            let next =
                heading.nextElementSibling;


            /*
            TECHNOLOGIES
            */

            if (
                next &&
                next.classList.contains(
                    "resume-technologies"
                )
            ) {

                const technologyText =
                    next.innerText
                        .replace(
                            /^Technologies:\s*/i,
                            ""
                        )
                        .trim();


                if (technologyText) {

                    project.technologies =
                        technologyText
                            .split(",")
                            .map(
                                value =>
                                    value.trim()
                            )
                            .filter(
                                value =>
                                    value
                            );
                }


                next =
                    next.nextElementSibling;
            }


            /*
            DESCRIPTION
            */

            if (
                next &&
                next.tagName === "P"
            ) {

                project.description =
                    next.innerText.trim();

                next =
                    next.nextElementSibling;
            }


            /*
            BULLETS
            */

            if (
                next &&
                next.tagName === "UL"
            ) {

                project.bullets =
                    Array.from(
                        next.querySelectorAll(
                            "li"
                        )
                    )
                    .map(
                        li =>
                            li.innerText.trim()
                    )
                    .filter(
                        value =>
                            value
                    );
            }


            result.push(project);
        }
    );


    return result;
}


/*
==================================================
READ EDUCATION
==================================================
*/

function readEducationFromPreview(section) {

    const result = [];


    const headings =
        section.querySelectorAll(
            "h4"
        );


    headings.forEach(
        function (heading) {

            const item = {};


            const headingParts =
                heading.innerText
                    .split("—")
                    .map(
                        value =>
                            value.trim()
                    )
                    .filter(
                        value =>
                            value
                    );


            if (headingParts[0]) {
                item.degree =
                    headingParts[0];
            }


            if (headingParts[1]) {
                item.institution =
                    headingParts[1];
            }


            let next =
                heading.nextElementSibling;


            /*
            META
            */

            if (
                next &&
                next.classList.contains(
                    "resume-meta"
                )
            ) {

                const metaParts =
                    next.innerText
                        .split("|")
                        .map(
                            value =>
                                value.trim()
                        )
                        .filter(
                            value =>
                                value
                        );


                if (metaParts[0]) {
                    item.location =
                        metaParts[0];
                }


                if (metaParts[1]) {
                    item.dates =
                        metaParts[1];
                }


                next =
                    next.nextElementSibling;
            }


            /*
            DETAILS
            */

            if (
                next &&
                next.tagName === "UL"
            ) {

                item.details =
                    Array.from(
                        next.querySelectorAll(
                            "li"
                        )
                    )
                    .map(
                        li =>
                            li.innerText.trim()
                    )
                    .filter(
                        value =>
                            value
                    );
            }


            result.push(item);
        }
    );


    return result;
}


/*
==================================================
READ SIMPLE LIST
==================================================
*/

function readSimpleListFromPreview(section) {

    return Array.from(
        section.querySelectorAll(
            "li"
        )
    )
    .map(
        li =>
            li.innerText.trim()
    )
    .filter(
        value =>
            value
    );
}


/*
==================================================
READ ACHIEVEMENTS
==================================================
*/

function readAchievementsFromPreview(section) {

    return Array.from(
        section.querySelectorAll(
            "li"
        )
    )
    .map(
        li =>
            li.innerText.trim()
    )
    .filter(
        value =>
            value
    )
    .map(
        text => {

            const parts =
                text
                    .split("—")
                    .map(
                        value =>
                            value.trim()
                    )
                    .filter(
                        value =>
                            value
                    );


            if (
                parts.length >= 2
            ) {

                return {

                    title:
                        parts[0],

                    description:
                        parts
                            .slice(1)
                            .join(" — ")

                };
            }


            return {

                title:
                    text,

                description:
                    ""

            };
        }
    );
}


/*
==================================================
DOWNLOAD PDF
==================================================
*/

async function downloadResume() {

    /*
    SAVE EDITS FIRST
    */

    const preview =
        getElement(
            "resumePreview"
        );


    if (
        preview &&
        preview.contentEditable === "true"
    ) {

        saveEditedPreview();
    }


    const button =
        getElement(
            "downloadResumeButton"
        );


    const message =
        getElement(
            "resumeDownloadMessage"
        );


    const generatedResume =
        localStorage.getItem(
            "generated_resume"
        );


    /*
    NO RESUME
    */

    if (!generatedResume) {

        if (message) {

            message.textContent =
                "Please generate your resume first.";
        }

        return;
    }


    let resumeData;


    try {

        resumeData =
            JSON.parse(
                generatedResume
            );

    }

    catch (error) {

        console.error(
            "Resume JSON Error:",
            error
        );


        if (message) {

            message.textContent =
                "Saved resume data is invalid. Please generate it again.";
        }

        return;
    }


    /*
    DISABLE BUTTON
    */

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "📥 Preparing PDF...";
    }


    if (message) {

        message.textContent =
            "Creating your PDF...";
    }


    try {

        const response =
            await fetch(

                `${RESUME_BUILDER_API}/pdf`,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body:
                        JSON.stringify({

                            resume:
                                resumeData

                        })
                }
            );


        /*
        AUTH ERROR
        */

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


        /*
        API ERROR
        */

        if (!response.ok) {

            const errorData =
                await getJSONResponse(
                    response
                );


            console.error(
                "PDF API Error:",
                errorData
            );


            if (message) {

                message.textContent =
                    errorData.message ||
                    "Unable to create PDF.";
            }

            return;
        }


        /*
        GET PDF
        */

        const blob =
            await response.blob();


        if (
            !blob ||
            blob.size === 0
        ) {

            throw new Error(
                "Empty PDF received."
            );
        }


        /*
        DOWNLOAD
        */

        const url =
            window.URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            "Intervo_Tailored_Resume.pdf";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        window.URL.revokeObjectURL(
            url
        );


        if (message) {

            message.textContent =
                "✓ Resume downloaded successfully.";
        }

    }

    catch (error) {

        console.error(
            "PDF Download Error:",
            error
        );


        if (message) {

            message.textContent =
                "Unable to connect to the PDF server.";
        }

    }

    finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "📥 Download PDF";
        }
    }
}


/*
==================================================
LOAD PREVIOUSLY GENERATED RESUME
==================================================

Only load the saved resume if it belongs
to the current Job Analysis.
==================================================
*/

function loadSavedResume() {

    const savedResume =
        localStorage.getItem(
            "generated_resume"
        );


    if (!savedResume) {
        return;
    }


    const currentAnalysisId =
        getAnalysisIdFromURL() ||
        localStorage.getItem(
            "job_analysis_id"
        );


    const generatedResumeAnalysisId =
        localStorage.getItem(
            "generated_resume_analysis_id"
        );


    /*
    PREVENT OLD RESUME FROM APPEARING
    */

    if (
        generatedResumeAnalysisId &&
        currentAnalysisId &&
        generatedResumeAnalysisId !==
        currentAnalysisId
    ) {

        console.log(
            "Saved resume belongs to another job analysis."
        );

        return;
    }


    try {

        const resume =
            JSON.parse(
                savedResume
            );


        displayResumePreview(
            resume
        );


        showMessage(
            "Previously generated resume loaded.",
            ""
        );

    }

    catch (error) {

        console.error(
            "Saved Resume Error:",
            error
        );


        localStorage.removeItem(
            "generated_resume"
        );

        localStorage.removeItem(
            "generated_resume_analysis_id"
        );
    }
}


/*
==================================================
EVENT LISTENERS
==================================================
*/

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
        SYNC ANALYSIS ID
        */

        syncAnalysisId();


        /*
        LOAD JOB DESCRIPTION
        */

        loadJobDescription();


        /*
        LOAD SAVED RESUME
        */

        loadSavedResume();


        /*
        CREATE BUTTON
        */

        const createButton =
            getElement(
                "createResumeButton"
            );


        if (createButton) {

            createButton.addEventListener(
                "click",
                createResume
            );
        }


        /*
        EDIT BUTTON
        */

        const editButton =
            getElement(
                "editResumeButton"
            );


        if (editButton) {

            editButton.addEventListener(
                "click",
                editResume
            );
        }


        /*
        SAVE BUTTON
        */

        const saveButton =
            getElement(
                "saveResumeButton"
            );


        if (saveButton) {

            saveButton.addEventListener(
                "click",
                saveEditedPreview
            );
        }


        /*
        DOWNLOAD BUTTON
        */

        const downloadButton =
            getElement(
                "downloadResumeButton"
            );


        if (downloadButton) {

            downloadButton.addEventListener(
                "click",
                downloadResume
            );
        }


        /*
        JOB DESCRIPTION INPUT
        */

        const textarea =
            getElement(
                "jobDescription"
            );


        if (textarea) {

            textarea.addEventListener(
                "input",
                function () {

                    updateJDCharacterCount();

                    saveJobDescription();

                }
            );


            updateJDCharacterCount();
        }

    }
);

