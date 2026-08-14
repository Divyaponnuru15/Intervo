from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


from .user import User
from .resume import Resume
from .question import InterviewQuestion
from .answer import InterviewAnswer