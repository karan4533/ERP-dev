"""Schedule JSON round-trip + marks association / placement gates (isolated SQLite)."""

import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-schedule-assoc"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from auth_test_helpers import login_headers
from tests.conftest import reset_sqlite_memory_schema

USERS = {
    "admin": ("admin@qmis.edu", "admin123"),
    "teacher": ("teacher@qmis.edu", "teacher123"),
    "principal": ("principal@qmis.edu", "principal123"),
    "director": ("director@qmis.edu", "director123"),
}
FUTURE = (date.today() + timedelta(days=70)).isoformat()
FUTURE_END = (date.today() + timedelta(days=73)).isoformat()


def _ok(response, status=200):
    assert response.status_code == status, response.text
    return response.json()


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as c:
        yield c


def _h(client, who):
    return login_headers(client, *USERS[who])


def _ensure_class_section(client, class_name: str, section: str = "A") -> None:
    """Exam create now requires active Class Details masters."""
    admin = _h(client, "admin")
    classes = _ok(client.get("/api/v1/masters/classes", headers=admin))
    row = next((c for c in classes if str(c.get("name") or "").strip().lower() == class_name.strip().lower()), None)
    if row is None:
        row = _ok(client.post("/api/v1/masters/classes", json={"name": class_name}, headers=admin), 201)
    sections = _ok(client.get(f"/api/v1/masters/sections?class_id={row['id']}", headers=admin))
    if any(str(s.get("name") or "").strip().lower() == section.strip().lower() for s in sections):
        return
    options = _ok(client.get("/api/v1/masters/class-teacher-options", headers=admin))
    tid = next((o["user_id"] for o in options if o.get("email") == USERS["teacher"][0]), None)
    body = {"class_id": row["id"], "name": section}
    if tid:
        body["class_teacher_user_id"] = tid
    _ok(client.post("/api/v1/masters/sections", json=body, headers=admin), 201)


def test_exam_schedule_timelines_round_trip(client):
    principal = _h(client, "principal")
    _ensure_class_section(client, "Grade 8", "B")
    timelines = [
        {
            "day": "Monday",
            "subject": "Maths",
            "examDate": FUTURE,
            "startTime": "09:00",
            "endTime": "11:00",
        }
    ]
    created = _ok(
        client.post(
            "/api/v1/exams",
            headers=principal,
            json={
                "name": "Schedule Round Trip",
                "examType": "MIDTERM",
                "className": "Grade 8",
                "section": "B",
                "teacherName": "Ms Rao",
                "startDate": FUTURE,
                "endDate": FUTURE_END,
                "timelines": timelines,
            },
        ),
        201,
    )
    # API surfaces schedule fields at the top level (see _exam_out), not nested under "schedule".
    assert created["section"] == "B"
    assert created["teacherName"] == "Ms Rao"
    assert created["timelines"][0]["subject"] == "Maths"
    got = _ok(client.get(f"/api/v1/exams/{created['id']}", headers=principal))
    assert got["timelines"][0]["startTime"] == "09:00"
    assert got["timelines"][0]["endTime"] == "11:00"
    assert got["section"] == "B"
    assert created.get("submittedAt") is None
    assert got.get("submittedAt") is None


def test_exam_submitted_at_is_approval_time_not_start_date(client):
    """Director Submitted Date must use approval_requests.created_at, not exam.start_date."""
    principal, director = _h(client, "principal"), _h(client, "director")
    _ensure_class_section(client, "Grade 8", "A")
    created = _ok(
        client.post(
            "/api/v1/exams",
            headers=principal,
            json={
                "name": "Submit Stamp Exam",
                "examType": "MIDTERM",
                "className": "Grade 8",
                "section": "A",
                "startDate": FUTURE,
                "endDate": FUTURE_END,
                "timelines": [
                    {
                        "day": "Tuesday",
                        "subject": "Science",
                        "examDate": FUTURE,
                        "startTime": "10:00",
                        "endTime": "12:00",
                    }
                ],
            },
        ),
        201,
    )
    assert created.get("submittedAt") is None
    submitted = _ok(client.post(f"/api/v1/exams/{created['id']}/submit", headers=principal))
    assert submitted["status"] == "submitted"
    assert submitted["submittedAt"]
    assert submitted["submittedAt"] != submitted["startDate"]
    stamp = submitted["submittedAt"]

    approved = _ok(
        client.post(
            f"/api/v1/approvals/{submitted['approvalId']}/decide",
            headers=director,
            json={"decision": "approve"},
        )
    )
    assert approved["status"] == "approved"
    after = _ok(client.get(f"/api/v1/exams/{created['id']}", headers=director))
    assert after["status"] == "approved"
    assert after["submittedAt"] == stamp
    assert after["startDate"] == FUTURE


def test_marks_require_placement_and_reject_wrong_section_or_class(client):
    admin, principal, teacher, director = (
        _h(client, "admin"),
        _h(client, "principal"),
        _h(client, "teacher"),
        _h(client, "director"),
    )
    options = _ok(client.get("/api/v1/masters/class-teacher-options", headers=admin))
    tid = next(o["user_id"] for o in options if o["email"] == USERS["teacher"][0])
    cls = _ok(client.post("/api/v1/masters/classes", json={"name": "Grade 8"}, headers=admin), 201)
    sec_a = _ok(
        client.post(
            "/api/v1/masters/sections",
            json={"class_id": cls["id"], "name": "A", "class_teacher_user_id": tid},
            headers=admin,
        ),
        201,
    )["id"]
    sec_b = _ok(
        client.post(
            "/api/v1/masters/sections",
            json={"class_id": cls["id"], "name": "B", "class_teacher_user_id": tid},
            headers=admin,
        ),
        201,
    )["id"]

    pending = _ok(
        client.post(
            "/api/v1/admissions",
            headers=admin,
            json={
                "first_name": "Pending",
                "last_name": "Kid",
                "mobile_number": "9000011111",
                "class_name": "Grade 8",
                "parent_account_email": "p.pending@example.com",
            },
        ),
        201,
    )
    pending_sid = str(
        _ok(
            client.post(
                f"/api/v1/admissions/{pending['id']}/enroll",
                headers=admin,
                json={
                    "parent_account_email": "p.pending@example.com",
                    "parent_account_password": "Assoc-Parent-2026",
                },
            )
        )["student_id"]
    )

    placed = _ok(
        client.post(
            "/api/v1/admissions",
            headers=admin,
            json={
                "first_name": "Placed",
                "last_name": "Kid",
                "mobile_number": "9000011112",
                "class_name": "Grade 8",
                "parent_account_email": "p.placed@example.com",
            },
        ),
        201,
    )
    placed_sid = str(
        _ok(
            client.post(
                f"/api/v1/admissions/{placed['id']}/enroll",
                headers=admin,
                json={
                    "parent_account_email": "p.placed@example.com",
                    "parent_account_password": "Assoc-Parent-2026",
                },
            )
        )["student_id"]
    )
    _ok(client.post(f"/api/v1/students/{placed_sid}/place", json={"sectionId": sec_a}, headers=principal))

    other = _ok(
        client.post(
            "/api/v1/admissions",
            headers=admin,
            json={
                "first_name": "Other",
                "last_name": "Class",
                "mobile_number": "9000011113",
                "class_name": "Grade 9",
                "parent_account_email": "p.other@example.com",
            },
        ),
        201,
    )
    other_cls = _ok(client.post("/api/v1/masters/classes", json={"name": "Grade 9"}, headers=admin), 201)
    other_sec = _ok(
        client.post(
            "/api/v1/masters/sections",
            json={"class_id": other_cls["id"], "name": "A", "class_teacher_user_id": tid},
            headers=admin,
        ),
        201,
    )["id"]
    other_sid = str(
        _ok(
            client.post(
                f"/api/v1/admissions/{other['id']}/enroll",
                headers=admin,
                json={
                    "parent_account_email": "p.other@example.com",
                    "parent_account_password": "Assoc-Parent-2026",
                },
            )
        )["student_id"]
    )
    _ok(client.post(f"/api/v1/students/{other_sid}/place", json={"sectionId": other_sec}, headers=principal))

    exam = _ok(
        client.post(
            "/api/v1/exams",
            headers=principal,
            json={
                "name": "Assoc Mid",
                "examType": "MIDTERM",
                "className": "Grade 8",
                "startDate": FUTURE,
                "endDate": FUTURE_END,
            },
        ),
        201,
    )
    sub = _ok(client.post(f"/api/v1/exams/{exam['id']}/submit", headers=principal))
    _ok(
        client.post(
            f"/api/v1/approvals/{sub['approvalId']}/decide",
            json={"decision": "approve"},
            headers=director,
        )
    )

    blocked_pending = client.post(
        "/api/v1/marks-batches",
        headers=teacher,
        json={
            "examId": exam["id"],
            "subject": "English",
            "section": "A",
            "maxMarks": 50,
            "entries": [{"studentId": pending_sid, "marks": 40}],
        },
    )
    assert blocked_pending.status_code == 400
    assert "section-placed" in blocked_pending.json()["detail"]["message"]

    wrong_class = client.post(
        "/api/v1/marks-batches",
        headers=teacher,
        json={
            "examId": exam["id"],
            "subject": "English",
            "section": "A",
            "maxMarks": 50,
            "entries": [{"studentId": other_sid, "marks": 40}],
        },
    )
    assert wrong_class.status_code == 400

    # Place in B then reject A-batch mismatch
    _ok(client.post(f"/api/v1/students/{placed_sid}/place", json={"sectionId": sec_b}, headers=principal))
    wrong_section = client.post(
        "/api/v1/marks-batches",
        headers=teacher,
        json={
            "examId": exam["id"],
            "subject": "English",
            "section": "A",
            "maxMarks": 50,
            "entries": [{"studentId": placed_sid, "marks": 40}],
        },
    )
    assert wrong_section.status_code == 400
    assert "section" in wrong_section.json()["detail"]["message"].lower()

    _ok(client.post(f"/api/v1/students/{placed_sid}/place", json={"sectionId": sec_a}, headers=principal))
    ok = _ok(
        client.post(
            "/api/v1/marks-batches",
            headers=teacher,
            json={
                "examId": exam["id"],
                "subject": "English",
                "section": "A",
                "maxMarks": 50,
                "entries": [{"studentId": placed_sid, "marks": 42}],
            },
        ),
        201,
    )
    assert ok["status"] == "draft" and ok["entries"][0]["marks"] == 42


def test_teacher_cannot_enroll_admission(client):
    """Stated SOP has no separate admission approval; enroll stays admissions.write-only."""
    teacher = _h(client, "teacher")
    r = client.post(
        "/api/v1/admissions",
        headers=teacher,
        json={
            "first_name": "No",
            "last_name": "Auth",
            "mobile_number": "9000099999",
            "class_name": "Grade 1",
        },
    )
    assert r.status_code == 403


def test_exam_year_label_formats_are_equivalent_for_marks(client):
    """Seed AY is often ``2026-27``; Mark Entry UI uses ``2026 - 2027`` — both must accept."""
    admin, principal, teacher, director = (
        _h(client, "admin"),
        _h(client, "principal"),
        _h(client, "teacher"),
        _h(client, "director"),
    )
    options = _ok(client.get("/api/v1/masters/class-teacher-options", headers=admin))
    tid = next(o["user_id"] for o in options if o["email"] == USERS["teacher"][0])
    cls = _ok(client.post("/api/v1/masters/classes", json={"name": "Grade 3"}, headers=admin), 201)
    sec = _ok(
        client.post(
            "/api/v1/masters/sections",
            json={"class_id": cls["id"], "name": "A", "class_teacher_user_id": tid},
            headers=admin,
        ),
        201,
    )["id"]
    adm = _ok(
        client.post(
            "/api/v1/admissions",
            headers=admin,
            json={
                "first_name": "Year",
                "last_name": "Match",
                "mobile_number": "9000012345",
                "class_name": "Grade 3",
                "parent_account_email": "p.yearmatch@example.com",
            },
        ),
        201,
    )
    sid = str(
        _ok(
            client.post(
                f"/api/v1/admissions/{adm['id']}/enroll",
                headers=admin,
                json={
                    "parent_account_email": "p.yearmatch@example.com",
                    "parent_account_password": "Year-Match-2026",
                },
            )
        )["student_id"]
    )
    _ok(client.post(f"/api/v1/students/{sid}/place", json={"sectionId": sec}, headers=principal))
    exam = _ok(
        client.post(
            "/api/v1/exams",
            headers=principal,
            json={
                "name": "Year Label Mid",
                "examType": "MIDTERM",
                "className": "Grade 3",
                "academicYear": "2026 - 2027",
                "startDate": FUTURE,
                "endDate": FUTURE_END,
            },
        ),
        201,
    )
    assert exam["academicYear"] == "2026 - 2027"  # display label preserved
    sub = _ok(client.post(f"/api/v1/exams/{exam['id']}/submit", headers=principal))
    _ok(
        client.post(
            f"/api/v1/approvals/{sub['approvalId']}/decide",
            json={"decision": "approve"},
            headers=director,
        )
    )
    ok = _ok(
        client.post(
            "/api/v1/marks-batches",
            headers=teacher,
            json={
                "examId": exam["id"],
                "subject": "EVS",
                "section": "A",
                "maxMarks": 40,
                "entries": [{"studentId": sid, "marks": 33}],
            },
        ),
        201,
    )
    assert ok["academicYear"] == "2026 - 2027"
