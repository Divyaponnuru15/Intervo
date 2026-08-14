from datetime import timedelta
import os
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables from .env
load_dotenv()    #Loads all values from your .env file into the application.

class Config:
    SECRET_KEY = os.getenv("Divya@vjh@15")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") 
        # JWT token validity
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)