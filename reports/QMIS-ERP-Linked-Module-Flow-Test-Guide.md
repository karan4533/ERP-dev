# QMIS ERP — Linked Module Flow Test Guide (all major roles)

Regenerate PDF: `python3 reports/_build_linked_module_flow_pdf.py`

Updated: **18 October 2026**  
Purpose: **How modules connect across roles** — what you do → what is created → next click.  
Stack: Postgres **18 @ 5433** · API `:8000` · App `:5173`

---

## Seed logins

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@qmis.edu | admin123 |
| Super Admin | (campus seed if present) | — |
| HR | hr@qmis.edu | hr12345 |
| PRM | prm@qmis.edu | prm12345 |
| Account Head | accounthead@qmis.edu | accounts123 |
| Principal | principal@qmis.edu | principal123 |
| Director | director@qmis.edu | director123 |
| Coordinator | coordinator@qmis.edu | coord123 |
| Teacher | teacher@qmis.edu | teacher123 |
| Parent | created at Enroll | set at Enroll |
| New staff after Offer Accept | candidate email | **temp password** shown to HR + queued email demo |

**Pass rule:** save → hard refresh (F5) → next role must see the effect.

**Passwords / email:** Campus demo queues mail locally (`QUEUED_LOCAL`) — not live SMTP unless configured. HR always sees the **one-time temporary password** in the toast / profile modal. Employee must **change password on first login**.

---

## Master story map

```text
ADMIN masters + user logins
        │
        ├─► HR hire chain ──► Principal allocation ──► Teacher teaches
        │
        └─► PRM admit student + Parent login
                    │
                    ├─► Account Head fees / Parent pays
                    ├─► Teacher attendance & marks → Parent sees
                    └─► Ops (Gate, Library, Transport…) + Audit
```

---

## FLOW A — Hire staff (HR → login password → Principal → Teacher)

### Status meaning (Offer Letters)

| Status | Meaning | Actions |
|--------|---------|---------|
| Draft | Preparing | Edit |
| Issued | Shared with candidate | Preview / Print · **Update status** |
| Accepted | Hire confirmed | Employee + login + Joiners created |
| Rejected / Expired | Closed | Stop |

### Steps

| Step | Who | Screen | Do | Creates | Next |
|------|-----|--------|----|---------|------|
| A1 | HR | Job Openings | Add job (position, department, closing date, hiring manager) | `JOB-…` | Candidates |
| A2 | HR | Candidates | Add candidate on that job; email + expected salary | `CAN-…` | Offer |
| A3 | HR | Offer Letters | Add Offer → select candidate (auto-fill) → joining → **Issued** → Preview/Print | `OFR-…` | Share letter |
| A4 | HR | Offer Letters | **Update status → Accepted** | Employee + **temp password** + email queue + Joiners | Toast shows password |
| A5 | New staff | Login page | Login with email + temp password → forced **Change password** | Active login | Teaching / ops |
| A6 | HR | Joiners → Appointment | Complete checklist; appointment letter if used | Onboarding | Principal |
| A7 | HR | Employees → View Profile | Optional: **Reset / send login password** anytime | New temp password + email queue | Share again |
| A8 | Principal | Teacher Allocation + Class Timetable | Assign class/subject + periods | Academics | Teacher work |
| A9 | Teacher | Attendance / LP / Marks | Daily teaching | Data for Parent | Flow B parents |

**If password unknown for an existing employee:** HR → Employees List → View Profile → **Reset / send login password**.

---

## FLOW B — Admit student + Parent + fees + results

| Step | Who | Screen | Do | Creates | Next |
|------|-----|--------|----|---------|------|
| B1 | Admin | Class Details | Ensure class/section | Masters | Enroll target |
| B2 | PRM | Admission Enquiry | Add enquiry | Enquiry | Convert |
| B3 | PRM | Admission / Enroll | Convert → Enroll + **parent email/password** | Student + Parent login | Write credentials down |
| B4 | Account Head | Settings → Bootstrap fee ledger (once) | Fee structures | Collection |
| B5 | Account Head | Fee Collection | Collect installment | Receipt | Parent fees |
| B6 | Parent | Fees / Payment | Login → see dues/paid | — | Trust loop |
| B7 | Teacher | Class Attendance / Marks | Mark child | Attendance / results | Parent views |
| B8 | Parent | Attendance / Results / Timetable | Confirm reflection | — | Done |

---

## FLOW C — Administrator / Super Admin

| Step | Screen | Do | Reflects to |
|------|--------|-----|-------------|
| C1 | User Creation | Create missing staff logins | HR can link employees |
| C2 | Class Details / Masters | Open year structure | PRM enroll, Principal TT |
| C3 | Documents / Announcements | Smoke send | All role inboxes |
| C4 | Super Admin RBAC (if used) | Open smoke only | Governance |

---

## FLOW D — Director / Coordinator academics control

| Step | Who | Screen | Do | Next |
|------|-----|--------|----|------|
| D1 | Teacher | Lesson Plan / Marks submit | Submit for approval | Coordinator/Director |
| D2 | Coordinator | LP Approval / Period Chart / Attendance | Approve / monitor | Teacher unblocked |
| D3 | Director | Approvals inbox | Decide pending | Teachers / exams |

---

## FLOW E — Leave, tasks, escalations (any staff role)

| Step | Who | Do | Who decides |
|------|-----|-----|-------------|
| E1 | Teacher (or any staff) | File Leave | Coordinator / Principal Received Leave |
| E2 | Manager | Assign Task | Assignee My Tasks |
| E3 | Any | Raise Escalation | Receiver moves status |
| E4 | Any | Communication / Announcements | Peer inboxes |

---

## FLOW F — Front Office + Gate

| Step | Who | Screen | Do | Reflects |
|------|-----|--------|----|----------|
| F1 | PRM | Student / Hostel / Material Gate Pass | Create pass | Gate Keeper list |
| F2 | Gate Keeper | Visitors / Registers | Add visitor | Ops store |
| F3 | Gate Keeper Manager | Assign Duty | Assign | Gate team |

---

## FLOW G — Library / Stores / Transport / Canteen / IT / HK

| Area | Who | Do | Reflects |
|------|-----|-----|----------|
| Library | Librarian | Issue book to enrolled student | Parent/Student borrowed |
| Stationery / HK / IT / Canteen | Respective manager | Inventory / ticket / menu smoke save | Ops collections |
| Transport | Transport Manager | Drivers, vehicles, routes; **Route Data → Track** | Parent Track Bus |
| Driver | Driver | My Duty smoke | TM views |

---

## FLOW H — Audit (JD → Process / Quality)

| Step | Who | Screen | Do | Next |
|------|-----|--------|----|------|
| H1 | JD Audit | Templates + Planning | Publish template, assign | Auditor My Audits |
| H2 | Process / Quality Auditor | Execute + Observations | Raise observation | RCA/ATR if needed |
| H3 | JD / JDA | Monitoring / Approvals | Smoke approve | Departments |

---

## FLOW I — Exit / TC exceptions

| Topic | Path |
|-------|------|
| Staff exit | HR Exit Formalities → clearance flags → Employee Profile exit interview |
| Student TC | Parent TC request → PRM forward → Admin decide |
| Transfer / Re-enrollment | PRM FO screens |

---

## Quick “I am stuck” index

| You are here | Next click |
|--------------|------------|
| Offer Issued, no Edit | **Update status → Accepted** |
| Offer Accepted, no password | Toast at accept time, or Employee Profile → **Reset / send login password** |
| New staff cannot login | Use temp password; complete Change Password screen |
| Candidate missing in Offer | Recruitment → Candidates first |
| Parent cannot login | Re-check Enroll credentials |
| Fees empty | Account Head Bootstrap ledger |
| Teacher not on timetable | Principal Allocation + Timetable |
| Preview blank | Allow pop-ups |

---

## Role → primary flows

| Role | Flows |
|------|-------|
| Administrator / Super Admin | C, B support, I |
| HR | A, E, I (staff exit) |
| PRM | B, F, I (TC/transfer) |
| Account Head | B fees |
| Principal | A8, D, E |
| Director / Coordinator | D, E |
| Teacher | A9, D1, E, B7 |
| Parent / Student | B6–B8, G transport/library |
| Gate / Librarian / Stores / Transport / Driver | F, G |
| JD / Process / Quality | H |

---

## Related docs

- Card journey guide: `reports/QMIS-ERP-Full-Panel-Test-Guide.pdf`  
- Status 480 sheet: `reports/QMIS-ERP-Role-Module-Status.480-complete.17oct.docx`
