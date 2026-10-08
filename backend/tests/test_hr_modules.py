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


def _headers(client: TestClient) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": "hr@qmis.edu", "password": "hr12345"})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_module_staff_user_creation(client):
    headers = _headers(client)
    created = client.post(
        "/api/v1/hr/staff",
        headers=headers,
        json={
            "name": "Kavya Iyer",
            "email": "kavya.iyer@school.com",
            "role": "teacher",
            "department": "Academic",
            "designation": "Teacher",
            "joiningDate": "01-10-2026",
            "status": "Active",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["role"] == "teacher"
    assert body["temporaryPassword"]
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "kavya.iyer@school.com", "password": body["temporaryPassword"]},
    )
    assert login.status_code == 200, login.text
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {login.json()['access_token']}"})
    assert me.status_code == 200
    assert me.json()["must_change_password"] is True
    assert me.json()["role"] == "teacher"
    history = client.get("/api/v1/hr/assignments", headers=headers)
    assert history.status_code == 200
    assert any(row["employeeId"] == body["id"] for row in history.json())


def test_module_documents(client):
    headers = _headers(client)
    saved = client.put(
        "/api/v1/hr/documents",
        headers=headers,
        json=[{"id": "DOC-101", "employeeId": "EMP-2026-014", "type": "ID Proof", "status": "Verified", "expiryDate": "02-06-2030"}],
    )
    assert saved.status_code == 200, saved.text
    assert saved.json()[0]["status"] == "Verified"


def test_module_recruitment_and_interview(client):
    headers = _headers(client)
    job = client.post("/api/v1/hr/jobs", headers=headers, json={"id": "JOB-MOD-1", "position": "Mathematics Teacher", "status": "Open"})
    assert job.status_code == 201, job.text
    candidate = client.post(
        "/api/v1/hr/candidates",
        headers=headers,
        json={"id": "CAN-MOD-1", "jobId": "JOB-MOD-1", "name": "Amit Khanna", "status": "Interview"},
    )
    assert candidate.status_code == 201, candidate.text
    interview = client.post(
        "/api/v1/hr/interviews",
        headers=headers,
        json={"id": "INT-MOD-1", "candidateId": "CAN-MOD-1", "level": "Technical", "status": "Scheduled", "technical": 3, "communication": 3},
    )
    assert interview.status_code == 201, interview.text
    feedback = client.patch("/api/v1/hr/interviews/INT-MOD-1", headers=headers, json={"status": "Selected", "finalDecision": "Selected"})
    assert feedback.status_code == 200, feedback.text
    assert feedback.json()["finalDecision"] == "Selected"


def test_module_offer_and_onboarding(client):
    headers = _headers(client)
    offer = client.post(
        "/api/v1/hr/offers",
        headers=headers,
        json={"id": "OFR-MOD-1", "candidateId": "CAN-MOD-1", "kind": "Offer", "status": "Accepted", "grossSalary": 40000},
    )
    assert offer.status_code == 201, offer.text
    onboarding = client.post(
        "/api/v1/hr/onboarding",
        headers=headers,
        json={"id": "ONB-MOD-1", "employeeId": "EMP-MOD", "overallStatus": "In Progress", "checklist": [{"label": "ID Card", "status": "Completed"}]},
    )
    assert onboarding.status_code == 201, onboarding.text
    assert onboarding.json()["checklist"][0]["label"] == "ID Card"


def test_module_observation_and_shadow(client):
    headers = _headers(client)
    observation = client.post(
        "/api/v1/hr/observations",
        headers=headers,
        json={"id": "OBS-MOD-1", "employeeId": "EMP-MOD", "status": "In Progress", "decision": "extended"},
    )
    assert observation.status_code == 201, observation.text
    shadow = client.post(
        "/api/v1/hr/shadow",
        headers=headers,
        json={"id": "SHD-MOD-1", "employeeId": "EMP-MOD", "mentorId": "EMP-1", "status": "In Progress"},
    )
    assert shadow.status_code == 201, shadow.text


def test_module_leave_updates_attendance(client):
    headers = _headers(client)
    saved = client.put(
        "/api/v1/hr/leave",
        headers=headers,
        json={
            "policies": [{"id": "POL-MOD-1", "leaveType": "Casual Leave", "entitlement": 12, "active": True}],
            "requests": [{"id": "LVE-MOD-1", "employeeId": "EMP-2026-001", "leaveType": "Casual Leave", "fromDate": "03-06-2026", "status": "Approved", "days": 1}],
        },
    )
    assert saved.status_code == 200, saved.text
    attendance = client.get("/api/v1/hr/attendance", headers=headers)
    assert attendance.status_code == 200
    match = next(row for row in attendance.json() if row["id"] == "LVE-LVE-MOD-1")
    assert match["status"] == "Leave"
    assert match["source"] == "Leave approval"


def test_module_training(client):
    headers = _headers(client)
    saved = client.post(
        "/api/v1/hr/training",
        headers=headers,
        json={"id": "TRN-MOD-1", "title": "Classroom Management", "status": "Completed", "participantIds": ["EMP-2026-001"], "attendance": {"EMP-2026-001": "Present"}, "feedback": [{"employeeId": "EMP-2026-001", "overall": 3}]},
    )
    assert saved.status_code == 201, saved.text
    assert saved.json()["feedback"][0]["overall"] == 3


def test_module_performance_and_increment(client):
    headers = _headers(client)
    review = client.post(
        "/api/v1/hr/performance",
        headers=headers,
        json={"id": "PRF-MOD-1", "employeeId": "EMP-2026-001", "period": "2025-26", "bsc": 86, "rating": "Above Average", "status": "Completed"},
    )
    assert review.status_code == 201, review.text
    revision = client.put(
        "/api/v1/hr/payroll",
        headers=headers,
        json={"months": [], "revisions": [{"id": "REV-MOD-1", "employeeId": "EMP-2026-001", "revisedGross": 65000, "status": "Applied"}]},
    )
    assert revision.status_code == 200, revision.text
    changed = client.put(
        "/api/v1/hr/payroll",
        headers=headers,
        json={"months": [], "revisions": [{"id": "REV-MOD-1", "employeeId": "EMP-2026-001", "revisedGross": 1, "status": "Applied"}]},
    )
    assert changed.status_code == 200, changed.text
    assert changed.json()["revisions"][0]["revisedGross"] == 65000


def test_module_payroll_lock(client):
    headers = _headers(client)
    first = client.put(
        "/api/v1/hr/payroll-months",
        headers=headers,
        json=[{"id": "PAY-MOD-1", "employeeId": "EMP-2026-001", "month": "June", "year": 2026, "paymentStatus": "Paid", "netSalary": 50000}],
    )
    assert first.status_code == 200, first.text
    second = client.put(
        "/api/v1/hr/payroll-months",
        headers=headers,
        json=[{"id": "PAY-MOD-1", "employeeId": "EMP-2026-001", "month": "June", "year": 2026, "paymentStatus": "Paid", "netSalary": 1}],
    )
    assert second.status_code == 200, second.text
    assert second.json()[0]["netSalary"] == 50000


def test_module_salary_advance(client):
    headers = _headers(client)
    saved = client.post(
        "/api/v1/hr/advances",
        headers=headers,
        json={"id": "ADV-MOD-1", "employeeId": "EMP-2026-001", "amount": 20000, "status": "APPROVED", "emi": 2000, "outstanding": 16000},
    )
    assert saved.status_code == 201, saved.text
    assert saved.json()["outstanding"] == 16000


def test_module_disciplinary_is_permanent(client):
    headers = _headers(client)
    created = client.post(
        "/api/v1/hr/disciplinary",
        headers=headers,
        json={"id": "DSC-MOD-1", "employeeId": "EMP-2026-001", "actionType": "Warning", "status": "APPROVED"},
    )
    assert created.status_code == 201, created.text
    edited = client.patch("/api/v1/hr/disciplinary/DSC-MOD-1", headers=headers, json={"actionType": "Cleared"})
    assert edited.status_code == 409


def test_module_child_concession(client):
    headers = _headers(client)
    saved = client.post(
        "/api/v1/hr/concessions",
        headers=headers,
        json={"id": "CON-MOD-1", "employeeId": "EMP-2026-001", "studentName": "Aarav Sharma", "percent": 50, "status": "Approved"},
    )
    assert saved.status_code == 201, saved.text
    assert saved.json()["percent"] == 50


def test_module_exit_deactivates_login(client):
    headers = _headers(client)
    created = client.post(
        "/api/v1/hr/staff",
        headers=headers,
        json={"id": "EMP-EXIT-1", "name": "Mohan Das", "email": "mohan.das@school.com", "role": "driver", "status": "Active"},
    )
    assert created.status_code == 201, created.text
    password = created.json()["temporaryPassword"]
    exited = client.post(
        "/api/v1/hr/exits",
        headers=headers,
        json={"id": "EXT-MOD-1", "employeeId": "EMP-EXIT-1", "exitType": "Resignation", "status": "Completed"},
    )
    assert exited.status_code == 201, exited.text
    login = client.post("/api/v1/auth/login", json={"email": "mohan.das@school.com", "password": password})
    assert login.status_code == 401


def test_saved_staff_profile_cannot_be_rewritten(client):
    headers = _headers(client)
    created = client.post(
        "/api/v1/hr/staff",
        headers=headers,
        json={"id": "EMP-LOCK-1", "name": "Kavya Iyer", "email": "kavya.lock@school.com", "role": "teacher", "department": "Academic", "designation": "Teacher", "grossSalary": 30000},
    )
    assert created.status_code == 201, created.text
    moved = client.put(
        "/api/v1/hr/portal/employees",
        headers=headers,
        json=[{"id": "EMP-LOCK-1", "name": "Changed Name", "email": "kavya.lock@school.com", "role": "librarian", "department": "Library", "designation": "Changed", "grossSalary": 1}],
    )
    assert moved.status_code == 200, moved.text
    row = next(item for item in moved.json() if item["id"] == "EMP-LOCK-1")
    assert row["name"] == "Kavya Iyer"
    assert row["department"] == "Library"
    assert row["role"] == "librarian"
    assert row["grossSalary"] == 30000
    history = client.get("/api/v1/hr/assignments", headers=headers).json()
    assert any(item["employeeId"] == "EMP-LOCK-1" and item["previousDepartment"] == "Academic" for item in history)


def test_permission_request_marks_attendance(client):
    headers = _headers(client)
    saved = client.put(
        "/api/v1/hr/leave",
        headers=headers,
        json={"policies": [], "requests": [{"id": "PERM-1", "employeeId": "EMP-LOCK-1", "leaveType": "Permission", "fromDate": "04-06-2026", "status": "Approved", "days": 1}]},
    )
    assert saved.status_code == 200, saved.text
    attendance = client.get("/api/v1/hr/attendance", headers=headers).json()
    match = next(row for row in attendance if row["id"] == "LVE-PERM-1")
    assert match["status"] == "Permission"


def test_leave_balance_by_type(client):
    headers = _headers(client)
    saved = client.put(
        "/api/v1/hr/leave",
        headers=headers,
        json={
            "policies": [{"id": "POL-BAL", "leaveType": "Casual Leave", "entitlement": 12}],
            "requests": [{"id": "LVE-BAL", "employeeId": "EMP-LOCK-1", "leaveType": "Casual Leave", "status": "Approved", "days": 2}],
        },
    )
    assert saved.status_code == 200, saved.text
    balance = next(row for row in saved.json()["balances"] if row["leaveType"] == "Casual Leave")
    assert balance["balance"] == 10


def test_applied_increment_updates_salary(client):
    headers = _headers(client)
    saved = client.put(
        "/api/v1/hr/payroll-revisions",
        headers=headers,
        json=[{"id": "REV-LOCK", "employeeId": "EMP-LOCK-1", "newDesignation": "Senior Teacher", "revisedGross": 36000, "status": "Applied"}],
    )
    assert saved.status_code == 200, saved.text
    employees = client.get("/api/v1/hr/employees", headers=headers).json()
    row = next(item for item in employees if item["employee_code"] == "EMP-LOCK-1")
    assert row["gross_salary"] == 36000
    assert row["designation"] == "Senior Teacher"


def test_employee_sees_only_own_profile(client):
    headers = _headers(client)
    other = client.post(
        "/api/v1/hr/staff",
        headers=headers,
        json={"id": "EMP-OTHER-1", "name": "Other Staff", "email": "other.staff@school.com", "role": "driver", "department": "Transport"},
    )
    assert other.status_code == 201, other.text
    created = client.post(
        "/api/v1/hr/staff",
        headers=headers,
        json={"id": "EMP-SELF-1", "name": "Self View", "email": "self.view@school.com", "role": "teacher", "department": "Academic"},
    )
    assert created.status_code == 201, created.text
    token = client.post("/api/v1/auth/login", json={"email": "self.view@school.com", "password": created.json()["temporaryPassword"]})
    assert token.status_code == 200, token.text
    visible = client.get("/api/v1/hr/portal/employees", headers={"Authorization": f"Bearer {token.json()['access_token']}"})
    assert visible.status_code == 200, visible.text
    assert [row["id"] for row in visible.json()] == ["EMP-SELF-1"]
    hidden = client.get("/api/v1/hr/employees/EMP-OTHER-1", headers={"Authorization": f"Bearer {token.json()['access_token']}"})
    assert hidden.status_code == 404


def test_module_claims_and_incentives(client):
    headers = _headers(client)
    claim = client.post(
        "/api/v1/hr/claims",
        headers=headers,
        json={"id": "CLM-MOD-1", "employee": "Priya Sharma", "claimType": "Extra work time", "amount": 500, "approver": "HR", "status": "Submitted"},
    )
    assert claim.status_code == 201, claim.text
    incentive = client.post(
        "/api/v1/hr/incentives",
        headers=headers,
        json={"id": "INC-MOD-1", "type": "Staff joining referral", "employeeId": "EMP-2026-001", "amount": 6000, "approver": "MD", "status": "Approved"},
    )
    assert incentive.status_code == 201, incentive.text
    assert client.get("/api/v1/hr/incentives", headers=headers).json()[0]["approver"] == "MD"
