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

# Identity / school documents: only these extensions, and the file's first bytes must agree with them.
DOCUMENT_SIGNATURES: dict[str, tuple[bytes, ...]] = {
    ".pdf": (b"%PDF-",),
    ".png": (b"\x89PNG\r\n\x1a\n",),
    ".jpg": (b"\xff\xd8\xff",),
    ".jpeg": (b"\xff\xd8\xff",),
}
DOCUMENT_CONTENT_TYPES = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}
DOCUMENT_MAX_BYTES = 5 * 1024 * 1024


def _uploads_dir() -> Path:
    configured = Path(settings.upload_dir)
    root = configured if configured.is_absolute() else _BACKEND_ROOT / configured
    root.mkdir(parents=True, exist_ok=True)
    return root


def store_upload(
    db: Session,
    actor: User,
    upload: UploadFile,
    *,
    resource_type: str = "attachment",
    resource_id: str | None = None,
    max_bytes: int = _MAX_BYTES,
    allowed_signatures: dict[str, tuple[bytes, ...]] | None = None,
) -> FileAsset:
    """Write the bytes and add a ``FileAsset`` row WITHOUT committing, so the caller can make the file and
    the record that points at it succeed or fail together. On a later failure call ``discard_stored_bytes``."""
    data = upload.file.read(max_bytes + 1)
    if not data:
        fail(422, "empty_file", "The uploaded file is empty.")
    if len(data) > max_bytes:
        fail(413, "file_too_large", f"Files larger than {max_bytes // (1024 * 1024)} MB are not accepted.")
    original = (upload.filename or "upload.bin").strip() or "upload.bin"
    content_type = upload.content_type or "application/octet-stream"
    if allowed_signatures is not None:
        extension = Path(original).suffix.lower()
        signatures = allowed_signatures.get(extension)
        if not signatures or not data.startswith(signatures):
            fail(415, "unsupported_file_type", "Only PDF, JPG or PNG files are accepted.")
        content_type = DOCUMENT_CONTENT_TYPES.get(extension, content_type)  # never trust the client's header
    safe = _SAFE_NAME.sub("_", original)[:180]
    stored = f"{uuid.uuid4().hex}_{safe}"
    path = _uploads_dir() / stored
    path.write_bytes(data)
    row = FileAsset(
        campus_id=actor.campus_id,
        uploaded_by=actor.id,
        original_name=original,
        stored_name=stored,
        content_type=content_type,
        size_bytes=len(data),
        resource_type=(resource_type or "attachment")[:64],
        resource_id=(resource_id or None),
    )
    db.add(row)
    db.flush()
    write_audit(
        db,
        action="FILE_UPLOADED",
        entity_type="file_asset",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=original,
    )
    return row


def discard_stored_bytes(row: FileAsset) -> None:
    """Delete the file's bytes from disk (the database row is the caller's business)."""
    try:
        (_uploads_dir() / row.stored_name).unlink(missing_ok=True)
    except OSError:
        pass


def save_upload(
    db: Session,
    actor: User,
    upload: UploadFile,
    *,
    resource_type: str = "attachment",
    resource_id: str | None = None,
) -> dict:
    row = store_upload(db, actor, upload, resource_type=resource_type, resource_id=resource_id)
    db.commit()
    db.refresh(row)
    return _public(row)


def _is_domain_linked_file(db: Session, row: FileAsset) -> bool:
    """True when a domain module owns this file and applies its own download ACL."""
    from sqlalchemy import select

    from app.models import Announcement, DocumentItem, Message

    if db.scalar(select(DocumentItem.id).where(DocumentItem.file_id == row.id).limit(1)):
        return True
    if db.scalar(select(Announcement.id).where(Announcement.attachment_file_id == row.id).limit(1)):
        return True
    if db.scalar(select(Message.id).where(Message.file_id == row.id).limit(1)):
        return True
    return False


def _can_download_orphan_file(db: Session, actor: User, row: FileAsset) -> bool:
    """Generic uploads are not campus-wide; only the uploader or elevated staff may read them."""
    if row.uploaded_by == actor.id:
        return True
    from app.services.campus_audit_collections import can_download_audit_file, is_audit_resource

    if is_audit_resource(row.resource_type):
        # Audit evidence follows the audit stream readers (Process and Quality stay separate).
        return can_download_audit_file(db, actor, row.resource_type)
    from app.services import attachments

    if attachments.is_linked_resource(row.resource_type):
        # Task / ticket attachments follow that record's visibility, not campus-wide staff permissions.
        return attachments.can_download(db, actor, row)
    from app.deps import permission_codes_for

    codes = set(permission_codes_for(db, actor))
    elevated = {
        "hr.write",
        "hr.employees.write",
        "admissions.write",
        "documents.students.read",
        "documents.employees.read",
        "documents.library.read",
        "audit.read",
        "users.write",
    }
    if elevated.intersection(codes):
        return True
    # Star of the Month attachments: any staff with ops/academics read may download.
    if str(row.resource_type or "").startswith("som-"):
        return bool(codes.intersection({"ops.read", "ops.write", "academics.read", "academics.write"}))
    return False


def get_file(db: Session, actor: User, file_id: uuid.UUID) -> tuple[FileAsset, Path]:
    row = db.get(FileAsset, file_id)
    if row is None or row.campus_id != actor.campus_id:
        fail(404, "not_found", "File was not found.")
    # Files that belong to a student/employee document folder follow that folder's permissions.
    from app.services import announcements, communication, documents

    documents.authorize_file_download(db, actor, row)
    # An announcement's attachment is only for the people who can see that announcement.
    announcements.authorize_file_download(db, actor, row)
    communication.authorize_file_download(db, actor, row)
    # Orphan / generic FileAsset rows: close campus-wide IDOR (uploader or elevated staff only).
    if not _is_domain_linked_file(db, row) and not _can_download_orphan_file(db, actor, row):
        fail(403, "forbidden", "You do not have permission to download this file.")
    path = _uploads_dir() / row.stored_name
    if not path.is_file():
        fail(404, "not_found", "File bytes are missing.")
    return row, path


# File Management: files uploaded on that screen are tagged with this resource type. Only these
# can be deleted there; files owned by other modules (documents, announcements, messages, photos,
# HR/ops JSON records) are listed read-only because their references cannot all be checked here.
LIBRARY_RESOURCE = "library"


def _referenced_by_table(db: Session, row: FileAsset) -> bool:
    from sqlalchemy import or_, select

    from app.models import Admission, AdmissionEnquiry

    if _is_domain_linked_file(db, row):
        return True
    for model in (Admission, AdmissionEnquiry):
        if db.scalar(select(model.id).where(model.profile_image_file_id == row.id).limit(1)):
            return True
    return False


def list_files(db: Session, actor: User, *, search: str = "", kind: str = "") -> list[dict]:
    from sqlalchemy import select

    rows = db.scalars(
        select(FileAsset).where(FileAsset.campus_id == actor.campus_id).order_by(FileAsset.created_at.desc())
    ).all()
    uploaders = {
        user.id: user.email
        for user in db.scalars(select(User).where(User.id.in_({r.uploaded_by for r in rows if r.uploaded_by}))).all()
    }
    query = search.strip().lower()
    out = []
    for row in rows:
        if query and query not in row.original_name.lower():
            continue
        if kind == "library" and row.resource_type != LIBRARY_RESOURCE:
            continue
        if kind == "module" and row.resource_type == LIBRARY_RESOURCE:
            continue
        deletable = row.resource_type == LIBRARY_RESOURCE and not _referenced_by_table(db, row)
        out.append({
            **_public(row),
            "uploaded_by": uploaders.get(row.uploaded_by, ""),
            "created_at": row.created_at.isoformat(),
            "deletable": deletable,
        })
    return out


def upload_library_file(db: Session, actor: User, upload: UploadFile) -> dict:
    row = store_upload(
        db, actor, upload, resource_type=LIBRARY_RESOURCE, allowed_signatures=DOCUMENT_SIGNATURES,
    )
    db.commit()
    db.refresh(row)
    return {**_public(row), "deletable": True}


def delete_library_file(db: Session, actor: User, file_id: uuid.UUID) -> dict:
    row = db.get(FileAsset, file_id)
    if row is None or row.campus_id != actor.campus_id:
        fail(404, "not_found", "File was not found.")
    if row.resource_type != LIBRARY_RESOURCE:
        fail(409, "file_in_use", "This file belongs to another module; remove it there instead.")
    if _referenced_by_table(db, row):
        fail(409, "file_in_use", "This file is still attached to a record and cannot be deleted.")
    write_audit(
        db,
        action="FILE_DELETED",
        entity_type="file_asset",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=row.original_name,
    )
    db.delete(row)
    db.commit()
    discard_stored_bytes(row)
    return {"deleted": True, "id": str(file_id)}


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
