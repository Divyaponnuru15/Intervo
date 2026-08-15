import os
import json

from google import genai
from dotenv import load_dotenv


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()


# =========================================================
# GEMINI CLIENT
# =========================================================

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError(
        "GEMINI_API_KEY is not configured."
    )


client = genai.Client(
    api_key=api_key
)


# =========================================================
# GEMINI MODEL
# =========================================================
#
# Gemini 2.5 Flash is no longer available to new users.
# Gemini 3.5 Flash supports generateContent.
#
# =========================================================

MODEL_NAME = "gemini-3.5-flash"


# =========================================================
# ANALYZE RESUME
# =========================================================

def analyze_resume(resume_text):

    # =====================================================
    # VALIDATE RESUME TEXT
    # =====================================================

    if not resume_text or not resume_text.strip():

        raise RuntimeError(
            "Resume text is empty."
        )


    # =====================================================
    # AI PROMPT
    # =====================================================

    prompt = f"""
You are an expert ATS resume analyzer,
technical recruiter, and career advisor.

Analyze the candidate's resume carefully.

IMPORTANT:

Your analysis MUST be based on the actual resume
provided below.

Do NOT use a predefined keyword list.

Do NOT simply count common technologies.

Do NOT assume that a candidate knows a technology
that is not mentioned in the resume.

Do NOT invent:

- Skills
- Experience
- Education
- Projects
- Certifications
- Achievements
- Job titles
- Companies
- Technologies

You may suggest potentially useful keywords,
but clearly distinguish suggestions from skills
that are actually present.

==================================================
RESUME
==================================================

{resume_text}

==================================================
ANALYSIS REQUIREMENTS
==================================================

Analyze the resume from an ATS and recruiter
perspective.

Evaluate:

1. Overall ATS compatibility
2. Technical skills
3. Relevant keywords
4. Professional experience
5. Projects
6. Education
7. Resume structure
8. Clarity
9. Readability
10. Action-oriented language
11. Quantifiable achievements
12. Relevance of skills
13. Relevance of projects
14. Missing information
15. Potential ATS weaknesses

==================================================
ATS SCORE
==================================================

Generate an overall ATS score from 0 to 100.

The score must reflect the actual quality of the
resume.

Do not artificially give a high score.

Consider:

- Resume structure
- Relevant skills
- Relevant keywords
- Experience quality
- Project quality
- Education
- Achievements
- Action verbs
- Quantifiable results
- Clarity
- ATS readability

==================================================
SKILLS
==================================================

Extract important skills that are ACTUALLY present
in the resume.

Do not invent skills.

==================================================
KEYWORDS
==================================================

Identify important keywords that are ACTUALLY
present in the resume.

These can include:

- Technologies
- Programming languages
- Frameworks
- Tools
- Concepts
- Job-related terminology
- Industry terminology

==================================================
MISSING KEYWORDS
==================================================

Suggest potentially useful keywords that could
improve the resume.

IMPORTANT:

Only suggest keywords that are reasonably related
to the candidate's existing background.

Do not randomly recommend unrelated technologies.

For example, if the resume contains Python,
Flask, SQL and REST APIs, suggestions may include
relevant backend terminology.

Do NOT claim that the candidate already knows
those suggested keywords.

==================================================
STRENGTHS
==================================================

Identify the strongest aspects of the resume.

Be specific.

==================================================
WEAKNESSES
==================================================

Identify actual weaknesses.

Do not invent weaknesses.

If something is missing, say that it is missing.

==================================================
IMPROVEMENTS
==================================================

Give practical improvements that the candidate
can actually make.

Prioritize the most important improvements first.

==================================================
SECTION SCORES
==================================================

Give each section a score from 0 to 100.

Evaluate:

- contact
- summary
- education
- skills
- experience
- projects

If a section is missing, give it a low score.

If a section does not apply, explain this in the
summary instead of inventing content.

==================================================
OUTPUT FORMAT
==================================================

Return ONLY valid JSON.

Do NOT use Markdown.

Do NOT use code fences.

Do NOT add explanations outside JSON.

Use EXACTLY this structure:

{{
    "score": 0,

    "summary": "Short overall assessment of the resume.",

    "skills": [
        "Skill 1",
        "Skill 2"
    ],

    "keywords": [
        "Keyword 1",
        "Keyword 2"
    ],

    "missing_keywords": [
        "Suggested keyword 1",
        "Suggested keyword 2"
    ],

    "strengths": [
        "Strength 1",
        "Strength 2"
    ],

    "weaknesses": [
        "Weakness 1",
        "Weakness 2"
    ],

    "improvements": [
        "Specific improvement 1",
        "Specific improvement 2"
    ],

    "sections": {{
        "contact": 0,
        "summary": 0,
        "education": 0,
        "skills": 0,
        "experience": 0,
        "projects": 0
    }}
}}

==================================================
RULES
==================================================

- score must be an integer from 0 to 100.
- Every section score must be an integer from 0 to 100.
- skills must contain only skills actually found.
- keywords must contain only keywords actually found.
- missing_keywords are suggestions, not confirmed skills.
- Do not invent information.
- Keep suggestions specific.
- Analyze the actual resume.
- Do not rely on a predefined keyword list.
- Do not automatically give a high score.
"""


    # =====================================================
    # CALL GEMINI AI
    # =====================================================

    try:

        print()
        print("==========================================")
        print("        GEMINI AI ATS ANALYSIS")
        print("==========================================")
        print(
            f"Model: {MODEL_NAME}"
        )
        print(
            "Sending resume to Gemini..."
        )


        response = client.models.generate_content(

            model=MODEL_NAME,

            contents=prompt,

            config={
                "temperature": 0,
                "response_mime_type": "application/json"
            }

        )


    except Exception as e:

        print()
        print("========== GEMINI ATS ERROR ==========")
        print(
            str(e)
        )
        print("======================================")

        error_message = str(e).lower()


        # =================================================
        # QUOTA / RATE LIMIT
        # =================================================

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


        # =================================================
        # SERVICE UNAVAILABLE
        # =================================================

        if (
            "503" in error_message
            or "unavailable" in error_message
            or "high demand" in error_message
        ):

            raise RuntimeError(
                "Gemini AI service is temporarily unavailable. "
                "Please try again later."
            )


        # =================================================
        # MODEL NOT FOUND
        # =================================================

        if (
            "404" in error_message
            or "not found" in error_message
            or "no longer available" in error_message
        ):

            raise RuntimeError(
                f"Gemini model '{MODEL_NAME}' is not available "
                "for this API key."
            )


        # =================================================
        # OTHER ERROR
        # =================================================

        raise RuntimeError(
            "Gemini AI resume analysis failed."
        )


    # =====================================================
    # GET RESPONSE
    # =====================================================

    result = response.text


    print()
    print("========== GEMINI ATS RESPONSE ==========")
    print(
        result
    )
    print("=========================================")


    # =====================================================
    # VALIDATE RESPONSE
    # =====================================================

    if not result:

        raise RuntimeError(
            "Gemini returned an empty ATS analysis."
        )


    # =====================================================
    # PARSE JSON
    # =====================================================

    try:

        analysis = json.loads(
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

            analysis = json.loads(
                cleaned_result
            )

        except json.JSONDecodeError:

            raise RuntimeError(
                "Gemini returned invalid ATS analysis data."
            )


    # =====================================================
    # REQUIRED FIELDS
    # =====================================================

    required_fields = [

        "score",
        "summary",
        "skills",
        "keywords",
        "missing_keywords",
        "strengths",
        "weaknesses",
        "improvements",
        "sections"

    ]


    for field in required_fields:

        if field not in analysis:

            raise RuntimeError(
                f"Gemini ATS analysis missing field: {field}"
            )


    # =====================================================
    # VALIDATE MAIN SCORE
    # =====================================================

    try:

        score = int(
            analysis["score"]
        )

    except (TypeError, ValueError):

        raise RuntimeError(
            "Gemini returned an invalid ATS score."
        )


    if score < 0 or score > 100:

        raise RuntimeError(
            "Gemini returned an ATS score outside 0-100."
        )


    analysis["score"] = score


    # =====================================================
    # VALIDATE LIST FIELDS
    # =====================================================

    list_fields = [

        "skills",
        "keywords",
        "missing_keywords",
        "strengths",
        "weaknesses",
        "improvements"

    ]


    for field in list_fields:

        if not isinstance(
            analysis[field],
            list
        ):

            raise RuntimeError(
                f"Gemini returned invalid '{field}' data."
            )


    # =====================================================
    # VALIDATE SECTION SCORES
    # =====================================================

    required_sections = [

        "contact",
        "summary",
        "education",
        "skills",
        "experience",
        "projects"

    ]


    for section in required_sections:

        if section not in analysis["sections"]:

            raise RuntimeError(
                f"Gemini ATS analysis missing section: {section}"
            )


        try:

            section_score = int(
                analysis["sections"][section]
            )

        except (TypeError, ValueError):

            raise RuntimeError(
                f"Invalid score for section: {section}"
            )


        if (
            section_score < 0
            or section_score > 100
        ):

            raise RuntimeError(
                f"Section '{section}' score must be between 0 and 100."
            )


        analysis["sections"][section] = section_score


    # =====================================================
    # SUCCESS
    # =====================================================

    print()
    print("==========================================")
    print("      ATS ANALYSIS COMPLETED")
    print(
        f"      ATS SCORE: {analysis['score']}/100"
    )
    print("==========================================")


    return analysis

