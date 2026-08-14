from datetime import datetime
from . import db


class InterviewReport(db.Model):

    __tablename__ = "interview_reports"


    id = db.Column(
        db.Integer,
        primary_key=True
    )


    session_id = db.Column(
        db.Integer,
        db.ForeignKey("interview_sessions.id"),
        nullable=False
    )


    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )


    total_questions = db.Column(
        db.Integer,
        default=0
    )


    answered_questions = db.Column(
        db.Integer,
        default=0
    )


    average_score = db.Column(
        db.Float,
        default=0
    )


    strengths = db.Column(
        db.Text
    )


    improvements = db.Column(
        db.Text
    )


    recommendation = db.Column(
        db.Text
    )


    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )