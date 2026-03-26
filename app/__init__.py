import os
from pathlib import Path

from authlib.integrations.flask_client import OAuth
from flask import Flask
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
login_manager = LoginManager()
oauth = OAuth()


def create_app() -> Flask:
    app = Flask(__name__, instance_relative_config=True)

    instance_path = Path(app.instance_path)
    instance_path.mkdir(parents=True, exist_ok=True)

    app.config.update(
        SECRET_KEY=os.getenv("SECRET_KEY", "dev-secret-key"),
        SQLALCHEMY_DATABASE_URI=os.getenv(
            "DATABASE_URL", f"sqlite:///{instance_path / 'resume_screener.db'}"
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        UPLOAD_FOLDER=os.getenv("UPLOAD_FOLDER", str(Path.cwd() / "uploads")),
        GENERATED_FOLDER=os.getenv(
            "GENERATED_FOLDER", str(Path.cwd() / "generated_resumes")
        ),
        STORAGE_BACKEND=os.getenv("STORAGE_BACKEND", "local"),
        S3_BUCKET_NAME=os.getenv("S3_BUCKET_NAME"),
        S3_REGION=os.getenv("S3_REGION"),
        MAIL_FROM=os.getenv("MAIL_FROM"),
        MAIL_HOST=os.getenv("MAIL_HOST"),
        MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
        MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
        MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
        MAIL_USE_TLS=os.getenv("MAIL_USE_TLS", "true").lower() == "true",
        MAX_CONTENT_LENGTH=10 * 1024 * 1024,
    )

    Path(app.config["UPLOAD_FOLDER"]).mkdir(parents=True, exist_ok=True)
    Path(app.config["GENERATED_FOLDER"]).mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    login_manager.init_app(app)
    oauth.init_app(app)
    login_manager.login_view = "auth.login"

    from .models import User

    @login_manager.user_loader
    def load_user(user_id: str):
        return User.query.get(int(user_id))

    _register_oauth_clients(app)

    from .auth import auth_bp
    from .main import main_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)

    with app.app_context():
        db.create_all()

    return app


def _register_oauth_clients(app: Flask) -> None:
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    if google_client_id and google_client_secret:
        oauth.register(
            name="google",
            client_id=google_client_id,
            client_secret=google_client_secret,
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )

    microsoft_client_id = os.getenv("MICROSOFT_CLIENT_ID")
    microsoft_client_secret = os.getenv("MICROSOFT_CLIENT_SECRET")
    if microsoft_client_id and microsoft_client_secret:
        oauth.register(
            name="microsoft",
            client_id=microsoft_client_id,
            client_secret=microsoft_client_secret,
            server_metadata_url="https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile User.Read"},
        )

    facebook_client_id = os.getenv("FACEBOOK_CLIENT_ID")
    facebook_client_secret = os.getenv("FACEBOOK_CLIENT_SECRET")
    if facebook_client_id and facebook_client_secret:
        oauth.register(
            name="facebook",
            client_id=facebook_client_id,
            client_secret=facebook_client_secret,
            access_token_url="https://graph.facebook.com/oauth/access_token",
            authorize_url="https://www.facebook.com/dialog/oauth",
            api_base_url="https://graph.facebook.com/",
            client_kwargs={"scope": "email public_profile"},
        )
