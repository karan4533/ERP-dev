# Testing report

**Date:** 24 October 2026  
**Context:** Route card GPS freshness and driver details

## Backend

| Metric | Count |
|---|---|
| Passed | **16** |
| Failed | **0** |
| Warnings | 1 (Starlette TestClient / httpx deprecation) |
| Duration | ~10 seconds |

Command: `python -m pytest tests/test_protrack_freshness.py tests/test_protrack_proxy.py tests/test_frontend_production_readiness_static.py -q` from `backend/`.

Coverage notes:
- Fresh OK fix at 0s, under 600s, and exactly 600s is live
- Older than 600s, future time, invalid time, OK with a stale timestamp, offline, missing, and no coordinates are not live
- Track proxy sets `gpsLive` false for a stale OK row
- Route card source does not hardcode Route 1 driver, contact, or locations

## Frontend

| Metric | Count |
|---|---|
| Passed | **15** |
| Failed | **0** |

Command: `node --test src/services/protrackFreshness.test.js src/Pages/TransportManager/RouteData/routeCardGps.test.js`

No Jest suite exists in this repo. These are Node’s built-in tests of the freshness and route-card rules.

Production build: `npm run build` succeeded (Vite, about 46 seconds).

## Browser (separate from the automated counts)

Transport Manager Route Data on `localhost:5174`, including after sign-out and sign-in: Route 1 showed saved driver, contact, and erode → coimbatore with **NOT LIVE**. Browser West Route showed **No IMEI**. The only track call was IMEI `355710090439063`.
