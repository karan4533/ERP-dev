from typing import Any

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_permission
from app.models import User
from app.services import campus_audit_collections as svc

router = APIRouter(prefix="/api/v1/campus-audit", tags=["campus-audit"])


# Department-head recipients do not hold campus_audit.*; the service limits them to their own
# role's assigned observations (svc.RECIPIENT_ROLES) and rejects every other role.
@router.get("/assigned/observations")
def assigned_observations_route(
    stream: str | None = Query(None, description="process | quality (both when omitted)"),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("campus_audit.respond")),
) -> list[dict]:
    return svc.list_assigned_observations(db, user, stream)


@router.post("/assigned/{stream}/observations/{observation_id}/corrective-action")
def submit_corrective_action_route(
    stream: str,
    observation_id: str,
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("campus_audit.respond")),
) -> dict:
    return svc.submit_corrective_action(db, user, stream, observation_id, body)


@router.get("/{collection}")
def list_route(
    collection: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("campus_audit.read")),
) -> list[dict]:
    return svc.list_records(db, user, collection)


@router.put("/{collection}")
def replace_route(
    collection: str,
    items: list[Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("campus_audit.write")),
) -> list[dict]:
    return svc.replace_records(db, user, collection, items)
