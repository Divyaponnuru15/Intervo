from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db
from models.answer import InterviewAnswer
from models.question import InterviewQuestion
from models.evaluation import AnswerEvaluation

from services.ai_evaluator import evaluate_answer


answer = Blueprint(
    "answer",
    __name__
)



# SUBMIT INTERVIEW ANSWER

@answer.route(
    "/submit-answer",
    methods=["POST"]
)
@jwt_required()
def submit_answer():

    user_id = get_jwt_identity()

    data = request.get_json()

    if not data:

        return jsonify({
            "message": "Request body is required"
        }), 400


    question_id = data.get(
        "question_id"
    )

    user_answer = data.get(
        "answer"
    )

    # VALIDATE ANSWER
   
    if not user_answer:

        return jsonify({
            "message": "Answer cannot be empty"
        }), 400

# CHECK QUESTION

    question = InterviewQuestion.query.filter_by(

        id=question_id,

        user_id=user_id

    ).first()


    if not question:

        return jsonify({
            "message": "Question not found"
        }), 404


        # SAVE ANSWER

    new_answer = InterviewAnswer(

        answer=user_answer,

        question_id=question_id,

        user_id=user_id

    )


    db.session.add(
        new_answer
    )

    db.session.commit()


    return jsonify({

        "message":
            "Answer submitted successfully",

        "answer_id":
            new_answer.id

    }), 201


# EVALUATE ANSWER USING AI

@answer.route(
    "/evaluate/<int:answer_id>",
    methods=["POST"]
)
@jwt_required()
def evaluate(answer_id):

    user_id = get_jwt_identity()


    
    # FIND SUBMITTED ANSWER
   
    answer_record = InterviewAnswer.query.filter_by(

        id=answer_id,

        user_id=user_id

    ).first()


    if not answer_record:

        return jsonify({
            "message": "Answer not found"
        }), 404

    # CHECK EXISTING EVALUATION
    
    existing_evaluation = AnswerEvaluation.query.filter_by(

        answer_id=answer_id

    ).first()


    if existing_evaluation:

        return jsonify({

            "message":
                "Answer already evaluated"

        }), 400

    # GET RELATED QUESTION
   

    question = InterviewQuestion.query.filter_by(

        id=answer_record.question_id,

        user_id=user_id

    ).first()


    if not question:

        return jsonify({

            "message":
                "Related question not found"

        }), 404


    
    # AI EVALUATION
    
    try:

        result = evaluate_answer(

            question.question,

            answer_record.answer,

            question.solution

        )


    except RuntimeError as e:

        return jsonify({

            "message":
                str(e)

        }), 503


    except Exception as e:

        print(
            "Unexpected Evaluation Error:",
            str(e)
        )

        return jsonify({

            "message":
                "AI evaluation failed. Please try again later."

        }), 500

    # SAVE EVALUATION
   
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

    # RETURN EVALUATION
    
    return jsonify({

        "message":
            "Answer evaluated successfully",

        "evaluation":
            result

    }), 200



# GET ANSWER EVALUATION

@answer.route(
    "/evaluation/<int:answer_id>",
    methods=["GET"]
)
@jwt_required()
def get_evaluation(answer_id):

    user_id = get_jwt_identity()


    # VERIFY ANSWER
    
    answer_record = InterviewAnswer.query.filter_by(

        id=answer_id,

        user_id=user_id

    ).first()


    if not answer_record:

        return jsonify({

            "message":
                "Answer not found"

        }), 404


    # GET EVALUATION
   
    evaluation = AnswerEvaluation.query.filter_by(

        answer_id=answer_id

    ).first()


    if not evaluation:

        return jsonify({

            "message":
                "Evaluation not found"

        }), 404


  
    # RETURN EVALUATION


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