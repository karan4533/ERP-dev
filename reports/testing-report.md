# Testing report

Project: Queen Mira International School ERP  
Last run: 9 October 2026, after Finance closeout  
Result: **38 passed, 0 failed** (about 20 seconds)  
Kind of test: API tests (Finance + Finance actions + Admissions + HR + Phase 0).

Command, from the `backend` folder:

```
python -m pytest tests/test_finance.py tests/test_finance_actions.py tests/test_admissions.py tests/test_hr_modules.py tests/test_hr.py tests/test_phase0.py -v
```

## Module results (headline)

| Module | Test | Result | What was checked |
|---|---|---|---|
| Finance snapshot | `test_accounthead_can_save_finance_state` | Passed | Account Head login, PUT/GET finance state, receipts collection |
| Finance authz | `test_hr_cannot_write_finance` | Passed | HR cannot PUT finance |
| Finance reset | `test_finance_reset` | Passed | Admin reset clears seeded snapshot |
| Finance collect + receipt | `test_collect_payment_and_send_receipt` | Passed | Cash collect + WhatsApp stub |
| Finance gateway + approval | `test_gateway_intent_and_approval` | Passed | Gateway stub + decide approval |
| Finance HR links | `test_hr_concession_and_payroll_voucher` | Passed | Concession apply + payroll OUT voucher |
| Admissions enquiry → enroll | `test_rich_enquiry_admission_enroll_with_parent` | Passed | Enquiry → convert → enroll with parent |
| Admissions create | `test_create_admission_direct` | Passed | Direct admission create and list |
| HR modules (closeout suite) | `test_hr_modules` + `test_hr` | Passed | Staff, leave, payroll, exit, files, announcements, … |
| Phase 0 | `test_phase0` | Passed | Health, login, OTP, masters, legacy enroll |

## Not covered by this run

- Browser click-through of Account Head fees / vouchers screens
- Real payment gateway / SMTP / WhatsApp keys (stubs only)
- RFID, Academics
