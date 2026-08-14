from flask import Blueprint, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from models.report import InterviewReport
from models.session import InterviewSession
from models.question import InterviewQuestion
from models.answer import InterviewAnswer
from models.evaluation import AnswerEvaluation

from services.report_generator import create_report


pdf_report = Blueprint(
    "pdf_report",
    __name__
)



@pdf_report.route(
    "/report/<int:report_id>",
    methods=["GET"]
)
@jwt_required()
def download_report(report_id):

    user_id = get_jwt_identity()



    # Get report

    report = InterviewReport.query.filter_by(
        id=report_id,
        user_id=user_id
    ).first()



    if not report:

        return jsonify({
            "message": "Report not found"
        }),404



    evaluations = []



    # Get questions and evaluations

    questions = InterviewQuestion.query.filter_by(
        session_id=report.session_id,
        user_id=user_id
    ).all()



    for question in questions:


        answer = InterviewAnswer.query.filter_by(
            question_id=question.id,
            user_id=user_id
        ).first()



        if answer:


            evaluation = AnswerEvaluation.query.filter_by(
                answer_id=answer.id
            ).first()



            if evaluation:


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



    pdf_path = create_report(data)



    return send_file(

        pdf_path,

        as_attachment=True,

        download_name=
        f"Interview_Report_{report.id}.pdf"

    )