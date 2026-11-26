# QMIS — Partner Branch Integration Plan

**Date:** 2026-11-24\
**Mode:** Audit only — no merge / cherry-pick / rebase / commit / push applied\
**Backup:** `C:\karan\irul\_sync_backups\2026-11-24_partner_sync_prep`

---

## Repository map (boundaries)

| Repo | Path | Remote(s) | Current branch | Role |
|---|---|---|---|---|
| **Root (ERP-dev)** | `C:\karan\irul` | `origin` → `https://github.com/karan4533/ERP-dev.git` | `irul` @ `267a580` tracking `origin/irul` | Backend SoT + legacy `src/` frontend + docs |
| **Frontend (ERP_QMIS)** | `C:\karan\irul\ERP_QMIS` (**own `.git`**) | `origin` → `https://github.com/irulappan151204/ERP_QMIS` · `new-ui` → `https://github.com/karan4533/new-UI_irul.git` | `main` @ `f2b0aa7` tracking `new-ui/main` | New UI SoT |
| **Backend** | `C:\karan\irul\backend` | *not a nested git repo* — lives inside root | same as root | FastAPI |
| **school-erp-demo2** | `C:\karan\irul\school-erp-demo2` | nested empty/orphan `.git` | ignore for sync | Unrelated / incomplete |

**Critical boundary rule:** Treat `ERP_QMIS` as a separate repository. Do not merge it as a folder of root. Do not replace root `backend/` with the copy partner embedded inside `new-ui/main` without an explicit SoT decision.

---

## Where the partner’s latest Super Admin / Admin / Front Desk work lives

### Primary partner track (recommended review source)

**Remote branch:** `new-ui/main` on `karan4533/new-UI_irul`\
**Commits not in local HEAD (`f2b0aa7`):**

| Commit | Summary |
|---|---|
| `8428f14` | **Adopt QMIS backend into new-UI_irul** + wire FO/Admin live portals |
| `c302904` | Add `backend/.env.example` |

**Scale:** ~509 files, ~+67k / −3k lines vs local HEAD.

This is the clearest “partner completed Super Admin / Admin / Front Desk live wiring” delivery. It also **vendors a full FastAPI `backend/` tree inside the frontend repo**.

### Secondary partner track (diverged UI modernization)

**Remote branch:** `origin/main` on `irulappan151204/ERP_QMIS`\
**Relationship to local HEAD:** **diverged** — ~6 commits on origin not in HEAD; ~7 local commits not on origin.\
**Scale vs HEAD:** ~228 files, ~+18k / −4k (reports modernization, design tokens, module decoupling).

Do **not** treat this as the same linear tip as `new-ui/main`. Integrating both remotes requires two separate reviews.

### Root `ERP-dev` `origin/main`

Local `irul` is **5 commits ahead** of `origin/main`.\
`origin/main` has **0 commits** that local HEAD lacks.\
Partner SA/Admin/FO UI work is **not** arriving as new root-main commits relative to your current `irul` tip.

---

## Working-tree protection status (must preserve)

### Root (`irul`)

- Clean relative to `origin/irul` (0 ahead / 0 behind) **for commits**.
- **Dirty working tree:** modified backend services/tests + docs + Track Bus honesty files.
- **Untracked:** Phase reports, `0019_calendar_event_times.py`, driver/visitor tests, `ERP_QMIS/` (nested repo), etc.
- **Do not stash/discard.** Backup patches saved under `_sync_backups/...`.

### ERP_QMIS (`main`)

- Local HEAD = former `new-ui/main` tip `f2b0aa7`.
- After fetch, `new-ui/main` is **2 commits ahead** of local HEAD.
- **Large dirty tree:** Phase 1/2 LIVE wiring across Driver, Hostel, Transport, Librarian, shared Common, API clients (~184 dirty paths).
- **Untracked:** new API services, HostelUnsupportedPage, tests, roleRegistry, etc.

---

## Overlap: files you changed locally **and** partner changed on `new-ui/main`

**35 overlapping paths** (from backup `erp_overlap_dirty_vs_newui_main.txt`). Highest risk:

### Super Admin / Admin / Front Desk (partner core)

| Path | Why risky | Safest resolution |
|---|---|---|
| `src/Routes/SuperAdminRoutes.jsx` | Both changed routes | Manual 3-way: keep partner SA route map; re-apply your LIVE-only route fixes if any |
| `src/Pages/SuperAdmin/Approvals/*` | Partner live approvals vs your Approvals LIVE wire | Prefer partner FO/Admin/SA live slice; re-verify your `/api/v1/approvals` honesty labels |
| `src/Pages/SuperAdmin/ActivityLogs/*` | Partner rewrite vs your list work | Side-by-side diff; do not take whole-file from one side blindly |
| `src/Pages/SuperAdmin/GatePass/GatePassList.jsx` | Both touched | Partner SA + your honesty/LIVE notes — merge field-by-field |
| `src/Pages/Admin/RBAC/RolesPage.jsx` | Both touched (also dirty in root `src/`) | Prefer partner Admin RBAC live; keep your Roles honesty if still accurate |
| `src/Layout/PRMLayout.jsx` | Partner FO live banner vs yours | Prefer partner PRM live layout; keep IntegrationNotice honesty pattern |

### Shared API clients (contract risk)

| Path | Why risky | Safest resolution |
|---|---|---|
| `src/services/api/leaveApiService.js` | Shared by many verified roles | Merge exports; run leave pytest + Teacher/Coordinator smoke |
| `src/services/api/tcApiService.js` | Admin/FO/Student TC | Prefer partner FO/Admin TC wiring; re-test Student TC LIVE |
| `src/services/api/approvalsApiService.js` | Partner **adds**; you also have local untracked/modified | Start from partner file; port any unique helpers you added |
| `src/services/api/calendarApiService.js` | Same pattern | Partner base + your NUI calendar time fields if needed |
| `src/services/api/escalationApiService.js` | Same | Partner base; keep role configs for verified roles |
| `src/services/api/taskApiService.js` | Same | Partner base |

### Shared enterprise Common (mock vs live honesty)

Many `src/Common/*` workspaces overlap (FileRoom, Escalation, LostAndFound, Stores, Visitors, Ticketing, Activities, AcademicCalendar).\
**Rule:** Partner changes that improve SA/Admin/FO live paths win for those roles; **do not** erase your MOCK/BLOCKED honesty banners for unverified domains; **do not** invent LIVE for GPS/hostel matrix.

### Routes that protect your Phase 2 work

| Path | Note |
|---|---|
| `src/Routes/EnterpriseOperationsRoutes.jsx` | You skipped hostel matrix for `hostelwarden`; partner also touched this file — **must** re-apply hostelwarden exclusion after merge |
| Driver / Hostel / Transport / Librarian pages | Mostly **your** dirty files, **not** in partner 2-commit tip overlap set — still re-test after any shared Layout/Auth/API merge |

---

## Backend conflicts (root SoT vs partner-embedded backend)

Partner `new-ui/main` **copies an entire `backend/`** into the frontend repo and advances Alembic to **0025**.

Your root backend:

- Lives only under `C:\karan\irul\backend` (SoT for this workspace).
- Dirty: `ops_collections.py`, `front_office.py`, `calendar.*`, `permissions/matrix.py`, `deps.py`, concurrency tests.
- Untracked migration: **`0019_calendar_event_times`** (revises `0018_exam_academic_year`).

Partner embedded backend:

- Migration **`0019_admission_zip_widen`** (different 0019) → … → **0025_audit_logs_ip_ua**.

### Migration conflict — do not auto-resolve

| Risk | Detail |
|---|---|
| Duplicate revision IDs | Both claim `0019*` with different purposes |
| Divergent heads | Partner 0020–0025 may include FO/Admin needs; your calendar times migration is local-only |
| DB reset temptation | **Forbidden** by safety rules |

**Safest strategy:**

1. Keep **root `C:\karan\irul\backend`** as the only runtime backend for your machine and for other developers until SoT is decided.
2. Treat partner `ERP_QMIS/backend` (from `new-ui/main`) as a **reference tree**, not an automatic replace.
3. Diff partner backend vs root backend file-by-file for FO/Admin-critical paths (`front_office.py`, `admin_users.py`, `permissions/matrix.py`, FO tests).
4. Port needed partner backend changes into root via **reviewed patches**, renumbering migrations as a **new linear revision** after local 0019 (e.g. 0020+) — never overwrite 0019 blindly.
5. Do **not** run partner migrations against your live `qmis_erp_local.db` without approval and a DB file backup.

---

## Recommended merge strategy (per repository)

### A. ERP_QMIS (frontend) — preferred approach

1. **Do not merge into current dirty `main`.**
2. Create a **dedicated worktree** (or clone) at a new path, e.g. `C:\karan\irul\_integration\ERP_QMIS_partner_sync`.
3. In that worktree:
   - Start from current commit `f2b0aa7` **or** from a branch that already contains your committed work (once you approve committing Phase work).
   - Create branch `integration/partner-new-ui-main`.
   - `git merge new-ui/main` **there only** (or merge `--no-commit` and stop for review).
4. Resolve the 35 overlap files manually with the table above.
5. Re-run: `npm run build`, focused pytest against **root** backend, browser UAT for SA/Admin/FO **and** regression smoke for Phase 1/2 roles.
6. Only after your approval: bring the resolved tree back into your daily `ERP_QMIS` working copy.

**Alternative if dirty tree cannot be committed yet:**\
Export your working tree as patches (already in backup) → reset integration worktree to clean `f2b0aa7` → merge partner → re-apply your patches selectively (Driver/Hostel/Transport/Librarian first, then shared).

### B. Root ERP-dev (backend + docs)

1. **No merge from `origin/main` required** for partner SA/Admin/FO UI (nothing incoming).
2. Create branch `integration/backend-partner-port` from `irul`.
3. Port selected backend diffs from partner’s embedded tree as patches.
4. Resolve Alembic as a new sequential migration chain.
5. Keep uncommitted Phase reports/docs until you approve commit.

### C. What not to do

- Do not `git pull` / merge into dirty `ERP_QMIS/main` in place.
- Do not `git reset --hard` / `git clean`.
- Do not replace root backend with partner embedded backend wholesale.
- Do not force-push any remote.
- Do not accept “ours” or “theirs” for whole conflicted files without reading.

---

## Suggested integration order (after your approval)

1. Freeze / backup current dirty trees (done).
2. Decide SoT: **root backend remains SoT** (recommended) vs monorepo under new-UI (partner direction).
3. Frontend integration worktree: merge `new-ui/main` FE paths only (or full merge with backend ignored via sparse strategies if needed).
4. Manually resolve SA/Admin/FO + shared API overlaps.
5. Re-apply Phase 2 hostel/driver/transport guards.
6. Backend selective port + migration renumber.
7. Full regression: SA/Admin/FO + Phase 1 seven + Phase 2 Librarian/TM/Driver/Hostel.
8. Portability dry-run on a clean folder using `docs/QMIS_NEW_DEVELOPER_SETUP.md`.
9. Commit/push only with your explicit approval.

---

## Open questions for you before any apply step

1. Is **`new-ui/main`** the partner tip you mean by “GitHub main,” or also **`origin/main` on irulappan’s ERP_QMIS**?
2. Do you accept partner’s direction to make **new-UI_irul a monorepo with embedded backend**, or keep **separate root backend**?
3. Should Phase 1/2 dirty FE/BE work be **committed to a personal branch first** before integration, to make merges cleaner?
4. Should `origin/main` (irulappan modernization, 228 files) be a **second integration wave** after SA/Admin/FO live portals?
