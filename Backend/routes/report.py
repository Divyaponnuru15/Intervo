from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db
from models.session import InterviewSession
from models.question import InterviewQuestion
from models.answer import InterviewAnswer
from models.evaluation import AnswerEvaluation
from models.report import InterviewReport


report = Blueprint("report", __name__)


# 
# GENERATE INTERVIEW REPORT
# 

@report.route("/generate/<int:session_id>", methods=["POST"])
@jwt_required()
def generate_report(session_id):

    user_id = get_jwt_identity()

    # 
    # CHECK SESSION OWNERSHIP
    # 

    session = InterviewSession.query.filter_by(
        id=session_id,
        user_id=user_id
    ).first()

    if not session:

        return jsonify({
            "message": "Interview session not found"
        }), 404


    # 
    # CHECK EXISTING REPORT
    # 

    existing_report = InterviewReport.query.filter_by(
        session_id=session_id,
        user_id=user_id
    ).first()

    if existing_report:

        return jsonify({

            "message":
                "Report already generated",

            "report_id":
                existing_report.id

        }), 200


    # 
    # GET QUESTIONS FOR THIS SESSION
    # 

    questions = InterviewQuestion.query.filter_by(
        session_id=session_id,
        user_id=user_id
    ).order_by(
        InterviewQuestion.id.asc()
    ).all()


    # 
    # LIMIT REPORT TO 5 QUESTIONS
    # 

    questions = questions[:5]


    total_questions = len(questions)

    answered_questions = 0

    scores = []

    strengths = []

    improvements = []


    # 
    # PROCESS QUESTIONS
    # 

    for question in questions:

        answer = InterviewAnswer.query.filter_by(
            question_id=question.id,
            user_id=user_id
        ).first()


        if not answer:
            continue


        answered_questions += 1


        evaluation = AnswerEvaluation.query.filter_by(
            answer_id=answer.id
        ).first()


        if not evaluation:
            continue


        # 
        # SCORE
        # 

        if evaluation.score is not None:

            scores.append(
                float(evaluation.score)
            )


        # 
        # STRENGTHS
        # 

        if evaluation.strengths:

            strengths.append(
                evaluation.strengths
            )


        # 
        # IMPROVEMENTS
        # 

        if evaluation.improvements:

            improvements.append(
                evaluation.improvements
            )


    # 
    # AVERAGE SCORE
    # 

    average_score = 0

    if scores:

        average_score = round(
            sum(scores) / len(scores),
            2
        )


    # 
    # RECOMMENDATION
    # 

    if average_score >= 8:

        recommendation = (
            "Excellent performance. "
            "Candidate is well prepared for interviews."
        )

    elif average_score >= 6:

        recommendation = (
            "Good performance. "
            "Candidate should improve the weaker areas."
        )

    elif average_score >= 4:

        recommendation = (
            "Average performance. "
            "More practice is recommended."
        )

    else:

        recommendation = (
            "Needs more preparation. "
            "Practice answering interview questions clearly "
            "and provide complete responses."
        )


    # 
    # REMOVE DUPLICATES
    # 

    unique_strengths = list(
        dict.fromkeys(strengths)
    )

    unique_improvements = list(
        dict.fromkeys(improvements)
    )


    # 
    # CREATE REPORT
    # 

    new_report = InterviewReport(

        session_id=session_id,

        user_id=user_id,

        total_questions=total_questions,

        answered_questions=answered_questions,

        average_score=average_score,

        strengths="\n".join(
            unique_strengths
        ),

        improvements="\n".join(
            unique_improvements
        ),

        recommendation=recommendation

    )


    db.session.add(new_report)

    db.session.commit()


    # 
    # RESPONSE
    # 

    return jsonify({

        "message":
            "Interview report generated successfully",

        "report_id":
            new_report.id,

        "total_questions":
            total_questions,

        "answered_questions":
            answered_questions,

        "average_score":
            average_score,

        "recommendation":
            recommendation

    }), 201


# 
# GET SINGLE REPORT
# 

@report.route("/<int:report_id>", methods=["GET"])
@jwt_required()
def get_report(report_id):

    user_id = get_jwt_identity()


    report = InterviewReport.query.filter_by(
        id=report_id,
        user_id=user_id
    ).first()


    if not report:

        return jsonify({
            "message": "Report not found"
        }), 404


    return jsonify({

        "report_id":
            report.id,

        "session_id":
            report.session_id,

        "total_questions":
            report.total_questions,

        "answered_questions":
            report.answered_questions,

        "average_score":
            report.average_score,

        "strengths":
            report.strengths,

        "improvements":
            report.improvements,

        "recommendation":
            report.recommendation

    }), 200


# 
# REPORT HISTORY
# 

@report.route("/history", methods=["GET"])
@jwt_required()
def report_history():

    user_id = get_jwt_identity()


    reports = InterviewReport.query.filter_by(
        user_id=user_id
    ).order_by(
        InterviewReport.created_at.desc()
    ).all()


    history = []


    for report in reports:

        history.append({

            "report_id":
                report.id,

            "session_id":
                report.session_id,

            "average_score":
                report.average_score,

            "recommendation":
                report.recommendation,

            "created_at":
                report.created_at

        })


    return jsonify({

        "reports":
            history

    }), 200