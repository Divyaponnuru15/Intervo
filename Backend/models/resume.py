from datetime import datetime

from . import db


class Resume(db.Model):

    __tablename__ = "resumes"


    id = db.Column(
        db.Integer,
        primary_key=True
    )


    filename = db.Column(
        db.String(255),
        nullable=False
    )


    file_path = db.Column(
        db.String(500),
        nullable=False
    )


    extracted_text = db.Column(
        db.Text
    )


    # =====================================================
    # ATS ANALYSIS
    # =====================================================

    ats_score = db.Column(
        db.Integer,
        nullable=True
    )


    ats_analysis = db.Column(
        db.JSON,
        nullable=True
    )


    uploaded_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )


    questions = db.relationship(
        "InterviewQuestion",
        backref="resume",
        lazy=True
    )