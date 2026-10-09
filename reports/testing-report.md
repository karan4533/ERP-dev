# HR testing report

Project: Queen Mira International School ERP  
Last run: 9 October 2026, after HR closeout  
Result: **30 passed, 0 failed** (about 13 seconds)  
Kind of test: API tests. Each HR module is called the way the screen calls it, using the HR login. The browser was not clicked through in this run.

Command, from the `backend` folder:

```
python -m pytest tests/test_hr_modules.py tests/test_hr.py tests/test_phase0.py -v
```

Test code lives in:

- `backend/tests/test_hr_modules.py` — one test per HR module, plus closeout checks
- `backend/tests/test_hr.py` — employee round trip, and routes that reject a missing login
- `backend/tests/test_phase0.py` — health, login, OTP, class and subject masters, HR-only employee create, admission journey

## Module results

| Module | Test | Result | What was checked |
|---|---|---|---|
| Staff user creation | `test_module_staff_user_creation` | Passed | HR creates the person, the temporary password logs in, first login must change the password, and the assignment is stored |
| Password change | `test_staff_must_change_password_then_clears` | Passed | Temporary password forces change; after change, login no longer requires it |
| File upload | `test_file_upload_stub` | Passed | File bytes are stored and downloaded through `/api/v1/files` |
| Announcements | `test_module_announcements_collection` | Passed | HR announcements save on the announcements collection |
| Documents | `test_module_documents` | Passed | An ID proof is stored as Verified |
| Recruitment and interview | `test_module_recruitment_and_interview` | Passed | Job, candidate, scheduled interview, then a Selected decision |
| Offer and onboarding | `test_module_offer_and_onboarding` | Passed | Accepted offer and an onboarding checklist item |
| Observation and shadow mentor | `test_module_observation_and_shadow` | Passed | Observation decision and a mentor assignment |
| Attendance and leave | `test_module_leave_updates_attendance` | Passed | Approved casual leave writes attendance as Leave |
| Permission | `test_permission_request_marks_attendance` | Passed | A permission request writes attendance as Permission |
| Leave balance | `test_leave_balance_by_type` | Passed | 12 days entitlement minus 2 approved days leaves 10 |
| Training | `test_module_training` | Passed | Session, attendance, and participant feedback |
| Performance and BSC | `test_module_performance_and_increment` | Passed | Review with a BSC score. An applied increment cannot be rewritten |
| Increment | `test_applied_increment_updates_salary` | Passed | An applied revision updates designation and gross salary |
| Payroll | `test_module_payroll_lock` | Passed | A paid month stays at the original net salary |
| Salary advance | `test_module_salary_advance` | Passed | An approved advance keeps the outstanding balance |
| Disciplinary action | `test_module_disciplinary_is_permanent` | Passed | Editing an approved record is rejected |
| Staff-child concession | `test_module_child_concession` | Passed | The concession percent is stored against the employee |
| Exit | `test_module_exit_deactivates_login` | Passed | A completed exit makes the old password fail |
| Incentives | `test_module_claims_and_incentives` | Passed | An extra-work claim and an incentive row are stored |
| Who can see a profile | `test_employee_sees_only_own_profile` | Passed | A teacher login sees only their own profile |
| Locked profile | `test_saved_staff_profile_cannot_be_rewritten` | Passed | Name and salary stay fixed. Department and role can transfer |
| HR data round trip | `test_hr_vertical_round_trip` | Passed | Employees and HR collections save and load again |
| Login required | `test_hr_routes_require_a_token` | Passed | HR routes reject a request with no token |
| Health, login, OTP, masters, admission | Phase 0 tests | Passed | The shared login, class and subject masters, and the admission path still work |

## Not covered by this run

- Clicking through each HR screen in the browser
- RFID punch import
- Sending the temporary password by real email
- Finance creating the payment voucher or applying the child concession on a fee
- Academics reassigning a teacher's periods for emergency leave
