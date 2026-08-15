
from flask import Blueprint, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from models.report import InterviewReport
from models.question import InterviewQuestion
from models.answer import InterviewAnswer
from models.evaluation import AnswerEvaluation
from models.resume import Resume

from services.report_generator import create_report
from services.ats_report_generator import create_ats_report


# ===========
# PDF REPORT BLUEPRINT
# ===========

pdf_report = Blueprint(
    "pdf_report",
    __name__
)


# ===========
# DOWNLOAD INTERVIEW REPORT
# ===========

@pdf_report.route(
    "/report/<int:report_id>",
    methods=["GET"]
)
@jwt_required()
def download_report(report_id):

    # =======
    # GET LOGGED-IN USER
    # =======

    user_id = get_jwt_identity()


    # =======
    # FIND REPORT
    # =======

    report = InterviewReport.query.filter_by(
        id=report_id,
        user_id=user_id
    ).first()


    if not report:

        return jsonify({
            "message": "Report not found."
        }), 404


    # =======
    # COLLECT EVALUATIONS
    # =======

    evaluations = []


    questions = InterviewQuestion.query.filter_by(
        session_id=report.session_id,
        user_id=user_id
    ).all()


    for question in questions:

        answer = InterviewAnswer.query.filter_by(
            question_id=question.id,
            user_id=user_id
        ).first()


        if not answer:
            continue


        evaluation = AnswerEvaluation.query.filter_by(
            answer_id=answer.id
        ).first()


        if not evaluation:
            continue


        evaluations.append({

            "question":
                question.question,

            "score":
                evaluation.score,

            "feedback":
                evaluation.feedback,

            "strengths":
                evaluation.strengths,

            "improvements":
                evaluation.improvements

        })


    # =======
    # PREPARE REPORT DATA
    # =======

    data = {

        "report_id":
            report.id,

        "average_score":
            report.average_score,

        "total_questions":
            report.total_questions,

        "answered_questions":
            report.answered_questions,

        "strengths":
            report.strengths,

        "improvements":
            report.improvements,

        "recommendation":
            report.recommendation,

        "evaluations":
            evaluations

    }


    # =======
    # GENERATE PDF
    # =======

    try:

        pdf_path = create_report(
            data
        )

    except Exception as e:

        print()
        print(
            "========== INTERVIEW PDF ERROR =========="
        )

        print(
            str(e)
        )

        print(
            "==================="
        )

        return jsonify({
            "message":
                "Failed to generate interview report."
        }), 500


    # =======
    # SEND PDF
    # =======

    return send_file(

        pdf_path,

        as_attachment=True,

        download_name=
            f"Interview_Report_{report.id}.pdf",

        mimetype=
            "application/pdf"

    )


# ===========
# DOWNLOAD ATS REPORT
# ===========

@pdf_report.route(
    "/ats-report/<int:resume_id>",
    methods=["GET"]
)
@jwt_required()
def download_ats_report(resume_id):

    # =======
    # GET LOGGED-IN USER
    # =======

    user_id = get_jwt_identity()


    # =======
    # FIND USER'S RESUME
    # =======

    resume = Resume.query.filter_by(

        id=resume_id,

        user_id=user_id

    ).first()


    # =======
    # CHECK RESUME
    # =======

    if not resume:

        return jsonify({
            "message":
                "Resume not found."
        }), 404


    # =======
    # CHECK ATS ANALYSIS
    # =======

    if not resume.ats_analysis:

        return jsonify({
            "message":
                "ATS analysis has not been completed yet."
        }), 400


    # =======
    # CHECK ATS SCORE
    # =======

    if resume.ats_score is None:

        return jsonify({
            "message":
                "ATS score is not available."
        }), 400


    # =======
    # GENERATE ATS PDF
    # =======

    try:

        pdf_path = create_ats_report(
            resume
        )


    except Exception as e:

        print()
        print(
            "========== ATS PDF ERROR =========="
        )

        print(
            str(e)
        )

        print(
            "============"
        )

        return jsonify({
            "message":
                "Failed to generate ATS report."
        }), 500


    # =======
    # SEND ATS PDF
    # =======

    return send_file(

        pdf_path,

        as_attachment=True,

        download_name=
            f"Intervo_ATS_Report_{resume.id}.pdf",

        mimetype=
            "application/pdf"

    )

