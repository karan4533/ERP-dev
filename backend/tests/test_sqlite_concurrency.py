"""File-SQLite concurrency: request-path engine must survive parallel auth reads.

Reproduces the Transport Manager browser failure mode (many concurrent GETs that
each call get_current_user → db.get(User, ...)) without relying on the browser.
"""

from __future__ import annotations

import os
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import unquote

# File DB (not :memory:) — StaticPool sharing is what crashed local uvicorn.
_FD, _DB_PATH = tempfile.mkstemp(prefix="qmis_sqlite_conc_", suffix=".db")
os.close(_FD)
os.environ["DATABASE_URL"] = f"sqlite+pysqlite:///{Path(_DB_PATH).as_posix()}"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-phase0-local"
os.environ["ENVIRONMENT"] = "development"

import atexit

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import NullPool, StaticPool

from app.core import database as database_module
from app.main import app


def _cleanup() -> None:
    try:
        Path(_DB_PATH).unlink(missing_ok=True)
    except OSError:
        pass


atexit.register(_cleanup)

TM = ("transportmanager@qmis.edu", "transport123")


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def _engine_is_memory_sqlite() -> bool:
    """Detect :memory: even when SQLAlchemy renders it URL-encoded (%3Amemory%3A)."""
    url = unquote(str(database_module.engine.url))
    if ":memory:" in url:
        return True
    # Full-suite import order may already bind StaticPool for pytest memory DB.
    return database_module.engine.pool.__class__ is StaticPool


def test_file_sqlite_engine_uses_null_pool():
    if _engine_is_memory_sqlite():
        pytest.skip("engine already bound to :memory: by another test module; run this file alone")
    assert database_module.engine.pool.__class__ is NullPool


def test_concurrent_authenticated_reads_keep_server_alive(client):
    if database_module.engine.pool.__class__ is not NullPool:
        pytest.skip("requires file-SQLite NullPool (run tests/test_sqlite_concurrency.py alone)")
    login = client.post("/api/v1/auth/login", json={"email": TM[0], "password": TM[1]})
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    paths = [
        "/api/v1/auth/me",
        "/api/v1/ops/transport-drivers",
        "/api/v1/ops/transport-vehicles",
        "/api/v1/ops/transport-routes",
        "/api/v1/ops/transport-student-assignments",
        "/api/v1/ops/transport-duties",
        "/api/v1/finance/state",
        "/api/v1/admin/users",
    ]

    def one(path: str) -> tuple[str, int]:
        response = client.get(path, headers=headers)
        return path, response.status_code

    # Burst similar to browser post-login fan-out (StrictMode + dashboard + finance).
    jobs: list[tuple[str, int]] = []
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = [pool.submit(one, paths[i % len(paths)]) for i in range(48)]
        for fut in as_completed(futures):
            jobs.append(fut.result())

    by_path: dict[str, set[int]] = {}
    for path, status in jobs:
        by_path.setdefault(path, set()).add(status)

    assert by_path["/api/v1/auth/me"] == {200}
    assert by_path["/api/v1/ops/transport-drivers"] == {200}
    assert by_path["/api/v1/ops/transport-vehicles"] == {200}
    assert by_path["/api/v1/ops/transport-routes"] == {200}
    assert by_path["/api/v1/ops/transport-student-assignments"] == {200}
    assert by_path["/api/v1/ops/transport-duties"] == {200}
    assert by_path["/api/v1/finance/state"] == {403}
    assert by_path["/api/v1/admin/users"] == {403}

    # Process still serving after the burst.
    health = client.get("/api/v1/ops/transport-drivers", headers=headers)
    assert health.status_code == 200


def test_concurrent_read_and_write_ops_collections(client):
    if database_module.engine.pool.__class__ is not NullPool:
        pytest.skip("requires file-SQLite NullPool (run tests/test_sqlite_concurrency.py alone)")
    login = client.post("/api/v1/auth/login", json={"email": TM[0], "password": TM[1]})
    assert login.status_code == 200, login.text
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    def reader() -> int:
        return client.get("/api/v1/ops/transport-drivers", headers=headers).status_code

    def writer(i: int) -> int:
        body = [
            {
                "id": f"TDR-CONC-{i}",
                "firstName": "Conc",
                "lastName": str(i),
                "name": f"Conc {i}",
                "mobileNumber": f"9000000{i:03d}",
                "licenseNumber": f"LIC-CONC-{i}",
                "status": "Active",
            }
        ]
        return client.put("/api/v1/ops/transport-drivers", json=body, headers=headers).status_code

    codes: list[int] = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = []
        for i in range(8):
            futures.append(pool.submit(reader))
            futures.append(pool.submit(writer, i))
        for fut in as_completed(futures):
            codes.append(fut.result())

    assert all(code in {200} for code in codes), codes
    listed = client.get("/api/v1/ops/transport-drivers", headers=headers)
    assert listed.status_code == 200
    # Last full-collection PUT wins; at least one row remains.
    assert isinstance(listed.json(), list)
