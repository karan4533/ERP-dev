from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_any, require_permission
from app.models import User
from app.services import finance as svc
from app.services import finance_actions as actions

router = APIRouter(prefix="/api/v1/finance", tags=["finance"])


@router.get("/state")
def get_finance_state(
    db: Session = Depends(get_db),
    user: User = Depends(require_any("finance.read", "finance.write", "finance.collect")),
) -> dict:
    return svc.get_state(db, user)


@router.put("/state")
def put_finance_state(
    body: dict = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("finance.write")),
) -> dict:
    return svc.save_state(db, user, body)


@router.post("/state/reset")
def reset_finance_state(
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("finance.write")),
) -> dict:
    return svc.reset_state(db, user)


@router.post("/actions/collect-payment")
def collect_payment_route(
    body: dict = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_any("finance.collect", "finance.write")),
) -> dict:
    return actions.collect_payment(db, user, body)


@router.post("/actions/settle-cheque")
def settle_cheque_route(
    body: dict = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_any("finance.collect", "finance.write")),
) -> dict:
    return actions.settle_cheque(db, user, body)


@router.post("/actions/send-receipt")
def send_receipt_route(
    body: dict = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_any("finance.collect", "finance.write")),
) -> dict:
    return actions.send_receipt(db, user, body)


@router.post("/actions/gateway-intent")
def gateway_intent_route(
    body: dict = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_any("finance.collect", "finance.write")),
) -> dict:
    return actions.create_gateway_intent(db, user, body)


@router.post("/actions/gateway-confirm")
def gateway_confirm_route(
    body: dict = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_any("finance.approve", "finance.write")),
) -> dict:
    return actions.confirm_gateway_payment(db, user, body)


@router.post("/actions/apply-hr-concessions")
def apply_hr_concessions_route(
    db: Session = Depends(get_db),
    user: User = Depends(require_any("finance.approve", "finance.write")),
) -> dict:
    return actions.apply_hr_concessions(db, user)


@router.post("/actions/post-payroll-voucher")
def post_payroll_voucher_route(
    body: dict = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_any("finance.write", "finance.approve", "hr.write")),
) -> dict:
    return actions.post_payroll_voucher(db, user, body)


@router.post("/actions/decide-approval")
def decide_approval_route(
    body: dict = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_any("finance.approve", "finance.write")),
) -> dict:
    return actions.decide_approval(db, user, body)


@router.get("/{collection}")
def list_finance_collection(
    collection: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_any("finance.read", "finance.write", "finance.collect")),
) -> list:
    return svc.list_collection(db, user, collection)


@router.put("/{collection}")
def replace_finance_collection(
    collection: str,
    body: list = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("finance.write")),
) -> list:
    return svc.replace_collection(db, user, collection, body)
