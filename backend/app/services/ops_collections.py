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
    "transport-vehicle-health": "VHS",
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
    # Hostel (student/parent assignment + payments)
    "hostel-assignments": "HAS",
    "hostel-payments": "HPY",
}

_ADMINS = {"admin", "superadmin", "managing_director"}
_LIBRARY = {"librarian"} | _ADMINS
# PRM shares visitor check-in/out with gate staff (W1 — single SoT gate-visitors).
_GATE = {"gatekeeper", "gatekeepermanager", "prm"} | _ADMINS
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
    if collection.startswith("hostel-"):
        return {"hostelwarden"} | _ADMINS
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
    if collection.startswith("hostel-"):
        return writers | {"principal", "director", "accounthead"}
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


def _norm_token(value: str) -> str:
    return "".join(ch for ch in str(value or "").upper() if ch.isalnum())


def _driver_scope(db: Session, actor: User) -> dict | None:
    """None means no driver filter. A driver only sees rows tied to their driver profile."""
    if _code(db, actor) != "driver":
        return None
    email = (actor.email or "").lower()
    profiles = [
        row for row in _rows(db, actor, "transport-drivers")
        if str(row.get("email") or "").lower() == email
    ]
    return {
        "email": email,
        "vehicles": {_norm_token(row.get("vehicleNumber")) for row in profiles if row.get("vehicleNumber")},
        "routes": {
            str(row.get("routeAssigned") or row.get("routeName") or "").strip().lower()
            for row in profiles
            if row.get("routeAssigned") or row.get("routeName")
        },
        "ids": {str(row.get("id")) for row in profiles if row.get("id")},
    }


def _in_driver_scope(item: dict, scope: dict | None, collection: str) -> bool:
    if scope is None:
        return True
    email = str(item.get("email") or item.get("driverEmail") or "").lower()
    if email and email == scope["email"]:
        return True
    if collection == "transport-drivers" and str(item.get("id") or "") in scope["ids"]:
        return True
    vehicle = _norm_token(item.get("vehicleNumber") or item.get("vehicle") or "")
    if vehicle and vehicle in scope["vehicles"]:
        return True
    route = str(item.get("routeName") or item.get("route") or item.get("routeAssigned") or "").strip().lower()
    if route and route in scope["routes"]:
        return True
    return False


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
    items = [_as_item(row) for row in rows]
    scope = _driver_scope(db, actor) if collection.startswith("transport-") else None
    if scope is None:
        return items
    return [item for item in items if _in_driver_scope(item, scope, collection)]


def replace_records(db: Session, actor: User, collection: str, items: list) -> list[dict]:
    _ensure_collection(collection)
    if not _can_write(db, actor, collection):
        fail(403, "forbidden", "You are not allowed to change ops records.")
    if not isinstance(items, list):
        fail(422, "invalid_body", "Body must be a JSON array.")

    previous = _rows(db, actor, collection)
    scope = _driver_scope(db, actor) if collection.startswith("transport-") else None
    if scope is not None:
        for raw in items:
            if not isinstance(raw, dict) or not _in_driver_scope(raw, scope, collection):
                fail(403, "forbidden", "You can only change your assigned vehicle, route, or duty.")
        kept = [
            row for row in _rows(db, actor, collection)
            if not _in_driver_scope(row, scope, collection)
        ]
        items = [*kept, *items]

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
    saved = list_records(db, actor, collection)
    from app.services.integrations.events import notify_saved_ops
    notify_saved_ops(db, actor, collection, previous, saved)
    return saved


def _rows(db: Session, actor: User, collection: str) -> list[dict]:
    rows = db.scalars(
        select(OpsRecord).where(
            OpsRecord.campus_id == actor.campus_id,
            OpsRecord.collection == collection,
        )
    ).all()
    return [_as_item(row) for row in rows]


def _plate_key(value: object) -> str:
    return "".join(ch for ch in str(value or "").upper() if ch.isalnum())


def _gps_imei(row: dict | None) -> str:
    if not isinstance(row, dict):
        return ""
    return str(row.get("gpsImei") or row.get("imei") or "").strip()


def _with_gps_imei(row: dict, vehicles_by_id: dict[str, dict], vehicles_by_plate: dict[str, dict]) -> dict:
    """Attach gpsImei/imei from the row, linked vehicle id, or plate match."""
    imei = _gps_imei(row)
    vehicle = None
    vehicle_id = str(row.get("vehicleId") or "").strip()
    if vehicle_id:
        vehicle = vehicles_by_id.get(vehicle_id)
    if vehicle is None:
        vehicle = vehicles_by_plate.get(_plate_key(row.get("vehicleNumber") or row.get("vehicle")))
    if not imei and vehicle:
        imei = _gps_imei(vehicle)
    if not imei:
        return row
    enriched = dict(row)
    enriched["imei"] = imei
    enriched["gpsImei"] = imei
    if vehicle and not enriched.get("vehicleNumber") and vehicle.get("vehicleNumber"):
        enriched["vehicleNumber"] = vehicle.get("vehicleNumber")
    return enriched


def my_transport(db: Session, actor: User) -> dict:
    """Assignments for the signed-in parent or student only."""
    from app.models import Student
    from app.services.finance import _child_student_ids_for_actor

    code = role_code_for(db, actor)
    if code not in {"parent", "student"}:
        fail(403, "forbidden", "Parent or student role required.")

    allowed_ids = _child_student_ids_for_actor(db, actor)
    students = []
    if allowed_ids:
        students = db.scalars(select(Student).where(Student.campus_id == actor.campus_id)).all()
        students = [row for row in students if str(row.id) in allowed_ids]
    keys = set(allowed_ids)
    for row in students:
        if row.admission_number:
            keys.add(str(row.admission_number))

    assignments = [
        row for row in _rows(db, actor, "transport-student-assignments")
        if str(row.get("studentId") or row.get("student_id") or "") in keys
    ]
    route_ids = {str(row.get("routeId") or row.get("route") or "") for row in assignments}
    routes = [
        row for row in _rows(db, actor, "transport-routes")
        if str(row.get("id") or "") in route_ids or str(row.get("routeName") or row.get("name") or "") in route_ids
    ]
    vehicles = _rows(db, actor, "transport-vehicles")
    vehicles_by_id = {str(row.get("id") or ""): row for row in vehicles if row.get("id")}
    vehicles_by_plate = {
        _plate_key(row.get("vehicleNumber")): row
        for row in vehicles
        if _plate_key(row.get("vehicleNumber"))
    }
    routes = [_with_gps_imei(row, vehicles_by_id, vehicles_by_plate) for row in routes]
    assignments = [_with_gps_imei(row, vehicles_by_id, vehicles_by_plate) for row in assignments]
    # Prefer route IMEI onto the assignment when the enrollment row has none.
    routes_by_id = {str(row.get("id") or ""): row for row in routes}
    routes_by_name = {
        str(row.get("routeName") or row.get("name") or "").strip().lower(): row
        for row in routes
        if (row.get("routeName") or row.get("name"))
    }
    enriched_assignments = []
    for row in assignments:
        imei = _gps_imei(row)
        if not imei:
            route = routes_by_id.get(str(row.get("routeId") or row.get("route") or ""))
            if route is None:
                route = routes_by_name.get(str(row.get("routeName") or "").strip().lower())
            if route:
                row = _with_gps_imei({**row, **{k: route.get(k) for k in ("gpsImei", "imei", "vehicleId", "vehicleNumber") if route.get(k)}}, vehicles_by_id, vehicles_by_plate)
        enriched_assignments.append(row)

    # Active duties for today — Parent/Student Track Bus only while not completed.
    from datetime import datetime

    today = datetime.now().astimezone().strftime("%d-%m-%Y")
    today_alt = datetime.now().astimezone().strftime("%d/%m/%Y")
    route_names = {
        str(row.get("routeName") or row.get("name") or "").strip().lower()
        for row in routes
        if row.get("routeName") or row.get("name")
    }
    route_ids_set = {str(row.get("id") or "") for row in routes if row.get("id")}
    for row in enriched_assignments:
        if row.get("routeName"):
            route_names.add(str(row.get("routeName")).strip().lower())
        if row.get("routeId"):
            route_ids_set.add(str(row.get("routeId")))

    def _duty_date_ok(value: object) -> bool:
        text = str(value or "").strip()
        return text in {today, today_alt} or text.replace("/", "-") == today

    def _duty_active(row: dict) -> bool:
        """Open duties for today (Assigned waiting to start, or In Progress live)."""
        if row.get("trackingActive") is False:
            return False
        status = str(row.get("dutyStatus") or row.get("status") or "").strip()
        if status in {"Completed", "Cancelled", "Done"}:
            return False
        # Include Assigned so parents can see "waiting for driver Start".
        return status in {"", "Assigned", "In Progress", "Started"} or row.get("trackingActive") is True

    active_duties = []
    for row in _rows(db, actor, "transport-duties"):
        if not _duty_date_ok(row.get("dutyDate") or row.get("date")):
            continue
        if not _duty_active(row):
            continue
        rid = str(row.get("routeId") or "")
        rname = str(row.get("routeName") or "").strip().lower()
        if rid and rid in route_ids_set:
            active_duties.append(row)
            continue
        if rname and rname in route_names:
            active_duties.append(row)

    return {
        "assignments": enriched_assignments,
        "routes": routes,
        "vehicles": vehicles,
        "activeDuties": active_duties,
        "studentCount": len(students),
        "trackingDate": today,
    }


def _hostel_row_keys(row: dict) -> set[str]:
    return {
        str(value).strip()
        for value in (
            row.get("studentId"),
            row.get("student_id"),
            row.get("admissionNumber"),
            row.get("admissionNo"),
            row.get("admission_number"),
        )
        if value
    }


def my_hostel(db: Session, actor: User) -> dict:
    """Hostel assignment + payments for the signed-in parent or student only."""
    from app.services.finance import _child_student_ids_for_actor

    code = role_code_for(db, actor)
    if code not in {"parent", "student"}:
        fail(403, "forbidden", "Parent or student role required.")

    allowed_ids = set(_child_student_ids_for_actor(db, actor) or [])
    from app.models import Student

    if allowed_ids:
        students = db.scalars(select(Student).where(Student.campus_id == actor.campus_id)).all()
        for row in students:
            if str(row.id) in allowed_ids and row.admission_number:
                allowed_ids.add(str(row.admission_number))

    assignments = [
        row
        for row in _rows(db, actor, "hostel-assignments")
        if _hostel_row_keys(row) & allowed_ids
    ]
    payments = [
        row
        for row in _rows(db, actor, "hostel-payments")
        if _hostel_row_keys(row) & allowed_ids
    ]
    return {"assignments": assignments, "payments": payments}

