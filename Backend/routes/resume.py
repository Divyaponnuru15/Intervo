import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from models import db
from models.resume import Resume
from services.resume_parser import extract_resume_text


resume = Blueprint("resume", __name__)


UPLOAD_FOLDER = "uploads/resumes"

ALLOWED_EXTENSIONS = {"pdf", "docx"}


# Create upload folder if not exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


@resume.route("/upload-resume", methods=["POST"])
@jwt_required()
def upload_resume():

    user_id = get_jwt_identity()


    # Check file exists
    if "file" not in request.files:
        return jsonify({
            "message": "No file uploaded"
        }), 400


    file = request.files["file"]


    # Check filename
    if file.filename == "":
        return jsonify({
            "message": "No selected file"
        }), 400


    # Check extension
    if not allowed_file(file.filename):
        return jsonify({
            "message": "Only PDF and DOCX files are allowed"
        }), 400


    # Secure filename
    filename = secure_filename(file.filename)


    filepath = os.path.join(
        UPLOAD_FOLDER,
        filename
    )


    # Save resume file
    file.save(filepath)


    # Extract resume text
    extracted_text = extract_resume_text(filepath)


    # Save resume details in database
    new_resume = Resume(
        filename=filename,
        file_path=filepath,
        extracted_text=extracted_text,
        user_id=user_id
    )


    db.session.add(new_resume)
    db.session.commit()


    return jsonify({
        "message": "Resume uploaded successfully",
        "resume_id": new_resume.id
    }), 201