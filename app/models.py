from datetime import datetime

from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash

from . import db


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=True)
    full_name = db.Column(db.String(255), nullable=False)
    provider = db.Column(db.String(50), nullable=False, default="local")
    provider_user_id = db.Column(db.String(255), nullable=True, unique=True)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    verification_code = db.Column(db.String(8), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    analyses = db.relationship(
        "ResumeAnalysis", back_populates="user", cascade="all, delete-orphan"
    )

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)


class ResumeAnalysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    job_title = db.Column(db.String(255), nullable=True)
    match_percentage = db.Column(db.Float, nullable=False)
    resume_path = db.Column(db.String(500), nullable=False)
    generated_docx_path = db.Column(db.String(500), nullable=False)
    generated_pdf_path = db.Column(db.String(500), nullable=False)
    missing_keywords = db.Column(db.Text, nullable=False)
    ats_resume_text = db.Column(db.Text, nullable=False)
    original_resume_text = db.Column(db.Text, nullable=False)
    job_description_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", back_populates="analyses")
