from services.ai_evaluator import evaluate_answer


question = "What are advantages of Flask?"

answer = """
Flask is a lightweight Python web framework.
It is easy to learn and used for building APIs.
"""


result = evaluate_answer(
    question,
    answer
)


print(result)