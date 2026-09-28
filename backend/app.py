import os
import uuid

from flask import Flask, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash

from config import Config
from extensions import cors, db, jwt
from models import User
from routes.admin import admin_bp
from routes.auth import auth_bp, login as login_view, me as me_view, refresh as refresh_view
from routes.cart import cart_bp
from routes.orders import orders_bp
from routes.products import products_bp
from utils import admin_required

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "static", "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def allowed_file(filename):
    if not filename:
        return False4
    ext = filename.rsplit(".", 1)[-1].lower()
    return "." in filename and ext in ALLOWED_EXTENSIONS


def create_app():
    app = Flask(__name__, static_folder="static")
    app.config.from_object(Config)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
    app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    app.config["FRONTEND_ORIGIN"],
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                ],
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
            }
        },
    )

    @jwt.unauthorized_loader
    def missing_token(_reason):
        return jsonify({"error": "Please log in to continue."}), 401

    @jwt.invalid_token_loader
    def invalid_token(_reason):
        return jsonify({"error": "Your session is invalid. Please log in again."}), 401

    @jwt.expired_token_loader
    def expired_token(_header, _payload):
        return jsonify({"error": "Your session has expired. Please log in again."}), 401

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(cart_bp, url_prefix="/api/cart")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    @app.post("/api/login")
    def login_alias():
        return login_view()

    @app.post("/api/refresh")
    def refresh_alias():
        return refresh_view()

    @app.get("/api/me")
    @jwt_required()
    def me_alias():
        user = db.session.get(User, int(get_jwt_identity()))
        if not user:
            return jsonify({"error": "User not found."}), 404
        return jsonify(user.to_dict())

    @app.put("/api/me")
    @jwt_required()
    def update_profile():
        data = request.get_json(silent=True) or {}
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        if not name or not email:
            return jsonify({"error": "Name and email are required."}), 400

        user = db.session.get(User, int(get_jwt_identity()))
        if not user:
            return jsonify({"error": "User not found."}), 404

        user.name = name
        user.email = email
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({"error": "Email already in use."}), 409
        return jsonify({"message": "Profile updated.", "user": user.to_dict()})

    @app.put("/api/me/password")
    @jwt_required()
    def change_password():
        data = request.get_json(silent=True) or {}
        current_password = data.get("current_password") or ""
        new_password = data.get("new_password") or ""
        confirm_password = data.get("confirm_password") or ""

        if new_password != confirm_password:
            return jsonify({"error": "Passwords do not match."}), 400
        if len(new_password) < 6:
            return jsonify({"error": "Password must be at least 6 characters."}), 400

        user = db.session.get(User, int(get_jwt_identity()))
        if not user:
            return jsonify({"error": "User not found."}), 404
        if not check_password_hash(user.password_hash, current_password):
            return jsonify({"error": "Current password incorrect."}), 401

        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        return jsonify({"message": "Password changed."})

    @app.put("/api/me/avatar")
    @jwt_required()
    def update_avatar():
        image = request.files.get("image")
        if not image or not image.filename:
            return jsonify({"error": "Choose an image to upload."}), 400
        if not allowed_file(image.filename):
            return jsonify({"error": "Use a PNG, JPG, JPEG, or WebP image."}), 400

        user = db.session.get(User, int(get_jwt_identity()))
        if not user:
            return jsonify({"error": "User not found."}), 404

        ext = secure_filename(image.filename).rsplit(".", 1)[-1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        image.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
        user.avatar_url = f"/static/uploads/{filename}"
        db.session.commit()
        return jsonify({"avatar_url": user.avatar_url, "user": user.to_dict()}), 201

    @app.post("/api/upload")
    @admin_required
    def upload_image():
        if "image" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["image"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type"}), 400

        filename = secure_filename(file.filename)
        ext = filename.rsplit(".", 1)[-1].lower()
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], unique_name)
        file.save(filepath)

        image_url = f"/static/uploads/{unique_name}"
        return jsonify({"image_url": image_url}), 201

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "velora-api"})

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
