# ProTrack365 API verification — Route 1

**Updated:** 24 October 2026  
**Account:** fleet admin panel via the ERP proxy. Credentials are not recorded here.

---

## Device match

| Check | Result |
|-------|--------|
| IMEI requested | `355710090439063` |
| Device name | `Route No.1_TN58BB3769` |
| Plate | `TN58BB3769` |
| ERP route | `RT-1792826320243` |
| ERP vehicle | `VEH-1792825477178` |

The saved route IMEI, saved vehicle IMEI, and provider device IMEI are the same value. The provider plate matches the saved registration.

---

## Latest track read

| Field | Value |
|-------|--------|
| `datastatus` | 2 (OK) |
| `gpstime` | `1792817627` |
| Age at read | 12860 seconds (~3.6 h) |
| Classifier | `stale`, `gpsLive` false |
| Label | `OK — last known (approximately 3.6 h ago)` |

OK means the provider accepted the device state. It does not mean the fix is fresh. Freshness uses `gpstime` against the current Unix time. Live requires OK and age from 0 to 600 seconds inclusive.

The same `gpstime` has remained in place across earlier reads on this date while server/heartbeat time moved. That points at the device or vendor, not at the ERP age calculation.

---

## What this does not prove

This read does **not** show a live bus. Tracking readiness stays **`BLOCKED_STALE_GPS`** until a later track returns a new `gpstime` inside the 600-second window.

Browser West Route has no IMEI and was not included in the track request.
