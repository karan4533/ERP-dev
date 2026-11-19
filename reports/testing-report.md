# Testing report

**Date:** 19 November 2026  
**Context:** Post-push + Transport Manager Phase B  
**Scope:** Local verification after PRM/Hostel push

## Backend

| Suite | Passed | Failed | Notes |
|---|---|---|---|
| Pre-push broader pack (admissions/TC/attendance/HR/finance/FO/ops/leave/auth/admin/teacher/coordinator/principal/hostel) | **93** | **0** | Confirmed on pre-push tree |
| `test_transport_manager_apis` + hostel + ops/audit | **13** | **0** | Drivers/routes/assignments + RBAC |

## Frontend

| Check | Result |
|---|---|
| `npm run build` after Transport Manager LIVE | **Pass** (exit 0) |

## API probes (Transport Manager)

| Check | Result |
|---|---|
| Login `transportmanager@qmis.edu` | **Pass** — role `transportmanager` |
| PUT `/api/v1/ops/transport-drivers` | **Pass** — `TDR-UAT-1` |
| PUT `/api/v1/ops/transport-vehicles` | **Pass** — `TN-09-UAT-01` |
| GET `/api/v1/admin/users` | **403** |

## Browser UAT

| Check | Result |
|---|---|
| Transport Manager UI login | **Not completed in-session** (prior hostel session); manual check recommended |
| Hostel Warden (earlier) | **Pass** — Live banner, allocate, payments |

## Git push (completed)

| Repo | Remote | Commits |
|---|---|---|
| `C:\karan\irul` `irul` | `origin/irul` | `6741b1a` regression; `1f439fd` hostel BE (+ prior `9b38ca6`) |
| `ERP_QMIS` `main` | `new-ui/main` | `a8c666b` PRM; `77b5f5c` hostel FE |
