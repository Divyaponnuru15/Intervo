from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db
from models.session import InterviewSession
from models.resume import Resume


session = Blueprint("session", __name__)


# ==================================================
# START INTERVIEW SESSION
# ==================================================

@session.route("/start", methods=["POST"])
@jwt_required()
def start_session():

    user_id = get_jwt_identity()

    data = request.get_json()


    if not data:

        return jsonify({
            "message": "Request body is required"
        }), 400


    resume_id = data.get("resume_id")
    title = data.get("title")
    category = data.get("category")


    # ==================================================
    # CHECK REQUIRED FIELDS
    # ==================================================

    if not resume_id:

        return jsonify({
            "message": "resume_id is required"
        }), 400


    if not category:

        return jsonify({
            "message": "category is required"
        }), 400


    # ==================================================
    # ALLOWED CATEGORIES
    # ==================================================

    allowed_categories = [
        "HR",
        "Technical",
        "Coding",
        "Project"
    ]


    if category not in allowed_categories:

        return jsonify({

            "message": "Invalid category",

            "allowed_categories":
                allowed_categories

        }), 400


    # ==================================================
    # CHECK RESUME
    # ==================================================

    resume = Resume.query.filter_by(

        id=resume_id,

        user_id=user_id

    ).first()


    if not resume:

        return jsonify({

            "message": "Resume not found"

        }), 404


    # ==================================================
    # CREATE NEW SESSION
    # ==================================================

    new_session = InterviewSession(

        title=title or f"{category} Interview",

        category=category,

        user_id=user_id,

        resume_id=resume_id

    )


    db.session.add(new_session)

    db.session.commit()


    # ==================================================
    # RESPONSE
    # ==================================================

    return jsonify({

        "message":
            "Interview session started successfully",

        "session_id":
            new_session.id,

        "category":
            new_session.category

    }), 201