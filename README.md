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
export DATABASE_URL="sqlite:////workspace/instance/resume_screener.db"
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
export MICROSOFT_CLIENT_ID="..."
export MICROSOFT_CLIENT_SECRET="..."
export FACEBOOK_CLIENT_ID="..."
export FACEBOOK_CLIENT_SECRET="..."
```

If OAuth variables are not set, social login buttons still render but redirect back with a configuration message.

## Cloud Agent Environment

This repository includes `.cursor/environment.json` so Cloud Agents automatically:

- install `python3-venv` (virtualenv support)
- ensure `python3-pip` is available
- install Python runtime dependencies from `requirements.txt`

## Important Note on Email Verification

For local development, the verification code is logged to server logs (stdout).  
In production, replace this with a transactional email provider.