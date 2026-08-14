import fitz
from docx import Document


def extract_text_from_pdf(filepath):

    text = ""

    try:
        pdf = fitz.open(filepath)

        for page in pdf:
            text += page.get_text()

        pdf.close()

    except Exception as e:
        print("PDF extraction error:", e)

    return text



def extract_text_from_docx(filepath):

    text = ""

    try:
        doc = Document(filepath)

        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"

    except Exception as e:
        print("DOCX extraction error:", e)

    return text



def extract_resume_text(filepath):

    filepath = filepath.lower()

    if filepath.endswith(".pdf"):
        return extract_text_from_pdf(filepath)

    elif filepath.endswith(".docx"):
        return extract_text_from_docx(filepath)

    else:
        return ""