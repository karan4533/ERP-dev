"""GPS freshness rules. datastatus OK is not a fresh fix by itself."""

from app.services.protrack import GPS_FRESH_MAX_AGE_SEC, classify_track_freshness, gps_age_seconds, track_imeis

NOW = 1_792_820_000


def _row(gpstime, **extra):
    payload = {
        "datastatus": 2,
        "latitude": 9.882777,
        "longitude": 78.03727,
        "gpstime": gpstime,
    }
    payload.update(extra)
    return payload


def test_fresh_max_age_stays_600_seconds():
    assert GPS_FRESH_MAX_AGE_SEC == 600


def test_ok_fix_at_600_seconds_is_live():
    result = classify_track_freshness(_row(NOW - 600), NOW)
    assert result["live"] is True
    assert result["state"] == "fresh"
    assert result["ageSec"] == 600


def test_ok_fix_under_600_seconds_is_live():
    result = classify_track_freshness(_row(NOW - 90), NOW)
    assert result["live"] is True
    assert result["ageSec"] == 90


def test_fix_older_than_600_seconds_is_not_live():
    result = classify_track_freshness(_row(NOW - 601), NOW)
    assert result["live"] is False
    assert result["state"] == "stale"
    assert result["label"].startswith("OK — last known (approximately ")


def test_future_and_invalid_timestamps_are_not_live():
    future = classify_track_freshness(_row(NOW + 15), NOW)
    assert future["live"] is False
    assert future["label"] == "Invalid GPS time"
    assert future["ageSec"] < 0
    for gpstime in (0, -1, "nope", None, ""):
        result = classify_track_freshness(_row(gpstime), NOW)
        assert result["live"] is False
        assert result["state"] != "fresh"


def test_ok_status_with_stale_timestamp_is_not_live():
    age = gps_age_seconds(1_792_817_627, 1_792_817_627 + 12_240)
    assert age == 12_240
    result = classify_track_freshness(_row(1_792_817_627), 1_792_817_627 + 12_240)
    assert result["datastatus"] == 2
    assert result["live"] is False
    assert result["label"] == "OK — last known (approximately 3.4 h ago)"


def test_offline_missing_and_unavailable_are_not_live():
    offline = classify_track_freshness(_row(NOW - 5, datastatus=4), NOW)
    assert offline["state"] == "offline"
    assert offline["live"] is False
    missing = classify_track_freshness(None, NOW)
    assert missing["state"] == "unavailable"
    assert missing["live"] is False
    no_coords = classify_track_freshness(_row(NOW - 5, latitude=0, longitude=0), NOW)
    assert no_coords["live"] is False


def test_track_proxy_does_not_mark_stale_ok_as_live(monkeypatch):
    from app.services import protrack as svc

    monkeypatch.setattr(
        svc,
        "_with_parent_fallback",
        lambda panel, action: [
            {
                "imei": "355710090439063",
                "datastatus": 2,
                "gpstime": NOW - 12_000,
                "latitude": 9.88,
                "longitude": 78.03,
            }
        ],
    )
    monkeypatch.setattr(svc.time, "time", lambda: NOW)
    rows = track_imeis(["355710090439063"], "admin")
    assert rows[0]["gpsLive"] is False
    assert rows[0]["gpsFreshness"] == "stale"
    assert rows[0]["datastatus"] == 2
