# QMIS ERP — Team Roadmap (You + Partner)

**You:** Backend lead (foundation, auth, masters, admissions, academics, finance core, integrations)  
**Partner:** Frontend integration + **HR backend vertical** (and wiring HR UI to APIs)

> **Status snapshot — 9 October 2026:** Phase 0 foundation, Phase 1 rich Admissions, Partner HR vertical, and Finance snapshot + actions are on the UUID `main` stack.  
> Verified: **39 pytest** + **21/21 smoke** (`reports/testing-report.md`). Next focus: Academics / ops, parent children API, production keys, Postgres-backed browser pass.  
> Historical week plan below is kept for context; prefer `API_BACKLOG.md` + Archify for current topology.

---

## Where YOU start (this week)

Do these in order. Do not jump to HR — partner owns that vertical.

### Day 1–2 — Foundation lock

1. Confirm PostgreSQL: DB `qmis_erp`, user `postgres`, password `root`
2. Run `setup-local.bat` then `run-local.bat`
3. Seed **roles** table with all 25 frontend role IDs (`docs` + `models/role.py`)
4. Add **campus** master row (Madurai / default `campus_id=1`)
5. Extend `GET /api/v1/auth/me` to return `role`, `permissions[]`, `campus_id`

### Day 3–4 — Auth for real SPA

6. Design OTP challenge + verify endpoints (keep password login for local admin)
7. CORS already points at Vite `5173` — verify login from frontend later
8. Add JWT refresh / logout stub (optional but useful)
9. Start **system audit log** table + middleware on mutating routes

### Day 5–7 — Masters + admission spine

10. Classes / sections / subjects / academic year APIs
11. Admission enquiry CRUD
12. Admission save + enroll (student + guardian link) — agree product rules first
13. Hand partner a working `Authorization: Bearer` contract so HR APIs can reuse `get_current_user`

**Your definition of done for “start”:**  
Partner can call `/auth/login` + `/auth/me`, create employees under `/hr/*` with a valid token, and every row has `campus_id`.

---

## Where PARTNER starts (HR)

Partner works in parallel **after** you finish Day 1–2 (roles + auth/me available).

### HR frontend screens to cover

From frontend `/hr/*` (handoff inventory ~43 routes):

| Order | Module | Frontend paths (examples) | Backend target |
|---|---|---|---|
| 1 | Employees | `/hr/employee-management/employees` | CRUD + profile |
| 2 | Documents | `/hr/employee-management/documents` | metadata + file ids |
| 3 | Recruitment | job-openings, candidates, interviews | pipeline statuses |
| 4 | Onboarding | offers, appointment, joiners, checklist | tasks + status |
| 5 | Attendance | `/hr/attendance` | list/filter (punch later) |
| 6 | Leave policies | `/hr/leave-management` | balances + policies |
| 7 | Training | training, records, feedback | CRUD |
| 8 | Performance | review, BSC, comparison, increment | CRUD + scores |
| 9 | Payroll | salary-statement, payslip, CTC, advances, claims | calc + finalize |
| 10 | Disciplinary / Exit | `/hr/disciplinary`, `/hr/exit` | workflows |
| 11 | Reports / notifications | `/hr/reports`, notifications | aggregates later |

### Partner week-by-week (HR)

#### Week 1 — Employees + documents

- Create files:
  - `app/models/hr_employee.py`
  - `app/schemas/hr.py`
  - `app/services/hr_employee_service.py`
  - `app/api/v1/endpoints/hr.py`
- APIs:
  - `GET/POST /api/v1/hr/employees`
  - `GET/PATCH /api/v1/hr/employees/{id}`
  - `GET/POST /api/v1/hr/employees/{id}/documents`
- Match fields from frontend `employeeData` / handoff page profiles
- Always set `campus_id` from token
- **Do not** invent final “HR-only user provisioning” until you finish auth users table link — for now link `user_id` nullable

#### Week 2 — Recruitment + onboarding

- Jobs, candidates, interviews, offers, onboarding checklist
- Status enums must match UI badges (`Pending`, `Approved`, etc.)
- Wire frontend HR pages to these APIs (service layer in React)

#### Week 3 — Leave policies + attendance + training

- Leave policy CRUD
- Attendance list (manual/demo punches OK; eSSL comes from you later)
- Training modules

#### Week 4 — Payroll + exit

- Payroll components config
- Run calculation (port logic from `payrollCalculations.js` carefully — server is source of truth)
- Payslip payload for print
- Exit + disciplinary workflows
- Finalize / lock statuses (no client edit after `FINALIZED`)

### Partner rules

1. Reuse `get_current_user` / `DbSession` from `app/api/deps.py`
2. Register router in `app/api/v1/router.py` under prefix `/hr`
3. No SQLite — PostgreSQL only
4. No business deletes of payroll/attendance — use status / adjustment entries
5. Ask you before changing User/Auth/Campus tables
6. Frontend: add `src/services/hrApi.js` (or similar) — don’t scatter `fetch` in every page

---

## Parallel swimlanes

```text
YOU                              PARTNER
─────────────────────────────────────────────────────────
Roles + campus + auth/me         Wait / read HR UI fields
OTP + audit log + masters        Employees + documents APIs
Enquiry → admission → enroll     Recruitment + onboarding
Attendance / lesson / leave core Wire HR screens to APIs
Fee structure skeleton           Payroll + exit
Integrations (eSSL, Paytm…)      Frontend polish for HR
```

---

## Handoff points (must sync)

| When | You deliver | Partner can then |
|---|---|---|
| After Day 2 | Login + me + role list | Start HR employee APIs with auth |
| After masters | Class/dept lists | Attach employee department/class refs |
| After user provisioning rules | Staff user create API | Link employee → login account |
| After file service | Upload URL | HR document vault real files |
| After biometric | Punch feed | HR attendance from punches |

---

## Product decisions to confirm together (blockers)

1. Keep separate **Parent** login (frontend) or follow architecture (parent via student)?
2. Staff accounts: **HR-only** create (architecture) vs Admin RBAC (frontend demo)?
3. Add **MD** role now or later?
4. Finance Assistant maker role — now or later?

Until decided: implement frontend-compatible roles (25) and keep MD as future seed.

---

## Quick commands

```bat
cd backend
setup-local.bat
run-local.bat
```

Swagger: http://127.0.0.1:8000/docs  
Health: http://127.0.0.1:8000/api/v1/health  
Seed admin: `admin@qmis.edu` / `admin123`
