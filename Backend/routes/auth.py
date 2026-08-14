from flask import Blueprint, request, jsonify
from models import db
from models.user import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from flask_jwt_extended import (
    create_access_token,
    jwt_required
)

auth = Blueprint("auth", __name__)


@auth.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    # Check existing user
    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "message": "User already exists"
        }), 409


    # Hash password
    hashed_password = generate_password_hash(password)


    new_user = User(
        name=name,
        email=email,
        password=hashed_password
    )


    db.session.add(new_user)
    db.session.commit()


    return jsonify({
        "message": "User registered successfully"
    }), 201

@auth.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    # Find user by email
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    # Check password
    if not check_password_hash(user.password, password):
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    # Generate JWT token
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }), 200

@auth.route("/profile", methods=["GET"])
@jwt_required()
def profile():

    return jsonify({
        "message": "Welcome! You are logged in."
    }), 200