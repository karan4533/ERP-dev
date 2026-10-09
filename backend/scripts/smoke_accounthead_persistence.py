"""Account Head persistence: save -> re-login -> GET (simulates refresh/logout)."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
import uuid

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8002"
MARKER = f"BROWSER-PERSIST-{uuid.uuid4().hex[:8]}"


def req(method: str, path: str, body=None, token=None):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read().decode()
            return response.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {"raw": raw}
        return exc.code, payload


def main():
    print(f"Persistence smoke against {BASE}")
    status, login = req("POST", "/api/v1/auth/login", {"email": "accounthead@qmis.edu", "password": "accounts123"})
    assert status == 200, login
    token1 = login["access_token"]

    status, state = req("GET", "/api/v1/finance/state", token=token1)
    assert status == 200, state
    data = dict(state.get("data") or {})
    data["meta"] = {**(data.get("meta") or {}), "seeded": True, "phase1BrowserMarker": MARKER}
    data.setdefault("feeCategories", [{"id": "CAT-P1", "name": "Tuition"}])
    data.setdefault(
        "feeStructures",
        [{"id": "FS-P1", "className": "Grade 1", "academicYear": "2026-27", "amount": 1000}],
    )
    data.setdefault("fineRules", [])
    status, saved = req("PUT", "/api/v1/finance/state", {"data": data}, token=token1)
    assert status == 200, saved
    print("PASS save finance state with marker")

    # New login = logout/login (fresh session; JWT may match if issued in the same second)
    status, login2 = req("POST", "/api/v1/auth/login", {"email": "accounthead@qmis.edu", "password": "accounts123"})
    assert status == 200
    token2 = login2["access_token"]
    status, again = req("GET", "/api/v1/finance/state", token=token2)
    assert status == 200, again
    meta = (again.get("data") or {}).get("meta") or {}
    assert meta.get("phase1BrowserMarker") == MARKER, meta
    assert meta.get("financialYearStartMonth") == "April", meta
    print("PASS re-login still has marker + financial year April meta")

    status, asst = req("POST", "/api/v1/auth/login", {"email": "finance.assistant@qmis.edu", "password": "finance123"})
    assert status == 200, asst
    status, put = req("PUT", "/api/v1/finance/state", {"data": data}, token=asst["access_token"])
    assert status == 403, put
    print("PASS finance assistant cannot PUT state")
    print("Summary: 3/3 persistence checks passed")


if __name__ == "__main__":
    main()
