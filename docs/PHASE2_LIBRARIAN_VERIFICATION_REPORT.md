# Phase 2 — Librarian Verification Report

**Date:** 2026-11-23\
**Role:** `librarian`\
**Login:** `librarian@qmis.edu` / `librarian123`\
**Home:** `/librarian/dashboard`\
**Frontend:** `ERP_QMIS`\
**Backend:** existing FastAPI `:8000` (not restarted)\
**Git:** No commit / push / merge / deploy

**Next role:** Transport Manager — **not started** (await this report acceptance before proceeding).

---

## Overall status: PARTIAL (core LIVE)

Core catalog / members / issue / return / dashboard KPIs are **LIVE** against `/api/v1/ops/library-*`. Book requisitions and SMS reminders remain **MOCK / LOCAL ONLY**. Enterprise sidebar extras (Stores, L&F, Helpdesk, etc.) stay outside Phase 2 library scope (honesty via shared enterprise patterns; not claimed LIVE).

---

## Status board

| Screen / action | API | Status |
|---|---|---|
| Dashboard KPIs (titles, copies, circulation, overdue, members) | `GET library-books\|issues\|members` | **LIVE** (wired this pass) |
| Dashboard Mark Returned | `PUT` books + issues + members | **LIVE** (wired this pass) |
| Catalog list / Add book | `GET/PUT library-books` | **LIVE** (prior + UAT) |
| Issue / Return (workspace + issue form) | `GET/PUT` three collections | **LIVE** |
| Members list / add | `GET/PUT library-members` | **LIVE** |
| Book Requests / requisitions | localStorage only | **MOCK / LOCAL ONLY** |
| Send Reminder (SMS) | none | **MOCK** (honest notice) |
| Announcements | `/announcements` read | **LIVE** read / create **BLOCKED** |
| Calendar / communication / tasks / leave / escalations | shared APIs | **PARTIAL / LIVE** per shared wiring |
| Stores / L&F / Helpdesk / File Room / Relieving / Reports | enterprise | **MOCK / out of library claim** |

---

## Changes this role

1. `ERP_QMIS/src/Pages/Librarian/Dashboard/Dashboard.jsx` — hydrate KPIs + overdue from `loadLibraryWorkspace`; Mark Returned persists via full-collection PUT; requests tab labeled MOCK.
2. `ERP_QMIS/src/Layout/LibrarianLayout.jsx` — honesty banner updated for LIVE vs MOCK split.

No new backend domains. Existing ops collections reused.

---

## Persistence / RBAC evidence

| Check | Result |
|---|---|
| Librarian `PUT /api/v1/ops/library-books` with `Phase2 Librarian Atlas` | **200**; subsequent GET count **1** |
| Teacher `PUT /api/v1/ops/library-books` | **403** |
| Pytest `test_ops_library_replace_and_list` + `test_teacher_denied_library_write` | **2 passed** |
| `npm run build` | **Pass** |

---

## Browser UAT

| Screen | Observed |
|---|---|
| `/librarian/dashboard` | **Live library dashboard** + Live Librarian workspace banner |
| `/librarian/book-management/book-list` | Live catalog notice; **Phase2 Librarian Atlas** visible |

---

## Remaining blockers (Librarian)

| Item | Why |
|---|---|
| Book requests collection | No FastAPI `library-requests` — needs domain approval |
| SMS / email overdue gateway | Reminder UI only; library notify exists for issue events but no dashboard SMS API |
| Fine ledger / inventory SKU | Not in ops collections |

---

## Confirmation

- Phase 2 role **1 of 6 (Librarian)** verification ready.
- Transport Manager / Driver / Hostel / Gate Keeper / Gate Keeper Manager **not started**.
- Specialty/enterprise modules outside Phase 2 scope **not started**.
- No commit, push, merge, or deploy.
