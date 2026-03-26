import mimetypes
import uuid
from pathlib import Path
from urllib.parse import urlparse

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from flask import current_app
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename


ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


def save_uploaded_file(file: FileStorage, folder: str) -> str:
    filename = secure_filename(file.filename or "")
    if not filename:
        raise ValueError("Uploaded file name is missing.")

    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported file format. Use PDF, DOCX, or TXT.")

    storage_backend = current_app.config.get("STORAGE_BACKEND", "local")
    key = f"{folder}/{uuid.uuid4().hex}{suffix}"
    if storage_backend == "s3":
        return _save_to_s3(file, key)

    local_base = Path(current_app.config["UPLOAD_FOLDER"])
    local_base.mkdir(parents=True, exist_ok=True)
    path = local_base / f"{uuid.uuid4().hex}{suffix}"
    file.save(path)
    return f"local://{path}"


def save_generated_file(local_path: Path, folder: str) -> str:
    storage_backend = current_app.config.get("STORAGE_BACKEND", "local")
    if storage_backend != "s3":
        return f"local://{local_path}"

    suffix = local_path.suffix.lower()
    key = f"{folder}/{uuid.uuid4().hex}{suffix}"
    content_type = _guess_mime(local_path)
    client = _s3_client()
    bucket = current_app.config["S3_BUCKET_NAME"]
    try:
        with local_path.open("rb") as handle:
            client.upload_fileobj(
                handle, bucket, key, ExtraArgs={"ContentType": content_type}
            )
    except (BotoCoreError, ClientError) as exc:
        raise RuntimeError("Failed to upload generated file to S3.") from exc
    return f"s3://{bucket}/{key}"


def read_text(ref: str) -> str:
    if ref.startswith("local://"):
        path = Path(ref.replace("local://", "", 1))
        return path.read_text(encoding="utf-8", errors="ignore")
    raise ValueError("Text reading is only supported for local paths.")


def read_bytes(ref: str) -> bytes:
    if ref.startswith("local://"):
        path = Path(ref.replace("local://", "", 1))
        return path.read_bytes()
    if ref.startswith("s3://"):
        parsed = urlparse(ref)
        bucket = parsed.netloc
        key = parsed.path.lstrip("/")
        client = _s3_client()
        try:
            obj = client.get_object(Bucket=bucket, Key=key)
            return obj["Body"].read()
        except (BotoCoreError, ClientError) as exc:
            raise RuntimeError("Failed to read file from S3.") from exc
    raise ValueError("Unsupported storage reference.")


def suffix_for_ref(ref: str) -> str:
    if ref.startswith("local://"):
        return to_local_path(ref).suffix.lower()
    if ref.startswith("s3://"):
        parsed = urlparse(ref)
        return Path(parsed.path).suffix.lower()
    return ""


def exists(ref: str) -> bool:
    if ref.startswith("local://"):
        path = Path(ref.replace("local://", "", 1))
        return path.exists()
    if ref.startswith("s3://"):
        parsed = urlparse(ref)
        bucket = parsed.netloc
        key = parsed.path.lstrip("/")
        client = _s3_client()
        try:
            client.head_object(Bucket=bucket, Key=key)
            return True
        except (BotoCoreError, ClientError):
            return False
    return False


def to_local_path(ref: str) -> Path:
    if not ref.startswith("local://"):
        raise ValueError("Reference is not local.")
    return Path(ref.replace("local://", "", 1))


def presigned_download_url(ref: str, expires_seconds: int = 600) -> str:
    if ref.startswith("local://"):
        raise ValueError("Presigned URL not supported for local file.")
    if not ref.startswith("s3://"):
        raise ValueError("Unsupported storage reference.")

    parsed = urlparse(ref)
    bucket = parsed.netloc
    key = parsed.path.lstrip("/")
    client = _s3_client()
    try:
        return client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_seconds,
        )
    except (BotoCoreError, ClientError) as exc:
        raise RuntimeError("Failed to generate presigned download URL.") from exc


def _save_to_s3(file: FileStorage, key: str) -> str:
    bucket = current_app.config.get("S3_BUCKET_NAME")
    if not bucket:
        raise ValueError("S3_BUCKET_NAME is required for S3 storage backend.")
    content_type = file.content_type or _guess_mime_from_name(file.filename or "")
    client = _s3_client()
    try:
        client.upload_fileobj(file.stream, bucket, key, ExtraArgs={"ContentType": content_type})
    except (BotoCoreError, ClientError) as exc:
        raise RuntimeError("Failed to upload file to S3.") from exc
    return f"s3://{bucket}/{key}"


def _s3_client():
    region = current_app.config.get("S3_REGION")
    kwargs = {}
    if region:
        kwargs["region_name"] = region
    return boto3.client("s3", **kwargs)


def _guess_mime(path: Path) -> str:
    guessed = mimetypes.guess_type(str(path))[0]
    return guessed or "application/octet-stream"


def _guess_mime_from_name(filename: str) -> str:
    guessed = mimetypes.guess_type(filename)[0]
    return guessed or "application/octet-stream"
