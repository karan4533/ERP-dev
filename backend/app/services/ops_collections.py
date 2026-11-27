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
    "library-book-requests": "LBR",
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
    "hk-tasks": "HTSK",
    "hk-checklists": "HCL",
    "hk-star-of-month": "HSOM",
    "hk-ro-testing": "HRO",
    "hk-lost-found": "HLF",
    "hk-inventory-requirements": "HIR",
    "hk-procurement": "HPC",
    # Maintenance (Facilities) — separate from Housekeeping hk-*
    "maint-requests": "MRQ",
    "maint-duty-allotments": "MDA",
    "maint-schedules": "MSCH",
    "maint-checklists": "MCL",
    "maint-inventory": "MINV",
    "maint-inventory-requirements": "MIR",
    "maint-procurement": "MPC",
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
    # Star of the Month matrix: one record per month/year/grade/section; school-wide checklist + titles.
    "som-matrix": "SOM",
    "som-config": "SOMC",
    # Camera register (records only; no video is handled by the ERP).
    "security-cameras": "CAM",
    # Non-Academics — File Room / CCTV / PRO (JSON campus collections).
    "fileroom-register": "FRG",
    "fileroom-issues": "FIS",
    "cctv-footage-requests": "CFR",
    "cctv-camera-status": "CCS",
    "pro-gov-cases": "PGC",
}

_ADMINS = {"admin", "superadmin", "managing_director"}
_LIBRARY = {"librarian"} | _ADMINS
_GATE = {"gatekeeper", "gatekeepermanager"} | _ADMINS
_TRANSPORT = {"transportmanager", "driver"} | _ADMINS
_FILE_ROOM = {"fileroom"} | _ADMINS
_CCTV_ROOM = {"cctv"} | _ADMINS
_PRO = {"pro"} | _ADMINS
# Dept Head / JD / MD approve footage and sensitive file access (Non-Academics §4.14–4.15).
_APPROVER_CHAIN = {"principal", "director", "jointdirector", "managing_director"} | _ADMINS
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
# Department managers may create/track product requests; Store still decides/issues.
_STATIONERY_REQUESTORS = {
    "housekeepingmanager",
    "maintenancemanager",
    "transportmanager",
    "itsupportmanager",
    "canteenmanager",
} | _ADMINS
_HK = {"housekeepingmanager"} | _ADMINS
_MAINT = {"maintenancemanager"} | _ADMINS
# Multi-department ticket inbox roles (shared it-support-tickets collection).
_TICKET_DEPT_ROLES = {
    "itsupportmanager",
    "housekeepingmanager",
    "maintenancemanager",
    "stationerystoremanager",
    "transportmanager",
    "canteenmanager",
    "prm",
    "hr",
    "accounthead",
    "financemanager",
}
_STORES = _CANTEEN | _IT | _STATIONERY | _HK | _MAINT
_JD = {"jointdirector", "jointdirectorassistant"} | _ADMINS
_BIOMETRIC = {"teacher", "coordinator", "principal", "director", "hr"} | _ADMINS
_STAR_OF_MONTH = {"teacher", "coordinator", "principal", "director"} | _ADMINS


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
            writers |= {"accounthead", "financemanager", "finance_assistant", "accountassistant"}
        return writers
    if collection.startswith("canteen-"):
        return _CANTEEN
    if collection == "it-support-tickets":
        # Multi-department ticket inbox: each department head can manage tickets routed to them.
        return _IT | _TICKET_DEPT_ROLES
    if collection.startswith("it-"):
        return _IT
    if collection == "stationery-requests":
        return _STATIONERY | _STATIONERY_REQUESTORS
    if collection.startswith("stationery-"):
        return _STATIONERY
    if collection.startswith("hk-"):
        return _HK
    if collection.startswith("maint-"):
        return _MAINT
    if collection.startswith("shared-"):
        return _STORES
    if collection.startswith("jd-"):
        return _JD
    if collection == "biometric-attendance":
        return _BIOMETRIC
    if collection.startswith("hostel-"):
        return {"hostelwarden"} | _ADMINS
    if collection.startswith("som-"):
        return _STAR_OF_MONTH
    if collection == "security-cameras":
        # Camera Room may update daily working/not-working status; Admin/GKM retain full write.
        return _ADMINS | {"gatekeepermanager", "cctv"}
    if collection.startswith("fileroom-"):
        writers = set(_FILE_ROOM)
        if collection == "fileroom-issues":
            writers |= _APPROVER_CHAIN
        return writers
    if collection.startswith("cctv-"):
        writers = set(_CCTV_ROOM) | {"gatekeepermanager"}
        if collection == "cctv-footage-requests":
            writers |= _APPROVER_CHAIN
        return writers
    if collection.startswith("pro-"):
        return set(_PRO) | _APPROVER_CHAIN
    return _ADMINS


def _readers_for(collection: str) -> set[str]:
    writers = _writers_for(collection)
    if collection.startswith("gate-"):
        return writers | {"prm", "pro", "principal", "director"}
    if collection.startswith("transport-"):
        # Finance roles need routes/drivers/vehicles for Transport Finance dropdowns.
        return writers | {"principal", "director", "jointdirector", "accounthead", "financemanager", "accountassistant"}
    if collection.startswith("jd-"):
        return writers | {"jointdirectoraudit", "principal", "director"}
    if collection == "biometric-attendance":
        return writers | {"parent", "student"}
    if collection.startswith("hostel-"):
        return writers | {"principal", "director", "accounthead", "financemanager"}
    # Teachers/coordinators need library issues/members to show Books Borrowed.
    if collection.startswith("library-"):
        return writers | {"principal", "director", "jointdirector", "teacher", "coordinator"}
    if collection == "stationery-requests":
        return writers | _STATIONERY_REQUESTORS | {"principal", "director", "jointdirector"}
    # CCTV Room portal: camera register + footage/status collections.
    if collection == "security-cameras" or collection.startswith("cctv-"):
        return writers | {"principal", "director", "jointdirector", "cctv", "gatekeepermanager"}
    if collection.startswith("fileroom-"):
        return writers | {"principal", "director", "jointdirector", "pro", "hr"}
    if collection.startswith("pro-"):
        return writers | {"principal", "director", "jointdirector", "managing_director"}
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
    for key in (
        "id",
        "itemId",
        "requestId",
        "dutyId",
        "menuId",
        "employeeId",
        "ticketId",
        "assetId",
        "bookId",
        "memberId",
    ):
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


def _filter_gatekeeper_duties(db: Session, actor: User, items: list[dict]) -> list[dict]:
    """Gate Keepers only see their own duty assignments (match email / assignee user id)."""
    if _code(db, actor) != "gatekeeper":
        return items
    email = (actor.email or "").strip().lower()
    uid = str(actor.id)
    if not email:
        return []
    matched = []
    for item in items:
        row_email = str(
            item.get("assigneeEmail")
            or item.get("email")
            or item.get("employeeId")
            or ""
        ).strip().lower()
        row_uid = str(item.get("assigneeUserId") or item.get("userId") or "").strip()
        # Prefer stable identity fields; display-name-only matches are not enough for isolation.
        if (email and row_email == email) or (row_uid and row_uid == uid):
            matched.append(item)
    return matched


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
    if collection == "gate-duty-assignments":
        items = _filter_gatekeeper_duties(db, actor, items)
    if collection == "stationery-requests":
        from app.services.stationery_workflow import filter_requests_for_reader

        items = filter_requests_for_reader(db, actor, items)
    if collection == IT_TICKETS:
        items = _scope_tickets(db, actor, items)
    scope = _driver_scope(db, actor) if collection.startswith("transport-") else None
    if scope is None:
        return items
    return [item for item in items if _in_driver_scope(item, scope, collection)]


def _guard_ledger_write(collection: str) -> None:
    """Stock movements and library loans are written only by their dedicated server actions."""
    from app.services.library_workflow import guard_issue_write
    from app.services.lost_found import guard_generic_write as guard_lost_found_write
    from app.services.stationery_workflow import guard_movement_write

    guard_movement_write(collection)
    guard_issue_write(collection)
    guard_lost_found_write(collection)


def _guard_workflow_list_save(db: Session, actor: User, collection: str, previous: list[dict], items: list) -> list:
    """Whole-list saves keep server-owned decision fields (procurement, JD department requests, transport)."""
    from app.services import department_requests, transport_decisions
    from app.services.stationery_workflow import PROCUREMENT, guard_procurement_save

    if collection == PROCUREMENT:
        return guard_procurement_save(db, actor, previous, items)
    items = department_requests.guard_list_save(db, actor, collection, previous, items)
    return transport_decisions.guard_list_save(db, actor, collection, previous, items)


def replace_records(db: Session, actor: User, collection: str, items: list) -> list[dict]:
    _ensure_collection(collection)
    _guard_ledger_write(collection)
    if collection in _ITEM_UPSERT_COLLECTIONS:
        # A whole-list PUT would erase other people's records (e.g. other classes' matrices).
        fail(400, "not_supported", "Save this collection one record at a time.")
    if not _can_write(db, actor, collection):
        fail(403, "forbidden", "You are not allowed to change ops records.")
    if collection == IT_TICKETS and _code(db, actor) not in _IT:
        # Department inboxes only see their own tickets, so a whole-list save would erase other departments'.
        fail(403, "forbidden", "Update tickets one at a time from your department inbox.")
    if not isinstance(items, list):
        fail(422, "invalid_body", "Body must be a JSON array.")

    previous = _rows(db, actor, collection)
    items = _guard_workflow_list_save(db, actor, collection, previous, items)
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
    if collection == IT_TICKETS:
        items = _keep_raised_tickets(previous, items)

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
    if collection == "transport-approval-requests":
        from app.services.transport_decisions import sync_after_list_save

        sync_after_list_save(db, actor, previous, saved)
    from app.services.integrations.events import notify_saved_ops
    notify_saved_ops(db, actor, collection, previous, saved)
    return saved


IT_TICKETS = "it-support-tickets"
TICKET_CATEGORIES = {
    "Hardware",
    "Software",
    "Network",
    "Printer",
    "Housekeeping",
    "Facilities / Maintenance",
    "Stationery / Stores",
    "Transport",
    "Canteen",
    "Other",
}
TICKET_PRIORITIES = {"Low", "Medium", "High", "Critical"}
_DEPARTMENT_QUEUES = {
    "IT Support": "IT Queue",
    "Housekeeping": "Housekeeping Queue",
    "Facilities": "Facilities Queue",
    "Stationery Store": "Stationery Queue",
    "Transport": "Transport Queue",
    "Canteen": "Canteen Queue",
    "Academics": "Academics Queue",
    "Front Office": "Front Office Queue",
    "HR": "HR Queue",
    "Finance": "Finance Queue",
    "General": "General Queue",
}
_REQUESTER_FIELDS = ("requesterUserId", "requesterEmail", "requesterName", "requesterRole", "raisedVia")
# Department inbox owners. IT Support and admins run the central helpdesk and see every ticket.
TICKET_DEPARTMENT_ROLES = {
    "Housekeeping": {"housekeepingmanager"},
    "Facilities": {"maintenancemanager"},
    "Stationery Store": {"stationerystoremanager"},
    "Transport": {"transportmanager"},
    "Canteen": {"canteenmanager"},
    "Front Office": {"prm"},
    "HR": {"hr"},
    "Finance": {"accounthead", "financemanager"},
}
_TICKET_IMMUTABLE_FIELDS = (*_REQUESTER_FIELDS, "ticketId", "createdAt", "createdDate", "department")
# Changed only through POST /ops/it-support-tickets/{id}/assign, never by a record save.
_TICKET_ASSIGNMENT_FIELDS = ("assignees", "assigneeUserIds")
# Legacy request/stored names → canonical field (see raise_ticket docstring).
_TICKET_ALIASES = {"title": "subject", "ticketTitle": "subject", "ticketNumber": "ticketId", "category": "issueType"}
TICKET_STATUSES = {
    "Open",
    "Raised",
    "Assigned",
    "In Progress",
    "Pending",
    "Resolved",
    "Confirmed by Requester",
    "Closed",
}
_TICKET_MAX_ASSIGNEES = 10


def _ticket_departments_for(code: str) -> set[str] | None:
    """None = every department (IT helpdesk / admins / read-only oversight); otherwise the role's own inboxes."""
    if code in _IT:
        return None
    owned = {dept for dept, roles in TICKET_DEPARTMENT_ROLES.items() if code in roles}
    return owned if owned else None


def _ticket_owner_roles(department: str) -> set[str]:
    """Roles that own a department's queue. Departments without their own inbox are run by IT Support."""
    return set(TICKET_DEPARTMENT_ROLES.get(department) or {"itsupportmanager"})


def _can_manage_ticket(code: str, department: str) -> bool:
    """IT helpdesk / admins, or the head (owner role) of the ticket's department."""
    return code in _IT or code in TICKET_DEPARTMENT_ROLES.get(department, set())


def _canonical_department(value: str) -> str:
    wanted = value.strip().lower()
    for name in _DEPARTMENT_QUEUES:
        if name.lower() == wanted:
            return name
    fail(422, "invalid_body", f"Department must be one of: {', '.join(sorted(_DEPARTMENT_QUEUES))}.")
    return ""


def _canonical_ticket(item: dict) -> dict:
    """Return the canonical ticket shape whatever legacy names a stored or incoming row used."""
    ticket = dict(item)
    for alias, field in _TICKET_ALIASES.items():
        value = ticket.pop(alias, None)
        if value not in (None, "") and ticket.get(field) in (None, ""):
            ticket[field] = value
    if not ticket.get("ticketId") and ticket.get("id"):
        ticket["ticketId"] = ticket["id"]
    assignees = [entry for entry in (ticket.get("assignees") or []) if isinstance(entry, dict)]
    ticket["assignees"] = assignees
    ticket["assigneeUserIds"] = [str(entry.get("userId")) for entry in assignees if entry.get("userId")]
    ticket.setdefault("history", [])
    return ticket


def _scope_tickets(db: Session, actor: User, items: list[dict]) -> list[dict]:
    departments = _ticket_departments_for(_code(db, actor))
    items = [_canonical_ticket(item) for item in items]
    if departments is None:
        return items
    return [item for item in items if str(item.get("department") or "") in departments]


def _merge_ticket_history(existing: list, incoming: list) -> list:
    """History is append-only: earlier entries can never be edited or removed by a later save."""
    existing = [entry for entry in (existing or []) if isinstance(entry, dict)]
    incoming = [entry for entry in (incoming or []) if isinstance(entry, dict)]
    if incoming[: len(existing)] == existing:
        return existing + incoming[len(existing):]
    return existing + [entry for entry in incoming if entry not in existing]


def _guard_ticket_upsert(db: Session, actor: User, row: OpsRecord | None, payload: dict) -> dict:
    code = _code(db, actor)
    if row is None:
        fail(400, "use_raise_endpoint", "Raise new tickets with POST /ops/it-support-tickets/raise.")
    existing = dict(row.body or {})
    departments = _ticket_departments_for(code)
    if departments is not None and str(existing.get("department") or "") not in departments:
        fail(403, "forbidden", "This ticket belongs to another department.")
    payload = _canonical_ticket(payload)
    for field in _TICKET_IMMUTABLE_FIELDS:
        if field in existing:
            payload[field] = existing[field]
    for field in _TICKET_ASSIGNMENT_FIELDS:
        payload[field] = list(existing.get(field) or [])
    if payload["assignees"]:
        # With named assignees the label is derived from them; free text only labels unassigned tickets.
        payload["assignedTo"] = existing.get("assignedTo")
    payload["history"] = _merge_ticket_history(existing.get("history"), payload.get("history"))
    return payload


def _keep_raised_tickets(previous: list[dict], items: list) -> list:
    """A whole-list save by IT must not drop a ticket someone raised meanwhile, change who raised it,
    rewrite its history or bypass the assign endpoint."""
    by_id = {str(row.get("id")): row for row in previous}
    stored = {public_id: row for public_id, row in by_id.items() if row.get("requesterUserId")}
    incoming: set[str] = set()
    merged = []
    for raw in items:
        if not isinstance(raw, dict):
            merged.append(raw)
            continue
        raw = _canonical_ticket(raw)
        public_id = _public_id_for(IT_TICKETS, raw, "")
        incoming.add(public_id)
        origin = by_id.get(public_id)
        if origin is not None:
            raw = {**raw, **{key: origin[key] for key in _REQUESTER_FIELDS if key in origin}}
            for field in _TICKET_ASSIGNMENT_FIELDS:
                raw[field] = list(origin.get(field) or [])
            if raw["assignees"]:
                raw["assignedTo"] = origin.get("assignedTo")
            raw["history"] = _merge_ticket_history(origin.get("history"), raw.get("history"))
        merged.append(raw)
    missing = [row for public_id, row in stored.items() if public_id not in incoming]
    return [*merged, *missing]


def _ticket_text(body: dict, key: str, *, limit: int, required: bool = False) -> str:
    value = str(body.get(key) or "").strip()
    if required and not value:
        fail(422, "invalid_body", f"{key} is required.")
    if len(value) > limit:
        fail(422, "invalid_body", f"{key} can be at most {limit} characters.")
    return value


def _requester_name(db: Session, actor: User) -> str:
    from app.models import HrEmployee

    employee = db.scalar(select(HrEmployee).where(HrEmployee.user_id == actor.id))
    if employee is not None:
        label = f"{employee.first_name or ''} {employee.last_name or ''}".strip()
        if label:
            return label
    return actor.email or "Staff"


def raise_ticket(db: Session, actor: User, body: dict) -> dict:
    """Any signed-in user raises ONE ticket; the server sets the number, requester and initial status.

    Canonical request (POST /ops/it-support-tickets/raise):
        subject*, description*, department (one of _DEPARTMENT_QUEUES, default "General"),
        issueType (TICKET_CATEGORIES, default "Hardware"), priority (TICKET_PRIORITIES, default "Medium"),
        assetId, attachmentName.
        Legacy aliases accepted on input: title / ticketTitle -> subject, category -> issueType.
        Client ids (ticketId, ticketNumber, id), requester fields, status and assignment are ignored.

    Canonical response (every ticket endpoint):
        id == ticketId ("TKT-<year>-<serial>", server-generated, unique per campus), subject, description,
        department, location, issueType, priority, status, assignedTo (display label: assignee names or the
        department queue), assignees [{userId, email, name, role}], assigneeUserIds [userId],
        requesterUserId, requesterEmail, requesterName, requesterRole, raisedVia, createdDate, createdAt,
        remarks, assetId, attachmentName, outsideService, printerMaintenance,
        history [{at, event, note, byUserId?, byEmail?}] (append-only).
    """
    from sqlalchemy.exc import IntegrityError

    from app.permissions.matrix import ALL_ROLES
    from app.services.approvals import _notify
    from app.services.audit import write_audit

    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    body = _canonical_ticket({key: body[key] for key in body if key not in {"ticketId", "ticketNumber", "id"}})
    subject = _ticket_text(body, "subject", limit=200, required=True)
    description = _ticket_text(body, "description", limit=2000, required=True)
    department = _canonical_department(_ticket_text(body, "department", limit=80) or "General")
    asset_id = _ticket_text(body, "assetId", limit=40)
    attachment = _ticket_text(body, "attachmentName", limit=120)
    category = str(body.get("issueType") or "Hardware").strip()
    priority = str(body.get("priority") or "Medium").strip()
    if category not in TICKET_CATEGORIES:
        fail(422, "invalid_body", f"Category must be one of: {', '.join(sorted(TICKET_CATEGORIES))}.")
    if priority not in TICKET_PRIORITIES:
        fail(422, "invalid_body", f"Priority must be one of: {', '.join(sorted(TICKET_PRIORITIES))}.")

    role = _code(db, actor)
    now = datetime.now(timezone.utc)
    prefix = f"TKT-{now.year}-"
    payload = {
        "requesterUserId": str(actor.id),
        "requesterEmail": actor.email or "",
        "requesterName": _requester_name(db, actor),
        "requesterRole": dict(ALL_ROLES).get(role, role),
        "raisedVia": "self-service",
        "department": department,
        "location": department,
        "issueType": category,
        "priority": priority,
        "assignedTo": _DEPARTMENT_QUEUES[department],
        "assignees": [],
        "assigneeUserIds": [],
        "status": "Open",
        "createdDate": now.date().isoformat(),
        "createdAt": now.isoformat(),
        "subject": subject,
        "description": description,
        "remarks": "",
        "assetId": asset_id,
        "attachmentName": attachment,
        "outsideService": False,
        "printerMaintenance": False,
        "history": [{"at": now.isoformat(), "event": "Created", "note": subject}],
    }
    row = None
    # Unique (campus, collection, public_id) constraint + retry: a concurrent raise that takes the same
    # number makes this flush fail, and the next attempt re-reads the highest number.
    for _attempt in range(10):
        taken = [
            str(item.get("ticketId") or item.get("id") or "")
            for item in _rows(db, actor, IT_TICKETS)
        ]
        serial = max(
            (int(code[len(prefix):]) for code in taken if code.startswith(prefix) and code[len(prefix):].isdigit()),
            default=0,
        ) + 1
        ticket_id = f"{prefix}{serial:04d}"
        candidate = OpsRecord(
            id=uuid.uuid4(),
            campus_id=actor.campus_id,
            collection=IT_TICKETS,
            public_id=ticket_id,
            body={**payload, "id": ticket_id, "ticketId": ticket_id},
            created_by=actor.id,
            updated_at=now,
        )
        try:
            with db.begin_nested():
                db.add(candidate)
                db.flush()
            row = candidate
            break
        except IntegrityError:
            continue  # another requester took that number first: take the next one
    if row is None:
        fail(409, "code_conflict", "Could not number the ticket. Please try again.")
    # IT runs the helpdesk; the owning department inbox is told as well so the ticket is actually picked up.
    for role_code in sorted({"itsupportmanager", *_ticket_owner_roles(department)}):
        _notify(
            db,
            campus_id=actor.campus_id,
            title=f"New ticket {row.public_id}: {subject[:80]}",
            body=f"{priority} priority - {department} - raised by {payload['requesterRole']}.",
            entity_type="it_ticket",
            entity_id=row.public_id,
            role_code=role_code,
        )
    write_audit(
        db,
        action="IT_TICKET_RAISED",
        entity_type="it_ticket",
        entity_id=row.public_id,
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{category}/{priority}",
    )
    db.commit()
    db.refresh(row)
    return _canonical_ticket(_as_item(row))


def _campus_tickets(db: Session, actor: User) -> list[OpsRecord]:
    return db.scalars(
        select(OpsRecord)
        .where(OpsRecord.campus_id == actor.campus_id, OpsRecord.collection == IT_TICKETS)
        .order_by(OpsRecord.created_at.desc())
    ).all()


def my_tickets(db: Session, actor: User) -> list[dict]:
    """Tickets this person raised, newest first; nobody else's."""
    mine = str(actor.id)
    return [
        _canonical_ticket(_as_item(row))
        for row in _campus_tickets(db, actor)
        if str((row.body or {}).get("requesterUserId") or "") == mine
    ]


def assigned_tickets(db: Session, actor: User) -> list[dict]:
    """Tickets currently assigned to the signed-in user, newest first."""
    mine = str(actor.id)
    return [
        _canonical_ticket(_as_item(row))
        for row in _campus_tickets(db, actor)
        if mine in _canonical_ticket(row.body or {})["assigneeUserIds"]
    ]


def _locked_ticket(db: Session, actor: User, ticket_id: str, *, lock: bool = True) -> OpsRecord:
    query = select(OpsRecord).where(
        OpsRecord.campus_id == actor.campus_id,
        OpsRecord.collection == IT_TICKETS,
        OpsRecord.public_id == str(ticket_id or "").strip(),
    )
    row = db.scalar(query.with_for_update() if lock else query)
    if row is None:
        fail(404, "not_found", "Ticket not found.")
    return row


def _ticket_member(db: Session, user: User, role_code: str) -> dict:
    return {"userId": str(user.id), "email": user.email or "", "name": _requester_name(db, user), "role": role_code}


def _department_members(db: Session, campus_id, department: str) -> list[dict]:
    """Active campus users whose role owns the department queue (the people a ticket can be assigned to)."""
    from app.models import Role

    rows = db.execute(
        select(User, Role.code)
        .join(Role, Role.id == User.role_id)
        .where(
            User.campus_id == campus_id,
            User.is_active.is_(True),
            Role.code.in_(sorted(_ticket_owner_roles(department))),
        )
        .order_by(User.email)
    ).all()
    return [_ticket_member(db, user, code) for user, code in rows]


def ticket_assignable_users(db: Session, actor: User, ticket_id: str) -> list[dict]:
    """Members of the ticket's department, for the assignee picker. Only people who may assign can ask."""
    row = _locked_ticket(db, actor, ticket_id, lock=False)
    department = str((row.body or {}).get("department") or "")
    if not _can_manage_ticket(_code(db, actor), department):
        fail(403, "forbidden", "Only IT Support or the department head can assign this ticket.")
    return _department_members(db, actor.campus_id, department)


def _actor_stamp(actor: User, now: datetime) -> dict:
    return {"at": now.isoformat(), "byUserId": str(actor.id), "byEmail": actor.email or ""}


def assign_ticket(db: Session, actor: User, ticket_id: str, body: dict) -> dict:
    """Assign a ticket to one or more members of its department (user ids or emails); [] unassigns.

    Only IT Support / admins or the owning department head may assign. Each change appends a history entry.
    """
    from app.services.approvals import _notify
    from app.services.audit import write_audit

    if not isinstance(body, dict) or not isinstance(body.get("assignees"), list):
        fail(422, "invalid_body", "assignees must be a list of user ids or emails.")
    wanted = [str(value or "").strip() for value in body["assignees"]]
    if any(not value for value in wanted):
        fail(422, "invalid_body", "Each assignee must be a user id or email.")
    if len(set(wanted)) > _TICKET_MAX_ASSIGNEES:
        fail(422, "invalid_body", f"A ticket can have at most {_TICKET_MAX_ASSIGNEES} assignees.")
    note = _ticket_text(body, "note", limit=500)

    row = _locked_ticket(db, actor, ticket_id)
    ticket = _canonical_ticket(row.body or {})
    department = str(ticket.get("department") or "")
    if not _can_manage_ticket(_code(db, actor), department):
        fail(403, "forbidden", "Only IT Support or the department head can assign this ticket.")

    members = _department_members(db, actor.campus_id, department)
    by_key = {}
    for member in members:
        by_key[member["userId"].lower()] = member
        if member["email"]:
            by_key[member["email"].lower()] = member
    chosen: list[dict] = []
    unknown: list[str] = []
    for value in wanted:
        member = by_key.get(value.lower())
        if member is None:
            unknown.append(value)
        elif member not in chosen:
            chosen.append(member)
    if unknown:
        fail(422, "invalid_assignee", f"Not an active member of {department}: {', '.join(unknown)}.")

    before = set(ticket["assigneeUserIds"])
    after = [member["userId"] for member in chosen]
    if set(after) == before:
        db.rollback()
        return _canonical_ticket(_as_item(row))

    now = datetime.now(timezone.utc)
    names = ", ".join(member["name"] for member in chosen)
    ticket["assignees"] = chosen
    ticket["assigneeUserIds"] = after
    ticket["assignedTo"] = names or _DEPARTMENT_QUEUES.get(department, f"{department} Queue")
    if chosen and ticket.get("status") in {"Open", "Raised"}:
        ticket["status"] = "Assigned"
    event = {
        **_actor_stamp(actor, now),
        "event": "Assigned" if chosen else "Unassigned",
        "note": (f"Assigned to {names}" if chosen else "Returned to the department queue") + (f" - {note}" if note else ""),
        "assigneeUserIds": after,
    }
    ticket["history"] = [*ticket["history"], event]
    row.body = ticket
    row.updated_at = now
    for member in chosen:
        if member["userId"] in before:
            continue
        _notify(
            db,
            campus_id=actor.campus_id,
            title=f"Ticket {row.public_id} assigned to you",
            body=f"{ticket.get('priority', '')} priority - {department}: {str(ticket.get('subject') or '')[:120]}",
            entity_type="it_ticket",
            entity_id=row.public_id,
            user_id=uuid.UUID(member["userId"]),
        )
    write_audit(
        db,
        action="IT_TICKET_ASSIGNED",
        entity_type="it_ticket",
        entity_id=row.public_id,
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=",".join(after) or "unassigned",
    )
    db.commit()
    db.refresh(row)
    return _canonical_ticket(_as_item(row))


def update_ticket_status(db: Session, actor: User, ticket_id: str, body: dict) -> dict:
    """Change status (and optionally remarks). Allowed for IT / admins, the owning department, or an assignee."""
    from app.services.approvals import _notify
    from app.services.audit import write_audit

    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    status = str(body.get("status") or "").strip()
    if status not in TICKET_STATUSES:
        fail(422, "invalid_body", f"Status must be one of: {', '.join(sorted(TICKET_STATUSES))}.")
    remarks = _ticket_text(body, "remarks", limit=2000) if "remarks" in body else None

    row = _locked_ticket(db, actor, ticket_id)
    ticket = _canonical_ticket(row.body or {})
    department = str(ticket.get("department") or "")
    code = _code(db, actor)
    if not (_can_manage_ticket(code, department) or str(actor.id) in ticket["assigneeUserIds"]):
        fail(403, "forbidden", "Only IT Support, the department or an assignee can update this ticket.")

    now = datetime.now(timezone.utc)
    events = []
    previous = str(ticket.get("status") or "")
    if status != previous:
        ticket["status"] = status
        events.append({**_actor_stamp(actor, now), "event": "Status Change", "note": f"Status {previous} -> {status}"})
    if remarks is not None and remarks != str(ticket.get("remarks") or ""):
        ticket["remarks"] = remarks
        events.append({**_actor_stamp(actor, now), "event": "Remarks", "note": remarks})
    if not events:
        db.rollback()
        return _canonical_ticket(_as_item(row))
    ticket["history"] = [*ticket["history"], *events]
    row.body = ticket
    row.updated_at = now
    requester = str(ticket.get("requesterUserId") or "")
    if status != previous and requester and requester != str(actor.id):
        try:
            requester_id = uuid.UUID(requester)
        except ValueError:
            requester_id = None
        if requester_id is not None:
            _notify(
                db,
                campus_id=actor.campus_id,
                title=f"Ticket {row.public_id} is now {status}",
                body=str(ticket.get("subject") or "")[:200],
                entity_type="it_ticket",
                entity_id=row.public_id,
                user_id=requester_id,
            )
    write_audit(
        db,
        action="IT_TICKET_STATUS",
        entity_type="it_ticket",
        entity_id=row.public_id,
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{previous}->{status}",
    )
    db.commit()
    db.refresh(row)
    return _canonical_ticket(_as_item(row))


# Whole-list PUT races for concurrent gate edits; save these one record at a time.
_ITEM_UPSERT_COLLECTIONS = {
    "som-matrix",
    "som-config",
    "security-cameras",
    "gate-visitors",
    "gate-registers",
    "gate-handover",
    "gate-vendors",
    "gate-incidents",
    "gate-duty-assignments",
    # Concurrent department product requests must not overwrite each other.
    "stationery-requests",
}
CAMERA_STATUSES = {"Active", "Offline", "Under Maintenance", "Removed"}
VISITOR_EXITED = "Exited"


def _validate_camera(body: dict) -> None:
    from urllib.parse import urlsplit

    if not str(body.get("name") or "").strip():
        fail(422, "invalid_body", "Camera name is required.")
    if not str(body.get("location") or "").strip():
        fail(422, "invalid_body", "Camera location is required.")
    if body.get("status") not in CAMERA_STATUSES:
        fail(422, "invalid_body", f"Status must be one of: {', '.join(sorted(CAMERA_STATUSES))}.")
    url = str(body.get("streamUrl") or "").strip()
    if url:
        parts = urlsplit(url)
        if parts.scheme not in {"rtsp", "http", "https"} or not parts.hostname:
            fail(422, "invalid_body", "Stream link must be an rtsp://, http:// or https:// address.")
        if parts.username or parts.password:
            # Never keep camera passwords in the ERP; they belong in the NVR/VMS.
            fail(422, "invalid_body", "Remove the username/password from the stream link; store credentials in the NVR.")


def delete_item(db: Session, actor: User, collection: str, item_id: str) -> dict:
    _ensure_collection(collection)
    _guard_ledger_write(collection)
    if not _can_write(db, actor, collection):
        fail(403, "forbidden", "You are not allowed to change ops records.")
    if collection == IT_TICKETS and _code(db, actor) not in _IT:
        fail(403, "forbidden", "Only IT Support can remove tickets.")
    if collection not in _ITEM_UPSERT_COLLECTIONS:
        fail(400, "not_supported", "This collection is saved as a whole list.")
    if collection == "stationery-requests":
        from app.services.stationery_workflow import guard_request_delete

        target = db.scalar(
            select(OpsRecord).where(
                OpsRecord.campus_id == actor.campus_id,
                OpsRecord.collection == collection,
                OpsRecord.public_id == str(item_id),
            )
        )
        if target is None:
            fail(404, "not_found", "Record not found.")
        guard_request_delete(db, actor, target)
    result = db.execute(
        delete(OpsRecord).where(
            OpsRecord.campus_id == actor.campus_id,
            OpsRecord.collection == collection,
            OpsRecord.public_id == str(item_id),
        )
    )
    db.commit()
    if not result.rowcount:
        fail(404, "not_found", "Record not found.")
    return {"deleted": True, "id": str(item_id)}


def upsert_record(db: Session, actor: User, collection: str, item_id: str, body: dict) -> dict:
    """Create or replace ONE record, leaving the rest of the collection alone (no whole-list PUT race)."""
    _ensure_collection(collection)
    _guard_ledger_write(collection)
    if not _can_write(db, actor, collection):
        fail(403, "forbidden", "You are not allowed to change ops records.")
    if collection not in _ITEM_UPSERT_COLLECTIONS and collection != IT_TICKETS:
        fail(400, "not_supported", "This collection is saved as a whole list.")
    public_id = str(item_id or "").strip()
    if not public_id or len(public_id) > 120:
        fail(422, "invalid_body", "A record id (1-120 characters) is required.")
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    payload = {key: value for key, value in body.items() if not str(key).startswith("_")}
    payload["id"] = public_id
    if collection == "security-cameras":
        _validate_camera(payload)
    if collection == "som-matrix":
        _validate_som_matrix(payload)
    row = db.scalar(
        select(OpsRecord).where(
            OpsRecord.campus_id == actor.campus_id,
            OpsRecord.collection == collection,
            OpsRecord.public_id == public_id,
        )
    )
    now = datetime.now(timezone.utc)
    if collection == "gate-visitors":
        _validate_visitor_upsert(row.body if row else None, payload, actor, now)
    if collection == "stationery-requests":
        from app.services.stationery_workflow import guard_request_upsert

        payload = guard_request_upsert(db, actor, row, payload)
    if collection == IT_TICKETS:
        payload = _guard_ticket_upsert(db, actor, row, payload)
    if row is None:
        row = OpsRecord(
            id=uuid.uuid4(),
            campus_id=actor.campus_id,
            collection=collection,
            public_id=public_id,
            body=payload,
            created_by=actor.id,
            updated_at=now,
        )
        db.add(row)
    else:
        row.body = payload
        row.updated_at = now
    db.commit()
    db.refresh(row)
    return _as_item(row)


# Star of the Month matrix cells: whole numbers 1–3 or NA only (no half-stars like 2.5).
SOM_ALLOWED_RATINGS = frozenset({"1", "2", "3", "NA"})


def _validate_som_matrix(payload: dict) -> None:
    """Enforce rating scale + in-payload uniqueness for som-matrix item upserts."""
    ratings = payload.get("ratings")
    if ratings is None:
        payload["ratings"] = []
        ratings = payload["ratings"]
    if not isinstance(ratings, list):
        fail(422, "invalid_body", "ratings must be an array.")
    seen: set[tuple[str, str]] = set()
    cleaned: list[dict] = []
    for index, row in enumerate(ratings):
        if not isinstance(row, dict):
            fail(422, "invalid_body", f"ratings[{index}] must be an object.")
        student_id = str(row.get("studentId") or "").strip()
        sub_id = str(row.get("subId") or "").strip()
        rating = str(row.get("rating") or "").strip()
        if not student_id or not sub_id:
            fail(422, "invalid_body", f"ratings[{index}] needs studentId and subId.")
        if rating not in SOM_ALLOWED_RATINGS:
            fail(
                422,
                "invalid_rating",
                f"Rating must be one of 1, 2, 3, or NA (got {rating!r}).",
            )
        key = (student_id, sub_id)
        if key in seen:
            fail(422, "duplicate", f"Duplicate rating for student {student_id} / {sub_id}.")
        seen.add(key)
        cleaned.append({"studentId": student_id, "subId": sub_id, "rating": rating})
    payload["ratings"] = cleaned

    meta = payload.get("meta")
    if meta is None:
        return
    if not isinstance(meta, dict):
        fail(422, "invalid_body", "meta must be an object.")
    documents = meta.get("documents")
    if documents is None:
        return
    if not isinstance(documents, list):
        fail(422, "invalid_body", "meta.documents must be an array.")
    cleaned_docs: list[dict] = []
    seen_files: set[str] = set()
    for index, doc in enumerate(documents):
        if not isinstance(doc, dict):
            fail(422, "invalid_body", f"meta.documents[{index}] must be an object.")
        file_id = str(doc.get("fileId") or "").strip()
        if not file_id:
            fail(422, "invalid_body", f"meta.documents[{index}] needs fileId.")
        if file_id in seen_files:
            fail(422, "duplicate", f"Duplicate document fileId {file_id}.")
        seen_files.add(file_id)
        cleaned_docs.append(
            {
                "fileId": file_id,
                "name": str(doc.get("name") or "").strip()[:240],
                "uploadedAt": str(doc.get("uploadedAt") or "").strip()[:64] or None,
                "uploadedBy": str(doc.get("uploadedBy") or "").strip()[:120] or None,
            }
        )
    meta["documents"] = cleaned_docs
    payload["meta"] = meta


def _validate_visitor_upsert(previous: dict | None, payload: dict, actor: User, now: datetime) -> None:
    """Prevent duplicate exits; stamp who exited and when on first Exited transition."""
    status_key = "status" if "status" in payload else ("visitorStatus" if "visitorStatus" in payload else None)
    if not status_key:
        return
    new_status = str(payload.get(status_key) or "").strip()
    old_status = str((previous or {}).get(status_key) or "").strip()
    if new_status == VISITOR_EXITED:
        if old_status == VISITOR_EXITED:
            # Idempotent re-save of an already-exited visitor: keep original exit stamps.
            for key in ("outTime", "exitedAt", "exitedByUserId", "exitedByEmail", "exitedByName"):
                if previous and previous.get(key) and not payload.get(key):
                    payload[key] = previous[key]
            return
        payload.setdefault("exitedAt", now.isoformat())
        payload.setdefault("exitedByUserId", str(actor.id))
        payload.setdefault("exitedByEmail", actor.email or "")
        payload.setdefault("exitedByName", actor.email or "")
        if not str(payload.get("outTime") or "").strip():
            payload["outTime"] = now.astimezone(timezone.utc).strftime("%H:%M")


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

