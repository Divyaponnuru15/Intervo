from flask import Flask
from flask_cors import CORS
from sqlalchemy import text
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from routes.auth import auth
from routes.resume import resume


from config import Config
from models import db
from models.user import User
from models.resume import Resume
from models.question import InterviewQuestion
from routes.interview import interview
from routes.answer import answer
from models.evaluation import AnswerEvaluation
from models.session import InterviewSession
from routes.report import report
from routes.session import session
from models.report import InterviewReport
from routes.pdf_report import pdf_report



app = Flask(__name__)

# Load configuration
app.config.from_object(Config)

# Initialize JWT
jwt = JWTManager(app)

# Enable CORS
CORS(app)

# Initialize SQLAlchemy
db.init_app(app)


# Initialize Flask-Migrate
migrate = Migrate(app, db)

# Register routes
app.register_blueprint(auth)
app.register_blueprint(resume)
app.register_blueprint(interview)
app.register_blueprint(answer, url_prefix="/api/answer")
app.register_blueprint(report, url_prefix="/api/report")
app.register_blueprint(session,url_prefix="/api/session")
app.register_blueprint(pdf_report,url_prefix="/api/pdf")

@app.route("/")
def home():
    return {
        "message": "Welcome to AI Interview Preparation Platform 🚀",
        "status": "Running Successfully"
    }


@app.route("/test-db")
def test_db():
    try:
        db.session.execute(text("SELECT 1"))

        return {
            "database": "Connected Successfully ✅"
        }

    except Exception as e:
        return {
            "database": "Connection Failed ❌",
            "error": str(e)
        }


if __name__ == "__main__":
    app.run(debug=True)