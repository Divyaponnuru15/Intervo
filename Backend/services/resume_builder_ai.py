import json

from services.ats_analyzer import (
    client,
    MODEL_NAME
)


# ============================================================
# GENERATE TAILORED RESUME
# ============================================================

def generate_tailored_resume(
    resume_text,
    job_description,
    job_analysis=None
):

    # ========================================================
    # VALIDATE INPUT
    # ========================================================

    if not resume_text or not resume_text.strip():
        raise ValueError(
            "Resume text is empty."
        )

    if not job_description or not job_description.strip():
        raise ValueError(
            "Job description is empty."
        )

    resume_text = resume_text.strip()
    job_description = job_description.strip()

    # ========================================================
    # OPTIONAL JOB ANALYSIS INFORMATION
    # ========================================================

    analysis_text = ""

    if isinstance(job_analysis, dict):

        analysis_text = f"""
MATCHING SKILLS:
{json.dumps(
    job_analysis.get("matching_skills", []),
    ensure_ascii=False
)}

PARTIAL SKILLS:
{json.dumps(
    job_analysis.get("partial_skills", []),
    ensure_ascii=False
)}

PRIORITY SKILLS:
{json.dumps(
    job_analysis.get("priority_skills", []),
    ensure_ascii=False
)}

MISSING SKILLS:
{json.dumps(
    job_analysis.get("missing_skills", []),
    ensure_ascii=False
)}

RESUME SUGGESTIONS:
{json.dumps(
    job_analysis.get("resume_suggestions", []),
    ensure_ascii=False
)}
"""

    # ========================================================
    # AI PROMPT
    # ========================================================

    prompt = f"""
You are an expert resume writer and ATS optimization
specialist.

Your task is to create an ATS-friendly resume tailored
to the provided Job Description.

There is ONE extremely important rule:

============================================================
SOURCE-OF-TRUTH RULE
============================================================

You MUST use ONLY factual information contained in the
candidate's original resume.

DO NOT invent or assume ANY information.

Never invent:

- Work experience
- Job titles
- Companies
- Internships
- Projects
- Project features
- Programming languages
- Frameworks
- Technologies
- Tools
- Certifications
- Education
- Degrees
- Universities
- CGPA
- Achievements
- Awards
- Responsibilities
- Job duties
- Numbers
- Statistics
- Users
- Revenue
- Performance improvements
- Years of experience
- Contact information

If something is not present in the original resume,
DO NOT add it.

============================================================
WHAT YOU ARE ALLOWED TO DO
============================================================

You MAY:

- Rewrite existing sentences professionally.
- Improve grammar.
- Improve clarity.
- Reorder existing information.
- Make existing experience more concise.
- Make existing project descriptions stronger.
- Use ATS-friendly wording.
- Emphasize skills that already exist in the resume.
- Reorder existing skills according to job relevance.
- Tailor the professional summary using existing facts.
- Rewrite existing bullet points using action-oriented language.
- Remove irrelevant information when appropriate.
- Organize the resume into a clean ATS-friendly structure.

You MUST NOT turn a suggested or missing skill into an
actual candidate skill.

For example:

If the JD requires AWS but the resume does not mention AWS,
DO NOT add AWS to the Skills section.

If the JD requires Django and the resume mentions Django,
you MAY emphasize Django more strongly.

============================================================
JOB DESCRIPTION
============================================================

{job_description}

============================================================
EXISTING RESUME
============================================================

{resume_text}

============================================================
EXISTING JOB ANALYSIS
============================================================

{analysis_text}

============================================================
RESUME GENERATION REQUIREMENTS
============================================================

Create a professional ATS-friendly resume.

Use only sections that are supported by the original resume.

Possible sections include:

- contact
- summary
- skills
- experience
- projects
- education
- certifications
- achievements

If the original resume does not contain a section,
return an empty value for that section.

Do not fabricate content to fill empty sections.

============================================================
CONTACT
============================================================

Preserve contact information from the original resume.

Do not modify:

- Name
- Email
- Phone
- LinkedIn
- GitHub
- Portfolio

If a contact field is not present, return an empty string.

============================================================
SUMMARY
============================================================

Create a concise professional summary based ONLY on facts
already present in the resume.

Tailor it to the Job Description.

Do not claim experience that does not exist.

============================================================
SKILLS
============================================================

Include ONLY skills that are actually present in the
original resume.

You may reorder them according to the job description.

Do not add missing skills.

============================================================
EXPERIENCE
============================================================

Preserve only actual experience from the original resume.

You may rewrite the wording.

Do not invent responsibilities or achievements.

============================================================
PROJECTS
============================================================

Preserve actual projects from the original resume.

You may:

- Improve wording
- Highlight relevant technologies already mentioned
- Reorder projects based on relevance
- Make descriptions concise

Do not invent project features.

============================================================
EDUCATION
============================================================

Preserve education exactly according to the original resume.

Do not invent:

- CGPA
- Marks
- Dates
- Institutions
- Degrees

============================================================
CERTIFICATIONS
============================================================

Only include certifications present in the original resume.

============================================================
ACHIEVEMENTS
============================================================

Only include achievements actually present in the original
resume.

============================================================
OUTPUT
============================================================

Return ONLY valid JSON.

Do NOT return Markdown.

Do NOT return code fences.

Use EXACTLY this structure:

{{
    "contact": {{
        "name": "",
        "email": "",
        "phone": "",
        "linkedin": "",
        "github": "",
        "portfolio": ""
    }},

    "summary": "",

    "skills": [],

    "experience": [],

    "projects": [],

    "education": [],

    "certifications": [],

    "achievements": []
}}

For experience, use:

{{
    "job_title": "",
    "company": "",
    "location": "",
    "dates": "",
    "bullets": []
}}

For projects, use:

{{
    "name": "",
    "technologies": [],
    "description": "",
    "bullets": []
}}

For education, use:

{{
    "degree": "",
    "institution": "",
    "location": "",
    "dates": "",
    "details": []
}}

For certifications, use:

{{
    "name": "",
    "issuer": "",
    "date": ""
}}

For achievements, use:

{{
    "title": "",
    "description": ""
}}

============================================================
FINAL INTEGRITY CHECK
============================================================

Before returning the JSON, verify:

1. Every fact comes from the original resume.
2. No new technology was invented.
3. No new project was invented.
4. No new experience was invented.
5. No new education was invented.
6. No new certification was invented.
7. No new achievement was invented.
8. No fake numbers were added.
9. No missing JD skill was presented as an existing skill.
10. The resume is tailored only by rewriting and reorganizing
    existing information.
"""

    # ========================================================
    # CALL GEMINI
    # ========================================================

    try:

        print()
        print("==========================================")
        print("      GEMINI AI RESUME BUILDER")
        print("==========================================")

        print(
            f"Model: {MODEL_NAME}"
        )

        response = client.models.generate_content(

            model=MODEL_NAME,

            contents=prompt,

            config={
                "temperature": 0,
                "response_mime_type": "application/json"
            }
        )

    except Exception as error:

        print()
        print("========== GEMINI RESUME BUILDER ERROR ==========")
        print(
            str(error)
        )
        print("==================================================")

        error_message = str(error).lower()

        if (
            "quota" in error_message
            or "rate limit" in error_message
            or "429" in error_message
            or "resource exhausted" in error_message
        ):

            raise RuntimeError(
                "Gemini API quota has been reached. "
                "Please try again later."
            )

        if (
            "503" in error_message
            or "unavailable" in error_message
            or "high demand" in error_message
        ):

            raise RuntimeError(
                "Gemini AI service is temporarily unavailable. "
                "Please try again later."
            )

        if (
            "404" in error_message
            or "not found" in error_message
            or "no longer available" in error_message
        ):

            raise RuntimeError(
                f"Gemini model '{MODEL_NAME}' is not available "
                "for this API key."
            )

        raise RuntimeError(
            "Gemini AI resume generation failed."
        )

    # ========================================================
    # GET RESPONSE
    # ========================================================

    result = response.text

    if not result:

        raise RuntimeError(
            "Gemini returned an empty resume."
        )

    # ========================================================
    # PARSE JSON
    # ========================================================

    try:

        resume = json.loads(
            result
        )

    except json.JSONDecodeError:

        cleaned_result = (
            result
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

        try:

            resume = json.loads(
                cleaned_result
            )

        except json.JSONDecodeError:

            raise RuntimeError(
                "Gemini returned invalid resume data."
            )

    # ========================================================
    # VALIDATE RESULT
    # ========================================================

    if not isinstance(
        resume,
        dict
    ):

        raise RuntimeError(
            "Gemini returned invalid resume data."
        )

    required_fields = [
        "contact",
        "summary",
        "skills",
        "experience",
        "projects",
        "education",
        "certifications",
        "achievements"
    ]

    for field in required_fields:

        if field not in resume:

            raise RuntimeError(
                f"Generated resume is missing field: {field}"
            )

    # ========================================================
    # SAFE DEFAULTS
    # ========================================================

    if not isinstance(
        resume["contact"],
        dict
    ):

        resume["contact"] = {}

    for field in [
        "name",
        "email",
        "phone",
        "linkedin",
        "github",
        "portfolio"
    ]:

        resume["contact"][field] = str(
            resume["contact"].get(field, "")
            or ""
        ).strip()

    resume["summary"] = str(
        resume.get("summary", "")
        or ""
    ).strip()

    for field in [
        "skills",
        "experience",
        "projects",
        "education",
        "certifications",
        "achievements"
    ]:

        if not isinstance(
            resume[field],
            list
        ):

            resume[field] = []

    # ========================================================
    # SUCCESS
    # ========================================================

    print()
    print("==========================================")
    print("      RESUME GENERATION COMPLETED")
    print("==========================================")

    return resume