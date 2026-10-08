# QMIS ERP — Priority API Backlog

Mapped from:

- `School_ERP_Frontend_Handoff (1).pdf` (frontend reality)
- Architecture roadmap (business rules)
- Current code under `ERP-dev/backend/app`

**Status key:** `DONE` · `NEXT` · `PLANNED` · `LATER`

---

## Folder map (where code goes)

| Area | Models | Schemas | Services | Endpoints |
|---|---|---|---|---|
| Auth / me | `models/user.py` | `schemas/auth.py` | `services/auth_service.py` | `api/v1/endpoints/auth.py` |
| Roles / RBAC | `models/role.py` | `schemas/rbac.py` | `services/rbac_service.py` | `api/v1/endpoints/rbac.py` |
| Campus / masters | `models/campus.py` | `schemas/masters.py` | `services/masters_service.py` | `api/v1/endpoints/masters.py` |
| Admissions | `models/admission.py` | `schemas/admission.py` | `services/admission_service.py` | `api/v1/endpoints/admissions.py` |
| Students / UIS | `models/student.py` | `schemas/student.py` | `services/student_service.py` | `api/v1/endpoints/students.py` |
| HR | `models/hr_*.py` | `schemas/hr.py` | `services/hr_*.py` | `api/v1/endpoints/hr.py` |
| Finance | `models/finance_*.py` | `schemas/finance.py` | `services/finance_*.py` | `api/v1/endpoints/finance.py` |
| Academics | `models/academic_*.py` | `schemas/academic.py` | `services/academic_*.py` | `api/v1/endpoints/academic.py` |
| Ops / transport | `models/ops_*.py` | `schemas/ops.py` | `services/ops_*.py` | `api/v1/endpoints/ops.py` |
| Audit | `models/audit_*.py` | `schemas/audit.py` | `services/audit_*.py` | `api/v1/endpoints/audit.py` |

Register every new router in `app/api/v1/router.py`.

---

## Phase 0 — Foundation (start here)

| ID | API / task | Frontend need | Status | Owner |
|---|---|---|---|---|
| P0-1 | PostgreSQL + `campus_id` on all tables | Multi-campus ready | DONE | You |
| P0-2 | `POST /api/v1/auth/login` (password/OTP later) | Replace fake OTP | DONE | You |
| P0-3 | `GET /api/v1/auth/me` (+ permissions) | Session / profile | DONE | You |
| P0-4 | `POST /api/v1/auth/otp/challenge` + `verify` | Sign-in flow | DONE | You |
| P0-5 | Roles seed (25 frontend roles + MD later) | Select profile / RBAC | DONE | You |
| P0-6 | Permission matrix CRUD | Admin RBAC screens | DONE | You |
| P0-7 | Immutable system audit log middleware | Architecture Rule 5 | DONE | You |
| P0-8 | File upload stub `POST /api/v1/files` | Documents / attachments | DONE | You |
| P0-9 | Masters: classes, sections, subjects, academic year | Admin / Teacher forms | DONE | You |

---

## Phase 1 — Identity journey (after Phase 0)

| ID | API | Frontend screens | Status | Owner |
|---|---|---|---|---|
| P1-1 | Enquiry CRUD | PRM / Admin admission enquiry | DONE | You |
| P1-2 | Admission CRUD + convert | Add admission | DONE | You |
| P1-3 | Enroll → student + guardian link | Enroll action | DONE | You |
| P1-4 | `GET /api/v1/parents/me/children` | Parent select-child | DONE | You |
| P1-5 | Student list & detail | Shared student database | DONE | You |

> Product note: Architecture wants student create only after fee confirm, and parent via student profile. Confirm with school before locking P1-3/P1-4.

---

## Phase 2 — Parallel tracks

### You (core + academics + finance shell)

| ID | Area | Key APIs |
|---|---|---|
| Y-1 | Attendance | `GET/POST /attendance` |
| Y-2 | Lesson plans | submit / decide |
| Y-3 | Marks / exams | entry + approval |
| Y-4 | Leave engine | request + decision + balances |
| Y-5 | Tasks / escalations | shared workflows |
| Y-6 | Fee structures + collection skeleton | Account Head |

### Partner (HR — full vertical)


| ID | Area | Key APIs |
|---|---|---|
| H-1 | Employees CRUD | `/api/v1/hr/employees` |
| H-2 | Documents vault | `/api/v1/hr/documents` |
| H-3 | Recruitment | jobs, candidates, interviews |
| H-4 | Onboarding / offers | offers, checklist |
| H-5 | Attendance / leave policies | HR attendance views |
| H-6 | Payroll run + payslip | calculate / finalize / PDF data |
| H-7 | Performance / training / exit | remaining HR screens |

---

## Phase 3+ — Later

Ops (stores, IT, transport, gate), Audit automation, MD cockpit, Paytm, WhatsApp, eSSL, GPS.

---

## Acceptance checks (every module)

- [ ] Deep link + refresh works with real token  
- [ ] Cross-role URL rejected by API (not only frontend redirect)  
- [ ] Forbidden IDs return 403/404  
- [ ] Parent cannot access unrelated child  
- [ ] No business source-of-truth left in browser storage  
- [ ] Every write has `campus_id` + audit log row  
