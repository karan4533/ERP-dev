"""Local API verification for P1 security fixes (no production changes)."""
from __future__ import annotations

import json
import urllib.error
import urllib.request

import os

BASE = os.environ.get("QMIS_API_BASE", "http://127.0.0.1:8001/api/v1")


def req(method: str, path: str, token: str | None = None, body=None):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            payload = json.loads(raw) if raw else None
        except Exception:
            payload = raw
        return exc.code, payload


def login(email: str, password: str) -> str:
    status, body = req("POST", "/auth/login", body={"email": email, "password": password})
    assert status == 200, (email, status, body)
    return body["access_token"]


def main() -> None:
    results: dict = {}

    teacher = login("teacher@qmis.edu", "teacher123")
    status, rows = req("GET", "/academics/class-timetables", token=teacher)
    results["teacher_timetables_status"] = status
    results["teacher_timetable_ids"] = [row.get("id") for row in (rows or [])]
    results["teacher_timetable_classes"] = sorted(
        {(row.get("className"), row.get("section")) for row in (rows or [])}
    )

    status, _ = req(
        "PUT",
        "/academics/unit-tests",
        token=teacher,
        body=[
            {
                "id": "UT-API-HACK-8A",
                "className": "Grade 8",
                "section": "A",
                "title": "hack",
                "subject": "Maths",
            }
        ],
    )
    results["teacher_unit_test_grade8_put"] = status

    status, _ = req("GET", "/campus-audit/process-rca", token=teacher)
    results["teacher_process_rca_get"] = status
    status, _ = req("GET", "/campus-audit/quality-observations", token=teacher)
    results["teacher_quality_obs_get"] = status

    process = login("processauditor@qmis.edu", "process123")
    quality = login("qualityauditor@qmis.edu", "quality123")

    status, _ = req(
        "PUT",
        "/campus-audit/process-observations",
        token=process,
        body=[
            {
                "id": "OBS-PA-LIVE-1",
                "observationId": "OBS-PA-LIVE-1",
                "auditReference": "AUD-PA-LIVE-1",
                "title": "PA live",
            }
        ],
    )
    results["process_put_obs"] = status
    status, _ = req("GET", "/campus-audit/process-observations", token=quality)
    results["quality_get_process_obs"] = status

    status, _ = req(
        "PUT",
        "/campus-audit/quality-observations",
        token=quality,
        body=[
            {
                "id": "OBS-QA-LIVE-1",
                "observationId": "OBS-QA-LIVE-1",
                "auditReference": "AUD-QA-LIVE-1",
                "title": "QA live",
            }
        ],
    )
    results["quality_put_obs"] = status
    status, _ = req("GET", "/campus-audit/quality-observations", token=process)
    results["process_get_quality_obs"] = status

    status, _ = req(
        "PUT",
        "/campus-audit/quality-observations",
        token=quality,
        body=[
            {
                "id": "OBS-PA-BLEED",
                "observationId": "OBS-PA-BLEED",
                "auditReference": "AUD-PA-1",
                "title": "bleed",
            }
        ],
    )
    results["quality_put_pa_id"] = status

    status, _ = req("PUT", "/ops/library-books", token=teacher, body=[])
    results["teacher_ops_library_wipe"] = status

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
