"""Transfer Certificate requests: PRM review, manager NOCs, then MD/Super Admin decision.

Requirement source (Non-Academics ERP Documentation §4.8):
- Transport Manager issues a TC NOC when the student uses school transport.
- MD / Super Admin provide final approval before a TC number is generated.
"""

from __future__ import annotations

import json
from datetime import date
from uuid import UUID

from sqlalchemy import String, cast, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.deps import permission_codes_for, role_code_for
from app.models import AuditLog, Admission, OpsRecord, Role, Student, TcRequest, TcRequestNoc, User
from app.models.base import utcnow
from app.services.approvals import _notify
from app.services.audit import write_audit
from app.services.errors import fail

STATUSES = (
    "Pending PRM Review",
    "Pending Manager NOCs",
    "Pending Super Admin Approval",
    "Approved",
    "Rejected",
)
OPEN_STATUSES = (
    "Pending PRM Review",
    "Pending Manager NOCs",
    "Pending Super Admin Approval",
)
REASON_MAX = 2000
TRANSFER_MAX = 200
REMARKS_MAX = 1000
_TC_FORWARDERS = {"prm", "pro", "admin", "superadmin", "managing_director"}
_TC_CAMPUS_READERS = {
    "prm",
    "pro",
    "admin",
    "superadmin",
    "managing_director",
    "principal",
    "director",
}
_TC_FINAL_DECIDERS = {"admin", "superadmin", "managing_director"}
_FINAL_NOTIFY_ROLES = ("admin", "managing_director", "superadmin")
# Admin override of a pending NOC (e.g. the campus has no active user in the clearing role).
# Always requires a reason; the override identity and reason are kept in the audit log.
_TC_NOC_OVERRIDERS = {"admin", "superadmin", "managing_director"}
OVERRIDE_REASON_MIN = 10
OVERRIDE_REMARK_PREFIX = "[Admin override] "
_HISTORY_LABELS = {
    "TC_REQUESTED": "Request filed",
    "TC_NOCS_ROUTED": "Routed to manager NOCs",
    "TC_NOC_APPROVED": "Manager NOC approved",
    "TC_NOC_REJECTED": "Manager NOC rejected",
    "TC_NOC_OVERRIDDEN": "Manager NOC overridden by administrator",
    "TC_NOCS_COMPLETE": "All manager NOCs complete",
    "TC_FORWARDED": "Forwarded for final approval",
    "TC_REJECTED_PRM": "Rejected at PRM review",
    "TC_APPROVED": "Final approval · TC issued",
    "TC_REJECTED": "Rejected at final approval",
}

# Role-configured manager authorities that may be required for a TC NOC.
# Applicability is evaluated per student — never hardcode person names.
TC_NOC_AUTHORITIES: tuple[dict, ...] = (
    {
        "role_code": "transportmanager",
        "label": "Transport Manager",
        "required_when": "school_transport",
    },
    # Dues clearance managers (always when the role exists in the campus catalogue).
    {
        "role_code": "accounthead",
        "label": "Accounts / Finance",
        "required_when": "always",
    },
    {
        "role_code": "librarian",
        "label": "Librarian",
        "required_when": "always",
    },
    {
        "role_code": "stationerystoremanager",
        "label": "Store Manager",
        "required_when": "always",
    },
)


def _has(db: Session, actor: User, code: str) -> bool:
    return code in permission_codes_for(db, actor)


def _parent_child_ids(db: Session, actor: User) -> set[UUID]:
    parent_key = str(actor.id)
    rows = db.scalars(
        select(Student.id).where(
            Student.campus_id == actor.campus_id,
            or_(
                Student.parent_user_id == actor.id,
                cast(Student.parent_user_id, String) == parent_key,
            ),
        )
    ).all()
    return set(rows)


def _assert_parent_owns_student(db: Session, actor: User, student: Student) -> None:
    if role_code_for(db, actor) != "parent":
        return
    kids = _parent_child_ids(db, actor)
    if student.id not in kids:
        fail(403, "forbidden", "You can only file TC requests for your linked children.")


def _assert_student_owns_self(db: Session, actor: User, student: Student) -> None:
    if role_code_for(db, actor) != "student":
        return
    if str(student.student_user_id or "") != str(actor.id):
        fail(403, "forbidden", "You can only file a TC request for your own student profile.")


def _student(db: Session, actor: User, ref: str) -> Student:
    row = None
    try:
        row = db.get(Student, UUID(ref))
    except ValueError:
        row = db.scalar(
            select(Student).where(Student.campus_id == actor.campus_id, Student.admission_number == ref.strip())
        )
    if row is None or row.campus_id != actor.campus_id:
        fail(404, "not_found", "Student not found.")
    return row


def _find(db: Session, actor: User, ref: str) -> TcRequest:
    row = None
    try:
        row = db.get(TcRequest, UUID(ref))
    except ValueError:
        row = db.scalar(
            select(TcRequest).where(TcRequest.campus_id == actor.campus_id, TcRequest.code == ref.strip().upper())
        )
    if row is None or row.campus_id != actor.campus_id:
        fail(404, "not_found", "TC request not found.")
    role = role_code_for(db, actor)
    if role == "parent" and row.student_id not in _parent_child_ids(db, actor):
        fail(404, "not_found", "TC request not found.")
    if role == "student":
        mine = db.scalar(
            select(Student.id).where(
                Student.campus_id == actor.campus_id,
                Student.student_user_id == actor.id,
            )
        )
        if mine is None or row.student_id != mine:
            fail(404, "not_found", "TC request not found.")
    if role not in _TC_CAMPUS_READERS and role not in {"parent", "student"}:
        # Manager / NOC roles may only open requests they have a NOC row for.
        if not _has(db, actor, "tc.noc") and not _has(db, actor, "tc.decide"):
            fail(404, "not_found", "TC request not found.")
        mine_noc = db.scalar(
            select(TcRequestNoc.id).where(
                TcRequestNoc.tc_request_id == row.id,
                TcRequestNoc.role_code == role,
            )
        )
        if mine_noc is None and not _has(db, actor, "tc.decide"):
            fail(404, "not_found", "TC request not found.")
    return row


def _uses_school_transport(db: Session, student: Student) -> bool:
    """True when ops student-transport assignment or admission mode indicates school bus."""
    keys = {
        str(student.id).lower(),
        (student.admission_number or "").strip().lower(),
        (student.full_name or "").strip().lower(),
    }
    keys.discard("")
    rows = db.scalars(
        select(OpsRecord).where(
            OpsRecord.campus_id == student.campus_id,
            OpsRecord.collection == "transport-student-assignments",
        )
    ).all()
    for row in rows:
        body = row.body or {}
        candidates = {
            str(body.get("studentId") or "").strip().lower(),
            str(body.get("student_id") or "").strip().lower(),
            str(body.get("admissionNumber") or "").strip().lower(),
            str(body.get("admission_number") or "").strip().lower(),
            str(body.get("studentName") or "").strip().lower(),
        }
        candidates.discard("")
        if keys & candidates:
            return True
    if student.admission_id:
        admission = db.get(Admission, student.admission_id)
        mode = (admission.mode_of_transport or "").strip().lower() if admission else ""
        if mode and any(token in mode for token in ("school", "bus", "transport", "route")):
            if "own" not in mode and "self" not in mode and "private" not in mode:
                return True
    return False


def _applicable_noc_authorities(db: Session, student: Student) -> list[dict]:
    out: list[dict] = []
    for authority in TC_NOC_AUTHORITIES:
        when = authority.get("required_when")
        if when == "school_transport" and not _uses_school_transport(db, student):
            continue
        if when not in {None, "always", "school_transport"}:
            continue
        # Only include roles that exist in the campus role catalogue. The NOC stays mandatory even
        # when no active user holds the role; that case is resolved through override_noc().
        role = db.scalar(select(Role).where(Role.code == authority["role_code"]))
        if role is None:
            continue
        out.append(
            {
                "role_code": authority["role_code"],
                "label": authority.get("label") or role.name or authority["role_code"],
            }
        )
    return out


def _nocs_for(db: Session, request_id) -> list[TcRequestNoc]:
    return list(
        db.scalars(
            select(TcRequestNoc)
            .where(TcRequestNoc.tc_request_id == request_id)
            .order_by(TcRequestNoc.created_at.asc(), TcRequestNoc.role_code.asc())
        ).all()
    )


def _seed_noc_rows(db: Session, row: TcRequest, student: Student) -> list[TcRequestNoc]:
    """Create pending NOC rows for applicable authorities. Idempotent (unique request+role)."""
    created: list[TcRequestNoc] = []
    existing = {n.role_code for n in _nocs_for(db, row.id)}
    for authority in _applicable_noc_authorities(db, student):
        if authority["role_code"] in existing:
            continue
        noc = TcRequestNoc(
            campus_id=row.campus_id,
            tc_request_id=row.id,
            role_code=authority["role_code"],
            role_label=authority["label"],
            status="Pending",
        )
        db.add(noc)
        created.append(noc)
        existing.add(authority["role_code"])
    db.flush()
    return created


def _active_role_user_exists(db: Session, campus_id, role_code: str) -> bool:
    return (
        db.scalar(
            select(User.id)
            .join(Role, Role.id == User.role_id)
            .where(
                User.campus_id == campus_id,
                User.is_active.is_(True),
                Role.code == role_code,
            )
            .limit(1)
        )
        is not None
    )


def _audit_rows(db: Session, row: TcRequest) -> list[AuditLog]:
    return list(
        db.scalars(
            select(AuditLog)
            .where(
                AuditLog.entity_type == "tc_request",
                AuditLog.entity_id == str(row.id),
                AuditLog.campus_id == row.campus_id,
            )
            .order_by(AuditLog.created_at.asc())
        ).all()
    )


def _override_details(entry: AuditLog) -> dict:
    try:
        data = json.loads(entry.details or "{}")
    except ValueError:
        data = {}
    return data if isinstance(data, dict) else {}


def _serialize_noc(db: Session, noc: TcRequestNoc, override: dict | None = None) -> dict:
    actor_email = ""
    actor_name = ""
    if noc.decided_by:
        user = db.get(User, noc.decided_by)
        if user:
            actor_email = user.email or ""
            actor_name = user.email or ""
    return {
        "id": str(noc.id),
        "roleCode": noc.role_code,
        "roleLabel": noc.role_label,
        "status": noc.status,
        "remarks": noc.remarks or "",
        "decidedBy": str(noc.decided_by) if noc.decided_by else "",
        "decidedByEmail": actor_email,
        "decidedByName": actor_name,
        "decidedAt": noc.decided_at.isoformat() if noc.decided_at else "",
        "clearingUserActive": _active_role_user_exists(db, noc.campus_id, noc.role_code),
        "overridden": override is not None,
        "override": (
            {
                "reason": override.get("reason", ""),
                "overriddenBy": override.get("overriddenBy", ""),
                "overriddenByEmail": override.get("overriddenByEmail", ""),
                "overriddenByRole": override.get("overriddenByRole", ""),
                "overriddenAt": override.get("overriddenAt", ""),
                "activeClearingUserExisted": bool(override.get("activeClearingUserExisted")),
            }
            if override is not None
            else None
        ),
    }


def _history(db: Session, entries: list[AuditLog]) -> list[dict]:
    users: dict = {}
    out: list[dict] = []
    for entry in entries:
        if entry.action not in _HISTORY_LABELS:
            continue
        if entry.actor_id and entry.actor_id not in users:
            user = db.get(User, entry.actor_id)
            users[entry.actor_id] = (user.email or "", role_code_for(db, user)) if user else ("", "")
        email, role = users.get(entry.actor_id, ("", ""))
        item = {
            "action": entry.action,
            "label": _HISTORY_LABELS[entry.action],
            "at": entry.created_at.isoformat() if entry.created_at else "",
            "actorEmail": email,
            "actorRole": role,
            "details": "",
        }
        if entry.action == "TC_NOC_OVERRIDDEN":
            data = _override_details(entry)
            item["details"] = f"{data.get('roleLabel') or data.get('roleCode') or ''}: {data.get('reason') or ''}".strip(
                ": "
            )
            item["override"] = {
                "roleCode": data.get("roleCode", ""),
                "roleLabel": data.get("roleLabel", ""),
                "reason": data.get("reason", ""),
                "activeClearingUserExisted": bool(data.get("activeClearingUserExisted")),
            }
        elif entry.action in {"TC_NOC_APPROVED", "TC_NOC_REJECTED"}:
            item["details"] = (entry.details or "").split(":", 1)[-1]
        out.append(item)
    return out


def _out(db: Session, row: TcRequest) -> dict:
    student = db.get(Student, row.student_id)
    entries = _audit_rows(db, row)
    overrides: dict[str, dict] = {}
    for entry in entries:
        if entry.action == "TC_NOC_OVERRIDDEN":
            data = _override_details(entry)
            if data.get("roleCode"):
                overrides[data["roleCode"]] = data
    nocs = [_serialize_noc(db, n, overrides.get(n.role_code)) for n in _nocs_for(db, row.id)]
    pending_nocs = sum(1 for n in nocs if n["status"] == "Pending")
    return {
        "id": row.code,
        "requestId": row.code,
        "uuid": str(row.id),
        "studentId": str(row.student_id),
        "studentName": student.full_name if student else "",
        "classSection": student.class_name if student else "",
        "admissionNumber": student.admission_number if student else "",
        "reason": row.reason,
        "transferTo": row.transfer_to,
        "lastDateOfAttendance": row.last_date_of_attendance.isoformat() if row.last_date_of_attendance else "",
        "requestedBy": row.requested_by,
        "requestedOn": row.requested_on.isoformat(),
        "status": row.status,
        "prmRemarks": row.prm_remarks,
        "superAdminRemarks": row.admin_remarks,
        "forwardedOn": row.forwarded_on.isoformat() if row.forwarded_on else "",
        "approvedOn": row.decided_on.isoformat() if row.status == "Approved" and row.decided_on else "",
        "rejectedOn": row.decided_on.isoformat() if row.status == "Rejected" and row.decided_on else "",
        "tcNumber": row.tc_number,
        "tcIssuedDate": row.decided_on.isoformat() if row.status == "Approved" and row.decided_on else "",
        "tcDocumentName": (
            f"Transfer-Certificate-{student.admission_number}.pdf"
            if row.status == "Approved" and student
            else ""
        ),
        "nocs": nocs,
        "pendingNocCount": pending_nocs,
        "allNocsComplete": bool(nocs) and pending_nocs == 0 and all(n["status"] == "Approved" for n in nocs),
        "overriddenNocCount": sum(1 for n in nocs if n["overridden"]),
        "history": _history(db, entries),
    }


def list_requests(db: Session, actor: User) -> list[dict]:
    if not _has(db, actor, "tc.read"):
        fail(403, "forbidden", "You are not allowed to view TC requests.")
    rows = db.scalars(
        select(TcRequest).where(TcRequest.campus_id == actor.campus_id).order_by(TcRequest.created_at.desc())
    ).all()
    role = role_code_for(db, actor)
    if role == "parent":
        kids = _parent_child_ids(db, actor)
        rows = [row for row in rows if row.student_id in kids]
    elif role == "student":
        mine = db.scalar(
            select(Student.id).where(
                Student.campus_id == actor.campus_id,
                Student.student_user_id == actor.id,
            )
        )
        rows = [row for row in rows if mine is not None and row.student_id == mine]
    elif role not in _TC_CAMPUS_READERS:
        # NOC managers see only requests assigned to their role.
        assigned = {
            n.tc_request_id
            for n in db.scalars(
                select(TcRequestNoc).where(
                    TcRequestNoc.campus_id == actor.campus_id,
                    TcRequestNoc.role_code == role,
                )
            ).all()
        }
        rows = [row for row in rows if row.id in assigned]
    return [_out(db, row) for row in rows]


def get_request(db: Session, actor: User, ref: str) -> dict:
    if not _has(db, actor, "tc.read"):
        fail(403, "forbidden", "You are not allowed to view TC requests.")
    return _out(db, _find(db, actor, ref))


def _next_code(db: Session, campus_id) -> str:
    codes = db.scalars(select(TcRequest.code).where(TcRequest.campus_id == campus_id)).all()
    n = max((int(c.split("-")[2]) for c in codes if c.startswith("TC-REQ-") and c[7:].isdigit()), default=0) + 1
    return f"TC-REQ-{n:03d}"


def _notify_roles(db: Session, *, campus_id, title: str, body: str, entity_id: str, role_codes: tuple[str, ...]) -> None:
    for role_code in role_codes:
        _notify(
            db,
            campus_id=campus_id,
            title=title,
            body=body,
            entity_type="tc_request",
            entity_id=entity_id,
            role_code=role_code,
        )


def create(
    db: Session,
    actor: User,
    *,
    student_ref: str,
    reason: str,
    transfer_to: str,
    last_date: date | None,
    requested_by: str | None,
) -> dict:
    if not _has(db, actor, "tc.write"):
        fail(403, "forbidden", "You are not allowed to file a TC request.")
    student = _student(db, actor, student_ref)
    _assert_parent_owns_student(db, actor, student)
    _assert_student_owns_self(db, actor, student)
    reason = (reason or "").strip()
    transfer_to = (transfer_to or "").strip()
    if not reason:
        fail(422, "reason_required", "A reason is required.")
    if len(reason) > REASON_MAX:
        fail(422, "reason_too_long", f"Reason can be at most {REASON_MAX} characters.")
    if not transfer_to:
        fail(422, "transfer_to_required", "The receiving school is required.")
    if len(transfer_to) > TRANSFER_MAX:
        fail(422, "transfer_to_too_long", f"The receiving school can be at most {TRANSFER_MAX} characters.")
    open_one = db.scalar(
        select(TcRequest).where(
            TcRequest.student_id == student.id,
            TcRequest.status.in_(OPEN_STATUSES),
        )
    )
    if open_one:
        fail(409, "already_open", "This student already has an open TC request.")
    row = TcRequest(
        campus_id=actor.campus_id,
        code=_next_code(db, actor.campus_id),
        student_id=student.id,
        reason=reason,
        transfer_to=transfer_to,
        last_date_of_attendance=last_date,
        requested_by=(requested_by or role_code_for(db, actor))[:80],
        requested_on=date.today(),
        status="Pending PRM Review",
        created_by=actor.id,
    )
    try:
        db.add(row)
        db.flush()
    except IntegrityError:
        db.rollback()
        fail(409, "code_conflict", "Could not number the request. Please try again.")

    seeded = _seed_noc_rows(db, row, student)
    if seeded:
        row.status = "Pending Manager NOCs"
        for noc in seeded:
            _notify(
                db,
                campus_id=actor.campus_id,
                title=f"TC NOC required · {row.code}",
                body=f"{student.full_name} — {noc.role_label} clearance pending.",
                entity_type="tc_request",
                entity_id=row.code,
                role_code=noc.role_code,
            )
        _notify(
            db,
            campus_id=actor.campus_id,
            title=f"TC request {row.code}",
            body=f"{student.full_name} — routed to manager NOCs.",
            entity_type="tc_request",
            entity_id=row.code,
            role_code="prm",
        )
    else:
        _notify(
            db,
            campus_id=actor.campus_id,
            title=f"TC request {row.code}",
            body=f"{student.full_name} — awaiting PRM review.",
            entity_type="tc_request",
            entity_id=row.code,
            role_code="prm",
        )

    write_audit(
        db,
        action="TC_REQUESTED",
        entity_type="tc_request",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=row.code,
    )
    if seeded:
        write_audit(
            db,
            action="TC_NOCS_ROUTED",
            entity_type="tc_request",
            entity_id=str(row.id),
            actor_id=actor.id,
            campus_id=actor.campus_id,
            details=",".join(n.role_code for n in seeded),
        )
    db.commit()
    return _out(db, row)


def decide_noc(db: Session, actor: User, ref: str, *, decision: str, remarks: str) -> dict:
    """Manager authority records NOC approve/reject for their role only."""
    if not _has(db, actor, "tc.noc"):
        fail(403, "forbidden", "You are not allowed to record a TC NOC.")
    role = role_code_for(db, actor)
    row = _find(db, actor, ref)
    if row.status != "Pending Manager NOCs":
        fail(409, "wrong_status", "Only a request awaiting manager NOCs can receive a NOC decision.")
    noc = db.scalar(
        select(TcRequestNoc).where(
            TcRequestNoc.tc_request_id == row.id,
            TcRequestNoc.role_code == role,
        )
    )
    if noc is None:
        fail(403, "forbidden", "No NOC assignment exists for your role on this request.")
    if noc.status != "Pending":
        fail(409, "already_decided", "This NOC has already been decided.")
    decision = (decision or "").strip().lower()
    if decision not in {"approve", "reject"}:
        fail(422, "invalid_decision", "Decision must be approve or reject.")
    remarks = (remarks or "").strip()
    if decision == "reject" and not remarks:
        fail(422, "remarks_required", "A remark is required when rejecting a NOC.")
    if len(remarks) > REMARKS_MAX:
        fail(422, "remarks_too_long", f"Remarks can be at most {REMARKS_MAX} characters.")

    noc.status = "Approved" if decision == "approve" else "Rejected"
    noc.remarks = remarks
    noc.decided_by = actor.id
    noc.decided_at = utcnow()
    row.updated_at = utcnow()

    student = db.get(Student, row.student_id)
    if decision == "reject":
        row.status = "Rejected"
        row.decided_on = date.today()
        _notify(
            db,
            campus_id=actor.campus_id,
            title=f"TC request {row.code} rejected",
            body=f"{noc.role_label} rejected NOC. {remarks}",
            entity_type="tc_request",
            entity_id=row.code,
            role_code="prm",
        )
        write_audit(
            db,
            action="TC_NOC_REJECTED",
            entity_type="tc_request",
            entity_id=str(row.id),
            actor_id=actor.id,
            campus_id=actor.campus_id,
            details=f"{row.code}:{noc.role_code}",
        )
        db.commit()
        return _out(db, row)

    write_audit(
        db,
        action="TC_NOC_APPROVED",
        entity_type="tc_request",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{row.code}:{noc.role_code}",
    )

    _complete_if_all_cleared(db, actor, row, student)
    db.commit()
    return _out(db, row)


def _complete_if_all_cleared(db: Session, actor: User, row: TcRequest, student: Student | None) -> None:
    remaining = [n for n in _nocs_for(db, row.id) if n.status == "Pending"]
    if remaining:
        return
    row.status = "Pending PRM Review"
    _notify(
        db,
        campus_id=actor.campus_id,
        title=f"TC request {row.code} — NOCs complete",
        body=f"{student.full_name if student else row.code} — awaiting PRM review.",
        entity_type="tc_request",
        entity_id=row.code,
        role_code="prm",
    )
    write_audit(
        db,
        action="TC_NOCS_COMPLETE",
        entity_type="tc_request",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=row.code,
    )


def override_noc(db: Session, actor: User, ref: str, *, role_code: str, reason: str) -> dict:
    """Admin / Super Admin / MD clears one pending NOC on behalf of its authority.

    Intended for campuses where the clearing role has no active user (Store, Librarian, Accounts …).
    A reason is always mandatory; the override identity, timestamp, reason and whether an active
    clearing user existed are written to the audit log and shown in the request history.
    """
    if not _has(db, actor, "tc.decide"):
        fail(403, "forbidden", "You are not allowed to override a TC NOC.")
    actor_role = role_code_for(db, actor)
    if actor_role not in _TC_NOC_OVERRIDERS:
        fail(403, "forbidden", "Only Admin / Super Admin / Managing Director can override a TC NOC.")
    row = _find(db, actor, ref)
    if row.status != "Pending Manager NOCs":
        fail(409, "wrong_status", "Only a request awaiting manager NOCs can have a NOC overridden.")
    role_code = (role_code or "").strip().lower()
    noc = db.scalar(
        select(TcRequestNoc).where(
            TcRequestNoc.tc_request_id == row.id,
            TcRequestNoc.role_code == role_code,
        )
    )
    if noc is None:
        fail(404, "not_found", "No NOC for that authority exists on this request.")
    if noc.status != "Pending":
        fail(409, "already_decided", "This NOC has already been decided and cannot be overridden.")
    reason = (reason or "").strip()
    if len(reason) < OVERRIDE_REASON_MIN:
        fail(
            422,
            "override_reason_required",
            f"An override reason of at least {OVERRIDE_REASON_MIN} characters is required.",
        )
    if len(reason) > REMARKS_MAX:
        fail(422, "reason_too_long", f"Reason can be at most {REMARKS_MAX} characters.")

    active_clearing_user = _active_role_user_exists(db, row.campus_id, noc.role_code)
    now = utcnow()
    noc.status = "Approved"
    noc.remarks = f"{OVERRIDE_REMARK_PREFIX}{reason}"
    noc.decided_by = actor.id
    noc.decided_at = now
    row.updated_at = now

    write_audit(
        db,
        action="TC_NOC_OVERRIDDEN",
        entity_type="tc_request",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=json.dumps(
            {
                "code": row.code,
                "roleCode": noc.role_code,
                "roleLabel": noc.role_label,
                "reason": reason,
                "overriddenBy": str(actor.id),
                "overriddenByEmail": actor.email or "",
                "overriddenByRole": actor_role,
                "overriddenAt": now.isoformat(),
                "activeClearingUserExisted": active_clearing_user,
            }
        ),
    )
    _notify(
        db,
        campus_id=actor.campus_id,
        title=f"TC NOC overridden · {row.code}",
        body=f"{noc.role_label} clearance overridden by {actor.email}: {reason}",
        entity_type="tc_request",
        entity_id=row.code,
        role_code=noc.role_code,
    )
    student = db.get(Student, row.student_id)
    _complete_if_all_cleared(db, actor, row, student)
    db.commit()
    return _out(db, row)


def forward(db: Session, actor: User, ref: str, remarks: str) -> dict:
    if not _has(db, actor, "tc.write"):
        fail(403, "forbidden", "You are not allowed to forward a TC request.")
    if role_code_for(db, actor) not in _TC_FORWARDERS:
        fail(403, "forbidden", "Only Front Office or administrators can forward TC requests.")
    row = _find(db, actor, ref)
    if row.status == "Pending Manager NOCs":
        fail(409, "nocs_pending", "All mandatory manager NOCs must be completed before PRM forward.")
    if row.status != "Pending PRM Review":
        fail(409, "wrong_status", "Only a request awaiting PRM review can be forwarded.")
    # Safety: never forward while any NOC is still pending (stale race).
    pending = [n for n in _nocs_for(db, row.id) if n.status == "Pending"]
    if pending:
        fail(409, "nocs_pending", "All mandatory manager NOCs must be completed before PRM forward.")
    rejected = [n for n in _nocs_for(db, row.id) if n.status == "Rejected"]
    if rejected:
        fail(409, "noc_rejected", "A rejected manager NOC blocks forwarding.")
    remarks = (remarks or "").strip()
    if len(remarks) > REMARKS_MAX:
        fail(422, "remarks_too_long", f"Remarks can be at most {REMARKS_MAX} characters.")
    row.prm_remarks = remarks
    row.status = "Pending Super Admin Approval"
    row.forwarded_on = date.today()
    row.updated_at = utcnow()
    _notify_roles(
        db,
        campus_id=actor.campus_id,
        title=f"TC request {row.code} forwarded",
        body="Awaiting MD / Super Admin final approval.",
        entity_id=row.code,
        role_codes=_FINAL_NOTIFY_ROLES,
    )
    write_audit(
        db,
        action="TC_FORWARDED",
        entity_type="tc_request",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=row.code,
    )
    db.commit()
    return _out(db, row)


def reject_at_prm(db: Session, actor: User, ref: str, remarks: str) -> dict:
    if not _has(db, actor, "tc.write"):
        fail(403, "forbidden", "You are not allowed to reject a TC request at PRM review.")
    if role_code_for(db, actor) not in _TC_FORWARDERS:
        fail(403, "forbidden", "Only Front Office or administrators can reject TC requests at PRM review.")
    row = _find(db, actor, ref)
    if row.status != "Pending PRM Review":
        fail(409, "wrong_status", "Only a request awaiting PRM review can be rejected here.")
    remarks = (remarks or "").strip()
    if not remarks:
        fail(422, "remarks_required", "A remark is required when rejecting.")
    if len(remarks) > REMARKS_MAX:
        fail(422, "remarks_too_long", f"Remarks can be at most {REMARKS_MAX} characters.")
    row.prm_remarks = remarks
    row.status = "Rejected"
    row.decided_on = date.today()
    row.updated_at = utcnow()
    write_audit(
        db,
        action="TC_REJECTED_PRM",
        entity_type="tc_request",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=row.code,
    )
    db.commit()
    return _out(db, row)


def decide(db: Session, actor: User, ref: str, *, decision: str, remarks: str) -> dict:
    if not _has(db, actor, "tc.decide"):
        fail(403, "forbidden", "You are not allowed to decide a TC request.")
    if role_code_for(db, actor) not in _TC_FINAL_DECIDERS:
        fail(403, "forbidden", "Only MD / Super Admin / Administrator can give final TC approval.")
    row = _find(db, actor, ref)
    if row.status != "Pending Super Admin Approval":
        fail(409, "wrong_status", "Only a request awaiting final approval can be decided.")
    # Final gate: every mandatory NOC must be Approved before TC generation.
    nocs = _nocs_for(db, row.id)
    if any(n.status != "Approved" for n in nocs):
        fail(409, "nocs_incomplete", "Final approval requires every mandatory manager NOC to be approved.")
    decision = (decision or "").strip().lower()
    if decision not in {"approve", "reject"}:
        fail(422, "invalid_decision", "Decision must be approve or reject.")
    remarks = (remarks or "").strip()
    if decision == "reject" and not remarks:
        fail(422, "remarks_required", "A remark is required when rejecting.")
    if len(remarks) > REMARKS_MAX:
        fail(422, "remarks_too_long", f"Remarks can be at most {REMARKS_MAX} characters.")
    student = db.get(Student, row.student_id)
    row.admin_remarks = remarks
    row.decided_on = date.today()
    row.updated_at = utcnow()
    if decision == "approve":
        row.status = "Approved"
        digits = "".join(ch for ch in (student.admission_number if student else "") if ch.isdigit())[-4:] or "0001"
        row.tc_number = f"TC/{date.today().year}/{digits}"
        action = "TC_APPROVED"
    else:
        row.status = "Rejected"
        row.tc_number = ""
        action = "TC_REJECTED"
    _notify(
        db,
        campus_id=actor.campus_id,
        title=f"TC request {row.code} {row.status.lower()}",
        body=remarks or row.status,
        entity_type="tc_request",
        entity_id=row.code,
        role_code="prm",
    )
    write_audit(
        db,
        action=action,
        entity_type="tc_request",
        entity_id=str(row.id),
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=row.code,
    )
    db.commit()
    return _out(db, row)
