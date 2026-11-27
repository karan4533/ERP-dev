from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import bearer, get_current_user, permission_codes_for, require_any, require_permission
from app.models import User
from app.services import attachments as attachments_svc
from app.services import campus_audit_collections as audit_svc
from app.services.errors import fail
from app.services.files import _public as public_file
from app.services.files import (
    DOCUMENT_MAX_BYTES,
    DOCUMENT_SIGNATURES,
    delete_library_file,
    get_file,
    list_files,
    save_upload,
    store_upload,
    upload_library_file,
)

router = APIRouter(prefix="/api/v1/files", tags=["files"])

# File Management screen: Admin/Super Admin/MD (users.write) or File Room (documents.library.*).


@router.get("")
def list_files_route(
    search: str = Query(""),
    kind: str = Query("", description="'' all, 'library' File Management uploads, 'module' other modules"),
    db: Session = Depends(get_db),
    user: User = Depends(require_any("users.write", "documents.library.read")),
) -> list[dict]:
    return list_files(db, user, search=search, kind=kind)


@router.post("/library", status_code=201)
async def upload_library_route(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_any("users.write", "documents.library.write")),
) -> dict:
    return upload_library_file(db, user, file)


@router.delete("/{file_id}")
def delete_file_route(
    file_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_any("users.write", "documents.library.write")),
) -> dict:
    return delete_library_file(db, user, file_id)


# FO / admissions profile photos: same PDF/PNG/JPG rules as Admin Documents (no exe / disguised files).
_ADMISSION_PROFILE_TYPES = frozenset({"admission", "admission_enquiry", "admission-profile", "profile"})


def _can_upload_resource(db: Session, user: User, resource_type: str) -> bool:
    codes = set(permission_codes_for(db, user))
    if codes.intersection({"hr.write", "hr.employees.write", "admissions.write"}):
        return True
    # Star of the Month evidence docs: teachers/ops with write may attach files.
    if str(resource_type or "").startswith("som-") and codes.intersection({"ops.write", "academics.write"}):
        return True
    return False


def _is_admission_profile(resource_type: str | None) -> bool:
    return str(resource_type or "") in _ADMISSION_PROFILE_TYPES


# Audit evidence: extension allowlist and the file's first bytes must agree with it.
_AUDIT_EVIDENCE_TYPES: dict[str, tuple[str, tuple[bytes, ...]]] = {
    ".pdf": ("application/pdf", (b"%PDF-",)),
    ".png": ("image/png", (b"\x89PNG\r\n\x1a\n",)),
    ".jpg": ("image/jpeg", (b"\xff\xd8\xff",)),
    ".jpeg": ("image/jpeg", (b"\xff\xd8\xff",)),
    ".doc": ("application/msword", (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1",)),
    ".docx": (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        (b"PK\x03\x04",),
    ),
    ".xls": ("application/vnd.ms-excel", (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1",)),
    ".xlsx": ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", (b"PK\x03\x04",)),
    ".mp4": ("video/mp4", ()),
}


def _audit_evidence_content_type(file: UploadFile) -> str:
    extension = Path(file.filename or "").suffix.lower()
    spec = _AUDIT_EVIDENCE_TYPES.get(extension)
    head = file.file.read(16)
    file.file.seek(0)
    if spec is not None:
        content_type, signatures = spec
        matches = head[4:8] == b"ftyp" if extension == ".mp4" else head.startswith(signatures)
        if matches:
            return content_type
    fail(
        415,
        "unsupported_file_type",
        "Audit evidence must be a PDF, PNG, JPG, Word, Excel or MP4 file whose contents match its extension.",
    )


async def _upload_audit_evidence(db: Session, user: User, file: UploadFile, resource_type: str, resource_id) -> dict:
    stored_type = audit_svc.resolve_audit_upload(db, user, resource_type, resource_id)
    if stored_type is None:
        fail(403, "forbidden", "You do not have permission to upload audit evidence for this record.")
    content_type = _audit_evidence_content_type(file)
    row = store_upload(db, user, file, resource_type=stored_type, resource_id=resource_id)
    row.content_type = content_type
    db.commit()
    db.refresh(row)
    return public_file(row)


@router.post("", status_code=201)
async def upload_file_route(
    file: UploadFile = File(...),
    resource_type: str = Form("attachment"),
    resource_id: str | None = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    if audit_svc.is_audit_resource(resource_type):
        return await _upload_audit_evidence(db, user, file, resource_type, resource_id)
    if attachments_svc.is_linked_resource(resource_type):
        return attachments_svc.upload(db, user, file, resource_type, resource_id)
    if not _can_upload_resource(db, user, resource_type):
        fail(403, "forbidden", "You do not have permission to upload this file.")
    # Admissions / FO profile photos: reject exe and disguised files the same way documents do.
    if _is_admission_profile(resource_type):
        row = store_upload(
            db,
            user,
            file,
            resource_type=resource_type,
            resource_id=resource_id,
            max_bytes=DOCUMENT_MAX_BYTES,
            allowed_signatures=DOCUMENT_SIGNATURES,
        )
        db.commit()
        db.refresh(row)
        return public_file(row)
    return save_upload(db, user, file, resource_type=resource_type, resource_id=resource_id)


@router.get("/attached")
def list_attached_route(
    resource_type: str = Query(
        ...,
        description="task-attachment | it-ticket-attachment | home-fun-attachment | "
        "study-material-attachment | sample-question-attachment | lesson-plan-attachment",
    ),
    resource_id: str = Query(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    """Files attached to one domain record, for people who can see that record."""
    if not attachments_svc.is_linked_resource(resource_type):
        fail(400, "validation_error", "Unknown attachment resource_type.")
    return attachments_svc.list_attached(db, user, resource_type, resource_id)


@router.get("/{file_id}/download")
def download_file_route(
    file_id: UUID,
    request: Request,
    token: str | None = Query(None),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
):
    auth = credentials
    if auth is None and token:
        auth = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    user = get_current_user(request, auth, db)
    row, path = get_file(db, user, file_id)
    return FileResponse(path, media_type=row.content_type, filename=row.original_name)
