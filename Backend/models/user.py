from . import db
from datetime import datetime


class User(db.Model):

    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )
     # One user can upload many resumes
    resumes = db.relationship(
        "Resume",
        backref="user",
        lazy=True
    )
    # One user can have many interview questions
    questions = db.relationship(
    "InterviewQuestion",
    backref="user",
    lazy=True
    )
    # One user can submit many answers
    answers = db.relationship(
    "InterviewAnswer",
    backref="user",
    lazy=True
    )

    sessions = db.relationship(
    "InterviewSession",
    backref="user",
    lazy=True
    )

    def __repr__(self):
        return f"<User {self.email}>"

    