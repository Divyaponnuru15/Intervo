import os
import json
import time

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
# GEMINI MODEL
# ============================================================

MODEL_NAME = "gemini-3.5-flash"


# ============================================================
# COMMON GEMINI REQUEST
# ============================================================

def _generate_gemini_response(prompt):

    max_attempts = 3

    response = None


    for attempt in range(
        1,
        max_attempts + 1
    ):

        try:

            print()

            print(
                "========== GEMINI REQUEST "
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
                "=================================="
            )


            # ==================================================
            # TEMPORARY ERRORS
            # ==================================================

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


            # ==================================================
            # AUTHENTICATION ERROR
            # ==================================================

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


            # ==================================================
            # MODEL ERROR
            # ==================================================

            if (

                "not found" in error_lower

                or "model" in error_lower

            ):

                raise RuntimeError(
                    f"Gemini model '{MODEL_NAME}' "
                    f"could not be used. "
                    f"Original error: {error_message}"
                )


            # ==================================================
            # OTHER ERROR
            # ==================================================

            raise RuntimeError(
                f"Gemini AI request failed: "
                f"{error_message}"
            )


    # =========================================================
    # CHECK RESPONSE
    # =========================================================

    if response is None:

        raise RuntimeError(
            "Gemini did not return a response."
        )


    # =========================================================
    # GET RESPONSE TEXT
    # =========================================================

    result = response.text


    print()

    print(
        "========== GEMINI RESPONSE =========="
    )

    print(
        result
    )

    print(
        "======================================"
    )


    # =========================================================
    # EMPTY RESPONSE
    # =========================================================

    if not result:

        raise RuntimeError(
            "Gemini returned an empty response."
        )


    # =========================================================
    # PARSE JSON
    # =========================================================

    try:

        parsed_result = json.loads(
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

            parsed_result = json.loads(
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
                "=========================================="
            )


            raise RuntimeError(
                "Gemini returned invalid JSON data."
            )


    # =========================================================
    # VALIDATE RESPONSE TYPE
    # =========================================================

    if not isinstance(
        parsed_result,
        dict
    ):

        raise RuntimeError(
            "Gemini returned an invalid response format."
        )


    return parsed_result


# ============================================================
# EVALUATE INTERVIEW ANSWER
# ============================================================

def evaluate_answer(
    question,
    answer,
    expected_solution=None
):

    # ========================================================
    # VALIDATE INPUT
    # ========================================================

    if not question:

        raise RuntimeError(
            "Interview question is missing."
        )


    if not answer or not answer.strip():

        raise RuntimeError(
            "Candidate answer is empty."
        )


    # ========================================================
    # CODING QUESTION
    # ========================================================

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

Evaluate the candidate based on:

1. Syntax correctness
2. Logical correctness
3. Whether the solution solves the problem
4. Edge cases
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


    # ========================================================
    # HR / TECHNICAL / PROJECT QUESTION
    # ========================================================

    else:

        prompt = f"""
You are an expert professional interviewer.

Evaluate the candidate's interview answer.

QUESTION:
{question}

CANDIDATE ANSWER:
{answer}

Evaluate based on:

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

- Project understanding
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


    # ========================================================
    # SEND REQUEST TO GEMINI
    # ========================================================

    evaluation = _generate_gemini_response(
        prompt
    )


    # ========================================================
    # REQUIRED FIELDS
    # ========================================================

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


    # ========================================================
    # VALIDATE SCORE
    # ========================================================

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


    # ========================================================
    # NORMALIZE RESULT
    # ========================================================

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


    # ========================================================
    # SUCCESS
    # ========================================================

    print()

    print(
        "========== EVALUATION SUCCESS =========="
    )

    print(
        f"Score: {evaluation['score']}/10"
    )

    print(
        "========================================"
    )


    return evaluation


# ============================================================
# GENERATE AI FOLLOW-UP QUESTION
# ============================================================

def generate_follow_up(
    question,
    answer,
    evaluation,
    category=None
):

    # ========================================================
    # VALIDATE INPUT
    # ========================================================

    if not question:

        raise RuntimeError(
            "Interview question is missing."
        )


    if not answer or not answer.strip():

        raise RuntimeError(
            "Candidate answer is empty."
        )


    if not evaluation:

        raise RuntimeError(
            "Answer evaluation is missing."
        )


    # ========================================================
    # NEVER GENERATE FOLLOW-UP FOR CODING
    # ========================================================

    if category and category.lower() == "coding":

        return {

            "follow_up":
                False,

            "question":
                ""

        }


    # ========================================================
    # FOLLOW-UP PROMPT
    # ========================================================

    prompt = f"""
You are a professional interviewer conducting a realistic
job interview.

Decide whether a natural follow-up question should be asked
based on the candidate's answer.

INTERVIEW CATEGORY:
{category or "General"}

ORIGINAL QUESTION:
{question}

CANDIDATE ANSWER:
{answer}

AI EVALUATION:

Score:
{evaluation.get("score")}

Feedback:
{evaluation.get("feedback")}

Strengths:
{evaluation.get("strengths")}

Improvements:
{evaluation.get("improvements")}


FOLLOW-UP RULES:

1. Ask a follow-up only when it adds meaningful value.

2. The follow-up must naturally continue the conversation.

3. The question must be directly related to the candidate's
   answer.

4. Do not ask a follow-up simply because an answer exists.

5. If the candidate mentions a project, technology,
   achievement, experience, or specific claim, you may ask
   for more details.

6. If the answer is vague, ask for clarification or a
   specific example.

7. If the candidate makes a technical claim, ask about how
   they implemented it, why they chose it, or what challenge
   they faced.

8. For HR questions, realistic follow-ups include:
   - "Can you give me an example?"
   - "What did you learn from that experience?"
   - "What was the biggest challenge?"
   - "What would you do differently?"

9. For technical questions, realistic follow-ups include:
   - "Why did you choose that approach?"
   - "How would you handle this in a real application?"
   - "What challenges did you face?"
   - "Can you explain that with an example?"

10. For project questions, ask about the candidate's actual
    contribution, decisions, challenges, or implementation.

11. Ask only ONE question.

12. Do not repeat the original question.

13. Keep the question concise and conversational.

14. The question must sound like something a real interviewer
    would ask.

15. Do not generate follow-up questions for Coding interviews.

16. If the answer is already complete and there is nothing
    useful to explore, return false.

Return ONLY valid JSON.

If a follow-up is appropriate:

{{
    "follow_up": true,
    "question": "The follow-up question."
}}

If no follow-up is appropriate:

{{
    "follow_up": false,
    "question": ""
}}

Rules:

- follow_up must be true or false
- question must be one natural interview question
- Do not use Markdown
- Do not use code fences
- Do not add text outside JSON
"""


    # ========================================================
    # SEND REQUEST
    # ========================================================

    result = _generate_gemini_response(
        prompt
    )


    # ========================================================
    # VALIDATE RESULT
    # ========================================================

    if "follow_up" not in result:

        raise RuntimeError(
            "Gemini follow-up response is missing 'follow_up'."
        )


    follow_up = result.get(
        "follow_up"
    )


    if not isinstance(
        follow_up,
        bool
    ):

        raise RuntimeError(
            "Gemini returned an invalid follow-up value."
        )


    # ========================================================
    # NO FOLLOW-UP
    # ========================================================

    if not follow_up:

        return {

            "follow_up":
                False,

            "question":
                ""

        }


    # ========================================================
    # GET FOLLOW-UP QUESTION
    # ========================================================

    follow_up_question = str(
        result.get(
            "question",
            ""
        )
    ).strip()


    if not follow_up_question:

        return {

            "follow_up":
                False,

            "question":
                ""

        }


    # ========================================================
    # SUCCESS
    # ========================================================

    print()

    print(
        "========== FOLLOW-UP QUESTION GENERATED =========="
    )

    print(
        follow_up_question
    )

    print(
        "==================================================="
    )


    return {

        "follow_up":
            True,

        "question":
            follow_up_question

    }