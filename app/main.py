import uuid
from pathlib import Path

from flask import (
    Blueprint,
    current_app,
    flash,
    redirect,
    render_template,
    request,
    send_file,
    url_for,
)
from flask_login import current_user, login_required

from . import db
from .models import ResumeAnalysis
from .services.resume_service import (
    calculate_match,
    generate_ats_resume_text,
    parse_resume_bytes,
    write_docx,
    write_pdf,
)
from .services.storage_service import (
    exists as storage_exists,
    presigned_download_url,
    read_bytes,
    save_generated_file,
    save_uploaded_file,
    suffix_for_ref,
    to_local_path,
)

main_bp = Blueprint("main", __name__)


@main_bp.route("/dashboard")
@login_required
def dashboard():
    analyses = (
        ResumeAnalysis.query.filter_by(user_id=current_user.id)
        .order_by(ResumeAnalysis.created_at.desc())
        .all()
    )
    return render_template("main/dashboard.html", analyses=analyses)


@main_bp.route("/personal-dashboard")
@login_required
def personal_dashboard():
    return redirect(url_for("main.dashboard"))


@main_bp.route("/analyze", methods=["POST"])
@login_required
def analyze_resume():
    resume_file = request.files.get("resume_file")
    jd_file = request.files.get("job_description_file")
    job_description = request.form.get("job_description", "").strip()
    job_title = request.form.get("job_title", "").strip() or None

    if not resume_file or not resume_file.filename:
        flash("Please upload your current resume.", "error")
        return redirect(url_for("main.dashboard"))

    if jd_file and jd_file.filename:
        try:
            jd_ref = save_uploaded_file(jd_file, "job-descriptions")
            parsed_jd = parse_resume_bytes(read_bytes(jd_ref), suffix_for_ref(jd_ref)).strip()
            if parsed_jd:
                job_description = parsed_jd
        except Exception:
            flash(
                "Could not parse uploaded job description file. Using textbox input instead.",
                "error",
            )

    if not job_description:
        flash("Please provide a job description via text or file upload.", "error")
        return redirect(url_for("main.dashboard"))

    try:
        resume_ref = save_uploaded_file(resume_file, "resumes")
        resume_bytes = read_bytes(resume_ref)
        original_resume_text = parse_resume_bytes(resume_bytes, suffix_for_ref(resume_ref))
    except ValueError as exc:
        flash(str(exc), "error")
        return redirect(url_for("main.dashboard"))
    except Exception:
        flash("Could not parse the uploaded resume file.", "error")
        return redirect(url_for("main.dashboard"))

    match_percentage, _matched, missing = calculate_match(
        job_description=job_description, resume_text=original_resume_text
    )
    ats_resume_text = generate_ats_resume_text(
        full_name=current_user.full_name,
        resume_text=original_resume_text,
        job_description=job_description,
        missing_keywords=missing,
    )

    basename = uuid.uuid4().hex
    docx_path = Path(current_app.config["GENERATED_FOLDER"]) / f"{basename}.docx"
    pdf_path = Path(current_app.config["GENERATED_FOLDER"]) / f"{basename}.pdf"
    write_docx(ats_resume_text, docx_path)
    write_pdf(ats_resume_text, pdf_path)
    docx_ref = save_generated_file(docx_path, "generated")
    pdf_ref = save_generated_file(pdf_path, "generated")

    analysis = ResumeAnalysis(
        user_id=current_user.id,
        job_title=job_title,
        match_percentage=match_percentage,
        resume_path=resume_ref,
        generated_docx_path=docx_ref,
        generated_pdf_path=pdf_ref,
        missing_keywords=", ".join(missing),
        ats_resume_text=ats_resume_text,
        original_resume_text=original_resume_text,
        job_description_text=job_description,
    )
    db.session.add(analysis)
    db.session.commit()

    flash("Resume analysis completed successfully.", "success")
    return redirect(url_for("main.analysis_detail", analysis_id=analysis.id))


@main_bp.route("/analysis/<int:analysis_id>")
@login_required
def analysis_detail(analysis_id: int):
    analysis = ResumeAnalysis.query.filter_by(
        id=analysis_id, user_id=current_user.id
    ).first_or_404()
    missing_keywords = [
        token.strip()
        for token in (analysis.missing_keywords or "").split(",")
        if token.strip()
    ]
    return render_template(
        "main/analysis_detail.html",
        analysis=analysis,
        missing_keywords=missing_keywords,
    )


@main_bp.route("/download/<int:analysis_id>/<fmt>")
@login_required
def download_resume(analysis_id: int, fmt: str):
    analysis = ResumeAnalysis.query.filter_by(
        id=analysis_id, user_id=current_user.id
    ).first_or_404()

    if fmt == "docx":
        mimetype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = f"ats_resume_{analysis.id}.docx"
        ref = analysis.generated_docx_path
    elif fmt == "pdf":
        mimetype = "application/pdf"
        filename = f"ats_resume_{analysis.id}.pdf"
        ref = analysis.generated_pdf_path
    else:
        flash("Unsupported format requested.", "error")
        return redirect(url_for("main.analysis_detail", analysis_id=analysis.id))

    if not storage_exists(ref):
        flash("Requested file is unavailable.", "error")
        return redirect(url_for("main.analysis_detail", analysis_id=analysis.id))

    if ref.startswith("s3://"):
        return redirect(presigned_download_url(ref, expires_seconds=600))

    path = to_local_path(ref)
    return send_file(path, as_attachment=True, download_name=filename, mimetype=mimetype)


@main_bp.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    if request.method == "POST":
        full_name = request.form.get("full_name", "").strip()
        if not full_name:
            flash("Full name cannot be empty.", "error")
            return redirect(url_for("main.profile"))
        current_user.full_name = full_name
        db.session.commit()
        flash("Profile updated successfully.", "success")
        return redirect(url_for("main.profile"))
    return render_template("main/profile.html")


@main_bp.route("/settings", methods=["GET", "POST"])
@login_required
def settings():
    if current_user.provider != "local":
        return render_template("main/settings.html")

    if request.method == "POST":
        new_password = request.form.get("new_password", "")
        confirm_password = request.form.get("confirm_password", "")

        if not new_password:
            flash("Please provide a new password.", "error")
            return redirect(url_for("main.settings"))

        if new_password != confirm_password:
            flash("Password and confirm password do not match.", "error")
            return redirect(url_for("main.settings"))

        current_user.set_password(new_password)
        db.session.commit()
        flash("Password updated successfully.", "success")
        return redirect(url_for("main.settings"))

    return render_template("main/settings.html")


@main_bp.route("/help-center")
@login_required
def help_center():
    return render_template("main/help_center.html")
