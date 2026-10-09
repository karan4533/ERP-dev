# Testing report

Project: Queen Mira International School ERP  
Last run: 9 October 2026, after Admissions port  
Result: **32 passed, 0 failed** (about 13 seconds)  
Kind of test: API tests (HR modules + Phase 0 + rich Admissions). The browser was not clicked through in this run.

Command, from the `backend` folder:

```
python -m pytest tests/test_admissions.py tests/test_hr_modules.py tests/test_hr.py tests/test_phase0.py -v
```

Test code lives in:

- `backend/tests/test_admissions.py` — enquiry → convert → enroll with parent login; direct admission create
- `backend/tests/test_hr_modules.py` — one test per HR module, plus closeout checks
- `backend/tests/test_hr.py` — employee round trip, and routes that reject a missing login
- `backend/tests/test_phase0.py` — health, login, OTP, masters, legacy admission enroll shortcut

## Module results

| Module | Test | Result | What was checked |
|---|---|---|---|
| Admissions enquiry → enroll | `test_rich_enquiry_admission_enroll_with_parent` | Passed | Create enquiry, convert, patch admission, enroll with parent user, reject double enroll |
| Admissions create | `test_create_admission_direct` | Passed | Direct admission create and list |
| Staff user creation | `test_module_staff_user_creation` | Passed | HR creates the person, temporary password, must-change password |
| Password change | `test_staff_must_change_password_then_clears` | Passed | Temporary password forces change; then clears |
| File upload | `test_file_upload_stub` | Passed | File bytes stored and downloaded through `/api/v1/files` |
| Announcements | `test_module_announcements_collection` | Passed | HR announcements save on the collection |
| Documents | `test_module_documents` | Passed | An ID proof is stored as Verified |
| Recruitment and interview | `test_module_recruitment_and_interview` | Passed | Job, candidate, interview, Selected decision |
| Offer and onboarding | `test_module_offer_and_onboarding` | Passed | Accepted offer and onboarding checklist item |
| Observation and shadow mentor | `test_module_observation_and_shadow` | Passed | Observation decision and mentor assignment |
| Attendance and leave | `test_module_leave_updates_attendance` | Passed | Approved casual leave writes attendance as Leave |
| Permission | `test_permission_request_marks_attendance` | Passed | Permission request writes attendance as Permission |
| Leave balance | `test_leave_balance_by_type` | Passed | 12 entitlement minus 2 approved leaves 10 |
| Training | `test_module_training` | Passed | Session, attendance, and feedback |
| Performance and BSC | `test_module_performance_and_increment` | Passed | Review with BSC; applied increment locked |
| Increment | `test_applied_increment_updates_salary` | Passed | Applied revision updates designation and gross |
| Payroll | `test_module_payroll_lock` | Passed | Paid month stays at original net |
| Salary advance | `test_module_salary_advance` | Passed | Approved advance keeps outstanding balance |
| Disciplinary action | `test_module_disciplinary_is_permanent` | Passed | Editing an approved record is rejected |
| Staff-child concession | `test_module_child_concession` | Passed | Concession percent stored against employee |
| Exit | `test_module_exit_deactivates_login` | Passed | Completed exit makes old password fail |
| Incentives | `test_module_claims_and_incentives` | Passed | Extra-work claim and incentive row stored |
| Who can see a profile | `test_employee_sees_only_own_profile` | Passed | Teacher login sees only own profile |
| Locked profile | `test_saved_staff_profile_cannot_be_rewritten` | Passed | Name and salary fixed; department can transfer |
| HR data round trip | `test_hr_vertical_round_trip` | Passed | Employees and HR collections save and load |
| Login required | `test_hr_routes_require_a_token` | Passed | HR routes reject a request with no token |
| Health, login, OTP, masters, legacy enroll | Phase 0 tests | Passed | Shared login, masters, legacy enquiry enroll shortcut |

## Not covered by this run

- Clicking through each Admin / Front Office admissions screen in the browser
- RFID punch import
- Sending passwords by real email
- Finance payment voucher / fee concession apply
- Academics emergency period reassignment
