import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

from .models import db, User, About

load_dotenv()
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def create_app(config=None):
    app = Flask(__name__)
    db_url = os.getenv("DATABASE_URL", "sqlite:///cms.db")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    app.config.update(
        SECRET_KEY=os.getenv("SECRET_KEY", "dev-secret"),
        JWT_SECRET_KEY=os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-me-32-bytes-min!!"),
        SQLALCHEMY_DATABASE_URI=db_url,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        UPLOAD_FOLDER=os.path.join(BASE_DIR, "uploads"),
        MAX_CONTENT_LENGTH=8 * 1024 * 1024,
    )
    if config:
        app.config.update(config)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]
    CORS(app, resources={r"/*": {"origins": origins}})
    JWTManager(app)
    db.init_app(app)

    from .routes import bp
    app.register_blueprint(bp)

    @app.get("/uploads/<path:name>")
    def uploads(name):
        return send_from_directory(app.config["UPLOAD_FOLDER"], name)

    @app.get("/")
    def index():
        return jsonify(status="ok", service="Portfolio CMS API")

    @app.errorhandler(404)
    def nf(_):
        return jsonify(error="Not found"), 404

    @app.errorhandler(413)
    def too_big(_):
        return jsonify(error="File too large (max 8 MB)"), 413

    with app.app_context():
        db.create_all()
        if not User.query.first():
            u = User(email=os.getenv("ADMIN_EMAIL", "admin@example.com"))
            u.set_password(os.getenv("ADMIN_PASSWORD", "admin12345"))
            db.session.add(u)
        if not About.query.first():
            db.session.add(About(name="Your Name", title="Full-stack Developer", bio="Edit this from the admin panel."))
        db.session.commit()
    return app
