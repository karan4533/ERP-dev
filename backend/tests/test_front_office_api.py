"""Front Office campus records API (PRM gate passes / transfers / re-enrollment)."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

ADMIN = (settings.admin_seed_email, settings.admin_seed_password)
TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client, who):
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_admin_can_create_and_list_student_gate_pass(client):
    headers = _login(client, ADMIN)
    created = client.post(
        "/api/v1/front-office/student-gate-passes",
        headers=headers,
        json={
            "studentId": "STU-1",
            "studentName": "Test Student",
            "classSection": "1-A",
            "reason": "Medical",
            "date": "14-10-2026",
            "outTime": "14:00",
            "status": "Pending",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["id"].startswith("SGP-")
    assert body["studentName"] == "Test Student"

    listed = client.get("/api/v1/front-office/student-gate-passes", headers=headers)
    assert listed.status_code == 200
    assert any(row["id"] == body["id"] for row in listed.json())


def test_teacher_denied_front_office_collection(client):
    headers = _login(client, TEACHER)
    response = client.get("/api/v1/front-office/student-gate-passes", headers=headers)
    assert response.status_code == 403


def test_gatekeeper_can_read_gate_passes_but_not_change_them(client):
    prm = _login(client, (settings.prm_seed_email, settings.prm_seed_password))
    created = client.post(
        "/api/v1/front-office/student-gate-passes",
        headers=prm,
        json={
            "studentId": "STU-GATE",
            "studentName": "Gate Visible Student",
            "classSection": "4-A",
            "reason": "Appointment",
            "date": "23-10-2026",
            "outTime": "15:00",
            "status": "Approved",
        },
    )
    assert created.status_code == 201, created.text
    hr = _login(client, (settings.hr_seed_email, settings.hr_seed_password))
    hired = client.post(
        "/api/v1/hr/staff",
        headers=hr,
        json={"id": "EMP-GATE-READ", "name": "Gate Reader", "email": "gate.read@example.com", "role": "gatekeeper", "department": "Campus"},
    )
    assert hired.status_code == 201, hired.text
    temporary = hired.json()["temporaryPassword"]
    first = client.post("/api/v1/auth/login", json={"email": "gate.read@example.com", "password": temporary})
    assert first.status_code == 200, first.text
    token = first.json()["access_token"]
    changed = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": temporary, "new_password": "Secure-Pass-99"},
    )
    assert changed.status_code == 200, changed.text
    gate = _login(client, ("gate.read@example.com", "Secure-Pass-99"))
    listed = client.get("/api/v1/front-office/student-gate-passes", headers=gate)
    assert listed.status_code == 200, listed.text
    assert any(row["studentName"] == "Gate Visible Student" for row in listed.json())
    denied = client.get("/api/v1/front-office/student-transfers", headers=gate)
    assert denied.status_code == 403
    write = client.post(
        "/api/v1/front-office/student-gate-passes",
        headers=gate,
        json={"studentName": "Should Fail", "reason": "No", "date": "23-10-2026", "status": "Pending"},
    )
    assert write.status_code == 403
    # Verification-only update is allowed; inventing a new pass is not.
    verify = client.put(
        f"/api/v1/front-office/student-gate-passes/{created.json()['id']}",
        headers=gate,
        json={"gateKeeperStatus": "Verified", "studentName": "Should Be Ignored"},
    )
    assert verify.status_code == 200, verify.text
    assert verify.json()["gateKeeperStatus"] == "Verified"
    assert verify.json()["studentName"] == "Gate Visible Student"


def test_admin_can_create_update_and_list_hostel_gate_pass(client):
    headers = _login(client, ADMIN)
    created = client.post(
        "/api/v1/front-office/hostel-gate-passes",
        headers=headers,
        json={
            "studentId": "STU-H1",
            "studentName": "Hostel Student",
            "classSection": "8-A",
            "hostel": "QMIS Hostel",
            "leaveType": "Home Visit",
            "reason": "Family event",
            "outDate": "14-10-2026",
            "outTime": "16:00",
            "returnDate": "16-10-2026",
            "returnTime": "18:00",
            "status": "Pending",
            "parentApproval": "Pending",
            "principalApproval": "Pending",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["id"].startswith("HGP-")
    assert body["hostel"] == "QMIS Hostel"

    updated = client.put(
        f"/api/v1/front-office/hostel-gate-passes/{body['id']}",
        headers=headers,
        json={**body, "status": "Checked Out", "principalApproval": "Approved"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["status"] == "Checked Out"

    listed = client.get("/api/v1/front-office/hostel-gate-passes", headers=headers)
    assert listed.status_code == 200
    row = next(r for r in listed.json() if r["id"] == body["id"])
    assert row["status"] == "Checked Out"


def test_admin_can_create_and_list_material_gate_pass(client):
    headers = _login(client, ADMIN)
    created = client.post(
        "/api/v1/front-office/material-gate-passes",
        headers=headers,
        json={
            "passType": "Non-Returnable",
            "date": "14-10-2026",
            "time": "10:00",
            "timePeriod": "AM",
            "driverName": "Ravi",
            "vehicleNo": "TN-01-AB-1234",
            "materials": [
                {
                    "id": "row-1",
                    "description": "Chairs",
                    "quantity": 4,
                    "destination": "Hall",
                    "remarks": "",
                }
            ],
            "approvals": {},
            "status": "Pending",
            "createdBy": "Front Office",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["id"].startswith("MGP-")
    assert body["driverName"] == "Ravi"

    listed = client.get("/api/v1/front-office/material-gate-passes", headers=headers)
    assert listed.status_code == 200
    assert any(row["id"] == body["id"] for row in listed.json())


def test_admin_can_create_and_list_goods_received_pass(client):
    headers = _login(client, ADMIN)
    created = client.post(
        "/api/v1/front-office/goods-received-passes",
        headers=headers,
        json={
            "paymentType": "CASH",
            "date": "14-10-2026",
            "time": "10:00",
            "timePeriod": "AM",
            "supplierName": "ABC Supplies",
            "billNo": "BILL-100",
            "billDate": "14-10-2026",
            "materials": [
                {
                    "id": "row-1",
                    "description": "Paper reams",
                    "quantity": 10,
                    "remarks": "",
                }
            ],
            "signatories": {},
            "status": "Pending",
            "createdBy": "Front Office",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["id"].startswith("GRP-")
    assert body["supplierName"] == "ABC Supplies"

    listed = client.get("/api/v1/front-office/goods-received-passes", headers=headers)
    assert listed.status_code == 200
    assert any(row["id"] == body["id"] for row in listed.json())


def test_admin_can_create_and_list_student_transfer(client):
    headers = _login(client, ADMIN)
    created = client.post(
        "/api/v1/front-office/student-transfers",
        headers=headers,
        json={
            "studentName": "Transfer Student",
            "transferType": "Outward",
            "transferTo": "Another School",
            "className": "Grade 5",
            "reason": "Relocation",
            "requestedOn": "14-10-2026",
            "mdApprovalStatus": "Pending",
            "status": "In Progress",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["id"]
    assert body["studentName"] == "Transfer Student"
    assert body.get("transferType") == "Outward"

    listed = client.get("/api/v1/front-office/student-transfers", headers=headers)
    assert listed.status_code == 200
    assert any(row["id"] == body["id"] for row in listed.json())

    fetched = client.get(f"/api/v1/front-office/student-transfers/{body['id']}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["reason"] == "Relocation"


def test_admin_can_create_update_delete_student_re_enrollment(client):
    headers = _login(client, ADMIN)
    created = client.post(
        "/api/v1/front-office/student-re-enrollments",
        headers=headers,
        json={
            "studentName": "ReEnroll Student",
            "previousAdmissionNo": "ADM-OLD-1",
            "className": "Grade 3",
            "reason": "Returned TC",
            "requestedOn": "15-10-2026",
            "status": "Pending",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["id"].startswith("SRE-")

    updated = client.put(
        f"/api/v1/front-office/student-re-enrollments/{body['id']}",
        headers=headers,
        json={**body, "status": "Approved"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["status"] == "Approved"

    missing = client.get("/api/v1/front-office/student-re-enrollments/SRE-DOES-NOT-EXIST", headers=headers)
    assert missing.status_code == 404

    deleted = client.delete(f"/api/v1/front-office/student-re-enrollments/{body['id']}", headers=headers)
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/front-office/student-re-enrollments/{body['id']}", headers=headers).status_code == 404


def test_principal_can_read_but_not_write_front_office(client):
    principal = (settings.principal_seed_email, settings.principal_seed_password)
    headers = _login(client, principal)
    listed = client.get("/api/v1/front-office/material-gate-passes", headers=headers)
    assert listed.status_code == 200, listed.text
    created = client.post(
        "/api/v1/front-office/material-gate-passes",
        headers=headers,
        json={"driverName": "Nope", "vehicleNo": "TN-00", "timePeriod": "AM", "time": "09:00"},
    )
    assert created.status_code == 403


def test_prm_seed_can_write_front_office(client):
    prm = (settings.prm_seed_email, settings.prm_seed_password)
    headers = _login(client, prm)
    created = client.post(
        "/api/v1/front-office/student-gate-passes",
        headers=headers,
        json={
            "studentId": "STU-PRM",
            "studentName": "PRM Seed Student",
            "classSection": "2-B",
            "reason": "Dental",
            "date": "15-10-2026",
            "outTime": "11:00",
            "status": "Pending",
        },
    )
    assert created.status_code == 201, created.text
    assert created.json()["id"].startswith("SGP-")


def test_unauthenticated_front_office_is_401(client):
    response = client.get("/api/v1/front-office/student-gate-passes")
    assert response.status_code == 401


def test_unknown_front_office_collection_is_404(client):
    headers = _login(client, ADMIN)
    response = client.get("/api/v1/front-office/not-a-collection", headers=headers)
    assert response.status_code == 404
