"""Pytest defaults: stub integrations (ignore demo mode from backend/.env)."""

import os

import pytest

# Initial process default before collection.
os.environ["INTEGRATIONS_MODE"] = ""
os.environ.setdefault("RFID_IMPORT_ENABLED", "false")


@pytest.fixture(autouse=True)
def _stub_integrations_unless_test_overrides(monkeypatch):
    """Reset after any test that set INTEGRATIONS_MODE=demo."""
    monkeypatch.setenv("INTEGRATIONS_MODE", "")
    monkeypatch.setenv("RFID_IMPORT_ENABLED", "false")
    try:
        from app.core import config

        config.settings.integrations_mode = ""
    except Exception:
        pass
    yield
