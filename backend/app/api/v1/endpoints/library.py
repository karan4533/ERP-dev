from typing import Any

from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_permission
from app.models import User
from app.services import library_workflow as svc

router = APIRouter(prefix="/api/v1/library", tags=["library"])


@router.post("/issues", status_code=201)
def issue_book_route(
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("ops.write")),
) -> dict:
    """Issue one copy to a member: availability and the borrower limit are checked on the server."""
    return svc.issue_book(db, user, body)


@router.post("/issues/{issue_id}/return")
def return_book_route(
    issue_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("ops.write")),
) -> dict:
    return svc.return_book(db, user, issue_id)
