"""Publication must survive parent-notification failures (isolated SQLite)."""

import os
from datetime import date, timedelta
from unittest.mock import patch

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-notify-isolation"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from auth_test_helpers import login_headers
from tests.conftest import reset_sqlite_memory_schema

STAFF = {
    "admin": ("admin@qmis.edu", "admin123"),
    "principal": ("principal@qmis.edu", "principal123"),
    "director": ("director@qmis.edu", "director123"),
    "coordinator": ("coordinator@qmis.edu", "coord123"),
    "teacher": ("teacher@qmis.edu", "teacher123"),
}
PW = "Notify-Isolation-2026"
FUTURE = (date.today() + timedelta(days=80)).isoformat()
FUTURE_END = (date.today() + timedelta(days=82)).isoformat()


def _ok(response, status=200):
    assert response.status_code == status, response.text
    return response.json()


@pytest.fixture(scope="module")
def w():
    reset_sqlite_memory_schema()
    with TestClient(app) as c:
        h = {who: login_headers(c, *creds) for who, creds in STAFF.items()}
        uid = {
            o["email"]: o["user_id"]
            for o in _ok(c.get("/api/v1/masters/class-teacher-options", headers=h["admin"]))
        }
        _ok(
            c.put(
                "/api/v1/students/coordinator-grade-bands",
                headers=h["principal"],
                json={"userId": uid["coordinator@qmis.edu"], "gradeFrom": 1, "gradeTo": 12},
            )
        )
        cls = _ok(c.post("/api/v1/masters/classes", json={"name": "Grade 4"}, headers=h["admin"]), 201)
        sec = _ok(
            c.post(
                "/api/v1/masters/sections",
                json={
                    "class_id": cls["id"],
                    "name": "A",
                    "class_teacher_user_id": uid["teacher@qmis.edu"],
                },
                headers=h["admin"],
            ),
            201,
        )["id"]
        adm = _ok(
            c.post(
                "/api/v1/admissions",
                headers=h["admin"],
                json={
                    "first_name": "Nia",
                    "last_name": "Iso",
                    "mobile_number": "9000088881",
                    "class_name": "Grade 4",
                    "parent_account_email": "iso.parent@example.com",
                },
            ),
            201,
        )
        sid = str(
            _ok(
                c.post(
                    f"/api/v1/admissions/{adm['id']}/enroll",
                    headers=h["admin"],
                    json={
                        "parent_account_email": "iso.parent@example.com",
                        "parent_account_password": PW,
                    },
                )
            )["student_id"]
        )
        _ok(c.post(f"/api/v1/students/{sid}/place", json={"sectionId": sec}, headers=h["principal"]))
        exam = _ok(
            c.post(
                "/api/v1/exams",
                headers=h["principal"],
                json={
                    "name": "Iso Mid",
                    "examType": "MIDTERM",
                    "className": "Grade 4",
                    "startDate": FUTURE,
                    "endDate": FUTURE_END,
                },
            ),
            201,
        )
        sub = _ok(c.post(f"/api/v1/exams/{exam['id']}/submit", headers=h["principal"]))
        _ok(
            c.post(
                f"/api/v1/approvals/{sub['approvalId']}/decide",
                json={"decision": "approve"},
                headers=h["director"],
            )
        )
        yield {"c": c, "h": h, "sid": sid, "exam": exam["id"]}


def test_publish_survives_parent_notify_exception(w):
    c, h = w["c"], w["h"]
    batch = _ok(
        c.post(
            "/api/v1/marks-batches",
            headers=h["teacher"],
            json={
                "examId": w["exam"],
                "subject": "Science",
                "section": "A",
                "maxMarks": 50,
                "entries": [{"studentId": w["sid"], "marks": 44}],
            },
        ),
        201,
    )
    sent = _ok(c.post(f"/api/v1/marks-batches/{batch['id']}/submit", headers=h["teacher"]))
    for who in ("coordinator", "principal"):
        _ok(
            c.post(
                f"/api/v1/approvals/{sent['approvalId']}/decide",
                json={"decision": "approve"},
                headers=h[who],
            )
        )

    with patch(
        "app.services.exams.notify_parents_result_published",
        side_effect=RuntimeError("simulated notify outage"),
    ):
        final = _ok(
            c.post(
                f"/api/v1/approvals/{sent['approvalId']}/decide",
                json={"decision": "approve"},
                headers=h["director"],
            )
        )
    assert final["status"] == "approved"
    published = _ok(c.get(f"/api/v1/marks-batches/{batch['id']}", headers=h["teacher"]))
    assert published["status"] == "published"
    parent = login_headers(c, "iso.parent@example.com", PW)
    results = _ok(c.get(f"/api/v1/results/students/{w['sid']}", headers=parent))
    assert len(results["exams"]) == 1
    assert results["exams"][0]["examName"] == "Iso Mid"
