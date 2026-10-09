# Daily work report

Project: Queen Mira International School ERP  
Area: HR department  
Prepared for: Manager update  

New days go at the top. Older days stay below so the history is in one file.

---

## 9 October 2026

**Evening — HR closeout.** HR is finished for Phase 2 handoff on this stack. The HR API client now uses the shared auth token and `VITE_API_BASE_URL`. File upload stub (`POST /api/v1/files`) is live and wired into HR documents. New staff must change the temporary password through `POST /api/v1/auth/change-password` and the `/change-password` screen. HR announcements sync through `/api/v1/hr/announcements`. Backlog and frontend integration docs match reality. **30 API tests passed.** Deferred outside HR: RFID, production SMTP, Finance voucher, Academics substitution.

**Afternoon.** Partner commits on `origin/main` were reviewed. The admission screens, API login with demo fallback, and integration notes were brought in. The last partner commit, a GitHub workflow that sends scanned secrets to an external server, was not brought in. `feature/phase1-admissions` was not merged because it uses integer ids and a different backend layout. Local admission lookup stays synchronous so student, allocation, and document screens keep working while the admissions API flag is off.

**Status:** HR vertical closed for handoff. Module tests passed.

### Done today

- Staff are created only by HR. Saving the profile creates the login, issues a temporary password, and forces a password change on first login. The role comes from the fixed role list.
- After a profile is saved, name and salary cannot be rewritten. A later change is a department or role transfer, and the previous assignment stays in history. Salary and designation change only when an increment is marked Applied.
- Visibility follows the document: HR and MD see all staff, a department head sees their department, and any other staff login sees only their own profile.
- Approved leave writes attendance as Leave. A permission request writes attendance as Permission. Leave balance is the yearly entitlement minus approved days.
- A paid payroll month, an applied increment, and an approved disciplinary record stay locked. A completed exit deactivates the login and keeps the history.
- Claims and incentives are stored (extra work time, admission referral, staff joining referral).
- The Employees list screen was broken by a missing closing brace on the employment-type field. That is fixed, and the page compiles again. Adding a person shows the full form. An existing person opens Transfer, which changes only department, role, and reporting head.

### Test result

27 automated tests passed in about 10 seconds. Detail is in `reports/testing-report.md`.

### Still open

These items in the HR document depend on other systems and are not part of this HR build:

- RFID device punches
- A real email server (the temporary password is returned for local testing)
- Finance paying payroll and applying the staff-child concession on the fee
- Academics reassigning periods when a teacher takes emergency leave
- Click-through of every HR screen in the browser

### How to see it

- HR screens: `http://localhost:5173/` then open HR
- API tests: from the `backend` folder, run `python -m pytest tests/test_hr_modules.py tests/test_hr.py tests/test_phase0.py -v`
