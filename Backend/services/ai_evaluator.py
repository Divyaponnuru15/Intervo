import os
import json

from google import genai
from dotenv import load_dotenv


# =====================================================
# LOAD ENVIRONMENT VARIABLES
# =====================================================

load_dotenv()


# =====================================================
# GEMINI CLIENT
# =====================================================

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


# =====================================================
# EVALUATE ANSWER
# =====================================================

def evaluate_answer(question, answer, expected_solution=None):

    # =================================================
    # CODING QUESTION
    # =================================================

    if expected_solution:

        prompt = f"""
You are an expert programming interviewer.

Evaluate the candidate's coding solution carefully.

Question:
{question}

Candidate's Answer:
{answer}

Correct Reference Solution:
{expected_solution}

Evaluate the candidate's answer against the problem requirements
and the reference solution.

Check:

1. Is the code syntactically correct?
2. Does it solve the given problem?
3. Is the logic correct?
4. Does it handle important edge cases?
5. Does it produce the expected result?
6. Is the approach reasonably efficient?
7. If the candidate used a different but correct approach,
   give credit for it.
8. Do not require the candidate's code to exactly match the
   reference solution.

Return ONLY valid JSON.

Do not use Markdown.
Do not use code fences.
Do not add explanations outside JSON.

Use exactly this format:

{{
    "score": 1,
    "feedback": "Short explanation of whether the code is correct and why.",
    "strengths": "What the candidate did well.",
    "improvements": "What should be improved."
}}

Score must be between 1 and 10.
"""


    # =================================================
    # NORMAL QUESTION
    # =================================================

    else:

        prompt = f"""
You are an expert technical interviewer.

Evaluate the candidate's answer.

Question:
{question}

Candidate Answer:
{answer}

Evaluate the answer based on:

1. Correctness
2. Relevance
3. Clarity
4. Completeness
5. Professional communication

Return ONLY valid JSON.

Do not use Markdown.
Do not use code fences.
Do not add explanations outside JSON.

Use exactly this format:

{{
    "score": 1,
    "feedback": "Short explanation about the answer.",
    "strengths": "Candidate strengths.",
    "improvements": "Areas to improve."
}}

Score must be between 1 and 10.
"""


    # =================================================
    # CALL GEMINI
    # =================================================

    try:

        response = client.models.generate_content(

            model="gemini-flash-latest",

            contents=prompt,

            config={

                "temperature": 0,

                "response_mime_type":
                    "application/json"

            }

        )


    except Exception as e:

        print(
            "========== GEMINI ERROR =========="
        )

        print(
            str(e)
        )

        print(
            "=================================="
        )


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
        ):

            raise RuntimeError(
                "Gemini AI service is temporarily unavailable. "
                "Please try again later."
            )


        # =================================================
        # OTHER GEMINI ERROR
        # =================================================

        raise RuntimeError(
            "Gemini AI evaluation failed."
        )


    # =====================================================
    # GET RESPONSE
    # =====================================================

    result = response.text


    print(
        "========== GEMINI RESPONSE =========="
    )

    print(
        result
    )

    print(
        "====================================="
    )


    # =====================================================
    # PARSE JSON
    # =====================================================

    try:

        evaluation = json.loads(
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

            evaluation = json.loads(
                cleaned_result
            )

        except json.JSONDecodeError:

            raise RuntimeError(
                "Gemini returned invalid evaluation data."
            )


    # =====================================================
    # VALIDATE RESPONSE
    # =====================================================

    required_fields = [

        "score",
        "feedback",
        "strengths",
        "improvements"

    ]


    for field in required_fields:

        if field not in evaluation:

            raise RuntimeError(
                f"Gemini evaluation missing field: {field}"
            )


    return evaluation