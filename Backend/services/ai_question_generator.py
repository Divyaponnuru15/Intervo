import os
import json
import time

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
# SETTINGS
# =====================================================

TOTAL_QUESTIONS = 30
BATCH_SIZE = 5


# =====================================================
# GENERATE ONE BATCH
# =====================================================

def generate_batch(resume_text, category, batch_number):

    print(
        f"Generating batch {batch_number} "
        f"for category: {category}"
    )


    # =================================================
    # CODING
    # =================================================

    if category == "Coding":

        prompt = f"""
You are an expert programming interviewer.

Analyze the candidate's resume and generate
EXACTLY 5 coding interview questions.

Candidate Resume:
{resume_text}

Category:
Coding

This is batch {batch_number} of a 30-question
coding interview.

IMPORTANT RULES:

1. Generate EXACTLY 5 questions.

2. Every question MUST be a coding question.

3. Questions must test programming,
   algorithms, data structures, debugging,
   or problem solving.

4. Use Python for coding questions.

5. Every question MUST have a correct
   reference solution.

6. The solution must be complete and executable.

7. Do not put the solution inside the question.

8. Generate a mixture of:

   - Easy
   - Medium
   - Hard

9. Avoid repeating common questions whenever
   possible.

10. The reference solution will be shown to
    the candidate after AI evaluation.

Return ONLY valid JSON.

Do NOT use Markdown.
Do NOT use ```json.
Do NOT add explanations.

Use exactly this format:

[
    {{
        "question": "Write a Python function to check if a string is a palindrome.",
        "category": "Coding",
        "difficulty": "Easy",
        "solution": "def is_palindrome(s):\\n    s = s.lower().replace(' ', '')\\n    return s == s[::-1]"
    }}
]

Generate exactly 5 objects.
"""


    # =================================================
    # OTHER CATEGORIES
    # =================================================

    else:

        prompt = f"""
You are an expert interviewer.

Analyze the candidate's resume and generate
EXACTLY 5 personalized interview questions.

Candidate Resume:
{resume_text}

Selected Category:
{category}

This is batch {batch_number} of a
30-question interview.

IMPORTANT RULES:

1. Generate EXACTLY 5 questions.

2. Every question MUST belong to:

{category}

3. Do not generate questions from another category.

4. Use a mixture of:

- Easy
- Medium
- Hard

5. Questions should be relevant to the
candidate's resume.

6. Avoid repeating questions whenever possible.

Category guidelines:

HR:
Ask about communication, strengths,
weaknesses, teamwork, motivation,
career goals and workplace situations.

Technical:
Ask about programming languages,
databases, frameworks, concepts and
technologies mentioned in the resume.

Project:
Ask specifically about projects,
technologies, architecture, challenges,
database design, deployment and improvements.

Return ONLY valid JSON.

Do NOT use Markdown.
Do NOT use code fences.
Do NOT add explanations.

Use exactly this format:

[
    {{
        "question": "Question text",
        "category": "{category}",
        "difficulty": "Easy",
        "solution": null
    }}
]

Generate exactly 5 objects.
"""


    # =================================================
    # GEMINI REQUEST
    # =================================================

    response = client.models.generate_content(

        model="gemini-flash-lite-latest",

        contents=prompt,

        config={
            "temperature": 0,
            "response_mime_type": "application/json"
        }
    )


    # =================================================
    # PRINT RESPONSE
    # =================================================

    print(
        "========== GEMINI RESPONSE =========="
    )

    print(
        response.text
    )

    print(
        "====================================="
    )


    # =================================================
    # PARSE JSON
    # =================================================

    try:

        questions = json.loads(
            response.text
        )

    except json.JSONDecodeError as error:

        print(
            "JSON Error:",
            error
        )

        raise ValueError(
            "Gemini returned invalid JSON."
        )


    # =================================================
    # VALIDATE LIST
    # =================================================

    if not isinstance(
        questions,
        list
    ):

        raise ValueError(
            "Gemini response is not a list."
        )


    # =================================================
    # VALIDATE COUNT
    # =================================================

    if len(questions) != BATCH_SIZE:

        raise ValueError(
            f"Expected {BATCH_SIZE} questions, "
            f"but received {len(questions)}."
        )


    # =================================================
    # VALIDATE EACH QUESTION
    # =================================================

    for question in questions:

        if not isinstance(
            question,
            dict
        ):

            raise ValueError(
                "Invalid question format."
            )


        if "question" not in question:

            raise ValueError(
                "Question field is missing."
            )


        if "category" not in question:

            raise ValueError(
                "Category field is missing."
            )


        if "difficulty" not in question:

            raise ValueError(
                "Difficulty field is missing."
            )


        # Coding requires solution

        if category == "Coding":

            if (
                "solution" not in question
                or not question["solution"]
            ):

                raise ValueError(
                    "Coding question is missing solution."
                )


        # Other categories

        else:

            question["solution"] = None


    return questions


# =====================================================
# GENERATE 30 QUESTIONS
# =====================================================

def generate_questions(resume_text, category):
    """
    Generate 30 interview questions.

    Questions are generated in batches of 5
    to reduce Gemini API failures.
    """

    all_questions = []


    # =================================================
    # GENERATE 6 BATCHES
    # =================================================

    for batch_number in range(1, 7):

        print(
            f"\n===================================="
        )

        print(
            f"Generating batch "
            f"{batch_number}/6"
        )

        print(
            f"===================================="
        )


        questions = generate_batch(
            resume_text,
            category,
            batch_number
        )


        all_questions.extend(
            questions
        )


        # Small delay between API requests
        # to reduce rate-limit problems.

        if batch_number < 6:

            time.sleep(2)


    # =================================================
    # FINAL VALIDATION
    # =================================================

    if len(all_questions) != TOTAL_QUESTIONS:

        raise ValueError(
            f"Expected {TOTAL_QUESTIONS} questions, "
            f"but generated {len(all_questions)}."
        )


    print(
        f"\nSuccessfully generated "
        f"{len(all_questions)} questions."
    )


    return all_questions