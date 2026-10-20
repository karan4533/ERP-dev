"""Campus ops collections: library, gate, transport, stores, JD chrome data, biometric."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.deps import role_code_for
from app.models import OpsRecord, User
from app.services.errors import fail

# prefix → short id code for generated public ids
COLLECTIONS: dict[str, str] = {
    # Library
    "library-books": "LBK",
    "library-issues": "LIS",
    "library-members": "LMB",
    # Gate
    "gate-visitors": "GVS",
    "gate-registers": "GRG",
    "gate-handover": "GHO",
    "gate-vendors": "GVD",
    "gate-incidents": "GIN",
    "gate-duties": "GDU",
    "gate-duty-assignments": "GDA",
    "gate-team-attendance": "GTA",
    # Transport + Driver
    "transport-drivers": "TDR",
    "transport-vehicles": "TVH",
    "transport-routes": "TRT",
    "transport-route-stops": "TRS",
    "transport-student-assignments": "TSA",
    "transport-duties": "TDU",
    "transport-maintenance": "TMN",
    "transport-expenses": "TEX",
    "transport-budget-requests": "TBR",
    "transport-approval-requests": "TAR",
    "transport-service-centers": "TSC",
    "transport-building-maintenance": "TBM",
    "transport-driver-fuel": "TDF",
    "transport-driver-maintenance": "TDM",
    "transport-student-attendance": "TST",
    "transport-driver-my-duties": "TDY",
    # Canteen
    "canteen-menu": "CMN",
    "canteen-inventory": "CIV",
    "canteen-orders": "COR",
    "canteen-requests": "CRQ",
    "canteen-reports": "CRP",
    # IT
    "it-assets": "ITA",
    "it-asset-service": "ITS",
    "it-asset-transfers": "ITT",
    "it-support-tickets": "ITK",
    "it-maintenance-inventory": "ITI",
    "it-requests": "IRQ",
    "it-procurement": "IPC",
    # Stationery
    "stationery-inventory": "SIV",
    "stationery-issue-returns": "SIR",
    "stationery-requests": "SRQ",
    "stationery-requirements": "SRQ2",
    "stationery-stock-issues": "SSI",
    "stationery-critical-alerts": "SCA",
    "stationery-procurement": "SPC",
    # Housekeeping
    "hk-inventory": "HIV",
    "hk-requests": "HRQ",
    "hk-duty-allotments": "HDA",
    "hk-schedules": "HSCH",
    "hk-star-of-month": "HSOM",
    "hk-ro-testing": "HRO",
    "hk-lost-found": "HLF",
    "hk-inventory-requirements": "HIR",
    "hk-procurement": "HPC",
    # Shared stores
    "shared-inventory": "INV",
    "shared-inventory-movements": "IMV",
    "shared-inventory-requirements": "IRQ2",
    "shared-procurement": "PRC",
    # JD / JDA
    "jd-meetings": "JDM",
    "jd-request-approvals": "JDA",
    "jd-escalations": "JDE",
    "jd-assets": "JDS",
    "jd-employee-views": "JDV",
    "jd-tasks": "JDT",
    # Biometric (Wave 8)
    "biometric-attendance": "BIO",
}

_ADMINS = {"admin", "superadmin", "managing_director"}
_LIBRARY = {"librarian"} | _ADMINS
_GATE = {"gatekeeper", "gatekeepermanager"} | _ADMINS
_TRANSPORT = {"transportmanager", "driver"} | _ADMINS
# Principal final-approves maintenance/fuel requests and posts the linked expense.
_TRANSPORT_PRINCIPAL_WRITE = {
    "transport-approval-requests",
    "transport-expenses",
    "transport-maintenance",
}
# Account Head sets per-route Transport Fee amounts from Fee Management.
_TRANSPORT_FINANCE_WRITE = {
    "transport-routes",
}
_CANTEEN = {"canteenmanager"} | _ADMINS
_IT = {"itsupportmanager"} | _ADMINS
_STATIONERY = {"stationerystoremanager"} | _ADMINS
_HK = {"housekeepingmanager"} | _ADMINS
_STORES = _CANTEEN | _IT | _STATIONERY | _HK
_JD = {"jointdirector", "jointdirectorassistant"} | _ADMINS
_BIOMETRIC = {"teacher", "coordinator", "principal", "director", "hr"} | _ADMINS


def _writers_for(collection: str) -> set[str]:
    if collection.startswith("library-"):
        return _LIBRARY
    if collection.startswith("gate-"):
        return _GATE
    if collection.startswith("transport-"):
        writers = set(_TRANSPORT)
        if collection in _TRANSPORT_PRINCIPAL_WRITE:
            writers |= {"principal", "director"}
        if collection in _TRANSPORT_FINANCE_WRITE:
            writers |= {"accounthead", "finance_assistant"}
        return writers
    if collection.startswith("canteen-"):
        return _CANTEEN
    if collection.startswith("it-"):
        return _IT
    if collection.startswith("stationery-"):
        return _STATIONERY
    if collection.startswith("hk-"):
        return _HK
    if collection.startswith("shared-"):
        return _STORES
    if collection.startswith("jd-"):
        return _JD
    if collection == "biometric-attendance":
        return _BIOMETRIC
    return _ADMINS


def _readers_for(collection: str) -> set[str]:
    writers = _writers_for(collection)
    if collection.startswith("gate-"):
        return writers | {"prm", "principal", "director"}
    if collection.startswith("transport-"):
        # Account Head needs routes/drivers/vehicles for Transport Finance dropdowns.
        return writers | {"principal", "director", "jointdirector", "accounthead"}
    if collection.startswith("jd-"):
        return writers | {"jointdirectoraudit", "principal", "director"}
    if collection == "biometric-attendance":
        return writers | {"parent", "student"}
    # Teachers/coordinators need library issues/members to show Books Borrowed.
    if collection.startswith("library-"):
        return writers | {"principal", "director", "jointdirector", "teacher", "coordinator"}
    return writers | {"principal", "director", "jointdirector"}


def _code(db: Session, actor: User) -> str:
    return role_code_for(db, actor)


def _ensure_collection(collection: str) -> None:
    if collection not in COLLECTIONS:
        fail(404, "not_found", "That ops collection does not exist.")


def _can_read(db: Session, actor: User, collection: str) -> bool:
    return _code(db, actor) in _readers_for(collection)


def _can_write(db: Session, actor: User, collection: str) -> bool:
    return _code(db, actor) in _writers_for(collection)


def _as_item(row: OpsRecord) -> dict:
    body = dict(row.body or {})
    body["id"] = row.public_id
    body.setdefault("id", row.public_id)
    body["_collection"] = row.collection
    body["_updatedAt"] = row.updated_at.isoformat() if row.updated_at else None
    body["_createdAt"] = row.created_at.isoformat() if row.created_at else None
    return body


def _public_id_for(collection: str, body: dict, fallback: str) -> str:
    for key in ("id", "menuId", "employeeId", "ticketId", "assetId", "bookId", "memberId"):
        value = body.get(key)
        if value:
            return str(value).strip()
    return fallback


def list_records(db: Session, actor: User, collection: str) -> list[dict]:
    _ensure_collection(collection)
    if not _can_read(db, actor, collection):
        fail(403, "forbidden", "You are not allowed to view ops records.")
    rows = db.scalars(
        select(OpsRecord)
        .where(
            OpsRecord.campus_id == actor.campus_id,
            OpsRecord.collection == collection,
        )
        .order_by(OpsRecord.created_at.desc())
    ).all()
    return [_as_item(row) for row in rows]


def replace_records(db: Session, actor: User, collection: str, items: list) -> list[dict]:
    _ensure_collection(collection)
    if not _can_write(db, actor, collection):
        fail(403, "forbidden", "You are not allowed to change ops records.")
    if not isinstance(items, list):
        fail(422, "invalid_body", "Body must be a JSON array.")

    db.execute(
        delete(OpsRecord).where(
            OpsRecord.campus_id == actor.campus_id,
            OpsRecord.collection == collection,
        )
    )

    now = datetime.now(timezone.utc)
    prefix = COLLECTIONS[collection]
    seen: set[str] = set()
    for index, raw in enumerate(items):
        if not isinstance(raw, dict):
            fail(422, "invalid_body", "Each item must be an object.")
        fallback = f"{prefix}-{index + 1:04d}"
        public_id = _public_id_for(collection, raw, fallback)
        if not public_id:
            fail(422, "invalid_body", "Each item needs an id.")
        if public_id in seen:
            fail(422, "duplicate", f"Duplicate id in payload: {public_id}")
        seen.add(public_id)
        payload = {**raw, "id": public_id}
        db.add(
            OpsRecord(
                id=uuid.uuid4(),
                campus_id=actor.campus_id,
                collection=collection,
                public_id=public_id,
                body=payload,
                created_by=actor.id,
                updated_at=now,
            )
        )

    db.commit()
    return list_records(db, actor, collection)
