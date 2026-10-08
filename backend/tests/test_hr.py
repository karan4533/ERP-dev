import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client: TestClient) -> str:
    response = client.post("/api/v1/auth/login", json={"email": "hr@qmis.edu", "password": "hr12345"})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def test_hr_vertical_round_trip(client):
    token = _login(client)
    headers = {"Authorization": f"Bearer {token}"}

    employees = client.put(
        "/api/v1/hr/portal/employees",
        headers=headers,
        json=[
            {
                "id": "EMP-2026-001",
                "name": "Priya Sharma",
                "email": "priya.sharma@school.com",
                "department": "Academic",
                "designation": "Senior Teacher — Mathematics",
                "status": "Active",
                "grossSalary": 65000,
            }
        ],
    )
    assert employees.status_code == 200, employees.text
    priya_portal = next(row for row in employees.json() if row["id"] == "EMP-2026-001")
    assert priya_portal["name"] == "Priya Sharma"
    listed = client.get("/api/v1/hr/employees", headers=headers)
    assert listed.status_code == 200
    priya = next(row for row in listed.json() if row["employee_code"] == "EMP-2026-001")
    assert priya["department"] == "Academic"

    document = client.post(
        "/api/v1/hr/documents",
        headers=headers,
        json={"employeeId": "EMP-2026-001", "type": "Offer Letter", "name": "Offer Letter — Priya Sharma", "status": "Verified"},
    )
    assert document.status_code == 201, document.text
    docs = client.get("/api/v1/hr/employees/EMP-2026-001/documents", headers=headers)
    assert docs.status_code == 200
    assert docs.json()[0]["type"] == "Offer Letter"

    job = client.post(
        "/api/v1/hr/jobs",
        headers=headers,
        json={"id": "JOB-2026-001", "position": "Mathematics Teacher", "status": "Open", "openings": 2},
    )
    assert job.status_code == 201, job.text
    candidate = client.post(
        "/api/v1/hr/candidates",
        headers=headers,
        json={"id": "CAN-2026-001", "jobId": "JOB-2026-001", "name": "Amit Khanna", "status": "Interview"},
    )
    assert candidate.status_code == 201, candidate.text
    onboarding = client.post(
        "/api/v1/hr/onboarding",
        headers=headers,
        json={"id": "ONB-2026-001", "employeeId": "EMP-2026-001", "overallStatus": "In Progress", "checklist": [{"label": "Offer Accepted", "status": "Completed"}]},
    )
    assert onboarding.status_code == 201, onboarding.text

    leave = client.put(
        "/api/v1/hr/leave",
        headers=headers,
        json={
            "policies": [{"id": "POL-001", "leaveType": "Casual Leave", "entitlement": 12, "active": True}],
            "requests": [{"id": "LVE-001", "employeeId": "EMP-2026-001", "leaveType": "Casual Leave", "status": "Pending", "days": 1}],
        },
    )
    assert leave.status_code == 200, leave.text
    assert leave.json()["requests"][0]["status"] == "Pending"
    approved = client.patch(
        "/api/v1/hr/leave-requests/LVE-001",
        headers=headers,
        json={"status": "Approved", "approvedBy": "HR"},
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "Approved"

    attendance = client.post(
        "/api/v1/hr/attendance",
        headers=headers,
        json={"id": "ATT-001", "employeeId": "EMP-2026-001", "date": "22-09-2026", "status": "Present"},
    )
    assert attendance.status_code == 201, attendance.text
    training = client.post(
        "/api/v1/hr/training",
        headers=headers,
        json={"id": "TRN-2026-001", "title": "Communication Skills", "status": "Scheduled", "participantIds": ["EMP-2026-001"]},
    )
    assert training.status_code == 201, training.text

    payroll = client.put(
        "/api/v1/hr/payroll",
        headers=headers,
        json={
            "months": [{"id": "PAY-001", "employeeId": "EMP-2026-001", "month": "June", "year": 2026, "paymentStatus": "Unpaid"}],
            "revisions": [{"id": "REV-001", "employeeId": "EMP-2026-001", "revisedGross": 65000, "status": "Approved"}],
        },
    )
    assert payroll.status_code == 200, payroll.text
    assert payroll.json()["months"][0]["paymentStatus"] == "Unpaid"

    exited = client.post(
        "/api/v1/hr/exits",
        headers=headers,
        json={"id": "EXT-2026-001", "employeeId": "EMP-2026-001", "exitType": "Resignation", "status": "Initiated"},
    )
    assert exited.status_code == 201, exited.text
    assert client.get("/api/v1/hr/exits", headers=headers).json()[0]["exitType"] == "Resignation"


def test_hr_routes_require_a_token(client):
    assert client.get("/api/v1/hr/jobs").status_code == 401
    assert client.post("/api/v1/hr/exits", json={"exitType": "Resignation"}).status_code == 401
