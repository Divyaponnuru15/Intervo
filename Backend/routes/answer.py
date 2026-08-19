from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db
from models.answer import InterviewAnswer
from models.question import InterviewQuestion
from models.evaluation import AnswerEvaluation

from services.ai_evaluator import (
    evaluate_answer,
    generate_follow_up
)


# ============================================================
# BLUEPRINT
# ============================================================

answer = Blueprint(
    "answer",
    __name__
)


# ============================================================
# SUBMIT INTERVIEW ANSWER
# ============================================================

@answer.route(
    "/submit-answer",
    methods=["POST"]
)
@jwt_required()
def submit_answer():

    user_id = get_jwt_identity()

    data = request.get_json(silent=True)


    # ========================================================
    # VALIDATE REQUEST BODY
    # ========================================================

    if not data:

        return jsonify({
            "message":
                "Request body is required."
        }), 400


    question_id = data.get(
        "question_id"
    )

    user_answer = data.get(
        "answer"
    )


    # ========================================================
    # VALIDATE QUESTION ID
    # ========================================================

    if not question_id:

        return jsonify({
            "message":
                "Question ID is required."
        }), 400


    # ========================================================
    # VALIDATE ANSWER
    # ========================================================

    if not isinstance(
        user_answer,
        str
    ) or not user_answer.strip():

        return jsonify({
            "message":
                "Answer cannot be empty."
        }), 400


    user_answer = user_answer.strip()


    # ========================================================
    # FIND QUESTION
    # ========================================================

    question = InterviewQuestion.query.filter_by(

        id=question_id,

        user_id=user_id

    ).first()


    if not question:

        return jsonify({
            "message":
                "Question not found."
        }), 404


    # ========================================================
    # SAVE ANSWER
    # ========================================================

    try:

        new_answer = InterviewAnswer(

            answer=user_answer,

            question_id=question_id,

            user_id=user_id

        )


        db.session.add(
            new_answer
        )

        db.session.commit()


    except Exception as e:

        db.session.rollback()

        print(
            "Answer Save Error:",
            str(e)
        )

        return jsonify({

            "message":
                "Failed to save your answer."

        }), 500


    # ========================================================
    # SUCCESS
    # ========================================================

    return jsonify({

        "message":
            "Answer submitted successfully.",

        "answer_id":
            new_answer.id

    }), 201


# ============================================================
# EVALUATE ANSWER USING AI
# ============================================================

@answer.route(
    "/evaluate/<int:answer_id>",
    methods=["POST"]
)
@jwt_required()
def evaluate(answer_id):

    user_id = get_jwt_identity()


    # ========================================================
    # GET REQUEST DATA
    # ========================================================

    data = request.get_json(
        silent=True
    ) or {}


    question_text = data.get(
        "question_text"
    )

    is_follow_up = bool(
        data.get(
            "is_follow_up",
            False
        )
    )


    # ========================================================
    # FIND ANSWER
    # ========================================================

    answer_record = InterviewAnswer.query.filter_by(

        id=answer_id,

        user_id=user_id

    ).first()


    if not answer_record:

        return jsonify({

            "message":
                "Answer not found."

        }), 404


    # ========================================================
    # CHECK EXISTING EVALUATION
    # ========================================================

    existing_evaluation = AnswerEvaluation.query.filter_by(

        answer_id=answer_id

    ).first()


    if existing_evaluation:

        return jsonify({

            "message":
                "Answer has already been evaluated.",

            "evaluation": {

                "score":
                    existing_evaluation.score,

                "feedback":
                    existing_evaluation.feedback,

                "strengths":
                    existing_evaluation.strengths,

                "improvements":
                    existing_evaluation.improvements

            },

            "follow_up_question":
                None

        }), 200


    # ========================================================
    # FIND ORIGINAL QUESTION
    # ========================================================

    question = InterviewQuestion.query.filter_by(

        id=answer_record.question_id,

        user_id=user_id

    ).first()


    if not question:

        return jsonify({

            "message":
                "Related question not found."

        }), 404


    # ========================================================
    # DETERMINE QUESTION TEXT
    # ========================================================

    if not question_text:

        question_text = question.question


    question_text = str(
        question_text
    ).strip()


    if not question_text:

        return jsonify({

            "message":
                "Question text is required."

        }), 400


    # ========================================================
    # REFERENCE SOLUTION
    # ========================================================

    expected_solution = None


    # Coding reference solution should only be used
    # for the original coding question.

    if (
        not is_follow_up
        and question.solution
    ):

        expected_solution = question.solution


    # ========================================================
    # AI EVALUATION
    # ========================================================

    try:

        result = evaluate_answer(

            question=question_text,

            answer=answer_record.answer,

            expected_solution=expected_solution

        )


    except RuntimeError as e:

        print(
            "AI Evaluation Error:",
            str(e)
        )

        return jsonify({

            "message":
                str(e)

        }), 503


    except Exception as e:

        print(
            "Unexpected AI Evaluation Error:",
            str(e)
        )

        return jsonify({

            "message":
                "AI evaluation failed. "
                "Please try again later."

        }), 500


    # ========================================================
    # VALIDATE AI RESULT
    # ========================================================

    required_fields = [

        "score",
        "feedback",
        "strengths",
        "improvements"

    ]


    for field in required_fields:

        if field not in result:

            return jsonify({

                "message":
                    f"AI evaluation is missing '{field}'."

            }), 500


    # ========================================================
    # SAVE EVALUATION
    # ========================================================

    try:

        evaluation = AnswerEvaluation(

            answer_id=answer_id,

            score=result["score"],

            feedback=result["feedback"],

            strengths=result["strengths"],

            improvements=result["improvements"]

        )


        db.session.add(
            evaluation
        )

        db.session.commit()


    except Exception as e:

        db.session.rollback()

        print(
            "Database Evaluation Error:",
            str(e)
        )

        return jsonify({

            "message":
                "Failed to save AI evaluation."

        }), 500


    # ========================================================
    # FOLLOW-UP QUESTION
    # ========================================================

    follow_up_question = None


    # ========================================================
    # ONLY GENERATE FOLLOW-UP FOR:
    #
    # HR
    # Technical
    # Project
    #
    # NEVER:
    # Coding
    # Existing Follow-up
    # ========================================================

    if (
        not is_follow_up
        and not question.solution
    ):

        evaluation_data = {

            "score":
                result["score"],

            "feedback":
                result["feedback"],

            "strengths":
                result["strengths"],

            "improvements":
                result["improvements"]

        }


        try:

            follow_up_result = generate_follow_up(

                question=question.question,

                answer=answer_record.answer,

                evaluation=evaluation_data

            )


            if (

                follow_up_result

                and follow_up_result.get(
                    "follow_up",
                    False
                )

            ):

                generated_question = str(

                    follow_up_result.get(
                        "question",
                        ""
                    )

                ).strip()


                if generated_question:

                    follow_up_question = (
                        generated_question
                    )


        except RuntimeError as e:

            print(
                "Follow-up AI Error:",
                str(e)
            )

            # Do not fail the completed evaluation
            # if follow-up generation fails.

            follow_up_question = None


        except Exception as e:

            print(
                "Unexpected Follow-up Error:",
                str(e)
            )

            follow_up_question = None


    # ========================================================
    # LOG RESULT
    # ========================================================

    print()
    print(
        "========== AI EVALUATION =========="
    )
    print(
        f"Score: {result['score']}/10"
    )

    if follow_up_question:

        print(
            "Follow-up:",
            follow_up_question
        )

    else:

        print(
            "Follow-up: None"
        )

    print(
        "===================================="
    )


    # ========================================================
    # RETURN RESULT
    # ========================================================

    return jsonify({

        "message":
            "Answer evaluated successfully.",

        "evaluation": {

            "score":
                result["score"],

            "feedback":
                result["feedback"],

            "strengths":
                result["strengths"],

            "improvements":
                result["improvements"]

        },

        "follow_up_question":
            follow_up_question

    }), 200


# ============================================================
# GENERATE AI FOLLOW-UP QUESTION
#
# This endpoint is kept for compatibility.
#
# Your new frontend does NOT need to call this endpoint because
# /evaluate/<answer_id> already generates the follow-up.
# ============================================================

@answer.route(
    "/follow-up/<int:answer_id>",
    methods=["POST"]
)
@jwt_required()
def follow_up_question(answer_id):

    user_id = get_jwt_identity()


    # ========================================================
    # FIND ANSWER
    # ========================================================

    answer_record = InterviewAnswer.query.filter_by(

        id=answer_id,

        user_id=user_id

    ).first()


    if not answer_record:

        return jsonify({

            "message":
                "Answer not found."

        }), 404


    # ========================================================
    # FIND RELATED QUESTION
    # ========================================================

    question = InterviewQuestion.query.filter_by(

        id=answer_record.question_id,

        user_id=user_id

    ).first()


    if not question:

        return jsonify({

            "message":
                "Related question not found."

        }), 404


    # ========================================================
    # CODING QUESTIONS
    # ========================================================

    if question.solution:

        return jsonify({

            "follow_up":
                False,

            "question":
                "",

            "message":
                "Follow-up questions are not generated "
                "for coding questions."

        }), 200


    # ========================================================
    # GET EVALUATION
    # ========================================================

    evaluation = AnswerEvaluation.query.filter_by(

        answer_id=answer_id

    ).first()


    if not evaluation:

        return jsonify({

            "message":
                "Answer must be evaluated before "
                "generating a follow-up question."

        }), 400


    # ========================================================
    # PREPARE EVALUATION
    # ========================================================

    evaluation_data = {

        "score":
            evaluation.score,

        "feedback":
            evaluation.feedback,

        "strengths":
            evaluation.strengths,

        "improvements":
            evaluation.improvements

    }


    # ========================================================
    # GENERATE FOLLOW-UP
    # ========================================================

    try:

        result = generate_follow_up(

            question=question.question,

            answer=answer_record.answer,

            evaluation=evaluation_data

        )


    except RuntimeError as e:

        print(
            "Follow-up AI Error:",
            str(e)
        )

        return jsonify({

            "message":
                str(e)

        }), 503


    except Exception as e:

        print(
            "Unexpected Follow-up Error:",
            str(e)
        )

        return jsonify({

            "message":
                "Unable to generate follow-up question."

        }), 500


    # ========================================================
    # VALIDATE RESULT
    # ========================================================

    if not result:

        return jsonify({

            "follow_up":
                False,

            "question":
                ""

        }), 200


    follow_up = result.get(
        "follow_up",
        False
    )


    # ========================================================
    # NO FOLLOW-UP
    # ========================================================

    if not follow_up:

        return jsonify({

            "follow_up":
                False,

            "question":
                "",

            "message":
                "No follow-up question is required."

        }), 200


    # ========================================================
    # GET FOLLOW-UP QUESTION
    # ========================================================

    follow_up_question_text = str(

        result.get(
            "question",
            ""
        )

    ).strip()


    if not follow_up_question_text:

        return jsonify({

            "follow_up":
                False,

            "question":
                ""

        }), 200


    # ========================================================
    # LOG
    # ========================================================

    print()
    print(
        "========== FOLLOW-UP QUESTION =========="
    )
    print(
        follow_up_question_text
    )
    print(
        "========================================="
    )


    # ========================================================
    # RETURN
    # ========================================================

    return jsonify({

        "follow_up":
            True,

        "question":
            follow_up_question_text

    }), 200


# ============================================================
# GET ANSWER EVALUATION
# ============================================================

@answer.route(
    "/evaluation/<int:answer_id>",
    methods=["GET"]
)
@jwt_required()
def get_evaluation(answer_id):

    user_id = get_jwt_identity()


    # ========================================================
    # VERIFY ANSWER BELONGS TO USER
    # ========================================================

    answer_record = InterviewAnswer.query.filter_by(

        id=answer_id,

        user_id=user_id

    ).first()


    if not answer_record:

        return jsonify({

            "message":
                "Answer not found."

        }), 404


    # ========================================================
    # FIND EVALUATION
    # ========================================================

    evaluation = AnswerEvaluation.query.filter_by(

        answer_id=answer_id

    ).first()


    if not evaluation:

        return jsonify({

            "message":
                "Evaluation not found."

        }), 404


    # ========================================================
    # RETURN EVALUATION
    # ========================================================

    return jsonify({

        "score":
            evaluation.score,

        "feedback":
            evaluation.feedback,

        "strengths":
            evaluation.strengths,

        "improvements":
            evaluation.improvements

    }), 200