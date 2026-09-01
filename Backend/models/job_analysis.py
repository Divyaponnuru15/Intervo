from datetime import datetime

from models import db


# ============================================================
# JOB ANALYSIS MODEL
# ============================================================

class JobAnalysis(db.Model):

    __tablename__ = "job_analyses"


    # ========================================================
    # PRIMARY KEY
    # ========================================================

    id = db.Column(
        db.Integer,
        primary_key=True
    )


    # ========================================================
    # USER
    # ========================================================

    user_id = db.Column(
        db.Integer,
        nullable=False,
        index=True
    )


    # ========================================================
    # RESUME
    # ========================================================

    resume_id = db.Column(
        db.Integer,
        nullable=False,
        index=True
    )


    # ========================================================
    # JOB DESCRIPTION
    # ========================================================

    job_description = db.Column(
        db.Text,
        nullable=False
    )


    # ========================================================
    # MATCH SCORE
    # ========================================================

    match_score = db.Column(
        db.Integer,
        nullable=False
    )


    # ========================================================
    # MATCHING SKILLS
    #
    # Stored as JSON text.
    # Example:
    #
    # ["Python", "Flask", "SQL"]
    # ========================================================

    matching_skills = db.Column(
        db.Text,
        nullable=True
    )


    # ========================================================
    # PARTIAL / WEAK SKILLS
    #
    # Stored as JSON text.
    # ========================================================

    partial_skills = db.Column(
        db.Text,
        nullable=True
    )


    # ========================================================
    # MISSING SKILLS
    #
    # Stored as JSON text.
    # ========================================================

    missing_skills = db.Column(
        db.Text,
        nullable=True
    )


    # ========================================================
    # PRIORITY SKILLS
    #
    # Stored as JSON text.
    # Example:
    #
    # ["Django", "AWS", "REST APIs"]
    # ========================================================

    priority_skills = db.Column(
        db.Text,
        nullable=True
    )


    # ========================================================
    # RESUME SUGGESTIONS
    #
    # Stored as JSON text.
    # ========================================================

    resume_suggestions = db.Column(
        db.Text,
        nullable=True
    )


    # ========================================================
    # OVERALL ASSESSMENT
    # ========================================================

    overall_assessment = db.Column(
        db.Text,
        nullable=True
    )


    # ========================================================
    # CREATED AT
    # ========================================================

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )


    # ========================================================
    # REPRESENTATION
    # ========================================================

    def __repr__(self):

        return (
            f"<JobAnalysis "
            f"id={self.id} "
            f"user_id={self.user_id} "
            f"resume_id={self.resume_id} "
            f"match_score={self.match_score}>"
        )