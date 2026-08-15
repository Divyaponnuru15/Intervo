from fpdf import FPDF
import os
from datetime import datetime


# =========================================================
# INTERVIEW REPORT PDF
# =========================================================

class InterviewReportPDF(FPDF):

    def header(self):

        self.set_font(
            "Arial",
            "B",
            16
        )

        self.cell(
            0,
            10,
            "AI Interview Performance Report",
            ln=True,
            align="C"
        )

        self.ln(10)


    def footer(self):

        self.set_y(-15)

        self.set_font(
            "Arial",
            size=8
        )

        self.cell(
            0,
            10,
            f"Generated on {datetime.now().strftime('%d-%m-%Y')}",
            align="C"
        )


# =========================================================
# CREATE INTERVIEW REPORT
# =========================================================

def create_report(data):

    pdf = InterviewReportPDF()

    pdf.add_page()

    pdf.set_font(
        "Arial",
        size=12
    )


    # =====================================================
    # SUMMARY
    # =====================================================

    pdf.cell(
        0,
        10,
        f"Interview Score: {data['average_score']}/10",
        ln=True
    )

    pdf.cell(
        0,
        10,
        f"Total Questions: {data['total_questions']}",
        ln=True
    )

    pdf.cell(
        0,
        10,
        f"Answered Questions: {data['answered_questions']}",
        ln=True
    )

    pdf.ln(10)


    # =====================================================
    # STRENGTHS
    # =====================================================

    pdf.set_font(
        "Arial",
        "B",
        12
    )

    pdf.cell(
        0,
        10,
        "Strengths",
        ln=True
    )

    pdf.set_font(
        "Arial",
        size=11
    )

    pdf.multi_cell(
        0,
        8,
        data["strengths"]
        or "No strengths recorded"
    )

    pdf.ln(5)


    # =====================================================
    # IMPROVEMENTS
    # =====================================================

    pdf.set_font(
        "Arial",
        "B",
        12
    )

    pdf.cell(
        0,
        10,
        "Areas To Improve",
        ln=True
    )

    pdf.set_font(
        "Arial",
        size=11
    )

    pdf.multi_cell(
        0,
        8,
        data["improvements"]
        or "No improvements recorded"
    )

    pdf.ln(5)


    # =====================================================
    # RECOMMENDATION
    # =====================================================

    pdf.set_font(
        "Arial",
        "B",
        12
    )

    pdf.cell(
        0,
        10,
        "AI Recommendation",
        ln=True
    )

    pdf.set_font(
        "Arial",
        size=11
    )

    pdf.multi_cell(
        0,
        8,
        data["recommendation"]
        or "No recommendation recorded"
    )

    pdf.ln(10)


    # =====================================================
    # QUESTION EVALUATIONS
    # =====================================================

    pdf.set_font(
        "Arial",
        "B",
        12
    )

    pdf.cell(
        0,
        10,
        "Answer Analysis",
        ln=True
    )


    for item in data["evaluations"]:

        pdf.set_font(
            "Arial",
            "B",
            11
        )

        pdf.multi_cell(
            0,
            8,
            f"""
Question:
{item['question']}

Score:
{item['score']}/10
"""
        )


        pdf.set_font(
            "Arial",
            size=11
        )

        pdf.multi_cell(
            0,
            8,
            f"""
Feedback:
{item['feedback']}

Strengths:
{item['strengths']}

Improvements:
{item['improvements']}

--------------------------------
"""
        )


    # =====================================================
    # SAVE PDF
    # =====================================================

    folder = "reports"

    os.makedirs(
        folder,
        exist_ok=True
    )


    filename = (
        f"interview_report_{data['report_id']}.pdf"
    )


    path = os.path.join(
        folder,
        filename
    )


    pdf.output(path)

    return path


# =========================================================
# ATS REPORT PDF CLASS
# =========================================================

class ATSReportPDF(FPDF):

    def header(self):

        self.set_font(
            "Arial",
            "B",
            16
        )

        self.cell(
            0,
            10,
            "AI ATS Resume Analysis Report",
            ln=True,
            align="C"
        )

        self.ln(8)


    def footer(self):

        self.set_y(-15)

        self.set_font(
            "Arial",
            size=8
        )

        self.cell(
            0,
            10,
            f"Generated on {datetime.now().strftime('%d-%m-%Y')}",
            align="C"
        )


# =========================================================
# ATS HELPER
# =========================================================

def clean_text(value):

    if value is None:
        return "Not available"

    if isinstance(value, list):

        if not value:
            return "Not available"

        return ", ".join(
            str(item)
            for item in value
        )

    return str(value)


# =========================================================
# CREATE ATS REPORT
# =========================================================

def create_ats_report(data):

    pdf = ATSReportPDF()

    pdf.add_page()


    # =====================================================
    # ATS SCORE
    # =====================================================

    pdf.set_font(
        "Arial",
        "B",
        14
    )

    pdf.cell(
        0,
        10,
        f"ATS Score: {data.get('score', 0)}/100",
        ln=True
    )

    pdf.ln(5)


    # =====================================================
    # SUMMARY
    # =====================================================

    pdf.set_font(
        "Arial",
        "B",
        12
    )

    pdf.cell(
        0,
        10,
        "Resume Summary",
        ln=True
    )

    pdf.set_font(
        "Arial",
        size=11
    )

    pdf.multi_cell(
        0,
        8,
        clean_text(
            data.get("summary")
        )
    )

    pdf.ln(5)


    # =====================================================
    # SKILLS
    # =====================================================

    pdf.set_font(
        "Arial",
        "B",
        12
    )

    pdf.cell(
        0,
        10,
        "Detected Skills",
        ln=True
    )

    pdf.set_font(
        "Arial",
        size=11
    )

    pdf.multi_cell(
        0,
        8,
        clean_text(
            data.get("skills")
        )
    )

    pdf.ln(5)


    # =====================================================
    # KEYWORDS
    # =====================================================

    pdf.set_font(
        "Arial",
        "B",
        12
    )

    pdf.cell(
        0,
        10,
        "Detected Keywords",
        ln=True
    )

    pdf.set_font(
        "Arial",
        size=11
    )

    pdf.multi_cell(
        0,
        8,
        clean_text(
            data.get("keywords")
        )
    )

    pdf.ln(5)


    # =====================================================
    # MISSING KEYWORDS
    # =====================================================

    pdf.set_font(
        "Arial",
        "B",
        12
    )

    pdf.cell(
        0,
        10,
        "Missing Keywords",
        ln=True
    )

    pdf.set_font(
        "Arial",
        size=11
    )

    pdf.multi_cell(
        0,
        8,
        clean_text(
            data.get("missing_keywords")
        )
    )

    pdf.ln(5)


    # =====================================================
    # STRENGTHS
    # =====================================================

    pdf.set_font(
        "Arial",
        "B",
        12
    )

    pdf.cell(
        0,
        10,
        "Resume Strengths",
        ln=True
    )

    pdf.set_font(
        "Arial",
        size=11
    )

    pdf.multi_cell(
        0,
        8,
        clean_text(
            data.get("strengths")
        )
    )

    pdf.ln(5)


    # =====================================================
    # WEAKNESSES
    # =====================================================

    pdf.set_font(
        "Arial",
        "B",
        12
    )

    pdf.cell(
        0,
        10,
        "Areas To Improve",
        ln=True
    )

    pdf.set_font(
        "Arial",
        size=11
    )

    pdf.multi_cell(
        0,
        8,
        clean_text(
            data.get("weaknesses")
        )
    )

    pdf.ln(5)


    # =====================================================
    # IMPROVEMENTS
    # =====================================================

    pdf.set_font(
        "Arial",
        "B",
        12
    )

    pdf.cell(
        0,
        10,
        "Recommended Improvements",
        ln=True
    )

    pdf.set_font(
        "Arial",
        size=11
    )

    pdf.multi_cell(
        0,
        8,
        clean_text(
            data.get("improvements")
        )
    )

    pdf.ln(5)


    # =====================================================
    # SECTION SCORES
    # =====================================================

    sections = data.get(
        "sections",
        {}
    )


    pdf.set_font(
        "Arial",
        "B",
        12
    )

    pdf.cell(
        0,
        10,
        "Resume Section Scores",
        ln=True
    )

    pdf.set_font(
        "Arial",
        size=11
    )


    section_names = [
        ("Contact", "contact"),
        ("Summary", "summary"),
        ("Education", "education"),
        ("Skills", "skills"),
        ("Experience", "experience"),
        ("Projects", "projects")
    ]


    for label, key in section_names:

        score = sections.get(
            key,
            "--"
        )

        pdf.cell(
            0,
            8,
            f"{label}: {score}%",
            ln=True
        )


    # =====================================================
    # SAVE PDF
    # =====================================================

    folder = "reports"

    os.makedirs(
        folder,
        exist_ok=True
    )


    filename = (
        f"ats_report_{data['resume_id']}.pdf"
    )


    path = os.path.join(
        folder,
        filename
    )


    pdf.output(path)

    return path

