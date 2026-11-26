# QMIS — Partner Code Synchronization Report

**Date:** 2026-11-24\
**Task type:** Audit + preparation only\
**Actions performed:** Repository discovery · status capture · remote **fetch** · comparison · safe patch/status backup · documentation\
**Actions NOT performed:** merge · pull-into-working-tree · cherry-pick · rebase · stash · reset · clean · commit · push · deploy · DB modify · application code edits

**Related docs:**

- [`QMIS_PARTNER_BRANCH_INTEGRATION_PLAN.md`](./QMIS_PARTNER_BRANCH_INTEGRATION_PLAN.md)
- [`QMIS_NEW_DEVELOPER_SETUP.md`](./QMIS_NEW_DEVELOPER_SETUP.md)

---

## 1. Repository and branch information

### Repository map

| Unit | Path | Nested `.git`? | Primary remotes |
|---|---|---|---|
| Root | `C:\karan\irul` | Yes | `origin` = `karan4533/ERP-dev` |
| Frontend | `C:\karan\irul\ERP_QMIS` | **Yes (separate repo)** | `origin` = `irulappan151204/ERP_QMIS` · `new-ui` = `karan4533/new-UI_irul` |
| Backend | `C:\karan\irul\backend` | No — part of root | via root |
| school-erp-demo2 | `C:\karan\irul\school-erp-demo2` | Yes (empty/orphan) | Not used for sync |

### Current HEADs (at audit time)

| Repo | Branch | HEAD | Tracking |
|---|---|---|---|
| Root | `irul` | `267a580` | `origin/irul` (0 ahead / 0 behind) |
| Root local `master` | `master` | `2931beb` | (local only tip equals old `origin/main`) |
| ERP_QMIS | `main` | `f2b0aa7` | configured to track `new-ui/main` |

### Partner tips after fetch

| Remote ref | Commit | Meaning |
|---|---|---|
| `new-ui/main` | `c302904` | **2 commits ahead** of local ERP_QMIS HEAD — backend adoption + FO/Admin live portals + `.env.example` |
| `origin/main` (irulappan ERP_QMIS) | `ef52ca8` | **Diverged** from local (6 remote-only / 7 local-only commits) — UI modernization wave |
| `origin/main` (ERP-dev root) | `2931beb` | Local `irul` is **5 commits ahead**; **no incoming** commits |

**Verdict:** Partner Super Admin / Admin / Front Desk live work is primarily on **`new-ui/main`**, not on root `ERP-dev` main. A second, divergent FE tip exists on **irulappan `origin/main`**.

---

## 2. Current working-tree status

### Root (`irul`) — summary

- Modified backend: calendar, deps, permissions matrix, front_office, ops_collections, several tests.
- Modified docs/reports + Track Bus honesty files under legacy `src/`.
- Untracked: Phase 1/2 verification reports, calendar migration `0019_calendar_event_times.py`, driver/visitor tests, nested `ERP_QMIS/`, backup DB file, shell logs.
- Local commits already on `origin/irul` (no unpushed commits vs that tracking branch).
- Local `irul` has **5 commits not on `origin/main`** (NullPool, TM/hostel tests, admissions/finance test fixes, frontend sync).

### ERP_QMIS (`main`) — summary

- ~184 dirty paths: Phase 1/2 LIVE wiring (Driver, Hostel Warden, Transport, Librarian, shared Common, API clients, layouts, routes).
- Untracked helpers/tests (approvals/calendar/escalation/task/gate APIs, HostelUnsupportedPage, roleRegistry, etc.).
- No local commits ahead of former `new-ui/main` tip; after fetch, remote advanced by 2 commits.

**Safety:** Uncommitted and untracked work was **not** stashed or discarded.

---

## 3. Backup status

**Location:** `C:\karan\irul\_sync_backups\2026-11-24_partner_sync_prep`

Contents:

- `status/*` — branch, remotes, HEAD, status, untracked lists, overlap list
- `patches/root_working_tree.diff`
- `patches/erp_qmis_working_tree.diff` (~1.2 MB)
- `README.txt` — exclusions note

**Excluded from backup:** `.env`, `.env.local`, `node_modules`, `dist`, live DB files, venvs, secrets.

This is a **status + patch** backup, not a full tree clone.

---

## 4. Partner changes discovered

### A. `new-ui/main` (primary)

Commits:

1. `8428f14` — Copy FastAPI backend into frontend repo as long-term SoT; ship Front Office / Admin live API integrations.
2. `c302904` — `backend/.env.example`.

Notable FE areas touched: Admin dashboard/class/docs/attendance/RBAC/reports, Front Office dashboard/parents/transfers/reports, Super Admin dashboard/approvals/activity logs/gate pass, many `src/services/api/*` clients, `AdminRoutes` / `FrontOfficeRoutes` / `SuperAdminRoutes`, `PRMLayout`.

Notable BE area: **entire `backend/` tree** added under ERP_QMIS (Alembic through **0025**).

### B. `origin/main` on irulappan ERP_QMIS (secondary)

Divergent modernization (~228 files): reports, design tokens, accessibility, Linux case-sensitivity Auth imports, etc. Overlaps some Admin/FO/SA surfaces but is **not** the same tip as `new-ui/main`.

### C. Root `ERP-dev` `origin/main`

No partner tip beyond what you already branched from; your `irul` work is ahead.

---

## 5. Files that overlap (both developers)

**35 paths** dirty locally in ERP_QMIS that also change on `new-ui/main` (see backup `erp_overlap_dirty_vs_newui_main.txt`).

Highest severity groups:

1. **Super Admin routes + Approvals + Activity Logs + GatePass**
2. **Admin RBAC RolesPage**
3. **PRMLayout**
4. **Shared API clients** (`leave`, `tc`, `approvals`, `calendar`, `escalation`, `task`)
5. **EnterpriseOperationsRoutes** (your Hostel Warden MOCK/BLOCKED guard lives here)
6. **Shared Common workspaces** (FileRoom, Escalation, LostAndFound, Stores, Visitors, Ticketing, Activities, AcademicCalendar)

Your Phase 2 Driver/Hostel/Transport/Librarian page files are largely **outside** that 35-file overlap set, but they depend on shared Auth/API/route infrastructure that **is** overlapping.

---

## 6. Conflict analysis (summary)

| Conflict class | Severity | Notes |
|---|---|---|
| Dirty FE tree vs partner `new-ui/main` merge | **High** | In-place merge would fight 184 dirty files |
| Dual FE remotes (`new-ui` vs irulappan `origin`) | **High** | Two different “main” stories |
| Embedded partner backend vs root backend SoT | **Critical** | Monorepo direction vs current split layout |
| Alembic `0019` collision | **Critical** | Local `0019_calendar_event_times` vs partner `0019_admission_zip_widen` (+0020–0025) |
| Shared API service contracts | **High** | leave/tc/approvals/calendar used by verified roles |
| `EnterpriseOperationsRoutes` hostel guard | **Medium** | Must re-apply after merge |
| Root dirty `front_office.py` / `ops_collections.py` / `matrix.py` vs partner backend copies | **High** | Selective port required |
| Secrets / local DB | **Managed** | `.env*` present locally; not to be committed; DB not modified |

Detailed resolution guidance: **Integration Plan** doc.

---

## 7. Recommended integration strategy

1. **Keep repository boundaries** unless you explicitly approve monorepo SoT.
2. **Do not merge into the dirty working trees.** Use a separate **integration worktree/clone**.
3. Treat **`new-ui/main`** as the first partner integration source for SA/Admin/FO.
4. Keep **`C:\karan\irul\backend`** as runtime backend SoT; use partner embedded backend as **reference** and port selectively.
5. Resolve Alembic by **new sequential revisions**, never by overwriting local `0019`.
6. Schedule **irulappan `origin/main` modernization** as a second wave after FO/Admin live portals land.
7. After FE merge in the worktree: rebuild, focused pytest, browser UAT for partner roles **and** Phase 1/2 regression.
8. **Stop for your approval** before any apply/commit/push (this report is that stop).

---

## 8. Portability audit findings

### Frontend can run on another laptop if

- Node + npm installed
- `npm ci` from lockfile succeeds
- `.env.local` sets `VITE_API_BASE_URL` + `VITE_USE_MOCK=false`
- CORS on backend includes the actual Vite origin/port

### Backend can run on another laptop if

- Python 3.11+ venv + `requirements.txt`
- `.env` from `backend/.env.example`
- DB reachable; `alembic upgrade head` on a **consistent** migration graph
- `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`

### Issues to fix during integration (not applied now)

| Issue | Impact |
|---|---|
| CORS example lists only `:5173` | Breaks when Vite binds `:5174`/`:5175` |
| Two backends (root vs partner-embedded) | New developers may start the wrong API |
| Alembic fork at 0019 | Fresh migrate can fail or diverge |
| Nested `ERP_QMIS` invisible to root git | Easy to “clone one repo” and miss FE history |
| `.env` / seed passwords in examples | OK for local demo only; must stay out of commits/docs republishing |
| Default Postgres password in examples | Config validator warns; fine for local demo only |

Clean-machine steps: **`docs/QMIS_NEW_DEVELOPER_SETUP.md`**.

---

## 9. Risks and unresolved questions

1. **Which GitHub “main” is authoritative for partner FE?** `new-ui/main` vs irulappan `origin/main`.
2. **Backend SoT:** remain root `ERP-dev/backend`, or adopt partner monorepo under new-UI?
3. **Should Phase 1/2 dirty work be committed to a private branch first** to make integration merges safer?
4. **How to reconcile calendar `0019` with partner `0019–0025`** without DB reset?
5. **Whether partner FO/Admin live portals assume backend APIs that differ** from your dirty local `front_office.py` / `ops_collections.py`.
6. **school-erp-demo2** nested empty git — confirm ignore/delete later (out of scope).

---

## 10. Stop condition / next step

This audit is complete.

**Waiting for your explicit approval before:**

- Creating an integration worktree
- Merging or cherry-picking partner commits
- Porting backend files
- Committing, pushing, or deploying anything

No application source was modified for this audit. No merge was applied.
