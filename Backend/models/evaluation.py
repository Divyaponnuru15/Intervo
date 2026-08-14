from datetime import datetime
from . import db


class AnswerEvaluation(db.Model):

    __tablename__ = "answer_evaluations"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    answer_id = db.Column(
        db.Integer,
        db.ForeignKey("interview_answers.id"),
        nullable=False
    )

    score = db.Column(
        db.Integer
    )

    feedback = db.Column(
        db.Text
    )

    strengths = db.Column(
        db.Text
    )

    improvements = db.Column(
        db.Text
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )