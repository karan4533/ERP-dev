"""Execute-audit draft persistence: array format, object wrap, role isolation."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-audit-draft"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from auth_test_helpers import login_headers
from tests.conftest import reset_sqlite_memory_schema


@pytest.fixture()
def client():
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _login(client, email, password):
    return login_headers(client, email, password)


def _process(client):
    return _login(client, "processauditor@qmis.edu", "process123")


def _quality(client):
    return _login(client, "qualityauditor@qmis.edu", "quality123")


def _teacher(client):
    return _login(client, settings.teacher_seed_email, settings.teacher_seed_password)


def test_process_execute_draft_array_persists_and_reloads(client):
    headers = _process(client)
    payload = [
        {
            "id": "AUD-PA-DRAFT-1",
            "header": {
                "auditId": "AUD-PA-DRAFT-1",
                "auditNumber": "AUD-PA-2026-DRAFT",
                "campus": "Main Campus",
                "building": "Block A",
                "area": "Room 12",
                "auditDate": "12-11-2026",
                "status": "In Progress",
            },
            "responses": {"p1": {"response": "No", "findingRating": "Minor Non-Conformity"}},
            "observations": [{"id": "obs-1", "title": "Missing register", "dueDate": "2026-11-20"}],
            "generalRemarks": "Need follow-up",
        }
    ]
    put = client.put("/api/v1/campus-audit/process-execute-draft", json=payload, headers=headers)
    assert put.status_code == 200, put.text
    assert put.json()[0]["header"]["campus"] == "Main Campus"
    assert put.json()[0]["responses"]["p1"]["response"] == "No"

    get = client.get("/api/v1/campus-audit/process-execute-draft", headers=headers)
    assert get.status_code == 200, get.text
    assert len(get.json()) == 1
    row = get.json()[0]
    assert row["id"] == "AUD-PA-DRAFT-1"
    assert row["header"]["building"] == "Block A"
    assert row["header"]["area"] == "Room 12"
    assert row["header"]["auditDate"] == "12-11-2026"
    assert row["observations"][0]["title"] == "Missing register"


def test_process_execute_draft_rejects_non_array_body(client):
    headers = _process(client)
    # Backend still requires a JSON array at the HTTP boundary.
    bad = client.put(
        "/api/v1/campus-audit/process-execute-draft",
        json={"id": "bare-object", "header": {"campus": "X"}},
        headers=headers,
    )
    assert bad.status_code == 422, bad.text


def test_quality_cannot_read_process_execute_draft(client):
    process = _process(client)
    put = client.put(
        "/api/v1/campus-audit/process-execute-draft",
        json=[{"id": "AUD-PA-ISO-D1", "header": {"auditNumber": "AUD-PA-ISO-D1", "campus": "Main"}}],
        headers=process,
    )
    assert put.status_code == 200, put.text

    quality = _quality(client)
    denied = client.get("/api/v1/campus-audit/process-execute-draft", headers=quality)
    assert denied.status_code == 403, denied.text


def test_teacher_denied_execute_draft(client):
    teacher = _teacher(client)
    assert client.get("/api/v1/campus-audit/process-execute-draft", headers=teacher).status_code == 403
    assert (
        client.put(
            "/api/v1/campus-audit/process-execute-draft",
            json=[{"id": "X"}],
            headers=teacher,
        ).status_code
        == 403
    )


def test_process_observations_and_atr_capa_persist(client):
    headers = _process(client)
    obs = [
        {
            "id": "OBS-PA-CAPA-1",
            "observationId": "OBS-PA-CAPA-1",
            "auditReference": "AUD-PA-2026-CAPA",
            "title": "Unsigned voucher",
            "findingRating": "Minor Non-Conformity",
            "riskLevel": "High",
            "dueDate": "2026-11-25",
            "assignTo": "Account Assistant",
        }
    ]
    put_obs = client.put("/api/v1/campus-audit/process-observations", json=obs, headers=headers)
    assert put_obs.status_code == 200, put_obs.text

    atr = [
        {
            "id": "ATR-PA-CAPA-1",
            "atrNumber": "ATR-PA-CAPA-1",
            "observationId": "OBS-PA-CAPA-1",
            "auditNumber": "AUD-PA-2026-CAPA",
            "assignedTo": "Account Assistant",
            "dueDate": "2026-11-25",
            "capaType": "CAPA",
            "findingRating": "Minor Non-Conformity",
            "riskLevel": "High",
            "status": "Submitted",
        }
    ]
    put_atr = client.put("/api/v1/campus-audit/process-atr", json=atr, headers=headers)
    assert put_atr.status_code == 200, put_atr.text

    history = [
        {
            "id": "AUD-PA-2026-CAPA",
            "auditNumber": "AUD-PA-2026-CAPA",
            "campus": "Main Campus",
            "building": "Admin",
            "area": "Finance",
            "status": "Completed",
            "findings": {"minorNc": 1, "majorNc": 0},
        }
    ]
    put_hist = client.put("/api/v1/campus-audit/process-audit-history", json=history, headers=headers)
    assert put_hist.status_code == 200, put_hist.text

    assert client.get("/api/v1/campus-audit/process-observations", headers=headers).json()[0]["id"] == "OBS-PA-CAPA-1"
    assert client.get("/api/v1/campus-audit/process-atr", headers=headers).json()[0]["dueDate"] == "2026-11-25"
    assert client.get("/api/v1/campus-audit/process-audit-history", headers=headers).json()[0]["building"] == "Admin"
