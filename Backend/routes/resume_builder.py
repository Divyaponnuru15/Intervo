python
import json
import re

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
    # LOAD SAVED JD ANALYSIS
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

    try:

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

        # ====================================================
        # PDF BUFFER
        # ====================================================

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

        # ====================================================
        # STYLES
        # ====================================================

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

        # ====================================================
        # CONTACT
        # ====================================================

        contact = resume_data.get(
            "contact",
            {}
        )

        if not isinstance(
            contact,
            dict
        ):

            contact = {}

        name = safe_pdf_text(
            contact.get(
                "name",
                ""
            )
        )

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

            value = safe_pdf_text(
                contact.get(
                    field,
                    ""
                )
            )

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

        # ====================================================
        # SUMMARY
        # ====================================================

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

        # ====================================================
        # SKILLS
        # ====================================================

        skills = resume_data.get(
            "skills",
            []
        )

        if isinstance(
            skills,
            list
        ) and skills:

            story.append(
                Paragraph(
                    "SKILLS",
                    heading_style
                )
            )

            skill_text = ", ".join(
                safe_pdf_text(skill)
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

        # ====================================================
        # EXPERIENCE
        # ====================================================

        experience = resume_data.get(
            "experience",
            []
        )

        if isinstance(
            experience,
            list
        ) and experience:

            story.append(
                Paragraph(
                    "EXPERIENCE",
                    heading_style
                )
            )

            for item in experience:

                if not isinstance(
                    item,
                    dict
                ):

                    continue

                job_title = safe_pdf_text(
                    item.get(
                        "job_title",
                        ""
                    )
                )

                company = safe_pdf_text(
                    item.get(
                        "company",
                        ""
                    )
                )

                dates = safe_pdf_text(
                    item.get(
                        "dates",
                        ""
                    )
                )

                header_parts = [
                    value
                    for value in [
                        job_title,
                        company
                    ]
                    if value
                ]

                header = " - ".join(
                    header_parts
                )

                if dates:

                    if header:

                        header += (
                            f" | {dates}"
                        )

                    else:

                        header = dates

                if header:

                    story.append(
                        Paragraph(
                            escape_pdf(
                                header
                            ),
                            body_style
                        )
                    )

                bullets = item.get(
                    "bullets",
                    []
                )

                if not isinstance(
                    bullets,
                    list
                ):

                    bullets = []

                for bullet in bullets:

                    bullet_text = safe_pdf_text(
                        bullet
                    )

                    if not bullet_text:

                        continue

                    story.append(
                        Paragraph(
                            "- "
                            + escape_pdf(
                                bullet_text
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

        # ====================================================
        # PROJECTS
        # ====================================================

        projects = resume_data.get(
            "projects",
            []
        )

        if isinstance(
            projects,
            list
        ) and projects:

            story.append(
                Paragraph(
                    "PROJECTS",
                    heading_style
                )
            )

            for project in projects:

                if not isinstance(
                    project,
                    dict
                ):

                    continue

                project_name = safe_pdf_text(
                    project.get(
                        "name",
                        ""
                    )
                )

                technologies = project.get(
                    "technologies",
                    []
                )

                description = safe_pdf_text(
                    project.get(
                        "description",
                        ""
                    )
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

                if isinstance(
                    technologies,
                    list
                ) and technologies:

                    tech_text = (
                        "Technologies: "
                        +
                        ", ".join(
                            safe_pdf_text(tech)
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

                bullets = project.get(
                    "bullets",
                    []
                )

                if not isinstance(
                    bullets,
                    list
                ):

                    bullets = []

                for bullet in bullets:

                    bullet_text = safe_pdf_text(
                        bullet
                    )

                    if not bullet_text:

                        continue

                    story.append(
                        Paragraph(
                            "- "
                            + escape_pdf(
                                bullet_text
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

        # ====================================================
        # EDUCATION
        # ====================================================

        education = resume_data.get(
            "education",
            []
        )

        if isinstance(
            education,
            list
        ) and education:

            story.append(
                Paragraph(
                    "EDUCATION",
                    heading_style
                )
            )

            for item in education:

                if not isinstance(
                    item,
                    dict
                ):

                    continue

                degree = safe_pdf_text(
                    item.get(
                        "degree",
                        ""
                    )
                )

                institution = safe_pdf_text(
                    item.get(
                        "institution",
                        ""
                    )
                )

                dates = safe_pdf_text(
                    item.get(
                        "dates",
                        ""
                    )
                )

                line_parts = [
                    value
                    for value in [
                        degree,
                        institution
                    ]
                    if value
                ]

                line = " - ".join(
                    line_parts
                )

                if dates:

                    if line:

                        line += (
                            f" | {dates}"
                        )

                    else:

                        line = dates

                if line:

                    story.append(
                        Paragraph(
                            escape_pdf(
                                line
                            ),
                            body_style
                        )
                    )

                details = item.get(
                    "details",
                    []
                )

                if not isinstance(
                    details,
                    list
                ):

                    details = []

                for detail in details:

                    detail_text = safe_pdf_text(
                        detail
                    )

                    if not detail_text:

                        continue

                    story.append(
                        Paragraph(
                            "- "
                            + escape_pdf(
                                detail_text
                            ),
                            body_style
                        )
                    )

        # ====================================================
        # CERTIFICATIONS
        # ====================================================

        certifications = resume_data.get(
            "certifications",
            []
        )

        if isinstance(
            certifications,
            list
        ) and certifications:

            story.append(
                Paragraph(
                    "CERTIFICATIONS",
                    heading_style
                )
            )

            for item in certifications:

                if not isinstance(
                    item,
                    dict
                ):

                    continue

                certification_name = safe_pdf_text(
                    item.get(
                        "name",
                        ""
                    )
                )

                issuer = safe_pdf_text(
                    item.get(
                        "issuer",
                        ""
                    )
                )

                date = safe_pdf_text(
                    item.get(
                        "date",
                        ""
                    )
                )

                line_parts = [
                    value
                    for value in [
                        certification_name,
                        issuer
                    ]
                    if value
                ]

                line = " - ".join(
                    line_parts
                )

                if date:

                    if line:

                        line += (
                            f" | {date}"
                        )

                    else:

                        line = date

                if line:

                    story.append(
                        Paragraph(
                            escape_pdf(
                                line
                            ),
                            body_style
                        )
                    )

        # ====================================================
        # ACHIEVEMENTS
        # ====================================================

        achievements = resume_data.get(
            "achievements",
            []
        )

        if isinstance(
            achievements,
            list
        ) and achievements:

            story.append(
                Paragraph(
                    "ACHIEVEMENTS",
                    heading_style
                )
            )

            for item in achievements:

                if not isinstance(
                    item,
                    dict
                ):

                    continue

                title = safe_pdf_text(
                    item.get(
                        "title",
                        ""
                    )
                )

                description = safe_pdf_text(
                    item.get(
                        "description",
                        ""
                    )
                )

                line_parts = [
                    value
                    for value in [
                        title,
                        description
                    ]
                    if value
                ]

                line = " - ".join(
                    line_parts
                )

                if line:

                    story.append(
                        Paragraph(
                            "- "
                            + escape_pdf(
                                line
                            ),
                            body_style
                        )
                    )

        # ====================================================
        # BUILD PDF
        # ====================================================

        document.build(
            story
        )

        buffer.seek(0)

        return send_file(

            buffer,

            mimetype="application/pdf",

            as_attachment=True,

            download_name=
                "Intervo_Tailored_Resume.pdf"
        )

    except Exception as error:

        print(
            "Resume PDF Error:",
            repr(error)
        )

        return jsonify({
            "message":
                "Failed to generate PDF.",
            "error":
                str(error)
        }), 500


# ============================================================
# PDF HELPERS
# ============================================================

def safe_pdf_text(value):

    if value is None:

        return ""

    value = str(
        value
    )

    # Replace common Unicode punctuation
    # that can cause problems with ReportLab
    # default fonts.

    replacements = {

        "\u2018": "'",   # left single quote
        "\u2019": "'",   # right single quote
        "\u201c": '"',   # left double quote
        "\u201d": '"',   # right double quote
        "\u2013": "-",   # en dash
        "\u2014": "-",   # em dash
        "\u2212": "-",   # minus sign
        "\u2022": "-",   # bullet
        "\u00a0": " ",   # non-breaking space
        "\u2026": "...", # ellipsis
        "\u00ae": "(R)",
        "\u2122": "(TM)"
    }

    for old, new in replacements.items():

        value = value.replace(
            old,
            new
        )

    # Remove remaining control characters.

    value = re.sub(
        r"[\x00-\x08\x0B\x0C\x0E-\x1F]",
        "",
        value
    )

    return value.strip()


def escape_pdf(value):

    value = safe_pdf_text(
        value
    )

    return (
        value
        .replace(
            "&",
            "&amp;"
        )
        .replace(
            "<",
            "&lt;"
        )
        .replace(
            ">",
            "&gt;"
        )
    )


def add_heading_and_text(
    story,
    heading,
    text,
    heading_style,
    body_style
):

    text = safe_pdf_text(
        text
    )

    if not text:

        return

    story.append(
        Paragraph(
            escape_pdf(
                heading
            ),
            heading_style
        )
    )

    story.append(
        Paragraph(
            escape_pdf(
                text
            ),
            body_style
        )
    )

