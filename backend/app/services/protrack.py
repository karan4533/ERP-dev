"""ProTrack365 GPS proxy — admin fleet + parent-panel accounts via Open API."""

from __future__ import annotations

import hashlib
import time
from typing import Any

import httpx
from fastapi import HTTPException

from app.core.config import settings
from app.services.errors import fail

BASE_URL = "https://api.protrack365.com"
GPS_FRESH_MAX_AGE_SEC = 600


def parse_gps_unix_seconds(gpstime: Any) -> int | None:
    """Unix seconds. Millisecond values (> 1e12) are converted. Not a local-time clock."""
    try:
        number = float(gpstime)
    except (TypeError, ValueError):
        return None
    if number != number or number <= 0:
        return None
    if number > 1e12:
        return int(number // 1000)
    if number > 1e9:
        return int(number)
    return None


def gps_age_seconds(gpstime: Any, now_sec: int) -> int | None:
    timestamp = parse_gps_unix_seconds(gpstime)
    if timestamp is None:
        return None
    return int(now_sec) - timestamp


def _format_age_approx(age_sec: int) -> str:
    if age_sec < 3600:
        return f"approximately {round(age_sec / 60)} min ago"
    return f"approximately {age_sec / 3600:.1f} h ago"


def classify_track_freshness(track: dict | None, now_sec: int | None = None) -> dict:
    """Live only when datastatus is OK (2) and fix age is within 0..600 seconds."""
    now = int(time.time()) if now_sec is None else int(now_sec)
    if not track:
        return {"state": "unavailable", "label": "Unavailable", "ageSec": None, "datastatus": None, "live": False}

    try:
        code = int(track.get("datastatus"))
    except (TypeError, ValueError):
        code = None
    age = gps_age_seconds(track.get("gpstime"), now)
    try:
        lat = float(track.get("latitude"))
        lng = float(track.get("longitude"))
        has_coords = lat == lat and lng == lng and not (lat == 0 and lng == 0)
    except (TypeError, ValueError):
        has_coords = False

    labels = {1: "Never online", 2: "OK", 3: "Expired", 4: "Offline", 5: "Blocked"}
    status_label = labels.get(code, "Unknown")

    def unavailable(label: str) -> dict:
        return {"state": "unavailable", "label": label, "ageSec": age, "datastatus": code, "live": False}

    if code in {1, 3, 5}:
        return unavailable(status_label)
    if code == 4:
        return {
            "state": "offline",
            "label": "Offline — last known" if has_coords else "Offline",
            "ageSec": age,
            "datastatus": code,
            "live": False,
        }
    if age is not None and age < 0:
        return unavailable("Invalid GPS time")
    if age is None:
        return unavailable("Invalid GPS time")
    if not has_coords:
        return unavailable(status_label or "Unavailable")
    if code == 2 and 0 <= age <= GPS_FRESH_MAX_AGE_SEC:
        return {"state": "fresh", "label": "Live GPS", "ageSec": age, "datastatus": code, "live": True}

    prefix = "OK" if code == 2 else status_label
    return {
        "state": "stale",
        "label": f"{prefix} — last known ({_format_age_approx(age)})",
        "ageSec": age,
        "datastatus": code,
        "live": False,
    }

# account role → cached token
_token_cache: dict[str, dict[str, Any]] = {}


def _md5(text: str) -> str:
    return hashlib.md5(text.encode("utf-8")).hexdigest()


def _credentials(panel: str) -> tuple[str, str]:
    panel = (panel or "admin").strip().lower()
    if panel == "parent":
        account = (settings.protrack_parent_account or "").strip()
        password = (settings.protrack_parent_password or "").strip()
    else:
        account = (settings.protrack_admin_account or "").strip()
        password = (settings.protrack_admin_password or "").strip()
    if not account or not password:
        fail(
            503,
            "protrack_not_configured",
            f"ProTrack365 {panel} credentials are not set. "
            "Add PROTRACK_ADMIN_ACCOUNT / PROTRACK_ADMIN_PASSWORD "
            "(and parent panel vars) to backend/.env, then restart the API.",
        )
    return account, password


def _authorize(panel: str) -> str:
    cached = _token_cache.get(panel)
    now = time.time()
    if cached and cached.get("expires_at", 0) > now + 60:
        return str(cached["access_token"])

    account, password = _credentials(panel)
    unix_time = int(time.time())
    signature = _md5(_md5(password) + str(unix_time))
    url = f"{BASE_URL}/api/authorization"
    params = {"time": unix_time, "account": account, "signature": signature}
    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.get(url, params=params)
    except httpx.HTTPError as exc:
        fail(502, "protrack_unreachable", f"Could not reach ProTrack365: {exc}")

    payload = response.json() if response.content else {}
    if response.status_code >= 400 or int(payload.get("code", -1)) != 0:
        message = payload.get("message") or response.text or "Authorization failed"
        fail(502, "protrack_auth_failed", f"ProTrack365 login failed ({panel}): {message}")

    record = payload.get("record") or {}
    token = record.get("access_token")
    expires_in = int(record.get("expires_in") or 7200)
    if not token:
        fail(502, "protrack_auth_failed", "ProTrack365 returned no access_token.")
    _token_cache[panel] = {"access_token": token, "expires_at": now + expires_in}
    return str(token)


# ProTrack Open API token failures (docs + observed live: 10011 "access_token error").
_TOKEN_INVALID_CODES = {1002, 1003, 1008, 10011}


def _is_token_invalid(payload: dict[str, Any]) -> bool:
    code = int(payload.get("code", 0) or 0)
    if code in _TOKEN_INVALID_CODES:
        return True
    if code == 0:
        return False
    message = str(payload.get("message") or "").lower()
    return "access_token" in message and (
        "invalid" in message or "error" in message or "expired" in message
    )


def _get(panel: str, path: str, params: dict[str, Any] | None = None) -> dict:
    token = _authorize(panel)
    query = {"access_token": token, **(params or {})}
    url = f"{BASE_URL}{path}"
    try:
        with httpx.Client(timeout=25.0) as client:
            response = client.get(url, params=query)
    except httpx.HTTPError as exc:
        fail(502, "protrack_unreachable", f"Could not reach ProTrack365: {exc}")

    payload = response.json() if response.content else {}
    # Token invalidated / expired — clear cache once and retry with a fresh login.
    if _is_token_invalid(payload):
        _token_cache.pop(panel, None)
        token = _authorize(panel)
        query["access_token"] = token
        try:
            with httpx.Client(timeout=25.0) as client:
                response = client.get(url, params=query)
            payload = response.json() if response.content else {}
        except httpx.HTTPError as exc:
            fail(502, "protrack_unreachable", f"Could not reach ProTrack365: {exc}")

    if response.status_code >= 400 or int(payload.get("code", -1)) != 0:
        message = payload.get("message") or response.text or "ProTrack request failed"
        fail(502, "protrack_error", str(message))
    return payload


def _admin_configured() -> bool:
    return bool(
        (settings.protrack_admin_account or "").strip()
        and (settings.protrack_admin_password or "").strip()
    )


def _with_parent_fallback(panel: str, action):
    """Parent-panel accounts sometimes reject Open API; fall back to fleet admin login."""
    try:
        return action(panel)
    except HTTPException as exc:
        detail = exc.detail if isinstance(exc.detail, dict) else {}
        code = str(detail.get("code") or "")
        message = str(detail.get("message") or "").lower()
        can_fallback = (
            (panel or "").strip().lower() == "parent"
            and _admin_configured()
            and (
                code in {"protrack_auth_failed", "protrack_error", "protrack_unreachable"}
                or "permission denied" in message
            )
        )
        if can_fallback:
            return action("admin")
        raise


def list_devices(panel: str = "admin") -> list[dict]:
    def _run(active_panel: str) -> list[dict]:
        payload = _get(active_panel, "/api/device/list")
        record = payload.get("record")
        if isinstance(record, list):
            return record
        if isinstance(record, dict):
            return [record]
        return []

    return _with_parent_fallback(panel, _run)


def track_imeis(imeis: list[str], panel: str = "admin") -> list[dict]:
    clean = [str(i).strip() for i in imeis if str(i).strip()]
    if not clean:
        fail(422, "invalid_body", "Provide at least one IMEI.")
    if len(clean) > 100:
        fail(422, "invalid_body", "Maximum 100 IMEIs per request.")

    def _run(active_panel: str) -> list[dict]:
        payload = _get(active_panel, "/api/track", {"imeis": ",".join(clean)})
        record = payload.get("record")
        if isinstance(record, list):
            return record
        if isinstance(record, dict):
            return [record]
        return []

    rows = _with_parent_fallback(panel, _run)
    now = int(time.time())
    annotated: list[dict] = []
    for row in rows:
        item = dict(row)
        freshness = classify_track_freshness(item, now)
        item["gpsFreshness"] = freshness["state"]
        item["gpsLive"] = freshness["live"]
        item["gpsAgeSec"] = freshness["ageSec"]
        item["gpsStatusLabel"] = freshness["label"]
        annotated.append(item)
    return annotated


def status_summary() -> dict:
    admin_set = bool((settings.protrack_admin_account or "").strip() and (settings.protrack_admin_password or "").strip())
    parent_set = bool(
        (settings.protrack_parent_account or "").strip() and (settings.protrack_parent_password or "").strip()
    )
    return {
        "configured": admin_set or parent_set,
        "adminConfigured": admin_set,
        "parentConfigured": parent_set,
        "baseUrl": BASE_URL,
    }
