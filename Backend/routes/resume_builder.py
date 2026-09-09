import json

from flask import (
    Blueprint,
    jsonify,
    request,
    send_file
)

from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable
)

from models.resume import Resume
from models.job_analysis import JobAnalysis

from services.resume_builder_ai import (
    generate_tailored_resume
)


# ============================================================
# BLUEPRINT
# ============================================================

resume_builder = Blueprint(
    "resume_builder",
    __name__
)


# ============================================================
# GENERATE TAILORED RESUME
# ============================================================

@resume_builder.route(
    "",
    methods=["POST"]
)
@jwt_required()
def create_resume():

    user_id = get_jwt_identity()

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

    analysis_id = data.get(
        "analysis_id"
    )

    job_description = data.get(
        "job_description"
    )

    # ========================================================
    # VALIDATE IDS
    # ========================================================

    try:

        resume_id = int(
            resume_id
        )

        analysis_id = int(
            analysis_id
        )

    except (
        TypeError,
        ValueError
    ):

        return jsonify({
            "message":
                "Invalid resume_id or analysis_id."
        }), 400

    # ========================================================
    # VALIDATE JD
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

    job_description = job_description.strip()

    if len(job_description) > 20000:

        return jsonify({
            "message":
                "Job description is too long."
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
    # FIND USER JOB ANALYSIS
    # ========================================================

    analysis = JobAnalysis.query.filter_by(

        id=analysis_id,

        user_id=user_id,

        resume_id=resume_id

    ).first()

    if not analysis:

        return jsonify({
            "message":
                "Job analysis not found."
        }), 404

    # ========================================================
    # RESUME TEXT
    # ========================================================

    resume_text = str(
        resume.extracted_text or ""
    ).strip()

    if not resume_text:

        return jsonify({
            "message":
                "Resume text is not available."
        }), 400

    # ========================================================
    # USE SAVED JD ANALYSIS
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

    job_analysis_data = {

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
            )
    }

    # ========================================================
    # GENERATE RESUME
    # ========================================================

    try:

        generated_resume = generate_tailored_resume(

            resume_text=resume_text,

            job_description=job_description,

            job_analysis=job_analysis_data
        )

    except ValueError as error:

        return jsonify({
            "message":
                str(error)
        }), 400

    except RuntimeError as error:

        print(
            "Resume Builder AI Error:",
            error
        )

        return jsonify({
            "message":
                str(error)
        }), 503

    except Exception as error:

        print(
            "Resume Builder Error:",
            error
        )

        return jsonify({
            "message":
                "Unable to generate resume. "
                "Please try again later."
        }), 500

    # ========================================================
    # SUCCESS
    # ========================================================

    return jsonify({

        "message":
            "Tailored resume generated successfully.",

        "resume_id":
            resume_id,

        "analysis_id":
            analysis_id,

        "resume":
            generated_resume,

        "generated_resume":
            generated_resume

    }), 200


# ============================================================
# GENERATE PDF
# ============================================================

@resume_builder.route(
    "/pdf",
    methods=["POST"]
)
@jwt_required()
def generate_resume_pdf():

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify({
            "message":
                "Resume data is required."
        }), 400

    resume_data = data.get(
        "resume"
    )

    if not isinstance(
        resume_data,
        dict
    ):

        return jsonify({
            "message":
                "Invalid resume data."
        }), 400

    # ========================================================
    # PDF BUFFER
    # ========================================================

    buffer = BytesIO()

    document = SimpleDocTemplate(

        buffer,

        pagesize=A4,

        rightMargin=45,
        leftMargin=45,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    name_style = styles["Title"]
    name_style.alignment = TA_CENTER
    name_style.fontSize = 20
    name_style.leading = 24

    contact_style = styles["Normal"]
    contact_style.alignment = TA_CENTER
    contact_style.fontSize = 9

    heading_style = styles["Heading2"]
    heading_style.fontSize = 12
    heading_style.leading = 15
    heading_style.spaceBefore = 10
    heading_style.spaceAfter = 5

    body_style = styles["BodyText"]
    body_style.fontSize = 9.5
    body_style.leading = 13

    story = []

    # ========================================================
    # CONTACT
    # ========================================================

    contact = resume_data.get(
        "contact",
        {}
    )

    name = str(
        contact.get("name", "")
        or ""
    ).strip()

    if name:

        story.append(
            Paragraph(
                escape_pdf(name),
                name_style
            )
        )

    contact_items = []

    for field in [
        "email",
        "phone",
        "linkedin",
        "github",
        "portfolio"
    ]:

        value = str(
            contact.get(field, "")
            or ""
        ).strip()

        if value:

            contact_items.append(
                value
            )

    if contact_items:

        story.append(
            Paragraph(
                escape_pdf(
                    " | ".join(
                        contact_items
                    )
                ),
                contact_style
            )
        )

    story.append(
        Spacer(
            1,
            10
        )
    )

    story.append(
        HRFlowable(
            width="100%",
            thickness=1
        )
    )

    # ========================================================
    # SUMMARY
    # ========================================================

    add_heading_and_text(

        story,

        "SUMMARY",

        resume_data.get(
            "summary",
            ""
        ),

        heading_style,

        body_style
    )

    # ========================================================
    # SKILLS
    # ========================================================

    skills = resume_data.get(
        "skills",
        []
    )

    if skills:

        story.append(
            Paragraph(
                "SKILLS",
                heading_style
            )
        )

        skill_text = ", ".join(
            str(skill)
            for skill in skills
        )

        story.append(
            Paragraph(
                escape_pdf(
                    skill_text
                ),
                body_style
            )
        )

    # ========================================================
    # EXPERIENCE
    # ========================================================

    experience = resume_data.get(
        "experience",
        []
    )

    if experience:

        story.append(
            Paragraph(
                "EXPERIENCE",
                heading_style
            )
        )

        for item in experience:

            job_title = str(
                item.get(
                    "job_title",
                    ""
                )
                or ""
            )

            company = str(
                item.get(
                    "company",
                    ""
                )
                or ""
            )

            dates = str(
                item.get(
                    "dates",
                    ""
                )
                or ""
            )

            header = " — ".join(
                value
                for value in [
                    job_title,
                    company
                ]
                if value.strip()
            )

            if dates:

                header += (
                    f" | {dates}"
                )

            if header:

                story.append(
                    Paragraph(
                        escape_pdf(
                            header
                        ),
                        body_style
                    )
                )

            for bullet in item.get(
                "bullets",
                []
            ):

                story.append(
                    Paragraph(
                        "• "
                        + escape_pdf(
                            str(bullet)
                        ),
                        body_style
                    )
                )

                story.append(
                    Spacer(
                        1,
                        2
                    )
                )

    # ========================================================
    # PROJECTS
    # ========================================================

    projects = resume_data.get(
        "projects",
        []
    )

    if projects:

        story.append(
            Paragraph(
                "PROJECTS",
                heading_style
            )
        )

        for project in projects:

            project_name = str(
                project.get(
                    "name",
                    ""
                )
                or ""
            )

            technologies = project.get(
                "technologies",
                []
            )

            description = str(
                project.get(
                    "description",
                    ""
                )
                or ""
            )

            if project_name:

                story.append(
                    Paragraph(
                        escape_pdf(
                            project_name
                        ),
                        body_style
                    )
                )

            if technologies:

                tech_text = (
                    "Technologies: "
                    +
                    ", ".join(
                        str(tech)
                        for tech in technologies
                    )
                )

                story.append(
                    Paragraph(
                        escape_pdf(
                            tech_text
                        ),
                        body_style
                    )
                )

            if description:

                story.append(
                    Paragraph(
                        escape_pdf(
                            description
                        ),
                        body_style
                    )
                )

            for bullet in project.get(
                "bullets",
                []
            ):

                story.append(
                    Paragraph(
                        "• "
                        + escape_pdf(
                            str(bullet)
                        ),
                        body_style
                    )
                )

            story.append(
                Spacer(
                    1,
                    5
                )
            )

    # ========================================================
    # EDUCATION
    # ========================================================

    education = resume_data.get(
        "education",
        []
    )

    if education:

        story.append(
            Paragraph(
                "EDUCATION",
                heading_style
            )
        )

        for item in education:

            degree = str(
                item.get(
                    "degree",
                    ""
                )
                or ""
            )

            institution = str(
                item.get(
                    "institution",
                    ""
                )
                or ""
            )

            dates = str(
                item.get(
                    "dates",
                    ""
                )
                or ""
            )

            line = " — ".join(
                value
                for value in [
                    degree,
                    institution
                ]
                if value.strip()
            )

            if dates:

                line += (
                    f" | {dates}"
                )

            if line:

                story.append(
                    Paragraph(
                        escape_pdf(
                            line
                        ),
                        body_style
                    )
                )

            for detail in item.get(
                "details",
                []
            ):

                story.append(
                    Paragraph(
                        "• "
                        + escape_pdf(
                            str(detail)
                        ),
                        body_style
                    )
                )

    # ========================================================
    # CERTIFICATIONS
    # ========================================================

    certifications = resume_data.get(
        "certifications",
        []
    )

    if certifications:

        story.append(
            Paragraph(
                "CERTIFICATIONS",
                heading_style
            )
        )

        for item in certifications:

            name = str(
                item.get(
                    "name",
                    ""
                )
                or ""
            )

            issuer = str(
                item.get(
                    "issuer",
                    ""
                )
                or ""
            )

            date = str(
                item.get(
                    "date",
                    ""
                )
                or ""
            )

            line = " — ".join(
                value
                for value in [
                    name,
                    issuer
                ]
                if value.strip()
            )

            if date:

                line += (
                    f" | {date}"
                )

            if line:

                story.append(
                    Paragraph(
                        escape_pdf(
                            line
                        ),
                        body_style
                    )
                )

    # ========================================================
    # ACHIEVEMENTS
    # ========================================================

    achievements = resume_data.get(
        "achievements",
        []
    )

    if achievements:

        story.append(
            Paragraph(
                "ACHIEVEMENTS",
                heading_style
            )
        )

        for item in achievements:

            title = str(
                item.get(
                    "title",
                    ""
                )
                or ""
            )

            description = str(
                item.get(
                    "description",
                    ""
                )
                or ""
            )

            line = " — ".join(
                value
                for value in [
                    title,
                    description
                ]
                if value.strip()
            )

            if line:

                story.append(
                    Paragraph(
                        "• "
                        + escape_pdf(
                            line
                        ),
                        body_style
                    )
                )

    # ========================================================
    # BUILD PDF
    # ========================================================

    try:

        document.build(
            story
        )

    except Exception as error:

        print(
            "PDF generation error:",
            error
        )

        return jsonify({
            "message":
                "Failed to generate PDF."
        }), 500

    buffer.seek(0)

    return send_file(

        buffer,

        mimetype="application/pdf",

        as_attachment=True,

        download_name=
            "Intervo_Tailored_Resume.pdf"
    )


# ============================================================
# PDF HELPERS
# ============================================================

def escape_pdf(value):

    value = str(
        value or ""
    )

    return (
        value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def add_heading_and_text(
    story,
    heading,
    text,
    heading_style,
    body_style
):

    text = str(
        text or ""
    ).strip()

    if not text:
        return

    story.append(
        Paragraph(
            heading,
            heading_style
        )
    )

    story.append(
        Paragraph(
            escape_pdf(text),
            body_style
        )
    )