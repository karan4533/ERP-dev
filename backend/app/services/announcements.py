"""Announcements: a staff role sends a notice to a set of audience roles.

Rules the server enforces (the screen only shows what comes back):
- Who may send is the ``announcements.write`` permission; who sees a notice is its audience (role codes), the
  sender's own role, the person who created it, and Super Admin / Managing Director. Anyone else gets 404.
- ``Sent By`` is the sender's role name, set here - the client cannot name someone else.
- The audience is the school's default broadcast list; it is never taken from the request.
- One optional attachment (PDF, JPG or PNG, up to 5 MB, content checked). It downloads only for people who
  can see the announcement.
- A reader acknowledges at most once, and may leave replies. The sender (and anyone who can send) sees all
  replies; everyone else sees only their own.
- Creating a notice fans a notification out to each audience role except the sender's, and is audited.
"""

from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.deps import permission_codes_for, role_code_for
from app.models import Announcement, AnnouncementReply, AnnouncementResponse, FileAsset, User
from app.models.base import utcnow
from app.permissions.matrix import ALL_ROLES
from app.services import files as file_service
from app.services.approvals import _notify
from app.services.audit import write_audit
from app.services.errors import fail

CATEGORIES = [
    "Administrative Notice",
    "Staff Notice",
    "Examination",
    "General Announcement",
    "Emergency",
    "Policy Update",
    "Holiday Announcement",
    "Training Announcement",
    "Internal Job Opening",
    "HR Circular",
]
# mirrors DEFAULT_BROADCAST_AUDIENCE in src/Common/Announcement/announcementData.js
DEFAULT_AUDIENCE = [
    "director",
    "principal",
    "prm",
    "pro",
    "teacher",
    "coordinator",
    "librarian",
    "student",
    "parent",
    "gatekeepermanager",
    "gatekeeper",
    "admin",
    "housekeepingmanager",
    "maintenancemanager",
    "stationerystoremanager",
    "canteenmanager",
    "itsupportmanager",
    "transportmanager",
]
SEE_ALL_ROLES = {"superadmin", "managing_director"}
ROLE_NAMES = dict(ALL_ROLES)
TITLE_MAX = 200
MESSAGE_MAX = 5000
REPLY_MAX = 1000
DATE_WINDOW_DAYS = 365


def _can_write(db: Session, actor: User) -> bool:
    return "announcements.write" in permission_codes_for(db, actor)


def _visible(row: Announcement, actor: User, role: str) -> bool:
    audience = row.audience or []
    if role in SEE_ALL_ROLES or role in audience or row.sender_role == role or row.created_by == actor.id:
        return True
    # Parents receive the same school notices that target students unless a parent audience is set.
    if role == "parent" and "student" in audience:
        return True
    return False


def _find(db: Session, actor: User, ref: str) -> Announcement:
    """The announcement named by its code (AN-0001) or id, if this person may see it."""
    row = None
    try:
        row = db.get(Announcement, UUID(ref))
    except ValueError:
        row = db.scalar(
            select(Announcement).where(Announcement.campus_id == actor.campus_id, Announcement.code == ref.strip().upper())
        )
    if row is None or row.campus_id != actor.campus_id or not _visible(row, actor, role_code_for(db, actor)):
        fail(404, "not_found", "Announcement not found.")
    return row


def _attachment(db: Session, row: Announcement) -> FileAsset | None:
    return db.get(FileAsset, row.attachment_file_id) if row.attachment_file_id else None


def _out(db: Session, row: Announcement, *, acknowledged_at=None, replies: list[dict] | None = None) -> dict:
    file = _attachment(db, row)
    data = {
        "id": row.code,
        "uuid": str(row.id),
        "title": row.title,
        "category": row.category,
        "message": row.message,
        "sentBy": row.sent_by,
        "senderRole": row.sender_role,
        "announcementDate": row.announcement_date.isoformat(),
        "attachmentName": file.original_name if file else "",
        "attachmentUrl": f"/api/v1/files/{file.id}/download" if file else "",
        "acknowledged": acknowledged_at is not None,
        "acknowledgedAt": acknowledged_at.isoformat() if acknowledged_at else None,
        "createdAt": row.created_at.isoformat(),
    }
    if replies is not None:
        data["replies"] = replies
    return data


def _my_acknowledgements(db: Session, actor: User) -> dict:
    rows = db.execute(
        select(AnnouncementResponse.announcement_id, AnnouncementResponse.acknowledged_at).where(
            AnnouncementResponse.user_id == actor.id
        )
    ).all()
    return {announcement_id: stamp for announcement_id, stamp in rows}


def list_announcements(db: Session, actor: User) -> list[dict]:
    role = role_code_for(db, actor)
    mine = _my_acknowledgements(db, actor)
    rows = db.scalars(
        select(Announcement)
        .where(Announcement.campus_id == actor.campus_id)
        .order_by(Announcement.announcement_date.desc(), Announcement.created_at.desc())
    ).all()
    return [_out(db, row, acknowledged_at=mine.get(row.id)) for row in rows if _visible(row, actor, role)]


def _replies_for(db: Session, actor: User, row: Announcement) -> list[dict]:
    query = select(AnnouncementReply).where(AnnouncementReply.announcement_id == row.id).order_by(
        AnnouncementReply.created_at
    )
    sees_all = row.created_by == actor.id or _can_write(db, actor)
    if not sees_all:
        query = query.where(AnnouncementReply.user_id == actor.id)
    return [
        {"text": reply.text, "by": reply.role_code, "at": reply.created_at.isoformat(), "mine": reply.user_id == actor.id}
        for reply in db.scalars(query).all()
    ]


def get_announcement(db: Session, actor: User, ref: str) -> dict:
    row = _find(db, actor, ref)
    return _out(
        db, row, acknowledged_at=_my_acknowledgements(db, actor).get(row.id), replies=_replies_for(db, actor, row)
    )


def _next_number(db: Session, campus_id) -> int:
    codes = db.scalars(select(Announcement.code).where(Announcement.campus_id == campus_id)).all()
    return max((int(code.split("-")[1]) for code in codes if code.startswith("AN-") and code[3:].isdigit()), default=0) + 1


def create(
    db: Session,
    actor: User,
    *,
    title: str,
    category: str,
    message: str,
    announcement_date: date | None,
    upload: UploadFile | None,
) -> dict:
    if not _can_write(db, actor):
        fail(403, "forbidden", "You are not allowed to send announcements.")
    title = (title or "").strip()
    message = (message or "").strip()
    if not title:
        fail(422, "title_required", "Announcement title is required.")
    if len(title) > TITLE_MAX:
        fail(422, "title_too_long", f"Announcement title can be at most {TITLE_MAX} characters.")
    if category not in CATEGORIES:
        fail(422, "invalid_category", "Choose one of the announcement categories.")
    if not message:
        fail(422, "message_required", "Announcement message is required.")
    if len(message) > MESSAGE_MAX:
        fail(422, "message_too_long", f"Announcement message can be at most {MESSAGE_MAX} characters.")
    today = date.today()
    when = announcement_date or today
    if abs((when - today).days) > DATE_WINDOW_DAYS:
        fail(422, "invalid_date", "Announcement date must be within a year of today.")

    role = role_code_for(db, actor)
    stored = None
    try:
        if upload is not None and upload.filename:
            stored = file_service.store_upload(
                db,
                actor,
                upload,
                resource_type="announcement",
                max_bytes=file_service.DOCUMENT_MAX_BYTES,
                allowed_signatures=file_service.DOCUMENT_SIGNATURES,
            )
        row = None
        for _attempt in range(5):
            candidate = Announcement(
                campus_id=actor.campus_id,
                code=f"AN-{_next_number(db, actor.campus_id):04d}",
                title=title,
                category=category,
                message=message,
                sent_by=ROLE_NAMES.get(role, role)[:80],
                sender_role=role,
                announcement_date=when,
                attachment_file_id=stored.id if stored else None,
                audience=list(DEFAULT_AUDIENCE),
                created_by=actor.id,
            )
            try:
                with db.begin_nested():
                    db.add(candidate)
                    db.flush()
                row = candidate
                break
            except IntegrityError:
                continue  # another sender took that number first: take the next one
        if row is None:
            fail(409, "code_conflict", "Could not number the announcement. Please try again.")
        if stored:
            stored.resource_id = row.code
        for audience_role in row.audience:
            if audience_role == role:
                continue
            _notify(
                db,
                campus_id=actor.campus_id,
                title=f"New announcement: {row.title[:80]}",
                body=f"{row.category} - sent by {row.sent_by}.",
                entity_type="announcement",
                entity_id=row.code,
                role_code=audience_role,
            )
        write_audit(
            db,
            action="ANNOUNCEMENT_CREATED",
            entity_type="announcement",
            entity_id=str(row.id),
            actor_id=actor.id,
            campus_id=actor.campus_id,
            details=row.code,
        )
        db.commit()
    except Exception:
        db.rollback()
        if stored is not None:
            file_service.discard_stored_bytes(stored)
        raise
    from app.services.integrations.events import notify_roles
    notify_roles(
        db,
        campus_id=actor.campus_id,
        role_codes=[code for code in row.audience if code != role],
        event_key=f"announcement:{row.id}",
        subject=f"QMIS ERP announcement: {row.title[:80]}",
        body=f"{row.category}. Open QMIS ERP to read the full announcement.",
    )
    return _out(db, row, replies=[])


def acknowledge(db: Session, actor: User, ref: str) -> dict:
    row = _find(db, actor, ref)
    existing = db.scalar(
        select(AnnouncementResponse).where(
            AnnouncementResponse.announcement_id == row.id, AnnouncementResponse.user_id == actor.id
        )
    )
    if existing is None:
        existing = AnnouncementResponse(announcement_id=row.id, user_id=actor.id, acknowledged_at=utcnow())
        db.add(existing)
        write_audit(
            db,
            action="ANNOUNCEMENT_ACKNOWLEDGED",
            entity_type="announcement",
            entity_id=str(row.id),
            actor_id=actor.id,
            campus_id=actor.campus_id,
            details=row.code,
        )
        db.commit()
    return _out(db, row, acknowledged_at=existing.acknowledged_at, replies=_replies_for(db, actor, row))


def reply(db: Session, actor: User, ref: str, text: str) -> dict:
    row = _find(db, actor, ref)
    text = (text or "").strip()
    if not text:
        fail(422, "reply_required", "Write a reply first.")
    if len(text) > REPLY_MAX:
        fail(422, "reply_too_long", f"A reply can be at most {REPLY_MAX} characters.")
    db.add(AnnouncementReply(announcement_id=row.id, user_id=actor.id, role_code=role_code_for(db, actor), text=text))
    write_audit(
        db,
        action="ANNOUNCEMENT_REPLIED",
        entity_type="announcement",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=row.code,
    )
    db.commit()
    return get_announcement(db, actor, ref)


def authorize_file_download(db: Session, actor: User, file: FileAsset) -> None:
    """An announcement's attachment is for the people who can see the announcement; other files are unchanged."""
    row = db.scalar(select(Announcement).where(Announcement.attachment_file_id == file.id))
    if row is not None and not _visible(row, actor, role_code_for(db, actor)):
        fail(404, "not_found", "File was not found.")