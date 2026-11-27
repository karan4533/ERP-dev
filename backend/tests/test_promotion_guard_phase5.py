"""Academic Phase 5: a student cannot be promoted twice in the same academic year."""

import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-promotion-guard"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from auth_test_helpers import login_headers
from tests.conftest import reset_sqlite_memory_schema

STAFF = {
    "admin": ("admin@qmis.edu", "admin123"),
    "principal": ("principal@qmis.edu", "principal123"),
}
PW = "Phase5-Promo-2026"


def _ok(response, status=200):
    assert response.status_code == status, response.text
    return response.json()


@pytest.fixture(scope="module")
def w():
    reset_sqlite_memory_schema()
    with TestClient(app) as c:
        h = {who: login_headers(c, *creds) for who, creds in STAFF.items()}
        ids = {}
        for cls in ("Grade 5", "Grade 6", "Grade 7"):
            row = _ok(c.post("/api/v1/masters/classes", json={"name": cls}, headers=h["admin"]), 201)
            ids[cls] = row["id"]
            ids[f"{cls}-A"] = _ok(
                c.post("/api/v1/masters/sections", json={"class_id": row["id"], "name": "A"}, headers=h["admin"]), 201
            )["id"]

        adm = _ok(c.post("/api/v1/admissions", headers=h["admin"], json={
            "first_name": "Ravi", "last_name": "Guard", "mobile_number": "9000055555",
            "class_name": "Grade 5", "parent_account_email": "p5.guard.parent@example.com"}), 201)
        sid = str(_ok(c.post(f"/api/v1/admissions/{adm['id']}/enroll", headers=h["admin"], json={
            "parent_account_email": "p5.guard.parent@example.com",
            "parent_account_password": PW}))["student_id"])
        _ok(c.post(f"/api/v1/students/{sid}/place", json={"sectionId": ids["Grade 5-A"]}, headers=h["principal"]))
        yield {"c": c, "h": h, "sid": sid, "ids": ids}


def test_second_promotion_in_the_same_year_is_refused(w):
    c, h, sid, ids = w["c"], w["h"], w["sid"], w["ids"]
    first = _ok(c.post(f"/api/v1/students/{sid}/promote", headers=h["principal"], json={
        "targetClassId": ids["Grade 6"], "targetSectionId": ids["Grade 6-A"]}))
    assert first["className"] == "Grade 6"

    again = c.post(f"/api/v1/students/{sid}/promote", headers=h["principal"], json={
        "targetClassId": ids["Grade 7"], "targetSectionId": ids["Grade 7-A"]})
    assert again.status_code == 409, again.text
    assert again.json()["detail"]["code"] == "already_promoted"

    still = _ok(c.get(f"/api/v1/students/{sid}", headers=h["principal"]))
    assert still["className"] == "Grade 6"
