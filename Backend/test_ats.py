print("==========================================")
print("        STARTING ATS TEST")
print("==========================================")


# =====================================================
# IMPORT ATS ANALYZER
# =====================================================

try:

    from services.ats_analyzer import analyze_resume

    print(
        "ATS analyzer imported successfully."
    )

except Exception as e:

    print(
        "FAILED TO IMPORT ATS ANALYZER:"
    )

    print(
        str(e)
    )

    raise


# =====================================================
# TEST RESUME
# =====================================================

resume_text = """

Divya Ponnuru

BCA Graduate

Skills:

Python,
Flask,
Django,
SQL,
MySQL,
PostgreSQL,
HTML,
CSS,
JavaScript,
Git,
GitHub,
NumPy,
Pandas


Projects:

AI Interview Preparation Platform

AI Multi-Crop Rotation Planner

Luxe Apparel E-commerce Website

CGPA Calculator

To-Do List Application


Education:

Bachelor of Computer Applications


Experience:

Developed web applications using Python and Flask.

Built REST APIs and integrated PostgreSQL databases.

Worked with Git and GitHub for version control.

"""


print(
    "\nTest resume loaded successfully."
)


# =====================================================
# CALL AI ATS ANALYZER
# =====================================================

print(
    "\nSending resume to Gemini AI..."
)


try:

    result = analyze_resume(
        resume_text
    )


except Exception as e:

    print("\n")
    print(
        "=========================================="
    )

    print(
        "           ATS TEST FAILED"
    )

    print(
        "=========================================="
    )

    print(
        "ERROR:"
    )

    print(
        str(e)
    )

    print(
        "=========================================="
    )

    raise


# =====================================================
# DISPLAY RESULT
# =====================================================

print("\n")
print(
    "=========================================="
)

print(
    "        AI ATS ANALYSIS RESULT"
)

print(
    "=========================================="
)


# =====================================================
# ATS SCORE
# =====================================================

print(
    "\nATS SCORE:"
)

print(
    result["score"],
    "/ 100"
)


# =====================================================
# SUMMARY
# =====================================================

print(
    "\nSUMMARY:"
)

print(
    result["summary"]
)


# =====================================================
# SKILLS
# =====================================================

print(
    "\nSKILLS:"
)

for skill in result["skills"]:

    print(
        "-",
        skill
    )


# =====================================================
# KEYWORDS
# =====================================================

print(
    "\nKEYWORDS:"
)

for keyword in result["keywords"]:

    print(
        "-",
        keyword
    )


# =====================================================
# MISSING KEYWORDS
# =====================================================

print(
    "\nMISSING KEYWORDS:"
)

for keyword in result["missing_keywords"]:

    print(
        "-",
        keyword
    )


# =====================================================
# STRENGTHS
# =====================================================

print(
    "\nSTRENGTHS:"
)

for strength in result["strengths"]:

    print(
        "-",
        strength
    )


# =====================================================
# WEAKNESSES
# =====================================================

print(
    "\nWEAKNESSES:"
)

for weakness in result["weaknesses"]:

    print(
        "-",
        weakness
    )


# =====================================================
# IMPROVEMENTS
# =====================================================

print(
    "\nIMPROVEMENTS:"
)

for improvement in result["improvements"]:

    print(
        "-",
        improvement
    )


# =====================================================
# SECTION SCORES
# =====================================================

print(
    "\nSECTION SCORES:"
)

for section, score in result["sections"].items():

    print(
        f"- {section}: {score}/100"
    )


# =====================================================
# COMPLETE
# =====================================================

print("\n")

print(
    "=========================================="
)

print(
    "        ATS TEST COMPLETED"
)

print(
    "=========================================="
)

