"""Gate pass approvals (#45 / #47a), DA read-only visibility and Store goods-received passes."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-gate-pass-approvals"

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.main import app
from app.models import Student, User
from tests.conftest import reset_sqlite_memory_schema

ADMIN = (settings.admin_seed_email, settings.admin_seed_password)
PRM = (settings.prm_seed_email, settings.prm_seed_password)
PRINCIPAL = (settings.principal_seed_email, settings.principal_seed_password)
TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)
PARENT = ("parent@qmis.edu", "parent123")
DA = ("jointdirectorassistant@qmis.edu", "jda1234567")
STORE = ("stationerystoremanager@qmis.edu", "stationery123")
GATE = ("gatekeeper@qmis.edu", "gatekeeper123")
LIBRARIAN = ("librarian@qmis.edu", "librarian123")

FO = "/api/v1/front-office"


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _h(client, who):
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _own_child() -> Student:
    with SessionLocal() as db:
        parent = db.scalar(select(User).where(User.email == PARENT[0]))
        child = db.scalar(select(Student).where(Student.parent_user_id == parent.id))
        assert child is not None
        db.expunge(child)
        return child


def _other_child() -> Student:
    with SessionLocal() as db:
        parent = db.scalar(select(User).where(User.email == PARENT[0]))
        other = Student(
            id=uuid.uuid4(),
            campus_id=parent.campus_id,
            admission_number=f"ADM-OTHER-{uuid.uuid4().hex[:6]}",
            full_name="Someone Else",
            class_name="Class 9",
            section="B",
            placement_status="placed",
        )
        db.add(other)
        db.commit()
        db.refresh(other)
        db.expunge(other)
        return other


def _hostel_pass(client, headers, student_id, **extra):
    response = client.post(
        f"{FO}/hostel-gate-passes",
        headers=headers,
        json={
            "studentId": student_id,
            "studentName": "Hostel Kid",
            "classSection": "10-A",
            "hostel": "QMIS Hostel",
            "leaveType": "Home Visit",
            "reason": "Family function",
            "outDate": "14-11-2026",
            "outTime": "16:00",
            "returnDate": "16-11-2026",
            "returnTime": "18:00",
            "status": "Pending",
            **extra,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def _student_pass(client, headers, **extra):
    response = client.post(
        f"{FO}/student-gate-passes",
        headers=headers,
        json={
            "studentId": "STU-SGP",
            "studentName": "Day Scholar",
            "classSection": "5-A",
            "reason": "Medical",
            "date": "14-11-2026",
            "outTime": "11:00",
            "status": "Pending",
            **extra,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


# ---------- #45 Hostel pass: Parent (own child only) + Principal ----------


def test_new_hostel_pass_defaults_pending_even_if_client_claims_approved(client):
    prm = _h(client, PRM)
    child = _own_child()
    created = _hostel_pass(
        client,
        prm,
        str(child.id),
        parentApproval="Approved",
        principalApproval="Approved",
        approvalStatus="Approved",
        decidedByEmail="spoof@x",
    )
    assert created["parentApproval"] == "Pending"
    assert created["principalApproval"] == "Pending"
    assert created["approvalStatus"] == "Pending"
    assert "decidedByEmail" not in created

    # A full-record edit by Front Office cannot sneak an approval in either.
    edited = client.put(
        f"{FO}/hostel-gate-passes/{created['id']}",
        headers=prm,
        json={**created, "principalApproval": "Approved", "approvalStatus": "Approved", "reason": "Updated reason"},
    )
    assert edited.status_code == 200, edited.text
    assert edited.json()["principalApproval"] == "Pending"
    assert edited.json()["approvalStatus"] == "Pending"
    assert edited.json()["reason"] == "Updated reason"


def test_parent_lists_and_approves_own_child_hostel_pass(client):
    prm = _h(client, PRM)
    child = _own_child()
    other = _other_child()
    own = _hostel_pass(client, prm, str(child.id))
    by_admission = _hostel_pass(client, prm, child.admission_number)
    foreign = _hostel_pass(client, prm, str(other.id))

    parent = _h(client, PARENT)
    listed = client.get(f"{FO}/parent/hostel-gate-passes", headers=parent)
    assert listed.status_code == 200, listed.text
    ids = {row["id"] for row in listed.json()}
    assert own["id"] in ids and by_admission["id"] in ids
    assert foreign["id"] not in ids

    # The full FO collection remains closed to parents.
    assert client.get(f"{FO}/hostel-gate-passes", headers=parent).status_code == 403

    decided = client.post(
        f"{FO}/hostel-gate-passes/{own['id']}/decision",
        headers=parent,
        json={"decision": "Approved", "remark": "OK from home", "reason": "rewritten", "hostel": "Hacked"},
    )
    assert decided.status_code == 200, decided.text
    body = decided.json()
    assert body["parentApproval"] == "Approved"
    assert body["approvalStatus"] == "Approved"
    assert body["principalApproval"] == "Pending"
    assert body["reason"] == "Family function"
    assert body["hostel"] == "QMIS Hostel"
    assert body["parentDecision"]["email"] == PARENT[0]
    assert body["parentDecision"]["role"] == "parent"
    assert body["parentDecision"]["remark"] == "OK from home"
    assert body["parentDecision"]["userId"]
    assert body["parentDecision"]["decidedAt"]
    assert body["decidedByEmail"] == PARENT[0]

    # Persisted: Front Office sees the same decision.
    fetched = client.get(f"{FO}/hostel-gate-passes/{own['id']}", headers=prm).json()
    assert fetched["parentApproval"] == "Approved"
    assert fetched["approvalStatus"] == "Approved"
    assert fetched["approvalHistory"][-1]["email"] == PARENT[0]

    # A final decision cannot be overwritten.
    again = client.post(
        f"{FO}/hostel-gate-passes/{own['id']}/decision",
        headers=_h(client, PRINCIPAL),
        json={"decision": "Rejected"},
    )
    assert again.status_code == 409


def test_parent_cannot_decide_other_child_or_student_gate_pass(client):
    prm = _h(client, PRM)
    other = _other_child()
    foreign = _hostel_pass(client, prm, str(other.id))
    sgp = _student_pass(client, prm)
    parent = _h(client, PARENT)

    denied = client.post(f"{FO}/hostel-gate-passes/{foreign['id']}/decision", headers=parent, json={"decision": "Approved"})
    assert denied.status_code == 403
    denied_sgp = client.post(f"{FO}/student-gate-passes/{sgp['id']}/decision", headers=parent, json={"decision": "Approved"})
    assert denied_sgp.status_code == 403

    unchanged = client.get(f"{FO}/hostel-gate-passes/{foreign['id']}", headers=prm).json()
    assert unchanged["parentApproval"] == "Pending"
    assert unchanged["approvalStatus"] == "Pending"


def test_principal_decides_hostel_pass_and_identity_is_recorded(client):
    prm = _h(client, PRM)
    created = _hostel_pass(client, prm, str(_own_child().id))
    principal = _h(client, PRINCIPAL)
    decided = client.post(
        f"{FO}/hostel-gate-passes/{created['id']}/decision",
        headers=principal,
        json={"decision": "Rejected", "remark": "Exams this week"},
    )
    assert decided.status_code == 200, decided.text
    body = decided.json()
    assert body["principalApproval"] == "Rejected"
    assert body["approvalStatus"] == "Rejected"
    assert body["principalDecision"]["email"] == PRINCIPAL[0]
    assert body["principalDecision"]["role"] == "principal"
    assert body["principalDecision"]["remark"] == "Exams this week"
    assert body["status"] == "Pending"  # movement status is not rewritten by the decision


def test_random_staff_and_writers_cannot_use_decision_path(client):
    prm = _h(client, PRM)
    created = _hostel_pass(client, prm, str(_own_child().id))
    sgp = _student_pass(client, prm)
    for who in (TEACHER, LIBRARIAN, DA, GATE, PRM, ADMIN):
        headers = _h(client, who)
        for collection, record in (("hostel-gate-passes", created), ("student-gate-passes", sgp)):
            response = client.post(
                f"{FO}/{collection}/{record['id']}/decision", headers=headers, json={"decision": "Approved"}
            )
            assert response.status_code == 403, (who, collection, response.text)
    assert client.post(f"{FO}/hostel-gate-passes/{created['id']}/decision", json={"decision": "Approved"}).status_code == 401


def test_decision_validates_input_and_collection(client):
    prm = _h(client, PRM)
    sgp = _student_pass(client, prm)
    principal = _h(client, PRINCIPAL)
    bad = client.post(f"{FO}/student-gate-passes/{sgp['id']}/decision", headers=principal, json={"decision": "Maybe"})
    assert bad.status_code == 422
    missing = client.post(f"{FO}/student-gate-passes/SGP-9999/decision", headers=principal, json={"decision": "Approved"})
    assert missing.status_code == 404
    mgp = client.post(
        f"{FO}/material-gate-passes", headers=prm, json={"driverName": "D", "vehicleNo": "TN-1", "status": "Pending"}
    ).json()
    not_applicable = client.post(
        f"{FO}/material-gate-passes/{mgp['id']}/decision", headers=principal, json={"decision": "Approved"}
    )
    assert not_applicable.status_code == 404


# ---------- #47a Principal student gate pass ----------


def test_student_gate_pass_defaults_pending_and_principal_decision_sets_final_status(client):
    prm = _h(client, PRM)
    created = _student_pass(client, prm, status="Approved")
    assert created["status"] == "Pending"
    assert created["approvalStatus"] == "Pending"

    # Front Office edits cannot flip the status themselves.
    edited = client.put(f"{FO}/student-gate-passes/{created['id']}", headers=prm, json={**created, "status": "Approved"})
    assert edited.status_code == 200
    assert edited.json()["status"] == "Pending"

    principal = _h(client, PRINCIPAL)
    listed = client.get(f"{FO}/student-gate-passes", headers=principal)
    assert listed.status_code == 200
    assert any(row["id"] == created["id"] and row["status"] == "Pending" for row in listed.json())

    # Principal still cannot rewrite the record through the generic PUT.
    assert client.put(
        f"{FO}/student-gate-passes/{created['id']}", headers=principal, json={**created, "status": "Approved"}
    ).status_code == 403

    decided = client.post(
        f"{FO}/student-gate-passes/{created['id']}/decision",
        headers=principal,
        json={"decision": "Approved", "remark": "Fine", "studentName": "Renamed"},
    )
    assert decided.status_code == 200, decided.text
    body = decided.json()
    assert body["status"] == "Approved"
    assert body["approvalStatus"] == "Approved"
    assert body["principalApproval"] == "Approved"
    assert body["studentName"] == "Day Scholar"
    assert body["decidedByEmail"] == PRINCIPAL[0]
    assert body["decidedByRole"] == "principal"
    assert body["decidedAt"]

    persisted = client.get(f"{FO}/student-gate-passes/{created['id']}", headers=prm).json()
    assert persisted["status"] == "Approved"
    assert persisted["principalDecision"]["remark"] == "Fine"

    assert client.post(
        f"{FO}/student-gate-passes/{created['id']}/decision", headers=principal, json={"decision": "Rejected"}
    ).status_code == 409


# ---------- DA read-only visibility ----------


def test_joint_director_assistant_reads_gate_passes_read_only(client):
    prm = _h(client, PRM)
    sgp = _student_pass(client, prm)
    hgp = _hostel_pass(client, prm, str(_own_child().id))
    da = _h(client, DA)
    for collection, record in (("student-gate-passes", sgp), ("hostel-gate-passes", hgp)):
        listed = client.get(f"{FO}/{collection}", headers=da)
        assert listed.status_code == 200, listed.text
        assert any(row["id"] == record["id"] for row in listed.json())
        assert client.get(f"{FO}/{collection}/{record['id']}", headers=da).status_code == 200
    assert client.get(f"{FO}/material-gate-passes", headers=da).status_code == 200

    assert client.get(f"{FO}/student-transfers", headers=da).status_code == 403
    assert client.post(f"{FO}/student-gate-passes", headers=da, json={"studentName": "X"}).status_code == 403
    assert client.put(f"{FO}/student-gate-passes/{sgp['id']}", headers=da, json={"status": "Approved"}).status_code == 403
    assert client.delete(f"{FO}/student-gate-passes/{sgp['id']}", headers=da).status_code == 403


# ---------- Store goods received passes ----------


def _grp_payload(**extra):
    return {
        "paymentType": "CASH",
        "date": "14-11-2026",
        "time": "10:00",
        "timePeriod": "AM",
        "supplierName": "Paper Mart",
        "billNo": "B-1",
        "billDate": "14-11-2026",
        "materials": [{"id": "row-1", "description": "A4 reams", "quantity": 5, "remarks": ""}],
        "signatories": {},
        "status": "Pending",
        "createdBy": "Store",
        **extra,
    }


def test_store_can_read_create_update_goods_received_pass(client):
    store = _h(client, STORE)
    assert client.get(f"{FO}/goods-received-passes", headers=store).status_code == 200
    created = client.post(f"{FO}/goods-received-passes", headers=store, json=_grp_payload())
    assert created.status_code == 201, created.text
    grp = created.json()
    assert grp["id"].startswith("GRP-")
    updated = client.put(f"{FO}/goods-received-passes/{grp['id']}", headers=store, json={**grp, "billNo": "B-2"})
    assert updated.status_code == 200
    assert updated.json()["billNo"] == "B-2"
    listed = client.get(f"{FO}/goods-received-passes", headers=store).json()
    assert any(row["id"] == grp["id"] for row in listed)

    # Store still has no access to people gate passes or other FO records.
    assert client.get(f"{FO}/student-gate-passes", headers=store).status_code == 403
    assert client.get(f"{FO}/student-transfers", headers=store).status_code == 403


def test_goods_received_pass_delete_and_gate_verify_are_gated(client):
    prm = _h(client, PRM)
    store = _h(client, STORE)
    fo_grp = client.post(f"{FO}/goods-received-passes", headers=prm, json=_grp_payload(supplierName="FO Supplier")).json()
    store_grp = client.post(f"{FO}/goods-received-passes", headers=store, json=_grp_payload()).json()

    # Store may delete only passes it created.
    assert client.delete(f"{FO}/goods-received-passes/{fo_grp['id']}", headers=store).status_code == 403
    assert client.delete(f"{FO}/goods-received-passes/{store_grp['id']}", headers=store).status_code == 204

    gate = _h(client, GATE)
    assert client.get(f"{FO}/goods-received-passes", headers=gate).status_code == 200
    verify = client.put(
        f"{FO}/goods-received-passes/{fo_grp['id']}",
        headers=gate,
        json={"gateKeeperStatus": "Verified", "supplierName": "Ignored"},
    )
    assert verify.status_code == 200, verify.text
    assert verify.json()["gateKeeperStatus"] == "Verified"
    assert verify.json()["supplierName"] == "FO Supplier"
    assert client.post(f"{FO}/goods-received-passes", headers=gate, json=_grp_payload()).status_code == 403
    assert client.delete(f"{FO}/goods-received-passes/{fo_grp['id']}", headers=gate).status_code == 403

    for who in (TEACHER, LIBRARIAN, PARENT):
        headers = _h(client, who)
        assert client.get(f"{FO}/goods-received-passes", headers=headers).status_code == 403
        assert client.post(f"{FO}/goods-received-passes", headers=headers, json=_grp_payload()).status_code == 403
        assert client.delete(f"{FO}/goods-received-passes/{fo_grp['id']}", headers=headers).status_code == 403

    principal = _h(client, PRINCIPAL)
    assert client.delete(f"{FO}/goods-received-passes/{fo_grp['id']}", headers=principal).status_code == 403
    assert client.delete(f"{FO}/goods-received-passes/{fo_grp['id']}", headers=prm).status_code == 204
