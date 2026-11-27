import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-leave"

import pytest
from fastapi.testclient import TestClient

from app.main import app

USERS = {
    "admin": ("admin@qmis.edu", "admin123"),
    "hr": ("hr@qmis.edu", "hr12345"),
    "teacher": ("teacher@qmis.edu", "teacher123"),
    "coordinator": ("coordinator@qmis.edu", "coord123"),
    "principal": ("principal@qmis.edu", "principal123"),
    "director": ("director@qmis.edu", "director123"),
}


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _h(client, who: str) -> dict:
    email, password = USERS[who]
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _day(offset: int) -> str:
    return (date.today() + timedelta(days=offset)).isoformat()


def _file(client, who, leave_type="Casual Leave", start=100, end=101, hours=None, reason="Family function"):
    body = {"leaveType": leave_type, "fromDate": _day(start), "toDate": _day(end), "reason": reason}
    if hours is not None:
        body["hours"] = hours
    return client.post("/api/v1/leave-requests", json=body, headers=_h(client, who))


def _decide(client, who, request_id, decision="approve", comment=None):
    return client.post(
        f"/api/v1/leave-requests/{request_id}/decide",
        json={"decision": decision, "comment": comment},
        headers=_h(client, who),
    )


def test_teacher_leave_goes_principal_then_hr_then_on_leave(client):
    created = _file(client, "teacher", "Sick Leave", start=100, end=102)  # 3 days: not under the monthly cap
    assert created.status_code == 201, created.text
    req = created.json()
    assert req["status"] == "Pending" and req["totalDays"] == 3
    assert req["chain"] == ["principal", "hr"] and req["requestedTo"] == "principal"
    assert req["leaveRequestId"].startswith("LR-")

    principal, hr = _h(client, "principal"), _h(client, "hr")
    received = client.get("/api/v1/leave-requests", params={"box": "received"}, headers=principal).json()
    assert any(r["id"] == req["id"] for r in received)
    # HR has not been reached yet
    hr_box = client.get("/api/v1/leave-requests", params={"box": "received"}, headers=hr).json()
    assert not any(r["id"] == req["id"] for r in hr_box)

    assert _decide(client, "principal", req["id"]).status_code == 200
    hr_box = client.get("/api/v1/leave-requests", params={"box": "received"}, headers=hr).json()
    assert any(r["id"] == req["id"] for r in hr_box)

    done = _decide(client, "hr", req["id"], comment="Approved")
    assert done.status_code == 200 and done.json()["status"] == "Approved"
    assert [e["action"] for e in done.json()["events"]] == ["submit", "approve", "approve"]

    on_leave = client.get("/api/v1/leave-requests/on-leave", params={"date": _day(101)}, headers=hr).json()
    row = next(r for r in on_leave if r["email"] == "teacher@qmis.edu")
    assert row["attendanceStatus"] == "Leave"
    assert client.get("/api/v1/leave-requests/on-leave", params={"date": _day(103)}, headers=hr).json() == []

    mine = client.get("/api/v1/leave-requests", params={"status": "Approved"}, headers=_h(client, "teacher")).json()
    assert any(r["id"] == req["id"] for r in mine)


def test_permission_rules_and_attendance_status(client):
    assert _file(client, "coordinator", "Permission", 110, 110).status_code == 400  # hours missing
    assert _file(client, "coordinator", "Permission", 110, 110, hours=3).status_code == 400  # > 2h
    assert _file(client, "coordinator", "Permission", 110, 111, hours=1).status_code == 400  # one day only
    assert _file(client, "coordinator", "Casual Leave", 110, 110, hours=1).status_code == 400  # hours = permission only
    assert _file(client, "coordinator", "Holiday", 110, 110).status_code == 400  # unknown type
    assert _file(client, "coordinator", reason="  ").status_code == 400

    ok = _file(client, "coordinator", "Permission", 110, 110, hours=1.5)
    assert ok.status_code == 201, ok.text
    rid = ok.json()["id"]
    assert ok.json()["chain"] == ["principal", "hr"]
    _decide(client, "principal", rid)
    _decide(client, "hr", rid)
    out = client.get("/api/v1/leave-requests/on-leave", params={"date": _day(110)}, headers=_h(client, "hr")).json()
    row = next(r for r in out if r["email"] == "coordinator@qmis.edu")
    assert row["attendanceStatus"] == "Permission" and row["hours"] == 1.5


def test_overlap_deny_and_refile(client):
    first = _file(client, "principal", start=120, end=121)  # chain director -> hr
    assert first.status_code == 201 and first.json()["chain"] == ["director", "hr"]
    assert _file(client, "principal", start=121, end=123).status_code == 409

    no_reason = _decide(client, "director", first.json()["id"], "deny")
    assert no_reason.status_code == 400
    denied = _decide(client, "director", first.json()["id"], "deny", "Exam duty")
    assert denied.status_code == 200 and denied.json()["status"] == "Rejected"
    assert denied.json()["approverRemarks"] == "Exam duty"
    # rejected requests do not block re-filing, and do not show as on-leave
    assert _file(client, "principal", "Medical Leave", start=121, end=123).status_code == 201
    assert client.get(
        "/api/v1/leave-requests/on-leave", params={"date": _day(120)}, headers=_h(client, "hr")
    ).json() == []


def test_access_rules(client):
    req = _file(client, "teacher", start=130, end=130).json()
    # a role that is not in the chain cannot decide or even see it
    assert _decide(client, "coordinator", req["id"]).status_code in (403, 404)
    seen = client.get(f"/api/v1/leave-requests/{req['id']}", headers=_h(client, "coordinator"))
    assert seen.status_code == 404
    # teacher has no decide permission
    assert _decide(client, "teacher", req["id"]).status_code == 403
    # the generic approvals endpoint cannot be used to open a leave approval directly
    bypass = client.post(
        "/api/v1/approvals",
        json={"entityType": "leave_request", "entityId": "x", "chain": ["hr"]},
        headers=_h(client, "teacher"),
    )
    assert bypass.status_code == 400
    # listing everything is HR/Admin only
    assert client.get("/api/v1/leave-requests", params={"box": "all"}, headers=_h(client, "teacher")).status_code == 403
    assert client.get("/api/v1/leave-requests", params={"box": "all"}, headers=_h(client, "hr")).status_code == 200


def _file_on(client, who, leave_type, start: date, end: date):
    body = {"leaveType": leave_type, "fromDate": start.isoformat(), "toDate": end.isoformat(), "reason": "Personal work"}
    return client.post("/api/v1/leave-requests", json=body, headers=_h(client, who))


def test_casual_and_personal_leave_are_capped_at_two_days_a_month(client):
    month = date(date.today().year + 3, 3, 1)
    assert _file_on(client, "director", "Casual Leave", month.replace(day=2), month.replace(day=4)).status_code == 400
    first = _file_on(client, "director", "Casual Leave", month.replace(day=2), month.replace(day=2))
    assert first.status_code == 201, first.text
    assert _file_on(client, "director", "Personal Leave", month.replace(day=9), month.replace(day=9)).status_code == 201
    over = _file_on(client, "director", "Casual Leave", month.replace(day=16), month.replace(day=16))
    assert over.status_code == 400
    assert "2 days per month" in over.text and "0 left" in over.text
    # exempt types are not counted or limited
    assert _file_on(client, "director", "Sick Leave", month.replace(day=20), month.replace(day=24)).status_code == 201
    assert _file_on(client, "director", "Emergency Leave", month.replace(day=27), month.replace(day=27)).status_code == 201
    # the cap is per calendar month: next month starts fresh
    nxt = month.replace(month=4)
    assert _file_on(client, "director", "Casual Leave", nxt.replace(day=6), nxt.replace(day=7)).status_code == 201


def test_leave_spanning_two_months_counts_in_each_month_and_denied_leave_frees_days(client):
    year = date.today().year + 3
    span = _file_on(client, "principal", "Casual Leave", date(year, 5, 31), date(year, 6, 1))  # 1 day in each month
    assert span.status_code == 201, span.text
    assert _file_on(client, "principal", "Casual Leave", date(year, 6, 10), date(year, 6, 10)).status_code == 201
    assert _file_on(client, "principal", "Casual Leave", date(year, 6, 20), date(year, 6, 20)).status_code == 400
    assert _decide(client, "director", span.json()["id"], "deny", "Exam duty").status_code == 200
    assert _file_on(client, "principal", "Casual Leave", date(year, 6, 20), date(year, 6, 20)).status_code == 201


def test_logout_is_audited(client):
    teacher = _h(client, "teacher")
    assert client.post("/api/v1/auth/logout", headers=teacher).json() == {"ok": True}
    logs = client.get("/api/v1/audit-logs", headers=_h(client, "admin")).json()
    assert any(entry["action"] == "LOGOUT" for entry in logs)
