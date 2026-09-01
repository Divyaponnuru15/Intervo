
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

import json

from models import db
from models.resume import Resume
from models.job_analysis import JobAnalysis

from services.ai_jd_analyzer import (
    analyze_resume_with_jd
)


# ============================================================
# JOB ANALYSIS BLUEPRINT
# ============================================================

job_analysis = Blueprint(
    "job_analysis",
    __name__
)


# ============================================================
# ANALYZE JOB DESCRIPTION
# ============================================================

@job_analysis.route(
    "/analyze",
    methods=["POST"]
)
@jwt_required()
def analyze_job_description():

    user_id = get_jwt_identity()

    # ========================================================
    # GET REQUEST DATA
    # ========================================================

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify({
            "message":
                "Request body is required."
        }), 400

    resume_id = data.get(
        "resume_id"
    )

    job_description = data.get(
        "job_description"
    )

    # ========================================================
    # VALIDATE RESUME ID
    # ========================================================

    if not resume_id:

        return jsonify({
            "message":
                "resume_id is required."
        }), 400

    try:

        resume_id = int(
            resume_id
        )

    except (
        ValueError,
        TypeError
    ):

        return jsonify({
            "message":
                "Invalid resume_id."
        }), 400

    # ========================================================
    # VALIDATE JOB DESCRIPTION
    # ========================================================

    if (
        not job_description
        or not isinstance(
            job_description,
            str
        )
        or not job_description.strip()
    ):

        return jsonify({
            "message":
                "Job description is required."
        }), 400

    job_description = (
        job_description
        .strip()
    )

    # ========================================================
    # LIMIT JOB DESCRIPTION LENGTH
    # ========================================================

    if len(job_description) > 20000:

        return jsonify({
            "message":
                "Job description is too long. "
                "Please keep it under 20,000 characters."
        }), 400

    # ========================================================
    # FIND USER RESUME
    # ========================================================

    resume = Resume.query.filter_by(

        id=resume_id,

        user_id=user_id

    ).first()

    if not resume:

        return jsonify({
            "message":
                "Resume not found."
        }), 404

    # ========================================================
    # CHECK EXTRACTED RESUME TEXT
    # ========================================================

    resume_text = str(
        resume.extracted_text or ""
    ).strip()

    if not resume_text:

        return jsonify({
            "message":
                "Resume text is not available. "
                "Please upload your resume again."
        }), 400

    # ========================================================
    # AI ANALYSIS
    # ========================================================

    try:

        analysis = analyze_resume_with_jd(

            resume_text=resume_text,

            job_description=job_description

        )

    except ValueError as error:

        print(
            "JD Validation Error:",
            error
        )

        return jsonify({
            "message":
                str(error)
        }), 400

    except RuntimeError as error:

        print(
            "JD AI Analysis Error:",
            error
        )

        return jsonify({
            "message":
                str(error)
        }), 503

    except Exception as error:

        print(
            "Unexpected JD Analysis Error:",
            error
        )

        return jsonify({
            "message":
                "Unable to analyze the job description. "
                "Please try again later."
        }), 500

    # ========================================================
    # VALIDATE AI RESULT
    # ========================================================

    if not isinstance(
        analysis,
        dict
    ):

        return jsonify({
            "message":
                "AI returned an invalid analysis."
        }), 500

    # ========================================================
    # GET AI VALUES
    # ========================================================

    match_score = analysis.get(
        "match_score"
    )

    matching_skills = analysis.get(
        "matching_skills",
        []
    )

    partial_skills = analysis.get(
        "partial_skills",
        []
    )

    missing_skills = analysis.get(
        "missing_skills",
        []
    )

    priority_skills = analysis.get(
        "priority_skills",
        []
    )

    resume_suggestions = analysis.get(
        "resume_suggestions",
        []
    )

    overall_assessment = analysis.get(
        "overall_assessment",
        ""
    )

    # ========================================================
    # VALIDATE MATCH SCORE
    # ========================================================

    try:

        match_score = int(
            match_score
        )

    except (
        ValueError,
        TypeError
    ):

        return jsonify({
            "message":
                "AI returned an invalid match score."
        }), 500

    if (
        match_score < 0
        or match_score > 100
    ):

        return jsonify({
            "message":
                "AI returned an invalid match score."
        }), 500

    # ========================================================
    # CLEAN LIST VALUES
    # ========================================================

    def clean_list(values):

        if not isinstance(
            values,
            list
        ):

            return []

        cleaned = []

        for value in values:

            if value is None:
                continue

            value = str(
                value
            ).strip()

            if value:

                cleaned.append(
                    value
                )

        return cleaned

    # ========================================================
    # CLEAN AI DATA
    # ========================================================

    matching_skills = clean_list(
        matching_skills
    )

    partial_skills = clean_list(
        partial_skills
    )

    missing_skills = clean_list(
        missing_skills
    )

    priority_skills = clean_list(
        priority_skills
    )

    resume_suggestions = clean_list(
        resume_suggestions
    )

    overall_assessment = str(
        overall_assessment or ""
    ).strip()

    # ========================================================
    # SAVE ANALYSIS
    # ========================================================

    try:

        new_analysis = JobAnalysis(

            user_id=user_id,

            resume_id=resume_id,

            job_description=job_description,

            match_score=match_score,

            matching_skills=json.dumps(
                matching_skills
            ),

            partial_skills=json.dumps(
                partial_skills
            ),

            missing_skills=json.dumps(
                missing_skills
            ),

            priority_skills=json.dumps(
                priority_skills
            ),

            resume_suggestions=json.dumps(
                resume_suggestions
            ),

            overall_assessment=
                overall_assessment

        )

        db.session.add(
            new_analysis
        )

        db.session.commit()

    except Exception as error:

        db.session.rollback()

        print(
            "JD Analysis Database Error:",
            error
        )

        return jsonify({
            "message":
                "Analysis was completed but "
                "could not be saved."
        }), 500

    # ========================================================
    # LOG RESULT
    # ========================================================

    print()

    print(
        "========== JOB DESCRIPTION ANALYSIS =========="
    )

    print(
        f"Analysis ID: {new_analysis.id}"
    )

    print(
        f"Resume ID: {resume_id}"
    )

    print(
        f"Match Score: {match_score}%"
    )

    print(
        f"Matching Skills: {len(matching_skills)}"
    )

    print(
        f"Partial Skills: {len(partial_skills)}"
    )

    print(
        f"Missing Skills: {len(missing_skills)}"
    )

    print(
        f"Priority Skills: {len(priority_skills)}"
    )

    print(
        f"Resume Suggestions: {len(resume_suggestions)}"
    )

    print(
        "=============================================="
    )

    # ========================================================
    # SUCCESS RESPONSE
    # ========================================================

    return jsonify({

        "message":
            "Job description analyzed successfully.",

        "analysis_id":
            new_analysis.id,

        "resume_id":
            resume_id,

        "match_score":
            match_score,

        "matching_skills":
            matching_skills,

        "partial_skills":
            partial_skills,

        "missing_skills":
            missing_skills,

        "priority_skills":
            priority_skills,

        "resume_suggestions":
            resume_suggestions,

        "overall_assessment":
            overall_assessment

    }), 200


# ============================================================
# GET SAVED JOB ANALYSIS
# ============================================================

@job_analysis.route(
    "/<int:analysis_id>",
    methods=["GET"]
)
@jwt_required()
def get_job_analysis(
    analysis_id
):

    user_id = get_jwt_identity()

    # ========================================================
    # FIND ANALYSIS
    # ========================================================

    analysis = JobAnalysis.query.filter_by(

        id=analysis_id,

        user_id=user_id

    ).first()

    if not analysis:

        return jsonify({
            "message":
                "Job analysis not found."
        }), 404

    # ========================================================
    # SAFE JSON LOADER
    # ========================================================

    def load_json_list(value):

        if not value:

            return []

        try:

            result = json.loads(
                value
            )

            if isinstance(
                result,
                list
            ):

                return result

        except (
            json.JSONDecodeError,
            TypeError
        ):

            pass

        return []

    # ========================================================
    # RETURN SAVED ANALYSIS
    # ========================================================

    return jsonify({

        "analysis_id":
            analysis.id,

        "resume_id":
            analysis.resume_id,

        "job_description":
            analysis.job_description,

        "match_score":
            analysis.match_score,

        "matching_skills":
            load_json_list(
                analysis.matching_skills
            ),

        "partial_skills":
            load_json_list(
                analysis.partial_skills
            ),

        "missing_skills":
            load_json_list(
                analysis.missing_skills
            ),

        "priority_skills":
            load_json_list(
                analysis.priority_skills
            ),

        "resume_suggestions":
            load_json_list(
                analysis.resume_suggestions
            ),

        "overall_assessment":
            analysis.overall_assessment or "",

        "created_at":
            analysis.created_at.isoformat()

    }), 200

