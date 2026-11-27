"""Inbox threads between people on the same campus: two-person chats and small groups.

Who may message whom (no project document defines a narrower rule):
- staff may message anyone active on their own campus;
- parents and students may only message staff, never another parent or student;
- a group follows its creator's rule, so a parent or student can only start a group of staff.
Only members of a conversation can read it, send to it or download its attachments.
"""

from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.deps import permission_codes_for, role_code_for
from app.models import Conversation, ConversationParticipant, FileAsset, HrEmployee, Message, Role, User
from app.models.base import utcnow
from app.permissions.matrix import ALL_ROLES
from app.services import files as file_service
from app.services.approvals import _notify
from app.services.audit import write_audit
from app.services.errors import fail

ROLE_NAMES = dict(ALL_ROLES)
BODY_MAX = 4000
TITLE_MAX = 120
GROUP_MIN_OTHERS = 2
GROUP_MAX_MEMBERS = 50
NON_STAFF_ROLES = frozenset({"parent", "student"})
COLORS = ["#515DEF", "#DB2777", "#0C1E5B", "#0891B2", "#7C3AED", "#059669", "#B45309", "#EA580C"]


def _has(db: Session, actor: User, code: str) -> bool:
    return code in permission_codes_for(db, actor)


def _is_staff(db: Session, user: User) -> bool:
    return role_code_for(db, user) not in NON_STAFF_ROLES


def _may_message(db: Session, actor: User, other: User) -> bool:
    return _is_staff(db, actor) or _is_staff(db, other)


def _refuse_recipient() -> None:
    fail(403, "recipient_not_allowed", "Parents and students can only message school staff.")


def _person(db: Session, user: User) -> dict:
    role = db.get(Role, user.role_id)
    employee = db.scalar(select(HrEmployee).where(HrEmployee.user_id == user.id))
    name = (
        f"{employee.first_name} {employee.last_name}".strip()
        if employee
        else (user.email.split("@")[0].replace(".", " ").title())
    )
    return {
        "id": str(user.id),
        "name": name,
        "email": user.email,
        "employeeId": employee.employee_code if employee else "",
        "role": ROLE_NAMES.get(role.code, role.code) if role else "",
        "department": (employee.department or "") if employee else "",
        "avatarColor": COLORS[int(user.id.hex[:2], 16) % len(COLORS)],
    }


def directory(db: Session, actor: User) -> list[dict]:
    if not _has(db, actor, "communication.read"):
        fail(403, "forbidden", "You are not allowed to view the inbox.")
    query = select(User).where(User.campus_id == actor.campus_id, User.is_active.is_(True), User.id != actor.id)
    if not _is_staff(db, actor):
        query = query.join(Role, Role.id == User.role_id).where(Role.code.not_in(NON_STAFF_ROLES))
    people = db.scalars(query).all()
    return sorted((_person(db, user) for user in people), key=lambda item: item["name"].lower())


def _pair_key(a: UUID, b: UUID) -> str:
    left, right = sorted((str(a), str(b)))
    return f"{left}:{right}"


def _ensure_participants(db: Session, conversation: Conversation, *user_ids: UUID) -> None:
    existing = {
        row.user_id
        for row in db.scalars(
            select(ConversationParticipant).where(ConversationParticipant.conversation_id == conversation.id)
        ).all()
    }
    for user_id in user_ids:
        if user_id not in existing:
            db.add(ConversationParticipant(conversation_id=conversation.id, user_id=user_id))
            existing.add(user_id)


def _mine(db: Session, conversation: Conversation, actor: User) -> ConversationParticipant | None:
    return db.scalar(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation.id,
            ConversationParticipant.user_id == actor.id,
        )
    )


def _member_of(db: Session, actor: User, conversation_id: UUID) -> tuple[Conversation, ConversationParticipant]:
    row = db.get(Conversation, conversation_id)
    if row is None or row.campus_id != actor.campus_id:
        fail(404, "not_found", "Conversation not found.")
    mine = _mine(db, row, actor)
    if mine is None:
        fail(403, "not_a_member", "You are not a member of this conversation.")
    return row, mine


def _other(db: Session, conversation: Conversation, actor: User) -> User | None:
    row = db.scalar(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation.id,
            ConversationParticipant.user_id != actor.id,
        )
    )
    return db.get(User, row.user_id) if row else None


def _members(db: Session, conversation: Conversation) -> list[User]:
    return list(
        db.scalars(
            select(User)
            .join(ConversationParticipant, ConversationParticipant.user_id == User.id)
            .where(ConversationParticipant.conversation_id == conversation.id)
        ).all()
    )


def _last_message(db: Session, conversation: Conversation) -> Message | None:
    return db.scalar(
        select(Message).where(Message.conversation_id == conversation.id).order_by(Message.created_at.desc())
    )


def _unread(db: Session, conversation: Conversation, mine: ConversationParticipant) -> int:
    query = select(func.count()).select_from(Message).where(
        Message.conversation_id == conversation.id, Message.sender_id != mine.user_id
    )
    if mine.last_read_at is not None:
        query = query.where(Message.created_at > mine.last_read_at)
    return db.scalar(query) or 0


def _file_out(db: Session, file_id) -> dict | None:
    if not file_id:
        return None
    file = db.get(FileAsset, file_id)
    if file is None:
        return None
    return {
        "name": file.original_name,
        "type": file.content_type,
        "size": f"{file.size_bytes} B",
        "url": f"/api/v1/files/{file.id}/download",
    }


def _message_out(db: Session, message: Message, *, read: bool, people: dict[str, dict] | None = None) -> dict:
    file = _file_out(db, message.file_id)
    kind = "file" if file else "text"
    if file and (file["type"] or "").startswith("image/"):
        kind = "image"
    sender = (people or {}).get(str(message.sender_id))
    return {
        "id": str(message.id),
        "senderId": str(message.sender_id),
        "senderName": sender["name"] if sender else "",
        "type": kind,
        "content": message.body,
        "createdAt": message.created_at.isoformat(),
        "status": "read" if read else "delivered",
        "attachment": file,
    }


def _group_title(conversation: Conversation, people: list[dict], actor: User) -> str:
    if conversation.title:
        return conversation.title
    names = sorted(person["name"] for person in people if person["id"] != str(actor.id))
    label = ", ".join(names[:3])
    return f"{label} +{len(names) - 3}" if len(names) > 3 else label or "Group"


def _conversation_out(db: Session, conversation: Conversation, actor: User, *, with_messages: bool = False) -> dict:
    mine = _mine(db, conversation, actor)
    people = [_person(db, user) for user in _members(db, conversation)]
    people.sort(key=lambda item: item["name"].lower())
    by_id = {person["id"]: person for person in people}
    participant = None
    if not conversation.is_group:
        participant = next((person for person in people if person["id"] != str(actor.id)), None)
    last = _last_message(db, conversation)
    unread = _unread(db, conversation, mine) if mine else 0
    messages = []
    if with_messages:
        rows = db.scalars(
            select(Message).where(Message.conversation_id == conversation.id).order_by(Message.created_at)
        ).all()
        cutoff = mine.last_read_at if mine else None
        messages = [
            _message_out(db, message, read=cutoff is not None and message.created_at <= cutoff, people=by_id)
            for message in rows
        ]
    return {
        "id": str(conversation.id),
        "isGroup": bool(conversation.is_group),
        "title": _group_title(conversation, people, actor) if conversation.is_group else (participant or {}).get("name", ""),
        "createdBy": str(conversation.created_by_id) if conversation.created_by_id else None,
        "participant": participant,
        "participants": people,
        "lastMessage": (last.body if last and last.body else (last and _file_out(db, last.file_id) or {}).get("name") or ""),
        "lastMessageAt": last.created_at.isoformat() if last else conversation.created_at.isoformat(),
        "unreadCount": unread,
        "archived": bool(mine.archived) if mine else False,
        "deleted": bool(mine.deleted) if mine else False,
        "messages": messages,
    }


def list_conversations(db: Session, actor: User) -> list[dict]:
    if not _has(db, actor, "communication.read"):
        fail(403, "forbidden", "You are not allowed to view the inbox.")
    ids = db.scalars(
        select(ConversationParticipant.conversation_id).where(ConversationParticipant.user_id == actor.id)
    ).all()
    rows = (
        db.scalars(
            select(Conversation).where(Conversation.id.in_(ids), Conversation.campus_id == actor.campus_id)
        ).all()
        if ids
        else []
    )
    listed = [_conversation_out(db, row, actor) for row in rows]
    listed.sort(key=lambda item: item["lastMessageAt"], reverse=True)
    return listed


def _open(db: Session, actor: User, other_id: UUID) -> Conversation:
    if other_id == actor.id:
        fail(422, "invalid_recipient", "You cannot message yourself.")
    other = db.get(User, other_id)
    if other is None or other.campus_id != actor.campus_id or not other.is_active:
        fail(404, "not_found", "That person was not found.")
    if not _may_message(db, actor, other):
        _refuse_recipient()
    key = _pair_key(actor.id, other.id)
    row = db.scalar(select(Conversation).where(Conversation.campus_id == actor.campus_id, Conversation.pair_key == key))
    if row is None:
        row = Conversation(campus_id=actor.campus_id, pair_key=key, created_by_id=actor.id)
        db.add(row)
        db.flush()
    _ensure_participants(db, row, actor.id, other.id)
    db.flush()
    mine = _mine(db, row, actor)
    if mine and mine.deleted:
        mine.deleted = False
        mine.archived = False
    return row


def get_conversation(db: Session, actor: User, conversation_id: UUID) -> dict:
    if not _has(db, actor, "communication.read"):
        fail(403, "forbidden", "You are not allowed to view the inbox.")
    row, mine = _member_of(db, actor, conversation_id)
    last = _last_message(db, row)
    if last:
        mine.last_read_at = last.created_at
        db.commit()
    return _conversation_out(db, row, actor, with_messages=True)


def start_conversation(db: Session, actor: User, other_id: UUID) -> dict:
    if not _has(db, actor, "communication.write"):
        fail(403, "forbidden", "You are not allowed to send messages.")
    row = _open(db, actor, other_id)
    db.commit()
    return _conversation_out(db, row, actor, with_messages=True)


def create_group(db: Session, actor: User, user_ids: list[UUID], title: str | None) -> dict:
    """Start one conversation with several people; the creator is always a member."""
    if not _has(db, actor, "communication.write"):
        fail(403, "forbidden", "You are not allowed to send messages.")
    title = (title or "").strip()
    if len(title) > TITLE_MAX:
        fail(422, "title_too_long", f"A group name can be at most {TITLE_MAX} characters.")
    others = list(dict.fromkeys(user_id for user_id in user_ids if user_id != actor.id))
    if len(others) < GROUP_MIN_OTHERS:
        fail(422, "group_too_small", "Choose at least two other people to start a group.")
    if len(others) + 1 > GROUP_MAX_MEMBERS:
        fail(422, "group_too_large", f"A group can have at most {GROUP_MAX_MEMBERS} members.")
    found = {
        user.id: user
        for user in db.scalars(select(User).where(User.id.in_(others))).all()
        if user.campus_id == actor.campus_id and user.is_active
    }
    if len(found) != len(others):
        fail(404, "not_found", "One or more of those people were not found.")
    if any(not _may_message(db, actor, user) for user in found.values()):
        _refuse_recipient()
    row = Conversation(
        campus_id=actor.campus_id,
        pair_key=f"group:{uuid4().hex}",
        is_group=True,
        title=title or None,
        created_by_id=actor.id,
    )
    db.add(row)
    db.flush()
    _ensure_participants(db, row, actor.id, *others)
    write_audit(
        db, action="CONVERSATION_GROUP_CREATED", entity_type="conversation", entity_id=str(row.id),
        actor_id=actor.id, campus_id=actor.campus_id, details=f"{len(others) + 1} members",
    )
    db.commit()
    return _conversation_out(db, row, actor, with_messages=True)


def send(db: Session, actor: User, conversation_id: UUID | None, *, other_id: UUID | None, body: str, upload: UploadFile | None) -> dict:
    if not _has(db, actor, "communication.write"):
        fail(403, "forbidden", "You are not allowed to send messages.")
    body = (body or "").strip()
    if len(body) > BODY_MAX:
        fail(422, "message_too_long", f"A message can be at most {BODY_MAX} characters.")
    if not body and (upload is None or not upload.filename):
        fail(422, "empty_message", "Write a message or attach a file.")
    if conversation_id:
        row, mine = _member_of(db, actor, conversation_id)
        if not row.is_group:
            other = _other(db, row, actor)
            if other is not None and not _may_message(db, actor, other):
                _refuse_recipient()
        if mine.deleted:
            mine.deleted = False
    else:
        if other_id is None:
            fail(422, "recipient_required", "Choose someone to message.")
        row = _open(db, actor, other_id)
    stored = None
    try:
        if upload is not None and upload.filename:
            stored = file_service.store_upload(
                db,
                actor,
                upload,
                resource_type="message",
                resource_id=str(row.id),
                max_bytes=file_service.DOCUMENT_MAX_BYTES,
                allowed_signatures=file_service.DOCUMENT_SIGNATURES,
            )
        message = Message(conversation_id=row.id, sender_id=actor.id, body=body, file_id=stored.id if stored else None)
        db.add(message)
        db.flush()
        mine = _mine(db, row, actor)
        mine.last_read_at = message.created_at
        recipients = db.scalars(
            select(ConversationParticipant).where(
                ConversationParticipant.conversation_id == row.id,
                ConversationParticipant.user_id != actor.id,
            )
        ).all()
        if recipients:
            sender_name = _person(db, actor)["name"]
            preview = body[:120] if body else ((stored.original_name if stored else None) or "Attachment")
            heading = (
                f"{sender_name} in {row.title or 'a group conversation'}"
                if row.is_group
                else f"New message from {sender_name}"
            )
            for recipient in recipients:
                # A new message brings a thread the recipient deleted or archived back into their inbox.
                recipient.deleted = False
                recipient.archived = False
                _notify(
                    db,
                    campus_id=actor.campus_id,
                    title=heading,
                    body=preview,
                    entity_type="conversation",
                    entity_id=str(row.id),
                    user_id=recipient.user_id,
                )
        write_audit(
            db, action="MESSAGE_SENT", entity_type="conversation", entity_id=str(row.id),
            actor_id=actor.id, campus_id=actor.campus_id, details=str(message.id),
        )
        db.commit()
    except Exception:
        db.rollback()
        if stored is not None:
            file_service.discard_stored_bytes(stored)
        raise
    return _conversation_out(db, row, actor, with_messages=True)


def set_flags(db: Session, actor: User, conversation_id: UUID, *, archived: bool | None, deleted: bool | None) -> dict:
    if not _has(db, actor, "communication.write"):
        fail(403, "forbidden", "You are not allowed to change conversations.")
    row, mine = _member_of(db, actor, conversation_id)
    if archived is not None:
        mine.archived = archived
    if deleted is not None:
        mine.deleted = deleted
    db.commit()
    return _conversation_out(db, row, actor)


def authorize_file_download(db: Session, actor: User, file: FileAsset) -> None:
    message = db.scalar(select(Message).where(Message.file_id == file.id))
    if message is None:
        return
    conversation = db.get(Conversation, message.conversation_id)
    if conversation is None or conversation.campus_id != actor.campus_id or _mine(db, conversation, actor) is None:
        fail(404, "not_found", "File was not found.")
