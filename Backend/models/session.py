from datetime import datetime
from . import db


class InterviewSession(db.Model):

    __tablename__ = "interview_sessions"


    # ==================================================
    # PRIMARY KEY
    # ==================================================

    id = db.Column(
        db.Integer,
        primary_key=True
    )


    # ==================================================
    # SESSION INFORMATION
    # ==================================================

    title = db.Column(
        db.String(200),
        nullable=False
    )


    category = db.Column(
        db.String(50),
        nullable=False,
        default="HR"
    )


    status = db.Column(
        db.String(50),
        default="Started"
    )


    total_score = db.Column(
        db.Float,
        default=0
    )


    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


    # ==================================================
    # USER
    # ==================================================

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )


    # ==================================================
    # RESUME
    # ==================================================

    resume_id = db.Column(
        db.Integer,
        db.ForeignKey("resumes.id"),
        nullable=False
    )


    # ==================================================
    # QUESTIONS
    # ==================================================

    questions = db.relationship(
        "InterviewQuestion",
        backref="session",
        lazy=True
    )


    # ==================================================
    # REPRESENTATION
    # ==================================================

    def __repr__(self):

        return (
            f"<InterviewSession "
            f"{self.id} - {self.category}>"
        )