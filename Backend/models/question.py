from datetime import datetime
from . import db


class InterviewQuestion(db.Model):

    __tablename__ = "interview_questions"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    question = db.Column(
        db.Text,
        nullable=False
    )

    category = db.Column(
        db.String(50),
        nullable=False
    )

    difficulty = db.Column(
        db.String(50),
        nullable=False
    )

    # AI-generated reference solution
    solution = db.Column(
        db.Text,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    resume_id = db.Column(
        db.Integer,
        db.ForeignKey("resumes.id"),
        nullable=False
    )

    session_id = db.Column(
        db.Integer,
        db.ForeignKey("interview_sessions.id"),
        nullable=False
    )

    def __repr__(self):
        return f"<InterviewQuestion {self.id}>"