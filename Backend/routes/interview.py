
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db
from models.question import InterviewQuestion
from models.resume import Resume
from models.session import InterviewSession

from services.ai_question_generator import (
    generate_questions as ai_generate_questions
)

from services.ai_answer_tips import (
    generate_answer_tips
)


# ============================================================
# INTERVIEW BLUEPRINT
# ============================================================

interview = Blueprint(
    "interview",
    __name__
)


# ============================================================
# ALLOWED INTERVIEW CATEGORIES
# ============================================================

ALLOWED_CATEGORIES = [
    "HR",
    "Technical",
    "Coding",
    "Project"
]


# ============================================================
# GENERATE INTERVIEW QUESTIONS
# ============================================================

@interview.route(
    "/generate-questions",
    methods=["POST"]
)
@jwt_required()
def generate_questions():

    user_id = get_jwt_identity()

    data = request.get_json()


    # ========================================================
    # CHECK REQUEST BODY
    # ========================================================

    if not data:

        return jsonify({
            "message": "Request body is required"
        }), 400


    resume_id = data.get("resume_id")
    session_id = data.get("session_id")
    category = data.get("category")


    # ========================================================
    # CHECK REQUIRED FIELDS
    # ========================================================

    if not resume_id or not session_id or not category:

        return jsonify({
            "message":
            "resume_id, session_id and category are required"
        }), 400


    # ========================================================
    # VALIDATE CATEGORY
    # ========================================================

    if category not in ALLOWED_CATEGORIES:

        return jsonify({

            "message":
            "Invalid category",

            "allowed_categories":
            ALLOWED_CATEGORIES

        }), 400


    # ========================================================
    # CHECK RESUME
    # ========================================================

    resume = Resume.query.filter_by(

        id=resume_id,
        user_id=user_id

    ).first()


    if not resume:

        return jsonify({
            "message": "Resume not found"
        }), 404


    # ========================================================
    # CHECK INTERVIEW SESSION
    # ========================================================

    session = InterviewSession.query.filter_by(

        id=session_id,
        user_id=user_id,
        resume_id=resume_id

    ).first()


    if not session:

        return jsonify({
            "message": "Interview session not found"
        }), 404


    # ========================================================
    # GENERATE QUESTIONS
    # ========================================================

    try:

        questions = ai_generate_questions(

            resume.extracted_text,
            category

        )


        # ====================================================
        # DELETE OLD QUESTIONS
        # ====================================================

        InterviewQuestion.query.filter_by(

            session_id=session_id,
            user_id=user_id

        ).delete()


        db.session.commit()


        # ====================================================
        # SAVE NEW QUESTIONS
        # ====================================================

        for item in questions:

            new_question = InterviewQuestion(

                question=item["question"],

                category=item["category"],

                difficulty=item["difficulty"],

                solution=item.get("solution"),

                user_id=user_id,

                resume_id=resume_id,

                session_id=session_id

            )

            db.session.add(new_question)


        # ====================================================
        # SAVE TO DATABASE
        # ====================================================

        db.session.commit()


        # ====================================================
        # SUCCESS RESPONSE
        # ====================================================

        return jsonify({

            "message":
            "Interview questions generated successfully",

            "session_id":
            session_id,

            "category":
            category,

            "count":
            len(questions)

        }), 201


    # ========================================================
    # ERROR
    # ========================================================

    except Exception as error:

        db.session.rollback()

        print(
            "Question Generation Error:",
            error
        )

        return jsonify({

            "message":
            "Failed to generate questions",

            "error":
            str(error)

        }), 500


# ============================================================
# GET INTERVIEW QUESTIONS
# ============================================================

@interview.route(
    "/questions/<int:session_id>",
    methods=["GET"]
)
@jwt_required()
def get_questions(session_id):

    user_id = get_jwt_identity()


    # ========================================================
    # GET QUESTIONS
    # ========================================================

    questions = InterviewQuestion.query.filter_by(

        session_id=session_id,
        user_id=user_id

    ).all()


    # ========================================================
    # CHECK QUESTIONS
    # ========================================================

    if not questions:

        return jsonify({

            "message":
            "No questions found"

        }), 404


    result = []


    # ========================================================
    # FORMAT QUESTIONS
    # ========================================================

    for question in questions:

        question_data = {

            "id":
            question.id,

            "question":
            question.question,

            "category":
            question.category,

            "difficulty":
            question.difficulty

        }


        # ====================================================
        # CODING QUESTION
        # ====================================================

        if question.category == "Coding":

            question_data["solution"] = (
                question.solution
            )


        result.append(
            question_data
        )


    # ========================================================
    # RETURN QUESTIONS
    # ========================================================

    return jsonify({

        "session_id":
        session_id,

        "questions":
        result

    }), 200


# ============================================================
# GENERATE AI ANSWER TIPS
# ============================================================

@interview.route(
    "/answer-tips",
    methods=["POST"]
)
@jwt_required()
def answer_tips():

    try:

        data = request.get_json()


        # ====================================================
        # CHECK REQUEST BODY
        # ====================================================

        if not data:

            return jsonify({

                "message":
                "Request body is required"

            }), 400


        question = data.get("question")
        category = data.get("category")


        # ====================================================
        # CHECK REQUIRED FIELDS
        # ====================================================

        if not question or not category:

            return jsonify({

                "message":
                "question and category are required"

            }), 400


        # ====================================================
        # VALIDATE CATEGORY
        # ====================================================

        if category not in ALLOWED_CATEGORIES:

            return jsonify({

                "message":
                "Invalid category",

                "allowed_categories":
                ALLOWED_CATEGORIES

            }), 400


        # ====================================================
        # GENERATE AI TIPS
        # ====================================================

        tips = generate_answer_tips(

            question,
            category

        )


        # ====================================================
        # VALIDATE AI RESPONSE
        # ====================================================

        if not isinstance(tips, list):

            return jsonify({

                "message":
                "AI returned an invalid tips format",

                "tips":
                []

            }), 500


        if not tips:

            return jsonify({

                "message":
                "No answer tips were generated",

                "tips":
                []

            }), 200


        # ====================================================
        # SUCCESS RESPONSE
        # ====================================================

        return jsonify({

            "message":
            "Answer tips generated successfully",

            "category":
            category,

            "question":
            question,

            "tips":
            tips[:5]

        }), 200


    # ========================================================
    # ERROR
    # ========================================================

    except Exception as error:

        print(
            "Answer Tips Error:",
            error
        )

        return jsonify({

            "message":
            "Unable to generate answer tips",

            "error":
            str(error)

        }), 500

