from services.ai_question_generator import generate_questions

sample_resume = """
Name: Divya

Skills:
Python
Flask
SQL
HTML
CSS
JavaScript

Projects:
AI Interview Preparation Platform
CGPA Calculator
To-Do List

Education:
Bachelor of Computer Applications
"""

questions = generate_questions(sample_resume)

print(questions)