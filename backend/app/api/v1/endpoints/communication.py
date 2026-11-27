from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_permission
from app.models import User
from app.services import communication as svc

router = APIRouter(prefix="/api/v1/communication", tags=["communication"])


class StartIn(BaseModel):
    userId: UUID


class GroupIn(BaseModel):
    userIds: list[UUID]
    title: str | None = None


class FlagsIn(BaseModel):
    archived: bool | None = None
    deleted: bool | None = None


@router.get("/directory")
def directory_route(
    db: Session = Depends(get_db), user: User = Depends(require_permission("communication.read"))
) -> list[dict]:
    return svc.directory(db, user)


@router.get("/conversations")
def list_route(
    db: Session = Depends(get_db), user: User = Depends(require_permission("communication.read"))
) -> list[dict]:
    return svc.list_conversations(db, user)


@router.get("/conversations/{conversation_id}")
def get_route(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("communication.read")),
) -> dict:
    return svc.get_conversation(db, user, conversation_id)


@router.post("/conversations", status_code=201)
def start_route(
    body: StartIn, db: Session = Depends(get_db), user: User = Depends(require_permission("communication.write"))
) -> dict:
    return svc.start_conversation(db, user, body.userId)


@router.post("/conversations/groups", status_code=201)
def group_route(
    body: GroupIn, db: Session = Depends(get_db), user: User = Depends(require_permission("communication.write"))
) -> dict:
    return svc.create_group(db, user, body.userIds, body.title)


@router.post("/conversations/{conversation_id}/messages", status_code=201)
def send_route(
    conversation_id: UUID,
    body: str = Form(""),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("communication.write")),
) -> dict:
    return svc.send(db, user, conversation_id, other_id=None, body=body, upload=file)


@router.post("/messages", status_code=201)
def send_new_route(
    userId: UUID = Form(...),
    body: str = Form(""),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("communication.write")),
) -> dict:
    return svc.send(db, user, None, other_id=userId, body=body, upload=file)


@router.patch("/conversations/{conversation_id}")
def flags_route(
    conversation_id: UUID,
    body: FlagsIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("communication.write")),
) -> dict:
    return svc.set_flags(db, user, conversation_id, archived=body.archived, deleted=body.deleted)
