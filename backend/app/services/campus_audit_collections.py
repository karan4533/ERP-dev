"""Campus audit collections: JD Audit configuration + Process/Quality execution."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.deps import role_code_for
from app.models import CampusAuditRecord, Notification, User
from app.services.errors import fail

COLLECTIONS: dict[str, str] = {
    # JD Audit configuration / planning
    "audit-templates": "ATM",
    "audit-checklist-sections": "ACS",
    "audit-question-bank": "AQB",
    "audit-response-types": "ART",
    "audit-scoring-rules": "ASR",
    "audit-workflow-rules": "AWR",
    "audit-visibility-rules": "AVR",
    "audit-template-versions": "ATV",
    "audit-published-templates": "APT",
    "audit-plans": "APL",
    "audit-monitoring": "AMN",
    "audit-findings": "AFD",
    "audit-assignments": "AAS",
    "audit-assignment-history": "AAH",
    "audit-workload": "AWL",
    "audit-reports-analytics": "ARA",
    "audit-components": "ACP",
    "audit-shared-deviations": "ASD",
    # Process auditor execution
    "process-my-audits": "PMA",
    "process-audit-schedule": "PAS",
    "process-execute-draft": "PED",
    "process-audit-templates": "PAT",
    "process-audit-history": "PAH",
    "process-observations": "POB",
    "process-rca": "PRCA",
    "process-atr": "PATR",
    "process-escalations": "PES",
    "process-audit-reports": "PAR",
    "process-actions-reports": "PAC",
    "process-compliance-reports": "PCR",
    "process-observation-reports": "POR",
    # Quality auditor execution
    "quality-my-audits": "QMA",
    "quality-audit-schedule": "QAS",
    "quality-execute-draft": "QED",
    "quality-audit-templates": "QAT",
    "quality-audit-history": "QAH",
    "quality-observations": "QOB",
    "quality-rca": "QRCA",
    "quality-atr": "QATR",
    "quality-escalations": "QES",
    "quality-audit-reports": "QAR",
    "quality-actions-reports": "QAC",
    "quality-compliance-reports": "QCR",
    "quality-observation-reports": "QOR",
}

_ADMINS = {"admin", "superadmin", "managing_director"}
_JD_AUDIT = {"jointdirectoraudit"} | _ADMINS
_PROCESS = {"processauditor"} | _ADMINS
_QUALITY = {"qualityauditor"} | _ADMINS
# Leadership may oversee both streams; Process and Quality must not cross-read each other.
_OVERSIGHT = _JD_AUDIT | {"jointdirector", "principal", "director"}
_READ_ALL_AUDIT = _OVERSIGHT | _PROCESS | _QUALITY

# Auditor personas that work inside exactly one stream.
_STREAM_OF_ROLE = {"processauditor": "PROCESS", "qualityauditor": "QUALITY"}
# Shared JD collections whose rows carry a stream and are owned by one auditor stream.
_STREAM_SCOPED_SHARED = {"audit-components"}

# Department heads that can be named as the recipient of an audit observation.
# Keep in sync with src/Common/auditDomain/auditRecipients.js.
RECIPIENT_ROLES: dict[str, str] = {
    "housekeepingmanager": "Housekeeping",
    "maintenancemanager": "Maintenance",
    "itsupportmanager": "IT Support",
    "transportmanager": "Transport",
    "canteenmanager": "Canteen",
    "stationerystoremanager": "Store",
    "librarian": "Library",
    "gatekeepermanager": "Security",
    "accounthead": "Finance",
    "hr": "HR",
    "prm": "Front Office",
    "fileroom": "File Room",
    "principal": "Academic",
    "coordinator": "Academic",
}
_OBSERVATION_COLLECTIONS = {"process-observations", "quality-observations"}
_ATR_COLLECTIONS = {"process-atr", "quality-atr"}
# Written only by the recipient endpoint; auditors' whole-list saves cannot change or drop them.
_SERVER_OWNED_FIELDS = ("departmentResponse", "responseHistory")
_OWNER_FIELDS = ("createdByEmail", "createdByRole")


def _writers_for(collection: str) -> set[str]:
    if collection.startswith("process-"):
        return _PROCESS | _JD_AUDIT
    if collection.startswith("quality-"):
        return _QUALITY | _JD_AUDIT
    # Shared component master is maintained by JD Audit and both auditor streams
    # (PA/QA Create Observation Component dropdown + Components & Rubrics pages).
    if collection == "audit-components":
        return _JD_AUDIT | _PROCESS | _QUALITY
    if collection.startswith("audit-"):
        return _JD_AUDIT
    return _ADMINS


def _readers_for(collection: str) -> set[str]:
    writers = _writers_for(collection)
    if collection.startswith("process-"):
        # Process stream: Process Auditor + JD Audit + campus oversight. Not Quality Auditor.
        return writers | _OVERSIGHT
    if collection.startswith("quality-"):
        # Quality stream: Quality Auditor + JD Audit + campus oversight. Not Process Auditor.
        return writers | _OVERSIGHT
    if collection.startswith("audit-"):
        # Shared JD configuration remains readable by both auditor personas.
        return _READ_ALL_AUDIT
    return writers


def _code(db: Session, actor: User) -> str:
    return role_code_for(db, actor)


def _ensure_collection(collection: str) -> None:
    if collection not in COLLECTIONS:
        fail(404, "not_found", "That audit collection does not exist.")


def _can_read(db: Session, actor: User, collection: str) -> bool:
    return _code(db, actor) in _readers_for(collection)


def _can_write(db: Session, actor: User, collection: str) -> bool:
    return _code(db, actor) in _writers_for(collection)


def _as_item(row: CampusAuditRecord) -> dict:
    body = dict(row.body or {})
    body["id"] = row.public_id
    body["_collection"] = row.collection
    body["_updatedAt"] = row.updated_at.isoformat() if row.updated_at else None
    body["_createdAt"] = row.created_at.isoformat() if row.created_at else None
    return body


def _public_id_for(body: dict, fallback: str) -> str:
    for key in ("id", "templateId", "planId", "assignmentId", "observationId"):
        value = body.get(key)
        if value:
            return str(value).strip()
    return fallback


def _stream_for_collection(collection: str) -> str | None:
    if collection.startswith("process-"):
        return "PROCESS"
    if collection.startswith("quality-"):
        return "QUALITY"
    return None


def _item_allowed_in_stream(collection: str, item: dict) -> bool:
    """Reject cross-stream IDs / stamps that land in the wrong auditor collection."""
    stream = _stream_for_collection(collection)
    if stream is None:
        return True
    stamped = str(item.get("auditStream") or item.get("stream") or "").strip().upper()
    if stamped and stamped != stream:
        return False
    foreign = "QA" if stream == "PROCESS" else "PA"
    blob = " ".join(
        str(item.get(key) or "")
        for key in (
            "id",
            "observationId",
            "auditId",
            "auditNumber",
            "auditReference",
            "atrNumber",
            "scheduleId",
            "rcaId",
            "referenceNumber",
        )
    )
    markers = (
        f"OBS-{foreign}",
        f"AUD-{foreign}",
        f"ATR-{foreign}",
        f"SCH-{foreign}",
        f"RCA-{foreign}",
    )
    return not any(marker in blob for marker in markers)


def _row_stream(item: dict) -> str:
    return str(item.get("stream") or item.get("auditStream") or "").strip().upper()


def _campus_rows(db: Session, campus_id, collection: str) -> list[CampusAuditRecord]:
    return list(
        db.scalars(
            select(CampusAuditRecord)
            .where(
                CampusAuditRecord.campus_id == campus_id,
                CampusAuditRecord.collection == collection,
            )
            .order_by(CampusAuditRecord.created_at.desc())
        ).all()
    )


def _visible_to_actor_stream(collection: str, code: str, item: dict) -> bool:
    """Stream-owned shared rows (components): a PA/QA sees its own stream plus unstamped rows."""
    actor_stream = _STREAM_OF_ROLE.get(code)
    if collection not in _STREAM_SCOPED_SHARED or actor_stream is None:
        return True
    return _row_stream(item) in ("", actor_stream)


def list_records(db: Session, actor: User, collection: str) -> list[dict]:
    _ensure_collection(collection)
    if not _can_read(db, actor, collection):
        fail(403, "forbidden", "You are not allowed to view audit records.")
    code = _code(db, actor)
    return [
        item
        for item in (_as_item(row) for row in _campus_rows(db, actor.campus_id, collection))
        if _item_allowed_in_stream(collection, item) and _visible_to_actor_stream(collection, code, item)
    ]


def _validate_recipient(payload: dict, public_id: str) -> None:
    role = str(payload.get("recipientRole") or "").strip().lower()
    if not role:
        payload.pop("recipientRole", None)
        return
    if role not in RECIPIENT_ROLES:
        fail(
            422,
            "invalid_recipient",
            f"Record {public_id}: recipient must be a department head role, not '{payload.get('recipientRole')}'.",
        )
    payload["recipientRole"] = role
    payload["recipientDepartment"] = RECIPIENT_ROLES[role]


def replace_records(db: Session, actor: User, collection: str, items: list) -> list[dict]:
    _ensure_collection(collection)
    if not _can_write(db, actor, collection):
        fail(403, "forbidden", "You are not allowed to change audit records.")
    if not isinstance(items, list):
        fail(422, "invalid_body", "Body must be a JSON array.")

    code = _code(db, actor)
    previous = list_records(db, actor, collection)
    previous_by_id = {str(item["id"]): item for item in previous}
    stream = _stream_for_collection(collection)
    actor_stream = _STREAM_OF_ROLE.get(code) if collection in _STREAM_SCOPED_SHARED else None
    # Rows owned by the other auditor stream are invisible to this actor and must survive its save.
    foreign_ids: set[str] = set()
    if actor_stream:
        foreign_ids = {
            row.public_id
            for row in _campus_rows(db, actor.campus_id, collection)
            if _row_stream(row.body or {}) not in ("", actor_stream)
        }
    tracks_response = collection in _OBSERVATION_COLLECTIONS or collection in _ATR_COLLECTIONS

    prefix = COLLECTIONS[collection]
    seen: set[str] = set()
    payloads: list[tuple[str, dict]] = []
    for index, raw in enumerate(items):
        if not isinstance(raw, dict):
            fail(422, "invalid_body", "Each item must be an object.")
        fallback = f"{prefix}-{index + 1:04d}"
        public_id = _public_id_for(raw, fallback)
        if not public_id:
            fail(422, "invalid_body", "Each item needs an id.")
        if len(public_id) > 80:
            fail(422, "invalid_body", f"Record id is longer than 80 characters: {public_id[:20]}...")
        if public_id in seen:
            fail(422, "duplicate", f"Duplicate id in payload: {public_id}")
        seen.add(public_id)
        payload = {**raw, "id": public_id}
        for meta in ("_collection", "_updatedAt", "_createdAt"):
            payload.pop(meta, None)
        if stream:
            payload["auditStream"] = stream
            if not _item_allowed_in_stream(collection, payload):
                fail(
                    422,
                    "invalid_body",
                    f"Record {public_id} does not belong to the {stream} audit stream.",
                )
        if actor_stream:
            if public_id in foreign_ids or _row_stream(payload) not in ("", actor_stream):
                fail(403, "forbidden", f"Record {public_id} belongs to the other audit stream.")
            payload["stream"] = actor_stream
        before = previous_by_id.get(public_id)
        # Ownership is stamped by the server and cannot be rewritten by later saves.
        for field in _OWNER_FIELDS:
            payload.pop(field, None)
            if before is not None and before.get(field):
                payload[field] = before[field]
        if before is None:
            payload["createdByEmail"] = actor.email
            payload["createdByRole"] = code
        if collection in _OBSERVATION_COLLECTIONS or collection in _ATR_COLLECTIONS:
            _validate_recipient(payload, public_id)
        if tracks_response:
            for field in _SERVER_OWNED_FIELDS:
                payload.pop(field, None)
                if before is not None and field in before:
                    payload[field] = before[field]
        payloads.append((public_id, payload))

    if tracks_response:
        for public_id, item in previous_by_id.items():
            if public_id not in seen and item.get("departmentResponse"):
                fail(
                    409,
                    "has_department_response",
                    f"Record {public_id} has a department corrective action and cannot be removed. "
                    "Refresh to load the latest records.",
                )

    condition = [
        CampusAuditRecord.campus_id == actor.campus_id,
        CampusAuditRecord.collection == collection,
    ]
    if foreign_ids:
        condition.append(CampusAuditRecord.public_id.notin_(foreign_ids))
    db.execute(delete(CampusAuditRecord).where(*condition))

    now = datetime.now(timezone.utc)
    for public_id, payload in payloads:
        db.add(
            CampusAuditRecord(
                id=uuid.uuid4(),
                campus_id=actor.campus_id,
                collection=collection,
                public_id=public_id,
                body=payload,
                created_by=actor.id,
                updated_at=now,
            )
        )
    if collection in _OBSERVATION_COLLECTIONS:
        _notify_new_recipients(db, actor, collection, previous_by_id, payloads)

    db.commit()
    saved = list_records(db, actor, collection)
    from app.services.integrations.events import notify_saved_audit
    notify_saved_audit(db, actor, collection, previous, saved)
    return saved


def _stream_label(collection: str) -> str:
    return "Process" if collection.startswith("process-") else "Quality"


def _notify_new_recipients(db, actor, collection, previous_by_id, payloads) -> None:
    for public_id, payload in payloads:
        role = payload.get("recipientRole")
        if not role:
            continue
        before = previous_by_id.get(public_id) or {}
        if before.get("recipientRole") == role:
            continue
        due = str(payload.get("dueDate") or "").strip()
        db.add(
            Notification(
                campus_id=actor.campus_id,
                role_code=role,
                title=f"{_stream_label(collection)} audit observation assigned to {RECIPIENT_ROLES[role]}"[:200],
                body=(
                    f"Observation {payload.get('observationId') or public_id} needs a corrective action"
                    + (f" by {due}." if due else ".")
                    + " Open Audit Observations in QMIS ERP to respond."
                ),
                entity_type="audit_observation",
                entity_id=public_id[:80],
            )
        )


# ---------- Recipient (department head) workflow ----------

_STREAMS = {"process": "PROCESS", "quality": "QUALITY"}
_RECIPIENT_VIEW_FIELDS = (
    "id",
    "observationId",
    "referenceNumber",
    "auditReference",
    "auditStream",
    "department",
    "location",
    "category",
    "grade",
    "section",
    "subject",
    "title",
    "description",
    "priority",
    "severity",
    "dueDate",
    "status",
    "recipientRole",
    "recipientDepartment",
    "createdDate",
    "correctiveActionStatus",
    "departmentResponse",
    "responseHistory",
)
_CLOSED_OBSERVATION_STATUSES = {"Resolved", "Closed"}
_ACTION_TEXT_LIMIT = 4000


def _require_stream(stream: str) -> str:
    key = str(stream or "").strip().lower()
    if key not in _STREAMS:
        fail(404, "not_found", "That audit stream does not exist.")
    return key


def _require_recipient(db: Session, actor: User) -> str:
    code = _code(db, actor)
    if code not in RECIPIENT_ROLES:
        fail(403, "forbidden", "Only department heads named as audit recipients can use this view.")
    return code


def _find_observation(db: Session, campus_id, stream: str, observation_id: str) -> CampusAuditRecord | None:
    wanted = str(observation_id or "").strip()
    if not wanted:
        return None
    for row in _campus_rows(db, campus_id, f"{stream}-observations"):
        body = row.body or {}
        if row.public_id == wanted or str(body.get("observationId") or "") == wanted:
            return row
    return None


def _find_atr(db: Session, campus_id, stream: str, observation: dict) -> CampusAuditRecord | None:
    keys = {str(observation.get("observationId") or ""), str(observation.get("id") or "")} - {""}
    for row in _campus_rows(db, campus_id, f"{stream}-atr"):
        if str((row.body or {}).get("observationId") or "") in keys:
            return row
    return None


def _recipient_view(stream: str, observation: dict, atr: dict | None) -> dict:
    view = {key: observation.get(key) for key in _RECIPIENT_VIEW_FIELDS if key in observation}
    view["stream"] = stream
    view["auditStream"] = _STREAMS[stream]
    view["correctiveAction"] = (
        {
            "id": atr.get("id"),
            "atrNumber": atr.get("atrNumber") or atr.get("id"),
            "status": atr.get("status"),
            "dueDate": atr.get("dueDate") or observation.get("dueDate"),
            "departmentResponse": atr.get("departmentResponse"),
            "responseHistory": atr.get("responseHistory") or [],
        }
        if atr
        else None
    )
    return view


def list_assigned_observations(db: Session, actor: User, stream: str | None = None) -> list[dict]:
    """Observations whose recipient is the actor's department-head role (both streams unless filtered)."""
    code = _require_recipient(db, actor)
    streams = [_require_stream(stream)] if stream else list(_STREAMS)
    out: list[dict] = []
    for key in streams:
        stream_name = _STREAMS[key]
        atr_by_obs: dict[str, dict] = {}
        for row in _campus_rows(db, actor.campus_id, f"{key}-atr"):
            body = row.body or {}
            if str(body.get("observationId") or ""):
                atr_by_obs.setdefault(str(body["observationId"]), _as_item(row))
        for row in _campus_rows(db, actor.campus_id, f"{key}-observations"):
            item = _as_item(row)
            if str(item.get("recipientRole") or "").lower() != code:
                continue
            if _row_stream(item) not in ("", stream_name) or not _item_allowed_in_stream(f"{key}-observations", item):
                continue
            atr = atr_by_obs.get(str(item.get("observationId") or "")) or atr_by_obs.get(str(item["id"]))
            out.append(_recipient_view(key, item, atr))
    return out


def _clean_text(value, field: str, *, required: bool = False) -> str:
    text = str(value or "").strip()
    if required and not text:
        fail(422, "invalid_body", f"{field} is required.")
    if len(text) > _ACTION_TEXT_LIMIT:
        fail(422, "invalid_body", f"{field} is longer than {_ACTION_TEXT_LIMIT} characters.")
    return text


def _validated_evidence(db: Session, actor: User, stream: str, observation_keys: set[str], raw) -> list[dict]:
    from app.models import FileAsset

    if raw in (None, ""):
        return []
    if not isinstance(raw, list) or len(raw) > 20:
        fail(422, "invalid_body", "evidence must be a list of up to 20 uploaded files.")
    out: list[dict] = []
    for entry in raw:
        file_id = str((entry or {}).get("fileId") or "").strip() if isinstance(entry, dict) else ""
        try:
            asset = db.get(FileAsset, uuid.UUID(file_id))
        except (ValueError, TypeError):
            asset = None
        if (
            asset is None
            or asset.campus_id != actor.campus_id
            or asset.uploaded_by != actor.id
            or asset.resource_type != f"{stream}-atr-evidence"
            or str(asset.resource_id or "") not in observation_keys
        ):
            fail(422, "invalid_evidence", "Evidence must be a file you uploaded for this corrective action.")
        out.append(
            {
                "fileId": str(asset.id),
                "name": asset.original_name,
                "contentType": asset.content_type,
                "downloadPath": f"/api/v1/files/{asset.id}/download",
            }
        )
    return out


def submit_corrective_action(db: Session, actor: User, stream: str, observation_id: str, body: dict) -> dict:
    code = _require_recipient(db, actor)
    key = _require_stream(stream)
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    row = _find_observation(db, actor.campus_id, key, observation_id)
    if row is None or not _item_allowed_in_stream(f"{key}-observations", _as_item(row)):
        fail(404, "not_found", "Observation was not found.")
    observation = dict(row.body or {})
    if str(observation.get("recipientRole") or "").lower() != code:
        fail(403, "forbidden", "This observation is not assigned to your department.")
    if str(observation.get("status") or "") in _CLOSED_OBSERVATION_STATUSES:
        fail(409, "observation_closed", "This observation is already closed.")

    now = datetime.now(timezone.utc)
    observation_key = str(observation.get("observationId") or row.public_id)
    response = {
        "actionTaken": _clean_text(body.get("actionTaken"), "Action taken", required=True),
        "rootCause": _clean_text(body.get("rootCause"), "Root cause"),
        "preventiveAction": _clean_text(body.get("preventiveAction"), "Preventive action"),
        "completionDate": _clean_text(body.get("completionDate"), "Completion date")[:32],
        "evidence": _validated_evidence(
            db, actor, key, {observation_key, row.public_id}, body.get("evidence")
        ),
        "department": RECIPIENT_ROLES[code],
        "submittedByEmail": actor.email,
        "submittedByRole": code,
        "submittedAt": now.isoformat(),
    }
    entry = {
        "at": now.isoformat(),
        "byEmail": actor.email,
        "byRole": code,
        "action": "Corrective action submitted",
        "status": "Submitted",
    }

    observation["departmentResponse"] = response
    observation["responseHistory"] = [*(observation.get("responseHistory") or []), entry]
    observation["correctiveActionStatus"] = "Submitted"
    if str(observation.get("status") or "") in ("", "Open", "Assigned"):
        observation["status"] = "In Review"
    row.body = observation
    row.updated_at = now

    atr_row = _find_atr(db, actor.campus_id, key, observation)
    if atr_row is not None:
        atr = dict(atr_row.body or {})
    else:
        tag = "PA" if key == "process" else "QA"
        atr_id = f"ATR-{tag}-{observation_key}"[:80]
        atr = {
            "id": atr_id,
            "atrNumber": atr_id,
            "observationId": observation_key,
            "auditNumber": observation.get("auditReference") or "",
            "department": observation.get("department") or RECIPIENT_ROLES[code],
            "capaType": "CAPA",
            "createdByEmail": actor.email,
            "createdByRole": code,
        }
        atr_row = CampusAuditRecord(
            id=uuid.uuid4(),
            campus_id=actor.campus_id,
            collection=f"{key}-atr",
            public_id=atr_id,
            body=atr,
            created_by=actor.id,
        )
        db.add(atr_row)
    atr.update(
        {
            "auditStream": _STREAMS[key],
            "status": "Submitted",
            "ownerRole": code,
            "ownerDepartment": RECIPIENT_ROLES[code],
            "dueDate": atr.get("dueDate") or observation.get("dueDate") or "",
            "submittedBy": actor.email,
            "submittedOn": now.strftime("%d-%m-%Y"),
            "submittedOnTime": now.strftime("%I:%M %p"),
            "departmentResponse": response,
            "responseHistory": [*(atr.get("responseHistory") or []), entry],
        }
    )
    action = dict(atr.get("actionTaken") or {}) if isinstance(atr.get("actionTaken"), dict) else {}
    action.update(
        {
            "actionTaken": response["actionTaken"],
            "completionDate": response["completionDate"] or action.get("completionDate", ""),
            "responsiblePerson": RECIPIENT_ROLES[code],
        }
    )
    atr["actionTaken"] = action
    atr_row.body = atr
    atr_row.updated_at = now

    auditor_role = "processauditor" if key == "process" else "qualityauditor"
    db.add(
        Notification(
            campus_id=actor.campus_id,
            role_code=auditor_role,
            title=f"Corrective action submitted by {RECIPIENT_ROLES[code]}"[:200],
            body=f"Observation {observation_key} has a department corrective action awaiting your review.",
            entity_type="audit_atr",
            entity_id=str(atr["id"])[:80],
        )
    )
    db.commit()
    db.refresh(row)
    db.refresh(atr_row)
    return _recipient_view(key, _as_item(row), _as_item(atr_row))


# ---------- Audit evidence files ----------

AUDITOR_EVIDENCE_TYPES = {"process-audit-evidence": "process", "quality-audit-evidence": "quality"}
RECIPIENT_EVIDENCE_TYPES = {"process-atr-evidence": "process", "quality-atr-evidence": "quality"}
GENERIC_EVIDENCE_TYPE = "audit-evidence"


def is_audit_resource(resource_type: str) -> bool:
    value = str(resource_type or "")
    return value == GENERIC_EVIDENCE_TYPE or value in AUDITOR_EVIDENCE_TYPES or value in RECIPIENT_EVIDENCE_TYPES


def resolve_audit_upload(db: Session, actor: User, resource_type: str, resource_id: str | None) -> str | None:
    """Return the stored resource type when ``actor`` may upload audit evidence, else None.

    The generic ``audit-evidence`` type is stored under the auditor's own stream so the other
    stream cannot download it.
    """
    code = _code(db, actor)
    value = str(resource_type or "")
    if value == GENERIC_EVIDENCE_TYPE:
        stream = _STREAM_OF_ROLE.get(code)
        if stream is None:
            return None
        value = f"{stream.lower()}-audit-evidence"
    if value in AUDITOR_EVIDENCE_TYPES:
        key = AUDITOR_EVIDENCE_TYPES[value]
        return value if code in _writers_for(f"{key}-observations") else None
    if value in RECIPIENT_EVIDENCE_TYPES:
        key = RECIPIENT_EVIDENCE_TYPES[value]
        if code in _writers_for(f"{key}-atr"):
            return value
        if code not in RECIPIENT_ROLES:
            return None
        row = _find_observation(db, actor.campus_id, key, resource_id or "")
        if row is None or str((row.body or {}).get("recipientRole") or "").lower() != code:
            return None
        return value
    return None


def can_download_audit_file(db: Session, actor: User, resource_type: str) -> bool:
    """Stream readers may download that stream's audit evidence (the uploader is checked separately)."""
    value = str(resource_type or "")
    key = AUDITOR_EVIDENCE_TYPES.get(value) or RECIPIENT_EVIDENCE_TYPES.get(value)
    if key is None:
        return False
    return _code(db, actor) in _readers_for(f"{key}-observations")
