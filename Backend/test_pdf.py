from services.report_generator import create_report


data = {
    "average_score": 8,
    "evaluations": [
        {
            "score":8,
            "feedback":"Good Python and Flask knowledge."
        },
        {
            "score":7,
            "feedback":"Improve database explanation."
        }
    ]
}


path = create_report(data)


print(path)