import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak
)
from reportlab.lib import colors


# =========================================================
# CREATE ATS REPORT
# =========================================================

def create_ats_report(resume):

    # =====================================================
    # CREATE REPORT DIRECTORY
    # =====================================================

    report_folder = "uploads/reports"

    os.makedirs(
        report_folder,
        exist_ok=True
    )


    # =====================================================
    # PDF PATH
    # =====================================================

    pdf_path = os.path.join(

        report_folder,

        f"ATS_Report_{resume.id}.pdf"

    )


    # =====================================================
    # DOCUMENT
    # =====================================================

    document = SimpleDocTemplate(

        pdf_path,

        pagesize=A4,

        rightMargin=18 * mm,

        leftMargin=18 * mm,

        topMargin=18 * mm,

        bottomMargin=18 * mm

    )


    # =====================================================
    # STYLES
    # =====================================================

    styles = getSampleStyleSheet()


    title_style = ParagraphStyle(

        "ATS_Title",

        parent=styles["Title"],

        alignment=TA_CENTER,

        fontSize=22,

        spaceAfter=12

    )


    heading_style = ParagraphStyle(

        "ATS_Heading",

        parent=styles["Heading2"],

        fontSize=14,

        spaceBefore=12,

        spaceAfter=8

    )


    body_style = ParagraphStyle(

        "ATS_Body",

        parent=styles["BodyText"],

        fontSize=10,

        leading=15,

        spaceAfter=6

    )


    # =====================================================
    # STORY
    # =====================================================

    story = []


    # =====================================================
    # TITLE
    # =====================================================

    story.append(

        Paragraph(
            "Intervo ATS Resume Analysis",
            title_style
        )

    )


    story.append(

        Paragraph(
            f"<b>Resume:</b> {resume.filename}",
            body_style
        )

    )


    # =====================================================
    # ATS SCORE
    # =====================================================

    story.append(

        Paragraph(
            f"<b>ATS Score:</b> "
            f"{resume.ats_score or 0} / 100",
            body_style
        )

    )


    # =====================================================
    # ANALYSIS
    # =====================================================

    analysis = resume.ats_analysis or {}


    # =====================================================
    # SUMMARY
    # =====================================================

    story.append(

        Paragraph(
            "Resume Summary",
            heading_style
        )

    )


    story.append(

        Paragraph(
            str(
                analysis.get(
                    "summary",
                    "No summary available."
                )
            ),
            body_style
        )

    )


    # =====================================================
    # HELPER
    # =====================================================

    def add_list_section(
        title,
        key
    ):

        story.append(

            Paragraph(
                title,
                heading_style
            )

        )


        items = analysis.get(
            key,
            []
        )


        if not isinstance(
            items,
            list
        ) or not items:

            items = [
                "No information available."
            ]


        for item in items:

            story.append(

                Paragraph(
                    "• " + str(item),
                    body_style
                )

            )


    # =====================================================
    # SKILLS
    # =====================================================

    add_list_section(
        "Detected Skills",
        "skills"
    )


    # =====================================================
    # KEYWORDS
    # =====================================================

    add_list_section(
        "Detected Keywords",
        "keywords"
    )


    # =====================================================
    # MISSING KEYWORDS
    # =====================================================

    add_list_section(
        "Missing Keywords",
        "missing_keywords"
    )


    # =====================================================
    # STRENGTHS
    # =====================================================

    add_list_section(
        "Resume Strengths",
        "strengths"
    )


    # =====================================================
    # WEAKNESSES
    # =====================================================

    add_list_section(
        "Areas to Improve",
        "weaknesses"
    )


    # =====================================================
    # IMPROVEMENTS
    # =====================================================

    add_list_section(
        "Recommended Improvements",
        "improvements"
    )


    # =====================================================
    # SECTION SCORES
    # =====================================================

    story.append(

        Paragraph(
            "Resume Section Scores",
            heading_style
        )

    )


    sections = analysis.get(
        "sections",
        {}
    )


    if not isinstance(
        sections,
        dict
    ):

        sections = {}


    section_data = [

        ["Section", "Score"],

        [
            "Contact",
            f"{sections.get('contact', '--')}%"
        ],

        [
            "Summary",
            f"{sections.get('summary', '--')}%"
        ],

        [
            "Education",
            f"{sections.get('education', '--')}%"
        ],

        [
            "Skills",
            f"{sections.get('skills', '--')}%"
        ],

        [
            "Experience",
            f"{sections.get('experience', '--')}%"
        ],

        [
            "Projects",
            f"{sections.get('projects', '--')}%"
        ]

    ]


    table = Table(
        section_data,
        colWidths=[
            90 * mm,
            40 * mm
        ]
    )


    table.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.lightgrey
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),

            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),

            (
                "ALIGN",
                (1, 1),
                (1, -1),
                "CENTER"
            ),

            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                6
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                6
            )

        ])

    )


    story.append(
        table
    )


    # =====================================================
    # BUILD PDF
    # =====================================================

    document.build(
        story
    )


    return pdf_path