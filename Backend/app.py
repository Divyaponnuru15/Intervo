from flask import Flask
from flask_cors import CORS
from sqlalchemy import text
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

from config import Config

from models import db
from models.user import User
from models.resume import Resume
from models.question import InterviewQuestion
from models.evaluation import AnswerEvaluation
from models.session import InterviewSession
from models.report import InterviewReport

from routes.auth import auth
from routes.resume import resume
from routes.interview import interview
from routes.answer import answer
from routes.report import report
from routes.session import session
from routes.pdf_report import pdf_report
from routes.job_analysis import job_analysis


# ============================================================
# CREATE FLASK APPLICATION
# ============================================================

app = Flask(__name__)


# ============================================================
# LOAD CONFIGURATION
# ============================================================

app.config.from_object(Config)


# ============================================================
# INITIALIZE JWT
# ============================================================

jwt = JWTManager(app)



# ============================================================
# CORS CONFIGURATION
# ============================================================

CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://127.0.0.1:5500",
                "http://localhost:5500",
                "https://intervo-ma97.onrender.com"
            ],
            "methods": [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
            ],
            "allow_headers": [
                "Content-Type",
                "Authorization"
            ],
            "supports_credentials": True
        }
    }
)


# ============================================================
# EXPLICIT OPTIONS HANDLER
# ============================================================

@app.route(
    "/<path:path>",
    methods=["OPTIONS"]
)
def handle_options(path):

    return "", 200



# ============================================================
# INITIALIZE SQLALCHEMY
# ============================================================

db.init_app(app)


# ============================================================
# INITIALIZE FLASK-MIGRATE
# ============================================================

migrate = Migrate(
    app,
    db
)


# ============================================================
# REGISTER BLUEPRINTS
# ============================================================

app.register_blueprint(auth)

app.register_blueprint(resume)

app.register_blueprint(
    interview,
    url_prefix="/api/interview"
)

app.register_blueprint(
    answer,
    url_prefix="/api/answer"
)

app.register_blueprint(
    report,
    url_prefix="/api/report"
)

app.register_blueprint(
    session,
    url_prefix="/api/session"
)

app.register_blueprint(
    pdf_report,
    url_prefix="/api/pdf"
)

app.register_blueprint(
    job_analysis,
    url_prefix="/api/job-analysis"
)

# ============================================================
# HOME ROUTE
# ============================================================

@app.route("/")
def home():

    return {
        "message":
            "Welcome to AI Interview Preparation Platform 🚀",

        "status":
            "Running Successfully"
    }


# ============================================================
# DATABASE TEST ROUTE
# ============================================================

@app.route("/test-db")
def test_db():

    try:

        db.session.execute(
            text("SELECT 1")
        )

        return {
            "database":
                "Connected Successfully ✅"
        }

    except Exception as error:

        return {

            "database":
                "Connection Failed ❌",

            "error":
                str(error)
        }


# ============================================================
# START FLASK SERVER
# ============================================================

if __name__ == "__main__":

    import os

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )

