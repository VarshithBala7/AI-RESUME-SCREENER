import random
from urllib.parse import urlencode

from flask import (
    Blueprint,
    current_app,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask_login import current_user, login_user, logout_user

from . import db, oauth
from .models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/")
def welcome():
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))
    return render_template("auth/welcome.html")


@auth_bp.route("/signup", methods=["GET", "POST"])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))

    if request.method == "POST":
        full_name = request.form.get("full_name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        if not full_name or not email or not password:
            flash("All fields are required.", "error")
            return render_template("auth/signup.html")

        if password != confirm_password:
            flash("Password and confirm password do not match.", "error")
            return render_template("auth/signup.html")

        existing = User.query.filter_by(email=email).first()
        if existing:
            flash("An account already exists with this email.", "error")
            return render_template("auth/signup.html")

        verification_code = f"{random.randint(100000, 999999)}"
        user = User(
            full_name=full_name,
            email=email,
            provider="local",
            is_verified=False,
            verification_code=verification_code,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        session["pending_verification_email"] = email
        # In production, this should be sent via transactional email provider.
        current_app.logger.info("Verification code for %s is %s", email, verification_code)
        flash("Account created. Enter the verification code sent to your email.", "success")
        return redirect(url_for("auth.verify_email"))

    return render_template("auth/signup.html")


@auth_bp.route("/verify-email", methods=["GET", "POST"])
def verify_email():
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))

    pending_email = session.get("pending_verification_email")
    if not pending_email:
        flash("Please sign up first.", "error")
        return redirect(url_for("auth.signup"))

    user = User.query.filter_by(email=pending_email).first()
    if not user:
        flash("User not found. Please sign up again.", "error")
        return redirect(url_for("auth.signup"))

    if request.method == "POST":
        code = request.form.get("verification_code", "").strip()
        if not code:
            flash("Verification code is required.", "error")
            return render_template("auth/verify_email.html")

        if code != user.verification_code:
            flash("Invalid verification code.", "error")
            return render_template("auth/verify_email.html")

        user.is_verified = True
        user.verification_code = None
        db.session.commit()
        session.pop("pending_verification_email", None)
        flash("Email verified. You can now sign in.", "success")
        return redirect(url_for("auth.login"))

    return render_template("auth/verify_email.html")


@auth_bp.route("/resend-verification", methods=["POST"])
def resend_verification():
    pending_email = session.get("pending_verification_email")
    if not pending_email:
        flash("No pending verification found.", "error")
        return redirect(url_for("auth.signup"))

    user = User.query.filter_by(email=pending_email).first()
    if not user:
        flash("User not found.", "error")
        return redirect(url_for("auth.signup"))

    if user.is_verified:
        flash("Email is already verified.", "success")
        return redirect(url_for("auth.login"))

    user.verification_code = f"{random.randint(100000, 999999)}"
    db.session.commit()
    current_app.logger.info(
        "Resent verification code for %s is %s", user.email, user.verification_code
    )
    flash("A new verification code has been generated.", "success")
    return redirect(url_for("auth.verify_email"))


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))

    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            flash("Invalid email or password.", "error")
            return render_template("auth/login.html")

        if not user.is_verified:
            session["pending_verification_email"] = user.email
            flash("Please verify your email before signing in.", "error")
            return redirect(url_for("auth.verify_email"))

        login_user(user)
        flash("Signed in successfully.", "success")
        return redirect(url_for("main.dashboard"))

    return render_template("auth/login.html")


@auth_bp.route("/logout")
def logout():
    logout_user()
    flash("You have been signed out.", "success")
    return redirect(url_for("auth.welcome"))


@auth_bp.route("/oauth/<provider>")
def oauth_login(provider: str):
    client = oauth.create_client(provider)
    if not client:
        flash(f"{provider.title()} sign-in is not configured.", "error")
        return redirect(url_for("auth.login"))

    redirect_uri = url_for("auth.oauth_callback", provider=provider, _external=True)
    return client.authorize_redirect(redirect_uri)


@auth_bp.route("/oauth/<provider>/callback")
def oauth_callback(provider: str):
    client = oauth.create_client(provider)
    if not client:
        flash("Social sign-in provider is not configured.", "error")
        return redirect(url_for("auth.login"))

    token = client.authorize_access_token()
    identity = _extract_identity(provider, client, token)
    if not identity.get("email"):
        flash("Could not read your email from social login.", "error")
        return redirect(url_for("auth.login"))

    email = identity["email"].lower()
    provider_user_id = identity.get("id") or f"{provider}:{email}"
    full_name = identity.get("name") or email.split("@")[0]

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(
            email=email,
            full_name=full_name,
            provider=provider,
            provider_user_id=provider_user_id,
            is_verified=True,
        )
        db.session.add(user)
    else:
        if not user.provider_user_id:
            user.provider_user_id = provider_user_id
        if user.provider == "local":
            user.provider = provider
        user.is_verified = True

    db.session.commit()
    login_user(user)
    flash("Signed in successfully with social account.", "success")
    return redirect(url_for("main.dashboard"))


def _extract_identity(provider: str, client, token: dict) -> dict:
    if provider == "google":
        userinfo = client.userinfo()
        return {
            "id": userinfo.get("sub"),
            "email": userinfo.get("email"),
            "name": userinfo.get("name"),
        }

    if provider == "microsoft":
        resp = client.get("https://graph.microsoft.com/v1.0/me", token=token)
        data = resp.json()
        return {
            "id": data.get("id"),
            "email": data.get("mail") or data.get("userPrincipalName"),
            "name": data.get("displayName"),
        }

    if provider == "facebook":
        params = urlencode({"fields": "id,name,email"})
        resp = client.get(f"/me?{params}", token=token)
        data = resp.json()
        return {"id": data.get("id"), "email": data.get("email"), "name": data.get("name")}

    return {}
