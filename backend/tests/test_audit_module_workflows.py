"""Audit module: PA/QA isolation, schedules/components/rubrics, recipient corrective actions, evidence files."""

import os


def test_respond_permission_matches_the_recipient_roles():
    from app.permissions.matrix import AUDIT_RECIPIENT_ROLES, ROLE_PERMISSIONS
    from app.services.campus_audit_collections import RECIPIENT_ROLES

    assert set(RECIPIENT_ROLES) == AUDIT_RECIPIENT_ROLES
    holders = {code for code, perms in ROLE_PERMISSIONS.items() if "campus_audit.respond" in perms}
    # Admin, Super Admin and the Managing Director hold every permission; the service still limits them.
    assert holders == AUDIT_RECIPIENT_ROLES | {"admin", "superadmin", "managing_director"}

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-audit-module"
os.environ["ENVIRONMENT"] = "development"

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import settings
from app.main import app
from auth_test_helpers import login_headers
from tests.conftest import reset_sqlite_memory_schema

PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
PDF_BYTES = b"%PDF-1.4\n%audit evidence\n"


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _process(client):
    return login_headers(client, "processauditor@qmis.edu", "process123")


def _quality(client):
    return login_headers(client, "qualityauditor@qmis.edu", "quality123")


def _jd_audit(client):
    return login_headers(client, "jointdirectoraudit@qmis.edu", "jdaudit123")


def _housekeeping(client):
    return login_headers(client, "housekeepingmanager@qmis.edu", "housekeeping123")


def _transport(client):
    return login_headers(client, "transportmanager@qmis.edu", "transport123")


def _teacher(client):
    return login_headers(client, settings.teacher_seed_email, settings.teacher_seed_password)


def _put(client, collection, items, headers):
    return client.put(f"/api/v1/campus-audit/{collection}", json=items, headers=headers)


def _get(client, collection, headers):
    return client.get(f"/api/v1/campus-audit/{collection}", headers=headers)


def _upload(client, headers, *, name, data, resource_type, resource_id=None, content_type="application/octet-stream"):
    form = {"resource_type": resource_type}
    if resource_id is not None:
        form["resource_id"] = resource_id
    return client.post(
        "/api/v1/files",
        files={"file": (name, data, content_type)},
        data=form,
        headers=headers,
    )


def _observation(obs_id, *, recipient="housekeepingmanager", audit="AUD-PA-2026-100", **extra):
    return {
        "id": obs_id,
        "observationId": obs_id,
        "referenceNumber": extra.pop("referenceNumber", obs_id),
        "auditReference": audit,
        "department": "Housekeeping",
        "title": "Corridor schedule missing",
        "description": "Board not displayed.",
        "priority": "Medium",
        "status": "Open",
        "dueDate": "2026-11-30",
        "recipientRole": recipient,
        **extra,
    }


# ---------- #31 Process vs Quality isolation + campus filtering ----------


@pytest.mark.parametrize(
    "suffix",
    ["observations", "audit-reports", "compliance-reports", "atr", "audit-schedule", "execute-draft"],
)
def test_process_and_quality_cannot_read_each_others_collections(client, suffix):
    process, quality = _process(client), _quality(client)
    assert _put(client, f"process-{suffix}", [{"id": f"PA-{suffix}-1"}], process).status_code == 200
    assert _put(client, f"quality-{suffix}", [{"id": f"QA-{suffix}-1"}], quality).status_code == 200

    assert _get(client, f"quality-{suffix}", process).status_code == 403
    assert _put(client, f"quality-{suffix}", [], process).status_code == 403
    assert _get(client, f"process-{suffix}", quality).status_code == 403
    assert _put(client, f"process-{suffix}", [], quality).status_code == 403

    # JD Audit oversight still reads both streams.
    jd = _jd_audit(client)
    assert [row["id"] for row in _get(client, f"process-{suffix}", jd).json()] == [f"PA-{suffix}-1"]
    assert [row["id"] for row in _get(client, f"quality-{suffix}", jd).json()] == [f"QA-{suffix}-1"]


def test_audit_reports_are_campus_scoped(client):
    from app.core.database import SessionLocal
    from app.models import Campus, Role
    from app.services.seed import _seed_user

    process = _process(client)
    assert _put(client, "process-audit-reports", [{"id": "PAR-MAIN-1"}], process).status_code == 200

    with SessionLocal() as db:
        other = Campus(code=f"OTH{uuid.uuid4().hex[:6]}", name="Other Campus", city="Elsewhere")
        db.add(other)
        db.flush()
        role = db.scalar(select(Role).where(Role.code == "processauditor"))
        _seed_user(db, campus=other, role=role, email="pa-other@qmis.edu", password="otherpa123")
        db.commit()

    other_headers = login_headers(client, "pa-other@qmis.edu", "otherpa123")
    assert _get(client, "process-audit-reports", other_headers).json() == []
    # A whole-list save on the other campus must not touch the main campus rows.
    assert _put(client, "process-audit-reports", [{"id": "PAR-OTHER-1"}], other_headers).status_code == 200
    assert [row["id"] for row in _get(client, "process-audit-reports", process).json()] == ["PAR-MAIN-1"]


# ---------- #11 schedules ----------


def test_schedules_persist_per_stream_with_server_owner(client):
    process, quality = _process(client), _quality(client)
    schedule = {
        "id": "SCH-PA-1",
        "scheduleId": "SCH-PA-1",
        "auditName": "Petty cash",
        "componentId": "AC-0001",
        "componentName": "Process walkthrough",
        "createdByEmail": "spoof@qmis.edu",
    }
    saved = _put(client, "process-audit-schedule", [schedule], process)
    assert saved.status_code == 200, saved.text
    assert saved.json()[0]["createdByEmail"] == "processauditor@qmis.edu"
    assert saved.json()[0]["auditStream"] == "PROCESS"

    # A later save by JD Audit keeps the original owner.
    jd = _jd_audit(client)
    resaved = _put(client, "process-audit-schedule", [{**saved.json()[0], "createdByEmail": "x"}], jd)
    assert resaved.json()[0]["createdByEmail"] == "processauditor@qmis.edu"

    # Reload (fresh request) still returns it; QA list stays empty.
    assert [row["id"] for row in _get(client, "process-audit-schedule", process).json()] == ["SCH-PA-1"]
    assert _get(client, "quality-audit-schedule", quality).json() == []
    # A PA schedule id cannot be saved into the quality stream.
    assert _put(client, "quality-audit-schedule", [{"id": "SCH-PA-9"}], quality).status_code == 422


# ---------- #19 / #20 / #21 components + rubrics ----------


def _component(cid, stream=None, **extra):
    row = {
        "id": cid,
        "component": f"Component {cid}",
        "subComponent": "Sub",
        "rubric1": "Beginning",
        "rubric2": "Developing",
        "rubric3": "Proficient",
        "rubric4": "Exemplary",
        **extra,
    }
    if stream:
        row["stream"] = stream
    return row


def test_components_are_stream_scoped_and_keep_four_rubrics(client):
    process, quality = _process(client), _quality(client)
    pa = _put(client, "audit-components", [_component("AC-0001")], process)
    assert pa.status_code == 200, pa.text
    assert pa.json()[0]["stream"] == "PROCESS"
    assert pa.json()[0]["createdByRole"] == "processauditor"

    qa = _put(client, "audit-components", [_component("AC-0002", rubric4="Outstanding")], quality)
    assert qa.status_code == 200, qa.text
    # QA's save did not delete PA's component, and neither sees the other's rows.
    assert [row["id"] for row in _get(client, "audit-components", process).json()] == ["AC-0001"]
    assert [row["id"] for row in _get(client, "audit-components", quality).json()] == ["AC-0002"]

    jd_rows = {row["id"]: row for row in _get(client, "audit-components", _jd_audit(client)).json()}
    assert set(jd_rows) == {"AC-0001", "AC-0002"}
    assert [jd_rows["AC-0002"][f"rubric{n}"] for n in range(1, 5)] == [
        "Beginning",
        "Developing",
        "Proficient",
        "Outstanding",
    ]

    # Editing one rubric level leaves the other three unchanged.
    edited = _component("AC-0001", rubric2="Approaching")
    rows = _put(client, "audit-components", [edited], process).json()
    assert [rows[0][f"rubric{n}"] for n in range(1, 5)] == ["Beginning", "Approaching", "Proficient", "Exemplary"]

    # PA cannot write a QUALITY component or overwrite QA's row by id.
    assert _put(client, "audit-components", [_component("AC-0009", stream="QUALITY")], process).status_code == 403
    assert _put(client, "audit-components", [_component("AC-0002")], process).status_code == 403
    assert [row["id"] for row in _get(client, "audit-components", quality).json()] == ["AC-0002"]

    # Unrelated roles cannot create components.
    assert _put(client, "audit-components", [_component("AC-0100")], _teacher(client)).status_code == 403


# ---------- #13 NA fields / #17 reference number ----------


def test_cleared_grade_section_subject_and_reference_number_persist(client):
    process = _process(client)
    obs = _observation("OBS-PA-2026-201", grade="", section=None, subject="", referenceNumber="REF-HK-77")
    saved = _put(client, "process-observations", [obs], process)
    assert saved.status_code == 200, saved.text
    row = _get(client, "process-observations", process).json()[0]
    assert row["grade"] == "" and row["section"] is None and row["subject"] == ""
    assert row["referenceNumber"] == "REF-HK-77"
    # Reference number is editable.
    _put(client, "process-observations", [{**row, "referenceNumber": "REF-HK-78"}], process)
    assert _get(client, "process-observations", process).json()[0]["referenceNumber"] == "REF-HK-78"


# ---------- Recipient workflow ----------


def test_recipient_must_be_a_department_head_role(client):
    process = _process(client)
    bad = _put(client, "process-observations", [_observation("OBS-PA-2026-300", recipient="Mr. Ramesh Iyer")], process)
    assert bad.status_code == 422
    good = _put(client, "process-observations", [_observation("OBS-PA-2026-301")], process)
    assert good.status_code == 200
    assert good.json()[0]["recipientDepartment"] == "Housekeeping"


def _assign_two_observations(client):
    process = _process(client)
    rows = [
        _observation("OBS-PA-2026-401"),
        _observation("OBS-PA-2026-402", recipient="transportmanager"),
    ]
    assert _put(client, "process-observations", rows, process).status_code == 200
    return process


def test_recipient_sees_only_assigned_observations_and_is_notified(client):
    _assign_two_observations(client)
    quality = _quality(client)
    assert _put(
        client,
        "quality-observations",
        [_observation("OBS-QA-2026-401", audit="AUD-QA-2026-1", recipient="transportmanager")],
        quality,
    ).status_code == 200

    hk = _housekeeping(client)
    got = client.get("/api/v1/campus-audit/assigned/observations", headers=hk)
    assert got.status_code == 200, got.text
    assert [row["id"] for row in got.json()] == ["OBS-PA-2026-401"]
    assert got.json()[0]["stream"] == "process"

    tm_rows = client.get("/api/v1/campus-audit/assigned/observations", headers=_transport(client)).json()
    assert {row["id"] for row in tm_rows} == {"OBS-PA-2026-402", "OBS-QA-2026-401"}

    # Department heads still cannot read the auditors' full collections.
    assert _get(client, "process-observations", hk).status_code == 403
    # Auditors and teachers are not recipients.
    assert client.get("/api/v1/campus-audit/assigned/observations", headers=_teacher(client)).status_code == 403

    notes = client.get("/api/v1/notifications", headers=hk).json()
    hk_notes = [n for n in notes if n.get("entityType") == "audit_observation"]
    assert [n["entityId"] for n in hk_notes] == ["OBS-PA-2026-401"]

    # Re-saving the same assignment does not notify again.
    process = _process(client)
    rows = _get(client, "process-observations", process).json()
    _put(client, "process-observations", rows, process)
    notes = client.get("/api/v1/notifications", headers=hk).json()
    assert len([n for n in notes if n.get("entityType") == "audit_observation"]) == 1


def test_recipient_submits_corrective_action_for_own_observation_only(client):
    process = _assign_two_observations(client)
    hk = _housekeeping(client)

    upload = _upload(
        client,
        hk,
        name="after.png",
        data=PNG_BYTES,
        resource_type="process-atr-evidence",
        resource_id="OBS-PA-2026-401",
        content_type="image/png",
    )
    assert upload.status_code == 201, upload.text
    file_id = upload.json()["id"]
    # Cannot attach evidence to another department's observation.
    assert _upload(
        client, hk, name="x.png", data=PNG_BYTES, resource_type="process-atr-evidence", resource_id="OBS-PA-2026-402"
    ).status_code == 403

    url = "/api/v1/campus-audit/assigned/process/observations/{}/corrective-action"
    body = {
        "actionTaken": "Board installed and schedule displayed.",
        "rootCause": "Board removed during painting.",
        "completionDate": "2026-11-20",
        "evidence": [{"fileId": file_id}],
    }
    other = client.post(url.format("OBS-PA-2026-402"), json=body, headers=hk)
    assert other.status_code == 403
    missing = client.post(url.format("OBS-PA-NOPE"), json=body, headers=hk)
    assert missing.status_code == 404
    assert client.post(url.format("OBS-PA-2026-401"), json={"actionTaken": " "}, headers=hk).status_code == 422

    done = client.post(url.format("OBS-PA-2026-401"), json=body, headers=hk)
    assert done.status_code == 200, done.text
    view = done.json()
    assert view["status"] == "In Review"
    assert view["departmentResponse"]["actionTaken"].startswith("Board installed")
    assert view["departmentResponse"]["evidence"][0]["fileId"] == file_id
    assert view["correctiveAction"]["status"] == "Submitted"
    assert view["correctiveAction"]["dueDate"] == "2026-11-30"
    assert len(view["correctiveAction"]["responseHistory"]) == 1

    # Auditor sees the ATR (owner, deadline, evidence, history) and is notified.
    atr = _get(client, "process-atr", process).json()
    assert len(atr) == 1
    assert atr[0]["ownerRole"] == "housekeepingmanager"
    assert atr[0]["departmentResponse"]["submittedByEmail"] == "housekeepingmanager@qmis.edu"
    notes = client.get("/api/v1/notifications", headers=process).json()
    assert any(n.get("entityType") == "audit_atr" for n in notes)
    # QA is not notified about a process ATR.
    assert not any(n.get("entityType") == "audit_atr" for n in client.get("/api/v1/notifications", headers=_quality(client)).json())

    # Auditor's evidence download works; another department head cannot download it.
    assert client.get(f"/api/v1/files/{file_id}/download", headers=process).status_code == 200
    assert client.get(f"/api/v1/files/{file_id}/download", headers=_quality(client)).status_code == 403
    assert client.get(f"/api/v1/files/{file_id}/download", headers=_transport(client)).status_code == 403

    # Auditor whole-list saves cannot overwrite or drop the department's response.
    tampered = [{**atr[0], "departmentResponse": {"actionTaken": "forged"}}]
    kept = _put(client, "process-atr", tampered, process)
    assert kept.status_code == 200
    assert kept.json()[0]["departmentResponse"]["actionTaken"].startswith("Board installed")
    assert _put(client, "process-atr", [], process).status_code == 409

    # The other stream's endpoint cannot reach a process observation.
    assert client.post(
        "/api/v1/campus-audit/assigned/quality/observations/OBS-PA-2026-401/corrective-action", json=body, headers=hk
    ).status_code == 404


# ---------- Evidence uploads ----------


def test_auditor_evidence_upload_type_validation_and_stream_isolation(client):
    process, quality = _process(client), _quality(client)
    png = _upload(client, process, name="photo.png", data=PNG_BYTES, resource_type="audit-evidence", content_type="image/png")
    assert png.status_code == 201, png.text
    assert png.json()["resource_type"] == "process-audit-evidence"
    assert png.json()["content_type"] == "image/png"

    pdf = _upload(client, quality, name="note.pdf", data=PDF_BYTES, resource_type="quality-audit-evidence")
    assert pdf.status_code == 201, pdf.text
    assert pdf.json()["content_type"] == "application/pdf"

    exe = _upload(client, process, name="tool.exe", data=b"MZ\x90\x00" + b"\x00" * 20, resource_type="audit-evidence")
    assert exe.status_code == 415
    disguised = _upload(client, process, name="fake.png", data=b"MZ\x90\x00" + b"\x00" * 20, resource_type="audit-evidence")
    assert disguised.status_code == 415

    # PA cannot upload into the quality stream; unrelated roles cannot upload audit evidence.
    assert _upload(client, process, name="p.png", data=PNG_BYTES, resource_type="quality-audit-evidence").status_code == 403
    assert _upload(client, _teacher(client), name="p.png", data=PNG_BYTES, resource_type="audit-evidence").status_code == 403
    assert _upload(client, _housekeeping(client), name="p.png", data=PNG_BYTES, resource_type="process-audit-evidence").status_code == 403

    # Downloads follow the stream readers.
    png_id, pdf_id = png.json()["id"], pdf.json()["id"]
    assert client.get(f"/api/v1/files/{png_id}/download", headers=_jd_audit(client)).status_code == 200
    assert client.get(f"/api/v1/files/{png_id}/download", headers=quality).status_code == 403
    assert client.get(f"/api/v1/files/{pdf_id}/download", headers=process).status_code == 403
