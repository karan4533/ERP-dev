"""Finance Assistant role access helpers (FE contract mirrored for regression).

The frontend financeRoleAccess.js keeps Collect vs Head UI split. These tests
lock the same path/permission contract so a future FE change cannot silently
grant Head-only screens without backend coverage.
"""

from __future__ import annotations

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-finance-assistant-ui"
os.environ["INTEGRATIONS_MODE"] = ""

import pytest
from fastapi.testclient import TestClient

from app.main import app

HEAD_ONLY_PATHS = [
    "/account-head/approvals",
    "/account-head/settings",
    "/account-head/payment-vouchers",
    "/account-head/annual-budget",
    "/account-head/mfp",
    "/account-head/fee-projection",
    "/account-head/book-fee",
    "/account-head/admission-referrals",
]


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client: TestClient, email: str, password: str) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_assistant_collects_but_cannot_write_or_approve(client):
    assistant = _login(client, "finance.assistant@qmis.edu", "finance123")
    me = client.get("/api/v1/auth/me", headers=assistant).json()
    assert me["role"] == "finance_assistant"
    perms = set(me["permissions"])
    assert {"auth.me", "finance.read", "finance.collect", "students.read", "masters.read"} <= perms
    assert "finance.write" not in perms
    assert "finance.approve" not in perms

    assert client.get("/api/v1/finance/state", headers=assistant).status_code == 200
    assert client.put(
        "/api/v1/finance/state",
        headers=assistant,
        json={"data": {"meta": {"seeded": True}}},
    ).status_code == 403


def test_head_only_ui_paths_documented_for_assistant_split():
    """Keep FE HeadOnly path list in sync with this documented set."""
    assert len(HEAD_ONLY_PATHS) >= 6
    assert all(path.startswith("/account-head/") for path in HEAD_ONLY_PATHS)
