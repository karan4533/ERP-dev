"""Files attached to a domain record (task, ticket, academics deliverable, lesson plan).

Each attachment is a ``FileAsset`` whose ``resource_type`` names the record kind and whose ``resource_id`` is
the record's id. The record's own visibility decides who may upload, list and download its attachments.
"""

from __future__ import annotations

from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import role_code_for
from app.models import AcademicsRecord, FileAsset, LessonPlan, OpsRecord, Task, User
from app.services.errors import fail
from app.services.files import _public, store_upload

TASK_ATTACHMENT = "task-attachment"
TICKET_ATTACHMENT = "it-ticket-attachment"
HOME_FUN_ATTACHMENT = "home-fun-attachment"
STUDY_MATERIAL_ATTACHMENT = "study-material-attachment"
SAMPLE_QUESTION_ATTACHMENT = "sample-question-attachment"
LESSON_PLAN_ATTACHMENT = "lesson-plan-attachment"

# Academics JSON collections: resource_id is the collection public_id (e.g. HF-1001).
ACADEMICS_ATTACHMENT_COLLECTIONS: dict[str, str] = {
    HOME_FUN_ATTACHMENT: "home-fun",
    STUDY_MATERIAL_ATTACHMENT: "study-materials",
    SAMPLE_QUESTION_ATTACHMENT: "sample-questions",
}

LINKED_TYPES = frozenset(
    {
        TASK_ATTACHMENT,
        TICKET_ATTACHMENT,
        LESSON_PLAN_ATTACHMENT,
        *ACADEMICS_ATTACHMENT_COLLECTIONS,
    }
)
MAX_PER_RECORD = 10
MAX_BYTES = 10 * 1024 * 1024

# Extension allowlist; the file's first bytes must agree with the extension (the client's header is ignored).
ATTACHMENT_TYPES: dict[str, tuple[str, tuple[bytes, ...]]] = {
    ".pdf": ("application/pdf", (b"%PDF-",)),
    ".png": ("image/png", (b"\x89PNG\r\n\x1a\n",)),
    ".jpg": ("image/jpeg", (b"\xff\xd8\xff",)),
    ".jpeg": ("image/jpeg", (b"\xff\xd8\xff",)),
    ".doc": ("application/msword", (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1",)),
    ".docx": ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", (b"PK\x03\x04",)),
    ".xls": ("application/vnd.ms-excel", (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1",)),
    ".xlsx": ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", (b"PK\x03\x04",)),
}


def is_linked_resource(resource_type: str | None) -> bool:
    return str(resource_type or "") in LINKED_TYPES


def _content_type(upload: UploadFile) -> str:
    extension = Path(upload.filename or "").suffix.lower()
    spec = ATTACHMENT_TYPES.get(extension)
    head = upload.file.read(16)
    upload.file.seek(0)
    if spec is not None and head.startswith(spec[1]):
        return spec[0]
    fail(
        415,
        "unsupported_file_type",
        "Attachments must be a PDF, PNG, JPG, Word or Excel file whose contents match its extension.",
    )


# ---------------------------------------------------------------- record access


def _task_access(db: Session, actor: User, resource_id: str) -> tuple[str, bool, bool]:
    from app.services.escalations import VIEW_ALL_ROLES

    try:
        task_id = UUID(str(resource_id))
    except (TypeError, ValueError):
        fail(404, "not_found", "Task not found.")
    row = db.get(Task, task_id)
    if row is None or row.campus_id != actor.campus_id:
        fail(404, "not_found", "Task not found.")
    participant = actor.id in (row.assignee_id, row.assigned_by_id)
    can_read = participant or role_code_for(db, actor) in VIEW_ALL_ROLES
    return str(row.id), can_read, participant


def _ticket_access(db: Session, actor: User, resource_id: str) -> tuple[str, bool, bool]:
    from app.services.ops_collections import IT_TICKETS, _can_manage_ticket

    public_id = str(resource_id or "").strip()
    row = db.scalar(
        select(OpsRecord).where(
            OpsRecord.campus_id == actor.campus_id,
            OpsRecord.collection == IT_TICKETS,
            OpsRecord.public_id == public_id,
        )
    ) if public_id else None
    if row is None:
        fail(404, "not_found", "Ticket not found.")
    body = row.body or {}
    me = str(actor.id)
    requester = str(body.get("requesterUserId") or "") == me
    assignee = me in {
        str(entry.get("userId")) for entry in (body.get("assignees") or []) if isinstance(entry, dict)
    }
    manager = _can_manage_ticket(role_code_for(db, actor), str(body.get("department") or ""))
    return row.public_id, requester or assignee or manager, requester or assignee or manager


def _academics_access(db: Session, actor: User, resource_type: str, resource_id: str) -> tuple[str, bool, bool]:
    """Same writers / readers as the academics collection the file belongs to."""
    from app.services import academics_collections as academics

    collection = ACADEMICS_ATTACHMENT_COLLECTIONS[resource_type]
    public_id = str(resource_id or "").strip()
    row = (
        db.scalar(
            select(AcademicsRecord).where(
                AcademicsRecord.campus_id == actor.campus_id,
                AcademicsRecord.collection == collection,
                AcademicsRecord.public_id == public_id,
            )
        )
        if public_id
        else None
    )
    if row is None:
        fail(404, "not_found", "Academics record not found.")
    can_upload = academics._can_write(db, actor, collection)
    if can_upload:
        return public_id, True, True
    # Readers who already see this row in the collection list may download its files.
    visible = {str(item.get("id") or "") for item in academics.list_records(db, actor, collection)}
    return public_id, public_id in visible, False


def _lesson_plan_access(db: Session, actor: User, resource_id: str) -> tuple[str, bool, bool]:
    from app.services import lesson_plans as plans

    try:
        plan_id = UUID(str(resource_id))
    except (TypeError, ValueError):
        fail(404, "not_found", "Lesson plan not found.")
    plan = db.get(LessonPlan, plan_id)
    if plan is None or plan.campus_id != actor.campus_id:
        fail(404, "not_found", "Lesson plan not found.")
    owner = plan.teacher_id == actor.id
    can_read = owner or role_code_for(db, actor) in plans.VIEW_ALL_ROLES
    # Draft only: submitted plans are locked (matches lesson_plans.update).
    can_upload = owner and plan.approval_id is None
    return str(plan.id), can_read, can_upload


def _access(db: Session, actor: User, resource_type: str, resource_id: str | None) -> tuple[str, bool, bool]:
    """(canonical resource id, may read, may upload). 404 when the record does not exist in this campus."""
    if resource_type == TASK_ATTACHMENT:
        return _task_access(db, actor, resource_id or "")
    if resource_type == TICKET_ATTACHMENT:
        return _ticket_access(db, actor, resource_id or "")
    if resource_type in ACADEMICS_ATTACHMENT_COLLECTIONS:
        return _academics_access(db, actor, resource_type, resource_id or "")
    if resource_type == LESSON_PLAN_ATTACHMENT:
        return _lesson_plan_access(db, actor, resource_id or "")
    fail(400, "validation_error", "Unknown attachment type.")


# ---------------------------------------------------------------- operations


def _attached(db: Session, campus_id, resource_type: str, resource_ids: list[str]) -> list[FileAsset]:
    if not resource_ids:
        return []
    return list(
        db.scalars(
            select(FileAsset)
            .where(
                FileAsset.campus_id == campus_id,
                FileAsset.resource_type == resource_type,
                FileAsset.resource_id.in_(resource_ids),
            )
            .order_by(FileAsset.created_at, FileAsset.id)
        ).all()
    )


def upload(db: Session, actor: User, file: UploadFile, resource_type: str, resource_id: str | None) -> dict:
    record_id, _can_read, can_upload = _access(db, actor, resource_type, resource_id)
    if not can_upload:
        fail(403, "forbidden", "You do not have permission to attach files to this record.")
    if len(_attached(db, actor.campus_id, resource_type, [record_id])) >= MAX_PER_RECORD:
        fail(409, "too_many_attachments", f"A record can have at most {MAX_PER_RECORD} attachments.")
    content_type = _content_type(file)
    row = store_upload(db, actor, file, resource_type=resource_type, resource_id=record_id, max_bytes=MAX_BYTES)
    row.content_type = content_type
    db.commit()
    db.refresh(row)
    return _public(row)


def list_attached(db: Session, actor: User, resource_type: str, resource_id: str | None) -> list[dict]:
    record_id, can_read, _can_upload = _access(db, actor, resource_type, resource_id)
    if not can_read:
        fail(403, "forbidden", "You do not have permission to see this record's attachments.")
    return [_public(row) for row in _attached(db, actor.campus_id, resource_type, [record_id])]


def can_download(db: Session, actor: User, row: FileAsset) -> bool:
    try:
        _record_id, can_read, _can_upload = _access(db, actor, row.resource_type, row.resource_id)
    except HTTPException:  # the record is gone or belongs elsewhere: nobody but the uploader keeps access
        return False
    return can_read


def task_attachments(db: Session, campus_id, task_ids: list) -> dict[str, list[dict]]:
    """Attachments per task id (one query for any number of tasks)."""
    grouped: dict[str, list[dict]] = {}
    for row in _attached(db, campus_id, TASK_ATTACHMENT, [str(task_id) for task_id in task_ids]):
        grouped.setdefault(row.resource_id, []).append(_public(row))
    return grouped
