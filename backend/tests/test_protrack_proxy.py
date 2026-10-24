"""ProTrack365 proxy status + auth configuration gate."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"
os.environ["PROTRACK_ADMIN_ACCOUNT"] = ""
os.environ["PROTRACK_ADMIN_PASSWORD"] = ""

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _admin_headers(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": settings.admin_seed_email, "password": settings.admin_seed_password},
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_protrack_status_unconfigured(client, monkeypatch):
    monkeypatch.setattr(settings, "protrack_admin_account", "")
    monkeypatch.setattr(settings, "protrack_admin_password", "")
    monkeypatch.setattr(settings, "protrack_parent_account", "")
    monkeypatch.setattr(settings, "protrack_parent_password", "")
    headers = _admin_headers(client)
    response = client.get("/api/v1/protrack/status", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["configured"] is False
    assert body["adminConfigured"] is False


def test_protrack_devices_requires_credentials(client, monkeypatch):
    monkeypatch.setattr(settings, "protrack_admin_account", "")
    monkeypatch.setattr(settings, "protrack_admin_password", "")
    monkeypatch.setattr(settings, "protrack_parent_account", "")
    monkeypatch.setattr(settings, "protrack_parent_password", "")
    headers = _admin_headers(client)
    response = client.get("/api/v1/protrack/devices", headers=headers)
    assert response.status_code == 503
    detail = response.json().get("detail") or {}
    assert detail.get("code") == "protrack_not_configured"


def test_protrack_retries_on_access_token_error_code_10011(monkeypatch):
    """Stale cached tokens return code 10011 — must re-authorize once, not surface raw error."""
    from app.services import protrack as svc

    monkeypatch.setattr(settings, "protrack_admin_account", "demo-account")
    monkeypatch.setattr(settings, "protrack_admin_password", "demo-password")
    svc._token_cache.clear()
    svc._token_cache["admin"] = {"access_token": "stale-token", "expires_at": 9e18}

    calls: list[str] = []

    class _FakeResponse:
        def __init__(self, payload, status_code=200):
            self._payload = payload
            self.status_code = status_code
            self.content = b"{}"
            self.text = str(payload)

        def json(self):
            return self._payload

    class _FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def get(self, url, params=None):
            calls.append(url)
            params = params or {}
            if url.endswith("/api/authorization"):
                return _FakeResponse(
                    {"code": 0, "record": {"access_token": "fresh-token", "expires_in": 7200}}
                )
            if url.endswith("/api/track"):
                token = params.get("access_token")
                if token == "stale-token":
                    return _FakeResponse({"code": 10011, "message": "access_token error"})
                if token == "fresh-token":
                    return _FakeResponse(
                        {
                            "code": 0,
                            "record": [
                                {
                                    "imei": "355710090439063",
                                    "latitude": 9.88,
                                    "longitude": 78.03,
                                    "datastatus": 2,
                                    "gpstime": 1792817627,
                                }
                            ],
                        }
                    )
            return _FakeResponse({"code": -1, "message": f"unexpected {url}"})

    monkeypatch.setattr("app.services.protrack.httpx.Client", _FakeClient)
    rows = svc.track_imeis(["355710090439063"], "admin")
    assert len(rows) == 1
    assert rows[0]["imei"] == "355710090439063"
    assert any(u.endswith("/api/authorization") for u in calls)
    assert sum(1 for u in calls if u.endswith("/api/track")) == 2
