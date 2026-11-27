"""File-backed SQLite auth stability (isolated UAT regression).

UAT on a file SQLite API showed /auth/me 401s and sqlite3.InterfaceError while
loading permissions under concurrent threadpool requests when StaticPool shared
one connection. These tests lock the pool choice and exercise login → /me under load.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import pytest
from sqlalchemy.pool import NullPool, StaticPool

from app.core.database import sqlite_engine_kwargs

BACKEND_DIR = Path(__file__).resolve().parents[1]


def test_sqlite_memory_keeps_static_pool():
    kwargs = sqlite_engine_kwargs("sqlite+pysqlite:///:memory:")
    assert kwargs["poolclass"] is StaticPool
    assert kwargs["connect_args"]["check_same_thread"] is False


def test_sqlite_file_uses_null_pool():
    kwargs = sqlite_engine_kwargs("sqlite+pysqlite:///C:/tmp/qmis_uat.sqlite")
    assert kwargs["poolclass"] is NullPool
    assert kwargs["connect_args"]["check_same_thread"] is False


def test_file_sqlite_auth_me_survives_concurrent_requests():
    """Subprocess so DATABASE_URL is bound before app.core.database is imported."""
    fd, path = tempfile.mkstemp(prefix="qmis_auth_stab_", suffix=".sqlite")
    os.close(fd)
    db_url = f"sqlite+pysqlite:///{Path(path).as_posix()}"
    script = r"""
import json, os, sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

os.environ["ENVIRONMENT"] = "development"
os.environ["DATABASE_URL"] = sys.argv[1]
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-sqlite-file-auth-stability"
os.environ["OTP_DEBUG"] = "true"
os.environ["INTEGRATIONS_MODE"] = ""
os.environ["STUDENT_LOGIN_MIN_GRADE"] = "1"

from fastapi.testclient import TestClient
from app.core import database as dbmod
from app.core.config import settings
from app.main import app
from sqlalchemy.pool import NullPool

assert ":memory:" not in settings.database_url
assert dbmod.engine.pool.__class__ is NullPool, dbmod.engine.pool.__class__.__name__

with TestClient(app) as client:
    login = client.post("/api/v1/auth/login", json={
        "email": settings.admin_seed_email,
        "password": settings.admin_seed_password,
    })
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200, me.text
    body = me.json()
    assert body.get("role") == "admin"
    assert isinstance(body.get("permissions"), list)
    assert "auth.me" in body["permissions"] or len(body["permissions"]) > 0

    # Wrong password stays a real 401 (not weakened by the pool fix).
    bad = client.post("/api/v1/auth/login", json={
        "email": settings.admin_seed_email,
        "password": "Definitely-Wrong-Password-999",
    })
    assert bad.status_code == 401, bad.text

    def hit(_i: int) -> tuple[int, str]:
        r = client.get("/api/v1/auth/me", headers=headers)
        return r.status_code, (r.text[:160] if r.status_code != 200 else "ok")

    results = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        futs = [pool.submit(hit, i) for i in range(24)]
        for fut in as_completed(futs):
            results.append(fut.result())

    statuses = [s for s, _ in results]
    assert statuses.count(200) == 24, results
    # Persistence: still valid after concurrent load.
    again = client.get("/api/v1/auth/me", headers=headers)
    assert again.status_code == 200, again.text
    # Protected route still enforces auth.
    denied = client.get("/api/v1/auth/me")
    assert denied.status_code == 401, denied.text

print(json.dumps({"ok": True, "pool": "NullPool", "concurrent_me": 24}))
"""
    try:
        proc = subprocess.run(
            [sys.executable, "-c", script, db_url],
            cwd=str(BACKEND_DIR),
            capture_output=True,
            text=True,
            timeout=120,
            env={**os.environ, "ENVIRONMENT": "development"},
        )
        if proc.returncode != 0:
            pytest.fail(f"stdout:\n{proc.stdout}\nstderr:\n{proc.stderr}")
        assert '"ok": true' in proc.stdout.lower().replace(" ", "") or '"ok":true' in proc.stdout.replace(" ", "")
    finally:
        Path(path).unlink(missing_ok=True)
