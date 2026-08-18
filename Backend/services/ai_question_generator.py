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

TOTAL_QUESTIONS = 10
BATCH_SIZE = 5
TOTAL_BATCHES = TOTAL_QUESTIONS // BATCH_SIZE


# =====================================================
# GENERATE ONE BATCH
# =====================================================

def generate_batch(resume_text, category, batch_number):

    print(
        f"Generating batch {batch_number}/{TOTAL_BATCHES} "
        f"for category: {category}"
    )


    # =================================================
    # CODING
    # =================================================

    if category == "Coding":

        prompt = f"""
You are an expert programming interviewer.

Analyze the candidate's resume and generate
EXACTLY {BATCH_SIZE} coding interview questions.

Candidate Resume:
{resume_text}

Category:
Coding

This is batch {batch_number} of a
{TOTAL_QUESTIONS}-question coding interview.

IMPORTANT RULES:

1. Generate EXACTLY {BATCH_SIZE} questions.

2. Every question MUST be a coding question.

3. Questions must test programming,
   algorithms, data structures, debugging,
   or problem solving.

4. Use Python for all coding questions.

5. Every question MUST have a correct
   reference solution.

6. The solution must be complete and executable.

7. Do not put the solution inside the question.

8. Use a mixture of:

   - Easy
   - Medium
   - Hard

9. Questions should be relevant to
   the candidate's skills and resume.

10. Avoid repeating common questions
    whenever possible.

11. Keep the questions practical and
    suitable for an interview.

12. The reference solution will be shown
    to the candidate after AI evaluation.

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

Generate exactly {BATCH_SIZE} objects.
"""


    # =================================================
    # OTHER CATEGORIES
    # =================================================

    else:

        prompt = f"""
You are an expert interviewer.

Analyze the candidate's resume and generate
EXACTLY {BATCH_SIZE} personalized interview questions.

Candidate Resume:
{resume_text}

Selected Category:
{category}

This is batch {batch_number} of a
{TOTAL_QUESTIONS}-question interview.

IMPORTANT RULES:

1. Generate EXACTLY {BATCH_SIZE} questions.

2. Every question MUST belong to:

{category}

3. Do not generate questions from another category.

4. Use a mixture of:

- Easy
- Medium
- Hard

5. Questions should be relevant to
   the candidate's resume.

6. Avoid repeating questions whenever possible.

7. Questions should be practical and
   suitable for an interview.

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

Generate exactly {BATCH_SIZE} objects.
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
    # GET RESPONSE TEXT
    # =================================================

    response_text = response.text.strip()


    print(
        "========== GEMINI RESPONSE =========="
    )

    print(response_text)

    print(
        "====================================="
    )


    # =================================================
    # PARSE JSON
    # =================================================

    try:

        questions = json.loads(
            response_text
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


        # ---------------------------------------------
        # QUESTION
        # ---------------------------------------------

        if "question" not in question:

            raise ValueError(
                "Question field is missing."
            )


        if not question["question"]:

            raise ValueError(
                "Question cannot be empty."
            )


        # ---------------------------------------------
        # CATEGORY
        # ---------------------------------------------

        if "category" not in question:

            raise ValueError(
                "Category field is missing."
            )


        # ---------------------------------------------
        # DIFFICULTY
        # ---------------------------------------------

        if "difficulty" not in question:

            raise ValueError(
                "Difficulty field is missing."
            )


        # ---------------------------------------------
        # CODING SOLUTION
        # ---------------------------------------------

        if category == "Coding":

            if (
                "solution" not in question
                or not question["solution"]
            ):

                raise ValueError(
                    "Coding question is missing solution."
                )


        # ---------------------------------------------
        # OTHER CATEGORIES
        # ---------------------------------------------

        else:

            question["solution"] = None


    return questions


# =====================================================
# GENERATE QUESTIONS
# =====================================================

def generate_questions(resume_text, category):
    """
    Generate interview questions in small batches.

    Total:
        10 questions

    Batch size:
        5 questions

    Number of API requests:
        2
    """

    all_questions = []


    # =================================================
    # GENERATE BATCHES
    # =================================================

    for batch_number in range(
        1,
        TOTAL_BATCHES + 1
    ):

        print(
            "\n===================================="
        )

        print(
            f"Generating batch "
            f"{batch_number}/{TOTAL_BATCHES}"
        )

        print(
            "===================================="
        )


        # ---------------------------------------------
        # GENERATE BATCH
        # ---------------------------------------------

        questions = generate_batch(
            resume_text,
            category,
            batch_number
        )


        # ---------------------------------------------
        # ADD QUESTIONS
        # ---------------------------------------------

        all_questions.extend(
            questions
        )


        # ---------------------------------------------
        # DELAY BETWEEN REQUESTS
        # ---------------------------------------------

        if batch_number < TOTAL_BATCHES:

            time.sleep(2)


    # =================================================
    # FINAL VALIDATION
    # =================================================

    if len(all_questions) != TOTAL_QUESTIONS:

        raise ValueError(
            f"Expected {TOTAL_QUESTIONS} questions, "
            f"but generated {len(all_questions)}."
        )


    # =================================================
    # SUCCESS
    # =================================================

    print(
        f"\nSuccessfully generated "
        f"{len(all_questions)} questions."
    )


    return all_questions