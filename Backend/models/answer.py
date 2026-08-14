from datetime import datetime
from . import db


class InterviewAnswer(db.Model):

    __tablename__ = "interview_answers"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    answer = db.Column(
        db.Text,
        nullable=False
    )

    score = db.Column(
        db.Integer,
        nullable=True
    )

    feedback = db.Column(
        db.Text,
        nullable=True
    )

    question_id = db.Column(
        db.Integer,
        db.ForeignKey("interview_questions.id"),
        nullable=False
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )