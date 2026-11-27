from typing import Any

from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_user, require_any, require_permission
from app.models import User
from app.services import department_requests as department_requests_svc
from app.services import lost_found as lost_found_svc
from app.services import ops_collections as svc
from app.services import stationery_workflow as stationery_svc
from app.services import transport_decisions as transport_decisions_svc

router = APIRouter(prefix="/api/v1/ops", tags=["ops"])


@router.get("/my-transport")
def my_transport_route(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Parent/student view of their own route assignment. Not the campus fleet."""
    return svc.my_transport(db, user)


@router.get("/my-hostel")
def my_hostel_route(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Parent/student view of their own hostel assignment and payments."""
    return svc.my_hostel(db, user)


@router.post("/it-support-tickets/raise", status_code=201)
def raise_ticket_route(
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Any signed-in user raises one IT ticket; it is added without touching the IT team's list."""
    return svc.raise_ticket(db, user, body)


@router.get("/it-support-tickets/mine")
def my_tickets_route(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    """The tickets the signed-in user raised, with their status and history."""
    return svc.my_tickets(db, user)


@router.get("/it-support-tickets/assigned")
def assigned_tickets_route(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    """Tickets currently assigned to the signed-in user."""
    return svc.assigned_tickets(db, user)


@router.get("/it-support-tickets/{ticket_id}/assignable")
def ticket_assignable_route(
    ticket_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    """Department members the ticket can be assigned to (IT / admins / department head only)."""
    return svc.ticket_assignable_users(db, user, ticket_id)


@router.post("/it-support-tickets/{ticket_id}/assign")
def assign_ticket_route(
    ticket_id: str,
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Set the ticket's assignees (user ids or emails of department members); authorised in the service."""
    return svc.assign_ticket(db, user, ticket_id, body)


@router.post("/it-support-tickets/{ticket_id}/status")
def ticket_status_route(
    ticket_id: str,
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Change status/remarks: IT, the owning department, or an assignee of this ticket."""
    return svc.update_ticket_status(db, user, ticket_id, body)


@router.post("/stationery/issue-return")
def stationery_issue_return_route(
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("ops.write")),
) -> dict:
    """Atomic issue/return with inventory update (idempotent via clientRequestId)."""
    return stationery_svc.record_issue_return(db, user, body)


@router.post("/stationery/requests", status_code=201)
def stationery_request_create_route(
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("ops.write")),
) -> dict:
    """Raise a store product request; the server assigns the request number (idempotent via clientRequestId)."""
    return stationery_svc.create_request(db, user, body)


@router.post("/stationery/requests/{request_id}/decide")
def stationery_request_decide_route(
    request_id: str,
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_any("ops.write", "approvals.decide")),
) -> dict:
    """Approve or reject a stationery store request (no self-approval)."""
    return stationery_svc.decide_request(db, user, request_id, body)


@router.post("/stationery/procurement/{procurement_id}/decide")
def stationery_procurement_decide_route(
    procurement_id: str,
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_any("ops.write", "finance.approve", "approvals.decide")),
) -> dict:
    """Role-gated purchase workflow transitions (Store / JD / Finance)."""
    return stationery_svc.decide_procurement(db, user, procurement_id, body)


@router.post("/stationery/procurement/{procurement_id}/receive-goods")
def stationery_receive_goods_route(
    procurement_id: str,
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("ops.write")),
) -> dict:
    """Idempotent GRN — updates inventory once per grnId."""
    return stationery_svc.receive_goods(db, user, procurement_id, body)


@router.get("/lost-found")
def lost_found_list_route(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Lost & Found register plus what the signed-in role may do (roles checked in the service)."""
    return lost_found_svc.list_items(db, user)


@router.post("/lost-found", status_code=201)
def lost_found_create_route(
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Record a found item (Housekeeping / Front Office / admins); the server assigns LF-<year>-<serial>."""
    return lost_found_svc.create_item(db, user, body)


@router.post("/lost-found/{item_id}/claim")
def lost_found_claim_route(
    item_id: str,
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    return lost_found_svc.claim_item(db, user, item_id, body)


@router.post("/lost-found/{item_id}/handover")
def lost_found_handover_route(
    item_id: str,
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    return lost_found_svc.handover_item(db, user, item_id, body)


@router.post("/lost-found/{item_id}/disposal-request")
def lost_found_disposal_request_route(
    item_id: str,
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    return lost_found_svc.request_disposal(db, user, item_id, body)


@router.post("/lost-found/{item_id}/disposal-decision")
def lost_found_disposal_decision_route(
    item_id: str,
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Principal / Director / admins approve or refuse disposal (not the person who requested it)."""
    return lost_found_svc.decide_disposal(db, user, item_id, body)


@router.post("/transport-approval-requests/{request_id}/decide")
def transport_decide_route(
    request_id: str,
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("ops.write")),
) -> dict:
    """Transport Manager (first) / Principal (final) decision; the driver's request is updated server-side."""
    return transport_decisions_svc.decide(db, user, request_id, body)


@router.get("/department-requests")
def department_requests_inbox_route(
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("ops.read")),
) -> dict:
    """Joint Director inbox: Housekeeping / IT / Canteen requests."""
    return department_requests_svc.list_inbox(db, user)


@router.post("/department-requests/{collection}/{request_id}/decide")
def department_request_decide_route(
    collection: str,
    request_id: str,
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("ops.write")),
) -> dict:
    """Joint Director approves or rejects a department request with a remark; the raiser is notified."""
    return department_requests_svc.decide(db, user, collection, request_id, body)


@router.get("/{collection}")
def list_route(
    collection: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("ops.read")),
) -> list[dict]:
    return svc.list_records(db, user, collection)


@router.put("/{collection}/items/{item_id}")
def upsert_item_route(
    collection: str,
    item_id: str,
    body: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("ops.write")),
) -> dict:
    """Save one record of an item-saved collection (Star of the Month) without touching the others."""
    return svc.upsert_record(db, user, collection, item_id, body)


@router.delete("/{collection}/items/{item_id}")
def delete_item_route(
    collection: str,
    item_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("ops.write")),
) -> dict:
    return svc.delete_item(db, user, collection, item_id)


@router.put("/{collection}")
def replace_route(
    collection: str,
    items: list[Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("ops.write")),
) -> list[dict]:
    return svc.replace_records(db, user, collection, items)
