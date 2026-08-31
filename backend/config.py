import os
from urllib.parse import quote_plus
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "velora-dev-secret-change-me-32b!!")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "velora-jwt-secret-change-me-32b!!")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    JWT_TOKEN_LOCATION = ["headers"]

    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DB = os.getenv("MYSQL_DB", "velora_shop")
    USE_SQLITE = os.getenv("USE_SQLITE", "0").lower() in {"1", "true", "yes"}

    if os.getenv("DATABASE_URL"):
        SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    elif USE_SQLITE:
        SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(BASE_DIR, "velora.db")
    else:
        SQLALCHEMY_DATABASE_URI = (
            "mysql+pymysql://{user}:{password}@{host}:{port}/{db}?charset=utf8mb4".format(
                user=quote_plus(MYSQL_USER),
                password=quote_plus(MYSQL_PASSWORD),
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                db=MYSQL_DB,
            )
        )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }

    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
