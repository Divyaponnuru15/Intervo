import os

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from models import db
from models.resume import Resume
from services.resume_parser import extract_resume_text
from services.ats_analyzer import analyze_resume


# 
# RESUME BLUEPRINT
# 

resume = Blueprint(
    "resume",
    __name__
)


# 
# CONFIGURATION
# 

UPLOAD_FOLDER = "uploads/resumes"

ALLOWED_EXTENSIONS = {
    "pdf",
    "docx"
}


# 
# CREATE UPLOAD FOLDER
# 

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


# 
# CHECK ALLOWED FILE
# 

def allowed_file(filename):

    return (
        "." in filename
        and filename.rsplit(
            ".",
            1
        )[1].lower()
        in ALLOWED_EXTENSIONS
    )


# 
# UPLOAD RESUME
# 
#
# This route ONLY:
#
# 1. Receives the resume
# 2. Saves the file
# 3. Extracts the text
# 4. Saves the resume in the database
#
# Gemini is NOT called here.
#
# 

@resume.route(
    "/upload-resume",
    methods=["POST"]
)
@jwt_required()
def upload_resume():

    # =
    # GET USER ID
    # =

    user_id = get_jwt_identity()


    # =
    # CHECK FILE EXISTS
    # =

    if "file" not in request.files:

        return jsonify({
            "message":
                "No file uploaded"
        }), 400


    file = request.files["file"]


    # =
    # CHECK FILENAME
    # =

    if file.filename == "":

        return jsonify({
            "message":
                "No selected file"
        }), 400


    # =
    # CHECK FILE TYPE
    # =

    if not allowed_file(
        file.filename
    ):

        return jsonify({
            "message":
                "Only PDF and DOCX files are allowed"
        }), 400


    # =
    # SECURE FILENAME
    # =

    filename = secure_filename(
        file.filename
    )


    # =
    # CREATE UNIQUE FILENAME
    # =
    #
    # Prevents users from overwriting files that have
    # the same original filename.
    #
    # =

    base_name, extension = os.path.splitext(
        filename
    )


    filename = (
        f"{user_id}_{base_name}{extension}"
    )


    filepath = os.path.join(
        UPLOAD_FOLDER,
        filename
    )


    # =
    # SAVE RESUME FILE
    # =

    try:

        file.save(
            filepath
        )

    except Exception as e:

        print()
        print(
            " FILE SAVE ERROR "
        )

        print(
            str(e)
        )

        print(
            "="
        )

        return jsonify({
            "message":
                "Failed to save resume file."
        }), 500


    # =
    # EXTRACT RESUME TEXT
    # =

    try:

        extracted_text = extract_resume_text(
            filepath
        )

    except Exception as e:

        print()
        print(
            " RESUME EXTRACTION ERROR "
        )

        print(
            str(e)
        )

        print(
            "="
        )

        return jsonify({
            "message":
                "Failed to extract text from resume."
        }), 500


    # =
    # VALIDATE EXTRACTED TEXT
    # =

    if (
        not extracted_text
        or
        not extracted_text.strip()
    ):

        return jsonify({
            "message":
                "Could not extract readable text from the resume."
        }), 400


    # =
    # SAVE RESUME TO DATABASE
    # =
    #
    # ATS analysis is intentionally NOT performed here.
    #
    # ats_score      -> NULL
    # ats_analysis   -> NULL
    #
    # Gemini will only run when the user clicks
    # "Analyze Resume".
    #
    # =

    try:

        new_resume = Resume(

            filename=filename,

            file_path=filepath,

            extracted_text=extracted_text,

            ats_score=None,

            ats_analysis=None,

            user_id=user_id

        )


        db.session.add(
            new_resume
        )

        db.session.commit()


    except Exception as e:

        db.session.rollback()


        print()
        print(
            " DATABASE ERROR "
        )

        print(
            str(e)
        )

        print(
            ""
        )

        return jsonify({
            "message":
                "Failed to save resume."
        }), 500


    # =
    # SUCCESS RESPONSE
    # =

    return jsonify({

        "message":
            "Resume uploaded successfully.",

        "resume_id":
            new_resume.id,

        "filename":
            new_resume.filename

    }), 201


# 
# ANALYZE RESUME
# 
#
# This route is called ONLY when the user clicks:
#
#              "Analyze Resume"
#
# 

@resume.route(
    "/analyze-resume/<int:resume_id>",
    methods=["POST"]
)
@jwt_required()
def analyze_uploaded_resume(resume_id):

    # =
    # GET USER ID
    # =

    user_id = get_jwt_identity()


    # =
    # FIND RESUME
    # =
    #
    # The user_id check is important.
    #
    # It prevents one user from analyzing another user's
    # resume by changing the resume ID.
    #
    # =

    resume_record = Resume.query.filter_by(

        id=resume_id,

        user_id=user_id

    ).first()


    # =
    # RESUME NOT FOUND
    # =

    if not resume_record:

        return jsonify({
            "message":
                "Resume not found."
        }), 404


    # =
    # CHECK EXTRACTED TEXT
    # =

    if (
        not resume_record.extracted_text
        or
        not resume_record.extracted_text.strip()
    ):

        return jsonify({
            "message":
                "Resume text is not available for analysis."
        }), 400


    # =
    # CHECK IF ALREADY ANALYZED
    # =
    #
    # If the resume was already analyzed, do not call
    # Gemini again.
    #
    # =

    if resume_record.ats_analysis is not None:

        return jsonify({

            "message":
                "Resume has already been analyzed.",

            "resume_id":
                resume_record.id,

            "ats_score":
                resume_record.ats_score,

            "ats_analysis":
                resume_record.ats_analysis

        }), 200


    # =
    # CALL GEMINI AI
    # =

    try:

        print()
        print(
            "==="
        )

        print(
            "        STARTING AI ATS ANALYSIS"
        )

        print(
            "==="
        )

        print(
            "Sending extracted resume text to Gemini..."
        )


        ats_analysis = analyze_resume(

            resume_record.extracted_text

        )


    except Exception as e:

        print()
        print(
            " ATS ANALYSIS ERROR "
        )

        print(
            str(e)
        )

        print(
            "="
        )

        return jsonify({

            "message":
                str(e)

        }), 503


    # =
    # GET ATS SCORE
    # =

    ats_score = ats_analysis.get(
        "score"
    )


    # =
    # SAVE ATS ANALYSIS
    # =

    try:

        resume_record.ats_score = ats_score

        resume_record.ats_analysis = ats_analysis


        db.session.commit()


    except Exception as e:

        db.session.rollback()


        print()
        print(
            " DATABASE ERROR "
        )

        print(
            str(e)
        )

        print(
            ""
        )

        return jsonify({

            "message":
                "Failed to save ATS analysis."

        }), 500


    # =
    # SUCCESS RESPONSE
    # =

    return jsonify({

        "message":
            "Resume analyzed successfully.",

        "resume_id":
            resume_record.id,

        "ats_score":
            ats_score,

        "ats_analysis":
            ats_analysis

    }), 200

