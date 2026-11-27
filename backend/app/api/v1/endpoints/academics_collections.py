from typing import Any

from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_permission
from app.models import User
from app.services import academics_collections as svc

router = APIRouter(prefix="/api/v1/academics", tags=["academics"])


@router.get("/{collection}")
def list_route(
    collection: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("academics.read")),
) -> list[dict]:
    return svc.list_records(db, user, collection)


@router.put("/{collection}")
def replace_route(
    collection: str,
    items: list[Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("academics.write")),
) -> list[dict]:
    return svc.replace_records(db, user, collection, items)


@router.patch("/extra-classes/{record_id}")
def update_extra_class_route(
    record_id: str,
    patch: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("academics.write")),
) -> dict:
    return svc.update_extra_class(db, user, record_id, patch)


@router.delete("/{collection}/{record_id}")
def delete_route(
    collection: str,
    record_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("academics.write")),
) -> dict:
    return svc.delete_record(db, user, collection, record_id)
