# QMIS ERP — Production Readiness Report (GPS / Route 1)

**Updated:** 24 October 2026  
**Focus:** Route card GPS freshness and saved driver details

---

## Tracking readiness

**`BLOCKED_STALE_GPS`**

The route card, freshness rule, and device mapping behave correctly. Live tracking is not operational because the tracker is still returning an old fix.

| Layer | Result |
|-------|--------|
| Implementation (fresh only when OK and age 0–600s) | **Correct** |
| Real device `355710090439063` | **Not fresh** — `datastatus` 2 (OK), `gpstime` `1792817627`, age **12860s (~3.6 h)**, `gpsLive` false |

Do not treat provider status OK as a live bus.

---

## Saved records (not invented)

| Field | Route `RT-1792826320243` | Vehicle `VEH-1792825477178` |
|-------|--------------------------|-----------------------------|
| Plate | `TN58BB3769` | `TN58BB3769` |
| IMEI | `355710090439063` | `355710090439063` |
| Driver | Browser Driver | empty on the vehicle |
| Contact | 7448907020 | empty on the vehicle |
| Start / end | erode → coimbatore | n/a |

ProTrack device for that IMEI: `Route No.1_TN58BB3769`, plate `TN58BB3769`.

Browser West Route has no IMEI. It is not given Route 1’s IMEI.

---

## Browser evidence (signed-in Transport Manager, port 5174)

After a full reload, and again after **Sign out** and a new Transport Manager sign-in:

| Card | Shown |
|------|--------|
| Route 1 | erode → coimbatore, Browser Driver, 7448907020, badge **NOT LIVE**, GPS `OK — last known (approximately 3.6 h ago)`, Call Driver `tel:+917448907020` |
| Browser West Route | — → —, Driver —, Contact —, badge **No IMEI**, **No driver contact** (disabled) |

Network after the new sign-in:

- `GET /api/v1/protrack/devices?panel=admin`
- `GET /api/v1/protrack/track?imeis=355710090439063&panel=admin`

No track request was sent for Browser West Route.

---

## Automated tests (not a substitute for the live device)

| Check | Result |
|-------|--------|
| `node --test` freshness + route-card cases | **15 passed, 0 failed** |
| `pytest tests/test_protrack_freshness.py tests/test_protrack_proxy.py tests/test_frontend_production_readiness_static.py -q` | **16 passed, 0 failed** |
| `npm run build` | **Succeeded** (vite, ~46s) |

Covered in tests: live at 0s and 600s; not live at 601s; future and invalid timestamps not live; OK + stale timestamp not live; offline, missing, and no coordinates not live; no-IMEI route excluded from the track list; duplicate IMEI and vehicle IMEI clash not tracked; Call Driver rejected for empty, short, and non-numeric contacts.

---

## Rule that stayed in place

Live GPS only when `datastatus` is OK (2) **and** Unix age is from 0 through 600 seconds. Age is `now - gpstime` in UTC seconds (millisecond values converted). A future timestamp is invalid, not age 0. The 600-second limit was not raised.

---

## Remaining blocker

GPS vendor: device `355710090439063` must publish a new `gpstime` no older than 600 seconds while status stays OK. Until then the Route 1 card stays **NOT LIVE**.
