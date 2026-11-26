# Phase 2 — Transport Driver Verification Report

**Date:** 2026-11-23\
**Role:** `driver`\
**Login:** `driver@qmis.edu` / `driver123`\
**Home:** `/driver/dashboard`\
**Frontend:** `ERP_QMIS`\
**Backend:** existing FastAPI `:8000` (not restarted)\
**Git:** No commit / push / merge / deploy

**Prior role:** Transport Manager — accepted.\
**Next role:** Hostel Warden — **not started** (stop for approval).

---

## Overall status: PARTIAL (core LIVE)

Driver-scoped transport ops are **LIVE**. Vehicle document upload remains **BLOCKED**. Dedicated edit forms remain **LOCAL ONLY**. Shared communication/reports stay **MOCK**. GPS / Track Bus is **DEMO elsewhere** and is **never claimed LIVE** in the Driver portal.

---

## Status board

| Screen / action | API | Status |
|---|---|---|
| Dashboard KPIs / recent duties | `GET transport-duties\|vehicles\|routes\|driver-fuel\|driver-maintenance` | **LIVE** / **UAT VERIFIED** |
| Assigned vehicle details | `GET transport-vehicles` (scoped) | **LIVE** / **UAT VERIFIED** |
| My Duty list + status | `GET/PUT transport-duties` | **LIVE** / **UAT VERIFIED** |
| Route details / stops | `transport-routes` / `transport-route-stops` | **LIVE** |
| Boarding attendance + history | assignments + `transport-student-attendance` | **LIVE** |
| Vehicle health list + Add + View | `GET/PUT transport-vehicle-health` | **LIVE** (view wired this pass) |
| Fuel list + Add + View | `GET/PUT transport-driver-fuel` | **LIVE** (view + scoped vehicle prefill) / **UAT VERIFIED** |
| Maintenance list + Add + View | `GET/PUT transport-driver-maintenance` | **LIVE** (view + scoped vehicle prefill) / **UAT VERIFIED** |
| Fuel / maintenance / health Edit routes | — | **LOCAL ONLY** (honest empty; create via Add) |
| Vehicle document upload | none | **BLOCKED** / **UAT VERIFIED** |
| Leave | shared leave API | **LIVE**-capable |
| Communication / reports | local / demo | **MOCK** |
| GPS / Track Bus | none in Driver portal | **DEMO elsewhere — not LIVE** |
| Fleet admin / expenses / TM screens | — | **BLOCKED** (not in Driver menu) |

---

## Changes this role

1. `ViewFuelRequest.jsx` / `ViewMaintenanceRequest.jsx` / `ViewVehicleHealthStatus.jsx` — LIVE detail from scoped list APIs
2. `AddFuelRequest.jsx` / `AddMaintenanceRequest.jsx` / `AddVehicleHealthStatus.jsx` — prefill vehicle from scoped `listTransportVehicles`
3. `DriverLayout.jsx` / `Dashboard.jsx` — honesty banners (LIVE / BLOCKED / MOCK; GPS not LIVE)
4. Edit fuel/maintenance/health routes — labeled **LOCAL ONLY**
5. Live DB merge-seed: `driver@qmis.edu` ↔ `TN33DRV001` / `Driver Loop` without wiping TM Phase 2 rows

No Transport Manager reimplementation. No GPS invented. No Hostel Warden / Gate Keeper work. No new backend domains.

---

## Persistence / RBAC evidence

| Check | Result |
|---|---|
| TM merge-seed drivers/vehicles/routes/stops/assignments/duties | **200**; TM sees **2** vehicles; Driver sees **1** (`TN33DRV001`) |
| Driver PUT fuel / maintenance / vehicle-health (in scope) | **200**; GET returns scoped rows |
| Driver PUT fuel with foreign plate (no email short-circuit) | **403** |
| Teacher PUT `transport-drivers` | **403** |
| Pytest `test_driver_ops_scope` + `test_transport_manager_apis` | **7 passed** |
| `npm run build` | **Pass** |

Note: `_driver_scope` treats matching `email` / `driverEmail` as in-scope even if the plate differs. Vehicle-only foreign plates remain **403** (covered by pytest).

---

## Browser UAT (`driver@qmis.edu`)

| Screen | Observed |
|---|---|
| `/driver/dashboard` | Live Driver workspace; KPIs Vehicles/Routes/Duties/Fuel/Maint = **1**; banner states GPS not LIVE |
| `/driver/vehicle-management/vehicle-details` | **TN33DRV001** Bus / UAT Driver from scoped vehicles |
| `/driver/my-duty` | Live duties; **Showing 1 of 1** |
| `/driver/fuel-request` | Live · `transport-driver-fuel`; list loads |
| `/driver/maintenance-request` | Live · `transport-driver-maintenance` |
| `/driver/vehicle-management/vehicle-documents` | **BLOCKED — vehicle document upload has no API** |

---

## Remaining blockers (Transport Driver)

| Item | Why |
|---|---|
| Vehicle document upload | No file/ops document API |
| Dedicated Edit forms | LOCAL ONLY; Add/list/view are SoT |
| Live GPS in Driver portal | Not wired; DEMO elsewhere only |
| Communication / reports | MOCK helpers |

---

## Confirmation

- Phase 2 role **3 of 6 (Transport Driver)** verification ready.
- Hostel Warden / Gate Keeper / Gate Keeper Manager **not started**.
- Transport Manager functionality preserved (not reimplemented).
- Specialty/enterprise modules outside Phase 2 scope **not started**.
- No commit, push, merge, or deploy.
