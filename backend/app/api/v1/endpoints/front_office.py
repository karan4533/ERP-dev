from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_user, permission_codes_for, require_permission
from app.models import User
from app.services import front_office as svc
from app.services.errors import fail

router = APIRouter(prefix="/api/v1/front-office", tags=["front-office"])


def _front_office_reader(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    if "frontoffice.read" in permission_codes_for(db, user) or svc.is_supplementary_reader(db, user):
        return user
    fail(403, "forbidden", "You do not have permission for this action.")


@router.get("/parent/hostel-gate-passes")
def parent_hostel_passes_route(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    return svc.list_parent_hostel_passes(db, user)


@router.post("/{collection}/{public_id}/decision")
def decide_route(
    collection: str,
    public_id: str,
    body: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    return svc.decide_record(db, user, collection, public_id, body)


@router.get("/{collection}")
def list_route(
    collection: str,
    db: Session = Depends(get_db),
    user: User = Depends(_front_office_reader),
) -> list[dict]:
    return svc.list_records(db, user, collection)


@router.get("/{collection}/{public_id}")
def get_route(
    collection: str,
    public_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(_front_office_reader),
) -> dict:
    return svc.get_record(db, user, collection, public_id)


@router.post("/{collection}", status_code=201)
def create_route(
    collection: str,
    body: dict,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("frontoffice.write")),
) -> dict:
    return svc.create_record(db, user, collection, body)


@router.put("/{collection}/{public_id}")
def replace_route(
    collection: str,
    public_id: str,
    body: dict,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("frontoffice.write")),
) -> dict:
    return svc.update_record(db, user, collection, public_id, body)


@router.delete("/{collection}/{public_id}", status_code=204)
def delete_route(
    collection: str,
    public_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("frontoffice.write")),
) -> Response:
    svc.delete_record(db, user, collection, public_id)
    return Response(status_code=204)
