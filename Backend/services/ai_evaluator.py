import os
import json
import time

from google import genai
from dotenv import load_dotenv


# =========
# LOAD ENVIRONMENT VARIABLES
# =========

load_dotenv()


# =========
# GEMINI API KEY
# =========

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not configured."
    )


# =========
# GEMINI CLIENT
# =========

client = genai.Client(
    api_key=GEMINI_API_KEY
)


# =========
# GEMINI MODEL
# =========

# This model is available to your current API key.

MODEL_NAME = "gemini-3.5-flash"


# =========
# EVALUATE ANSWER
# =========

def evaluate_answer(
    question,
    answer,
    expected_solution=None
):

    # =====
    # VALIDATE INPUT
    # =====

    if not question:
        raise RuntimeError(
            "Interview question is missing."
        )

    if not answer or not answer.strip():
        raise RuntimeError(
            "Candidate answer is empty."
        )


    # =====
    # CODING QUESTION
    # =====

    if expected_solution:

        prompt = f"""
You are an expert programming interviewer.

Evaluate the candidate's coding answer.

QUESTION:
{question}

CANDIDATE ANSWER:
{answer}

REFERENCE SOLUTION:
{expected_solution}

Evaluate the candidate carefully.

Consider:

1. Syntax correctness
2. Logical correctness
3. Whether the solution solves the problem
4. Important edge cases
5. Expected output
6. Time complexity
7. Space complexity
8. Code quality
9. Efficiency
10. Alternative valid approaches

Do not require the candidate to match the reference
solution exactly.

Give a fair score from 1 to 10.

Return ONLY valid JSON.

Use exactly:

{{
    "score": 1,
    "feedback": "Clear explanation of the answer.",
    "strengths": "Specific strengths.",
    "improvements": "Specific improvements."
}}

Rules:

- score must be an integer from 1 to 10
- feedback must explain the evaluation
- strengths must be specific
- improvements must be specific
- Do not use Markdown
- Do not use code fences
- Do not add text outside JSON
"""


    # =====
    # HR / TECHNICAL / PROJECT QUESTION
    # =====

    else:

        prompt = f"""
You are an expert professional interviewer.

Evaluate the candidate's interview answer.

QUESTION:
{question}

CANDIDATE ANSWER:
{answer}

Evaluate the answer based on:

1. Correctness
2. Relevance
3. Clarity
4. Completeness
5. Depth of understanding
6. Professional communication
7. Supporting examples
8. Whether the candidate directly answered the question

For HR questions, consider:

- Confidence
- Professionalism
- Communication
- Self-awareness
- Career motivation

For technical questions, consider:

- Technical accuracy
- Conceptual understanding
- Practical knowledge
- Explanation ability

For project questions, consider:

- Understanding of the project
- Candidate's contribution
- Technical decisions
- Problem solving
- Implementation knowledge

Give a fair score from 1 to 10.

Return ONLY valid JSON.

Use exactly:

{{
    "score": 1,
    "feedback": "Clear explanation of the answer.",
    "strengths": "Specific strengths.",
    "improvements": "Specific improvements."
}}

Rules:

- score must be an integer from 1 to 10
- feedback must explain the evaluation
- strengths must be specific
- improvements must be specific
- Do not use Markdown
- Do not use code fences
- Do not add text outside JSON
"""


    # =====
    # GEMINI REQUEST
    # =====

    max_attempts = 3

    response = None

    for attempt in range(
        1,
        max_attempts + 1
    ):

        try:

            print()
            print(
                "========== GEMINI EVALUATION "
                f"ATTEMPT {attempt}/{max_attempts} =========="
            )


            response = client.models.generate_content(

                model=MODEL_NAME,

                contents=prompt,

                config={
                    "temperature": 0,
                    "response_mime_type": "application/json"
                }

            )


            print(
                "Gemini request completed successfully."
            )

            break


        except Exception as e:

            error_message = str(e)

            error_lower = error_message.lower()


            print()
            print(
                "========== GEMINI ERROR =========="
            )

            print(
                repr(e)
            )

            print(
                "="
            )


            # ========
            # TEMPORARY GEMINI ERRORS
            # ========

            temporary_error = (

                "503" in error_lower

                or "unavailable" in error_lower

                or "429" in error_lower

                or "rate limit" in error_lower

                or "resource exhausted" in error_lower

                or "overloaded" in error_lower

            )


            if temporary_error:

                if attempt < max_attempts:

                    wait_time = attempt * 2

                    print(
                        f"Gemini temporarily unavailable. "
                        f"Retrying in {wait_time} seconds..."
                    )

                    time.sleep(
                        wait_time
                    )

                    continue


                raise RuntimeError(
                    "Gemini AI service is temporarily "
                    "unavailable after multiple attempts."
                )


            # ========
            # AUTHENTICATION ERROR
            # ========

            if (

                "api key" in error_lower

                or "unauthenticated" in error_lower

                or "authentication" in error_lower

                or "permission denied" in error_lower

            ):

                raise RuntimeError(
                    "Gemini API authentication failed. "
                    "Please check GEMINI_API_KEY."
                )


            # ========
            # MODEL ERROR
            # ========

            if (
                "not found" in error_lower
                or "model" in error_lower
            ):

                raise RuntimeError(
                    f"Gemini model '{MODEL_NAME}' "
                    f"could not be used. "
                    f"Original error: {error_message}"
                )


            # ========
            # OTHER ERROR
            # ========

            raise RuntimeError(
                f"Gemini AI evaluation failed: "
                f"{error_message}"
            )


    # =====
    # CHECK RESPONSE
    # =====

    if response is None:

        raise RuntimeError(
            "Gemini did not return a response."
        )


    # =====
    # GET RESPONSE TEXT
    # =====

    result = response.text


    print()
    print(
        "========== GEMINI RESPONSE =========="
    )

    print(
        result
    )

    print(
        "====="
    )


    # =====
    # EMPTY RESPONSE
    # =====

    if not result:

        raise RuntimeError(
            "Gemini returned an empty evaluation."
        )


    # =====
    # PARSE JSON
    # =====

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

            print()
            print(
                "========== INVALID GEMINI JSON =========="
            )

            print(
                cleaned_result
            )

            print(
                "========="
            )

            raise RuntimeError(
                "Gemini returned invalid evaluation data."
            )


    # =====
    # VALIDATE RESPONSE TYPE
    # =====

    if not isinstance(
        evaluation,
        dict
    ):

        raise RuntimeError(
            "Gemini returned an invalid evaluation format."
        )


    # =====
    # REQUIRED FIELDS
    # =====

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


    # =====
    # VALIDATE SCORE
    # =====

    try:

        score = int(
            evaluation["score"]
        )

    except (
        ValueError,
        TypeError
    ):

        raise RuntimeError(
            "Gemini returned an invalid score."
        )


    if score < 1 or score > 10:

        raise RuntimeError(
            "Gemini returned an invalid score. "
            "Score must be between 1 and 10."
        )


    # =====
    # NORMALIZE RESULT
    # =====

    evaluation["score"] = score

    evaluation["feedback"] = str(
        evaluation["feedback"]
    ).strip()

    evaluation["strengths"] = str(
        evaluation["strengths"]
    ).strip()

    evaluation["improvements"] = str(
        evaluation["improvements"]
    ).strip()


    # =====
    # SUCCESS
    # =====

    print()
    print(
        "========== EVALUATION SUCCESS =========="
    )

    print(
        f"Score: {evaluation['score']}/10"
    )

    print(
        "========"
    )


    return evaluation