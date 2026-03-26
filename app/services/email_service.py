import smtplib
from email.message import EmailMessage

from flask import current_app


def send_verification_code(to_email: str, code: str) -> bool:
    sender = current_app.config.get("MAIL_FROM")
    host = current_app.config.get("MAIL_HOST")
    port = int(current_app.config.get("MAIL_PORT", 587))
    username = current_app.config.get("MAIL_USERNAME")
    password = current_app.config.get("MAIL_PASSWORD")
    use_tls = bool(current_app.config.get("MAIL_USE_TLS", True))

    # Fallback for development environments without SMTP configuration.
    if not (sender and host and username and password):
        current_app.logger.info(
            "SMTP not configured. Verification code for %s is %s", to_email, code
        )
        return True

    message = EmailMessage()
    message["Subject"] = "Your AI Resume Screener verification code"
    message["From"] = sender
    message["To"] = to_email
    message.set_content(
        f"Your verification code is: {code}\n\n"
        "If you did not request this, you can ignore this email."
    )

    try:
        with smtplib.SMTP(host, port) as smtp:
            if use_tls:
                smtp.starttls()
            smtp.login(username, password)
            smtp.send_message(message)
        return True
    except Exception:
        current_app.logger.exception("Failed to send verification code email.")
        return False
