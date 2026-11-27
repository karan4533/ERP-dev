"""Library issue/return: server-enforced availability and borrower limits, atomic counts, desk-only access."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-library-limits"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.database import SessionLocal
from app.main import app
from app.models import AuditLog
from tests.conftest import reset_sqlite_memory_schema

LIB = ("librarian@qmis.edu", "librarian123")
ADMIN = ("admin@qmis.edu", "admin123")
TEACHER = ("teacher@qmis.edu", "teacher123")
ISSUE = "/api/v1/library/issues"


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _h(client, who):
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _seed(client, lib, copies=10):
    books = [{"id": f"LBK-{n}", "title": f"Book {n}", "copies": copies, "available": copies, "status": "Available"} for n in range(1, 8)]
    members = [
        {"id": "LMB-S1", "name": "Student One", "role": "Student", "status": "Active", "booksIssued": 0},
        {"id": "LMB-T1", "name": "Teacher One", "role": "Teacher", "status": "Active", "booksIssued": 0},
        {"id": "LMB-X1", "name": "Former Staff", "role": "Teacher", "status": "Inactive", "booksIssued": 0},
    ]
    assert client.put("/api/v1/ops/library-books", json=books, headers=lib).status_code == 200
    assert client.put("/api/v1/ops/library-members", json=members, headers=lib).status_code == 200


def _get(client, headers, collection, item_id):
    return next(row for row in client.get(f"/api/v1/ops/{collection}", headers=headers).json() if row["id"] == item_id)


def _issue(client, headers, book, member, **extra):
    return client.post(ISSUE, json={"bookId": book, "memberId": member, "dueDate": "2026-11-30", **extra}, headers=headers)


def test_issue_updates_book_member_and_loan_together(client):
    lib = _h(client, LIB)
    _seed(client, lib, copies=2)
    issued = _issue(client, lib, "LBK-1", "LMB-T1")
    assert issued.status_code == 201, issued.text
    loan = issued.json()
    assert loan["status"] == "Issued" and loan["memberRole"] == "Teacher" and loan["issuedByEmail"] == LIB[0]
    assert _get(client, lib, "library-books", "LBK-1")["available"] == 1
    assert _get(client, lib, "library-members", "LMB-T1")["booksIssued"] == 1
    with SessionLocal() as db:
        assert db.scalar(select(AuditLog).where(AuditLog.action == "LIBRARY_BOOK_ISSUED", AuditLog.entity_id == loan["id"]))

    returned = client.post(f"{ISSUE}/{loan['id']}/return", headers=lib)
    assert returned.status_code == 200 and returned.json()["status"] == "Returned"
    assert _get(client, lib, "library-books", "LBK-1")["available"] == 2
    assert _get(client, lib, "library-members", "LMB-T1")["booksIssued"] == 0
    again = client.post(f"{ISSUE}/{loan['id']}/return", headers=lib)
    assert again.status_code == 409


def test_student_limit_is_one_and_staff_limit_is_five(client):
    lib = _h(client, LIB)
    _seed(client, lib)
    assert _issue(client, lib, "LBK-1", "LMB-S1").status_code == 201
    second = _issue(client, lib, "LBK-2", "LMB-S1")
    assert second.status_code == 409 and second.json()["detail"]["code"] == "limit_reached"
    for n in range(1, 6):
        assert _issue(client, lib, f"LBK-{n}", "LMB-T1").status_code == 201, n
    sixth = _issue(client, lib, "LBK-6", "LMB-T1")
    assert sixth.status_code == 409 and sixth.json()["detail"]["code"] == "limit_reached"


def test_unavailable_book_inactive_member_and_double_submit(client):
    lib = _h(client, LIB)
    _seed(client, lib, copies=1)
    assert _issue(client, lib, "LBK-1", "LMB-T1", clientRequestId="form-1").status_code == 201
    repeat = _issue(client, lib, "LBK-1", "LMB-T1", clientRequestId="form-1")
    assert repeat.status_code == 201 and repeat.json().get("idempotent") is True
    assert _get(client, lib, "library-books", "LBK-1")["available"] == 0
    none_left = _issue(client, lib, "LBK-1", "LMB-S1")
    assert none_left.status_code == 409 and none_left.json()["detail"]["code"] == "unavailable"
    inactive = _issue(client, lib, "LBK-2", "LMB-X1")
    assert inactive.status_code == 409 and inactive.json()["detail"]["code"] == "member_inactive"
    assert _issue(client, lib, "LBK-404", "LMB-T1").status_code == 404


def test_loans_cannot_be_written_directly(client):
    lib = _h(client, LIB)
    _seed(client, lib)
    loan = _issue(client, lib, "LBK-1", "LMB-S1").json()
    assert client.put("/api/v1/ops/library-issues", json=[], headers=lib).status_code == 403
    assert client.put(f"/api/v1/ops/library-issues/items/{loan['id']}", json={"status": "Returned"}, headers=lib).status_code == 403
    assert client.delete(f"/api/v1/ops/library-issues/items/{loan['id']}", headers=lib).status_code == 403
    assert _get(client, lib, "library-issues", loan["id"])["status"] == "Issued"


def test_only_the_library_desk_issues_books(client):
    lib = _h(client, LIB)
    _seed(client, lib)
    teacher = _h(client, TEACHER)
    assert _issue(client, teacher, "LBK-1", "LMB-T1").status_code == 403
    assert _issue(client, _h(client, ADMIN), "LBK-1", "LMB-T1").status_code == 201
    assert _get(client, lib, "library-books", "LBK-1")["available"] == 9
