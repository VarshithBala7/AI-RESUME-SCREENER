# AI Resume Screener

End-to-end web application for students and job aspirants to:

- Sign up/sign in securely (email verification + optional social login)
- Upload a current resume and job description (file upload or text)
- Get resume-to-job match percentage
- View missing keywords from the job description
- Generate an ATS-optimized resume draft
- Download generated resume in **Word (.docx)** or **PDF (.pdf)**
- View previous generated resumes in a personal dashboard

## Tech Stack

- Python + Flask
- Flask-Login (session auth)
- Authlib (Google / Outlook / Facebook OAuth)
- SQLite via SQLAlchemy
- python-docx + fpdf2 for resume export
- pypdf for resume/JD PDF parsing

## Run Locally

1. Create and activate virtualenv:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Start app:

```bash
python run.py
```

4. Open:

```text
http://127.0.0.1:5000
```

## Environment Variables (Optional)

```bash
export SECRET_KEY="change-me"
export DATABASE_URL="postgresql+psycopg2://user:password@host:5432/dbname"
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
export MICROSOFT_CLIENT_ID="..."
export MICROSOFT_CLIENT_SECRET="..."
export FACEBOOK_CLIENT_ID="..."
export FACEBOOK_CLIENT_SECRET="..."
export STORAGE_BACKEND="local"   # or "s3"
export S3_BUCKET_NAME="your-s3-bucket"
export S3_REGION="us-east-1"
export MAIL_FROM="no-reply@yourdomain.com"
export MAIL_HOST="smtp.yourprovider.com"
export MAIL_PORT="587"
export MAIL_USERNAME="smtp-username"
export MAIL_PASSWORD="smtp-password"
export MAIL_USE_TLS="true"
```

If OAuth variables are not set, social login buttons still render but redirect back with a configuration message.

## Cloud Agent Environment

This repository includes `.cursor/environment.json` so Cloud Agents automatically:

- install `python3-venv` (virtualenv support)
- ensure `python3-pip` is available
- install Python runtime dependencies from `requirements.txt`

## Production Deployment (Recommended)

Use Gunicorn as the web server:

```bash
gunicorn run:app --workers 2 --threads 4 --timeout 120 --bind 0.0.0.0:$PORT
```

### Deployment checklist

- Use PostgreSQL via `DATABASE_URL`
- Set a strong `SECRET_KEY`
- Configure SMTP variables so verification code emails are delivered
- If running multiple instances or ephemeral disks, use `STORAGE_BACKEND=s3`
- Configure OAuth provider callback URLs:
  - `https://your-domain.com/oauth/google/callback`
  - `https://your-domain.com/oauth/microsoft/callback`
  - `https://your-domain.com/oauth/facebook/callback`

## Important Note on Email Verification

If SMTP is not configured, verification codes are logged to server output for development.