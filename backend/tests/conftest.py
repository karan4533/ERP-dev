"""Pytest defaults: stub integrations (ignore demo mode from backend/.env) and run as development.

The API refuses to start with insecure settings unless ENVIRONMENT is development, and demo
accounts are only seeded in development, so the suite pins ENVIRONMENT before any app import.
Tests that exercise production behaviour build their own Settings / use subprocesses.
"""

import os

import pytest

# Initial process default before collection.
os.environ["INTEGRATIONS_MODE"] = ""
os.environ.setdefault("RFID_IMPORT_ENABLED", "false")
os.environ["ENVIRONMENT"] = "development"
# Privacy fixtures enrol Grade 5 students with their own logins; the grade policy itself is
# exercised in test_admissions.py with the production value.
os.environ["STUDENT_LOGIN_MIN_GRADE"] = "1"

# Neutralize developer backend/.env secrets so credential-gate tests stay deterministic.
_CLEAR_ENV_KEYS = (
    "SMTP_HOST",
    "SMTP_USERNAME",
    "SMTP_PASSWORD",
    "SMTP_FROM",
    "WHATSAPP_API_URL",
    "WHATSAPP_API_TOKEN",
    "WHATSAPP_FROM",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "PROTRACK_ADMIN_ACCOUNT",
    "PROTRACK_ADMIN_PASSWORD",
    "PROTRACK_PARENT_ACCOUNT",
    "PROTRACK_PARENT_PASSWORD",
    "PROTRACK_SECONDARY_ACCOUNT",
    "PROTRACK_SECONDARY_PASSWORD",
)
for _key in _CLEAR_ENV_KEYS:
    os.environ[_key] = ""


def _clear_integration_settings() -> None:
    try:
        from app.core import config

        config.settings.integrations_mode = ""
        config.settings.smtp_host = ""
        config.settings.smtp_username = ""
        config.settings.smtp_password = ""
        config.settings.smtp_from = ""
        config.settings.whatsapp_api_url = ""
        config.settings.whatsapp_api_token = ""
        config.settings.whatsapp_from = ""
        config.settings.razorpay_key_id = ""
        config.settings.razorpay_key_secret = ""
        config.settings.razorpay_webhook_secret = ""
        config.settings.protrack_admin_account = ""
        config.settings.protrack_admin_password = ""
        config.settings.protrack_parent_account = ""
        config.settings.protrack_parent_password = ""
        config.settings.protrack_secondary_account = ""
        config.settings.protrack_secondary_password = ""
    except Exception:
        pass


@pytest.fixture(autouse=True)
def _stub_integrations_unless_test_overrides(monkeypatch):
    """Reset after any test that set INTEGRATIONS_MODE=demo; clear brute-force counters."""
    monkeypatch.setenv("INTEGRATIONS_MODE", "")
    monkeypatch.setenv("RFID_IMPORT_ENABLED", "false")
    for key in _CLEAR_ENV_KEYS:
        monkeypatch.setenv(key, "")
    _clear_integration_settings()
    try:
        from app.services.rate_limit import limiter

        limiter.reset()
    except Exception:
        pass
    yield
    try:
        from app.services.rate_limit import limiter

        limiter.reset()
    except Exception:
        pass


def reset_sqlite_memory_schema() -> None:
    """Drop/recreate shared StaticPool :memory: schema for a clean TestClient lifespan."""
    from app.core.config import settings
    from app.core.database import engine
    from app.models import Base

    url = settings.database_url.strip().lower()
    if url.startswith("sqlite") and ":memory:" in url:
        Base.metadata.drop_all(bind=engine)
