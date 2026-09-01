import os
import json

from google import genai
from dotenv import load_dotenv


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# GEMINI API KEY
# ============================================================

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)


if not GEMINI_API_KEY:

    raise RuntimeError(
        "GEMINI_API_KEY is not configured."
    )


# ============================================================
# GEMINI CLIENT
# ============================================================

client = genai.Client(
    api_key=GEMINI_API_KEY
)


# ============================================================
# SETTINGS
# ============================================================

MODEL_NAME = "gemini-flash-lite-latest"


# ============================================================
# ANALYZE RESUME AGAINST JOB DESCRIPTION
# ============================================================

def analyze_resume_with_jd(
    resume_text,
    job_description
):

    # ========================================================
    # VALIDATE RESUME
    # ========================================================

    if not resume_text or not str(resume_text).strip():

        raise ValueError(
            "Resume text is required."
        )


    # ========================================================
    # VALIDATE JOB DESCRIPTION
    # ========================================================

    if (
        not job_description
        or not str(job_description).strip()
    ):

        raise ValueError(
            "Job description is required."
        )


    resume_text = str(
        resume_text
    ).strip()


    job_description = str(
        job_description
    ).strip()


    # ========================================================
    # LIMIT EXTREMELY LARGE INPUTS
    # ========================================================

    MAX_RESUME_LENGTH = 20000
    MAX_JD_LENGTH = 20000


    resume_text = resume_text[
        :MAX_RESUME_LENGTH
    ]


    job_description = job_description[
        :MAX_JD_LENGTH
    ]


    # ========================================================
    # AI PROMPT
    # ========================================================

    prompt = f"""
You are an expert resume and job-matching assistant.

Compare the candidate's resume with the provided job
description.

Your goal is to help the candidate understand how well
their CURRENT resume matches the job and how they can
improve the resume truthfully.

IMPORTANT:

- Use ONLY information actually present in the resume.
- Do NOT invent skills, technologies, experience,
  certifications, projects, responsibilities, or achievements.
- Do NOT assume that a skill is possessed merely because
  it is common for the job.
- Distinguish between skills clearly present in the resume,
  skills partially demonstrated, and skills not found.
- A missing skill means only that it was not found in the
  resume. It does NOT prove that the candidate does not know it.
- Resume suggestions must be truthful and should tell the
  candidate to add information only if they genuinely have
  that experience.
- Do not rewrite the complete resume.
- Do not give generic advice.
- Base suggestions on this specific resume and this specific JD.

============================================================
CANDIDATE RESUME
============================================================

{resume_text}

============================================================
JOB DESCRIPTION
============================================================

{job_description}

============================================================
ANALYSIS REQUIREMENTS
============================================================

1. Calculate a job match score from 0 to 100.

2. Identify important skills or requirements that are clearly
   present in the resume.

3. Identify skills that are partially demonstrated or related
   but not strongly demonstrated.

4. Identify important JD skills or requirements that are not
   found in the resume.

5. Give specific resume improvement suggestions.

6. Give a short overall assessment.

7. Give a small list of the most important skills the candidate
   should focus on for this particular job.

============================================================
SCORING GUIDANCE
============================================================

The score should reflect how strongly the CURRENT RESUME
matches the IMPORTANT requirements of the JD.

Consider:

- Required technical skills
- Preferred technical skills
- Relevant projects
- Relevant experience
- Education requirements
- Domain knowledge
- Other clearly stated requirements

Do not give a high score merely because some keywords match.

============================================================
RETURN ONLY JSON
============================================================

Return exactly this structure:

{{
    "match_score": 78,

    "matching_skills": [
        "Python",
        "Flask",
        "SQL"
    ],

    "partial_skills": [
        "REST APIs"
    ],

    "missing_skills": [
        "Django",
        "AWS"
    ],

    "resume_suggestions": [
        "Highlight your backend API work in the project descriptions.",
        "Mention measurable project results where they are genuinely available.",
        "If you have real Django experience, add it to the skills or project section."
    ],

    "priority_skills": [
        "Django",
        "AWS",
        "REST APIs"
    ],

    "overall_assessment":
        "The resume has a good backend foundation but does not strongly demonstrate some of the technologies required by the job."
}}

Rules:

- match_score must be an integer from 0 to 100.
- matching_skills must be an array of strings.
- partial_skills must be an array of strings.
- missing_skills must be an array of strings.
- resume_suggestions must be an array of strings.
- priority_skills must be an array of strings.
- overall_assessment must be a string.
- Do not use Markdown.
- Do not use code fences.
- Do not add any text outside the JSON.
"""


    # ========================================================
    # CALL GEMINI
    # ========================================================

    try:

        response = client.models.generate_content(

            model=MODEL_NAME,

            contents=prompt,

            config={
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        )

    except Exception as error:

        print(
            "Gemini JD Analysis Error:",
            error
        )

        raise RuntimeError(
            "Gemini failed to analyze the resume and job description."
        )


    # ========================================================
    # CHECK RESPONSE
    # ========================================================

    if not response:

        raise RuntimeError(
            "Gemini did not return a response."
        )


    response_text = getattr(
        response,
        "text",
        None
    )


    if not response_text:

        raise RuntimeError(
            "Gemini returned an empty JD analysis."
        )


    response_text = response_text.strip()


    # ========================================================
    # LOG RESPONSE
    # ========================================================

    print()
    print(
        "========== GEMINI JD ANALYSIS =========="
    )

    print(
        response_text
    )

    print(
        "========================================="
    )


    # ========================================================
    # PARSE JSON
    # ========================================================

    try:

        result = json.loads(
            response_text
        )

    except json.JSONDecodeError as error:

        print(
            "JD Analysis JSON Error:",
            error
        )

        raise RuntimeError(
            "Gemini returned invalid JSON for JD analysis."
        )


    # ========================================================
    # VALIDATE OBJECT
    # ========================================================

    if not isinstance(
        result,
        dict
    ):

        raise RuntimeError(
            "Gemini JD analysis must be a JSON object."
        )


    # ========================================================
    # REQUIRED FIELDS
    # ========================================================

    required_fields = [

        "match_score",
        "matching_skills",
        "partial_skills",
        "missing_skills",
        "resume_suggestions",
        "priority_skills",
        "overall_assessment"

    ]


    for field in required_fields:

        if field not in result:

            raise RuntimeError(
                f"JD analysis is missing '{field}'."
            )


    # ========================================================
    # VALIDATE MATCH SCORE
    # ========================================================

    try:

        match_score = int(
            result["match_score"]
        )

    except (
        ValueError,
        TypeError
    ):

        raise RuntimeError(
            "JD analysis returned an invalid match score."
        )


    if match_score < 0 or match_score > 100:

        raise RuntimeError(
            "JD analysis match score must be between 0 and 100."
        )


    # ========================================================
    # VALIDATE LIST FIELDS
    # ========================================================

    list_fields = [

        "matching_skills",
        "partial_skills",
        "missing_skills",
        "resume_suggestions",
        "priority_skills"

    ]


    for field in list_fields:

        if not isinstance(
            result[field],
            list
        ):

            raise RuntimeError(
                f"JD analysis field '{field}' must be a list."
            )


    # ========================================================
    # CLEAN LIST VALUES
    # ========================================================

    cleaned_result = {}


    for field in list_fields:

        cleaned_values = []


        for value in result[field]:

            if value is None:

                continue


            value = str(
                value
            ).strip()


            if value:

                cleaned_values.append(
                    value
                )


        cleaned_result[field] = cleaned_values


    # ========================================================
    # VALIDATE OVERALL ASSESSMENT
    # ========================================================

    overall_assessment = str(
        result["overall_assessment"]
    ).strip()


    if not overall_assessment:

        raise RuntimeError(
            "JD analysis returned an empty overall assessment."
        )


    # ========================================================
    # FINAL RESULT
    # ========================================================

    final_result = {

        "match_score":
            match_score,

        "matching_skills":
            cleaned_result["matching_skills"],

        "partial_skills":
            cleaned_result["partial_skills"],

        "missing_skills":
            cleaned_result["missing_skills"],

        "resume_suggestions":
            cleaned_result["resume_suggestions"][:10],

        "priority_skills":
            cleaned_result["priority_skills"][:10],

        "overall_assessment":
            overall_assessment

    }


    # ========================================================
    # SUCCESS LOG
    # ========================================================

    print()
    print(
        "========== JD ANALYSIS SUCCESS =========="
    )

    print(
        f"Match Score: "
        f"{final_result['match_score']}%"
    )

    print(
        f"Matching Skills: "
        f"{len(final_result['matching_skills'])}"
    )

    print(
        f"Partial Skills: "
        f"{len(final_result['partial_skills'])}"
    )

    print(
        f"Missing Skills: "
        f"{len(final_result['missing_skills'])}"
    )

    print(
        "========================================="
    )


    return final_result