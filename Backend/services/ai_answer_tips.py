
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

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


if not GEMINI_API_KEY:

    raise ValueError(
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

TIPS_COUNT = 5

MODEL_NAME = "gemini-flash-lite-latest"


# ============================================================
# GENERATE ANSWER TIPS
# ============================================================

def generate_answer_tips(question, category):

    # ========================================================
    # VALIDATE QUESTION
    # ========================================================

    if not question:

        raise ValueError(
            "Interview question is required."
        )


    question = str(question).strip()


    if not question:

        raise ValueError(
            "Interview question cannot be empty."
        )


    # ========================================================
    # VALIDATE CATEGORY
    # ========================================================

    if not category:

        raise ValueError(
            "Interview category is required."
        )


    category = str(category).strip()


    # ========================================================
    # ALLOWED CATEGORIES
    # ========================================================

    allowed_categories = [
        "HR",
        "Technical",
        "Coding",
        "Project"
    ]


    if category not in allowed_categories:

        raise ValueError(
            f"Invalid interview category: {category}"
        )


    # ========================================================
    # PROMPT
    # ========================================================

    prompt = f"""
You are an expert interview coach.

Generate helpful answer tips for a candidate who is
preparing to answer the interview question below.

The tips must help the candidate understand WHAT
POINTS TO THINK ABOUT without giving the actual answer.

Interview Category:
{category}

Interview Question:
{question}

RULES:

1. Generate exactly {TIPS_COUNT} tips.

2. Every tip must be specific to the question.

3. Do not give generic advice.

4. Do not provide the actual answer.

5. Do not provide a sample answer.

6. Do not reveal the correct answer.

7. Do not solve the question.

8. Give short, practical hints.

9. Use simple language.

CATEGORY GUIDANCE:

HR:
Focus on:
- relevant experience
- situation or example
- personal contribution
- action taken
- result and learning

Technical:
Focus on:
- core concept
- how it works
- practical example
- real-world use
- limitations or trade-offs

Coding:
Focus on:
- understanding the problem
- possible approach
- algorithm or data structure
- edge cases
- time and space complexity

Project:
Focus on:
- project purpose
- technologies used
- personal contribution
- challenges
- results and improvements

Return ONLY valid JSON.

Return exactly:

{{
    "tips": [
        "Tip 1",
        "Tip 2",
        "Tip 3",
        "Tip 4",
        "Tip 5"
    ]
}}
"""


    # ========================================================
    # DEBUG INFORMATION
    # ========================================================

    print("========================================")
    print("GENERATING ANSWER TIPS")
    print("========================================")
    print("Category:", category)
    print("Question:", question)
    print("Model:", MODEL_NAME)
    print("========================================")


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

        print("========================================")
        print("GEMINI API ERROR")
        print("========================================")

        print(
            "Error Type:",
            type(error).__name__
        )

        print(
            "Error:",
            str(error)
        )

        print("========================================")

        # IMPORTANT:
        # Keep the original error so Flask/Render
        # can show the real problem.

        raise


    # ========================================================
    # CHECK GEMINI RESPONSE
    # ========================================================

    if response is None:

        raise ValueError(
            "Gemini returned no response."
        )


    # ========================================================
    # GET RESPONSE TEXT
    # ========================================================

    response_text = getattr(
        response,
        "text",
        None
    )


    if not response_text:

        print("========================================")
        print("EMPTY GEMINI RESPONSE")
        print("========================================")

        print(
            "Response:",
            response
        )

        print("========================================")

        raise ValueError(
            "Gemini returned an empty response."
        )


    response_text = response_text.strip()


    # ========================================================
    # PRINT GEMINI RESPONSE
    # ========================================================

    print("========================================")
    print("GEMINI ANSWER TIPS RESPONSE")
    print("========================================")

    print(response_text)

    print("========================================")


    # ========================================================
    # PARSE JSON
    # ========================================================

    try:

        data = json.loads(
            response_text
        )

    except json.JSONDecodeError as error:

        print("========================================")
        print("JSON PARSING ERROR")
        print("========================================")

        print(
            "Error:",
            str(error)
        )

        print(
            "Raw Response:",
            response_text
        )

        print("========================================")

        raise ValueError(
            "Gemini returned invalid JSON."
        )


    # ========================================================
    # VALIDATE OBJECT
    # ========================================================

    if not isinstance(data, dict):

        raise ValueError(
            "Gemini response must be a JSON object."
        )


    # ========================================================
    # GET TIPS
    # ========================================================

    tips = data.get(
        "tips"
    )


    if not isinstance(tips, list):

        raise ValueError(
            "Gemini response does not contain a valid tips list."
        )


    # ========================================================
    # CLEAN TIPS
    # ========================================================

    cleaned_tips = []


    for tip in tips:

        if tip is None:
            continue


        tip = str(
            tip
        ).strip()


        if tip:

            cleaned_tips.append(
                tip
            )


    # ========================================================
    # VALIDATE TIP COUNT
    # ========================================================

    if len(cleaned_tips) < TIPS_COUNT:

        raise ValueError(
            f"Gemini generated "
            f"{len(cleaned_tips)} tips. "
            f"Expected {TIPS_COUNT}."
        )


    # ========================================================
    # RETURN EXACTLY 5 TIPS
    # ========================================================

    final_tips = cleaned_tips[:TIPS_COUNT]


    print("========================================")
    print("ANSWER TIPS GENERATED SUCCESSFULLY")
    print("Tips:", len(final_tips))
    print("========================================")


    return final_tips

