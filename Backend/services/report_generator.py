from fpdf import FPDF
import os
from datetime import datetime


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



def create_report(data):


    pdf = InterviewReportPDF()


    pdf.add_page()



    pdf.set_font(
        "Arial",
        size=12
    )


    # Summary

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



    # Strengths

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



    # Improvements

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



    # Recommendation

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
    )



    pdf.ln(10)



    # Question Evaluations

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