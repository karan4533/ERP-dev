import re
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import FileAsset, User
from app.services.audit import write_audit
from app.services.errors import fail

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_MAX_BYTES = 10 * 1024 * 1024
_SAFE_NAME = re.compile(r"[^A-Za-z0-9._-]+")


def _uploads_dir() -> Path:
    configured = Path(settings.upload_dir)
    root = configured if configured.is_absolute() else _BACKEND_ROOT / configured
    root.mkdir(parents=True, exist_ok=True)
    return root


def save_upload(
    db: Session,
    actor: User,
    upload: UploadFile,
    *,
    resource_type: str = "attachment",
    resource_id: str | None = None,
) -> dict:
    data = upload.file.read(_MAX_BYTES + 1)
    if not data:
        fail(422, "empty_file", "The uploaded file is empty.")
    if len(data) > _MAX_BYTES:
        fail(413, "file_too_large", "Files larger than 10 MB are not accepted.")
    original = (upload.filename or "upload.bin").strip() or "upload.bin"
    safe = _SAFE_NAME.sub("_", original)[:180]
    stored = f"{uuid.uuid4().hex}_{safe}"
    path = _uploads_dir() / stored
    path.write_bytes(data)
    row = FileAsset(
        campus_id=actor.campus_id,
        uploaded_by=actor.id,
        original_name=original,
        stored_name=stored,
        content_type=upload.content_type or "application/octet-stream",
        size_bytes=len(data),
        resource_type=(resource_type or "attachment")[:64],
        resource_id=(resource_id or None),
    )
    db.add(row)
    write_audit(
        db,
        action="FILE_UPLOADED",
        entity_type="file_asset",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=original,
    )
    db.commit()
    db.refresh(row)
    return _public(row)


def get_file(db: Session, actor: User, file_id: uuid.UUID) -> tuple[FileAsset, Path]:
    row = db.get(FileAsset, file_id)
    if row is None or row.campus_id != actor.campus_id:
        fail(404, "not_found", "File was not found.")
    path = _uploads_dir() / row.stored_name
    if not path.is_file():
        fail(404, "not_found", "File bytes are missing.")
    return row, path


def _public(row: FileAsset) -> dict:
    return {
        "id": str(row.id),
        "original_name": row.original_name,
        "content_type": row.content_type,
        "size_bytes": row.size_bytes,
        "resource_type": row.resource_type,
        "resource_id": row.resource_id,
        "download_url": f"/api/v1/files/{row.id}/download",
    }
