# Admissions — frontend analysis & build plan

Date: 2026-10-09  
Stack: UUID FastAPI (`main`) + Admin / Front Office React screens

## Frontend truth (what the UI already does)

| Surface | Path | Data layer |
|---|---|---|
| Enquiry list / add / view | `/admin/front-office/admission-enquiry/*` and `/front-office/...` | `admissionEnquiryData.js` → `admissionsApi.js` when flag on |
| Admission list / add / view / enroll | `/admin/front-office/admission-list/*` and `/front-office/...` | `admissionListData.js` → `admissionsApi.js` when flag on |
| Flag | `VITE_USE_API_ADMISSIONS` (set **true** in `.env.example`) | localStorage fallback while off |

### Enquiry fields the UI saves

`name`, `mobileNumber`, `email`, `gender`, `address`, `description`, `note`, `enquiryDate`, `nextFollowUpDate`, `assignedTo`, `reference`, `source`, `className`, `numberOfChild`, `city`, `state`, `profileImage` / `profileImageFileId`, `status` (`Active` \| `Success` \| `In Active`)

### Admission fields the UI saves

Full student + parent + transport + fees block in `DEFAULT_ADMISSION_FORM` (see `admissionListData.js`), including `parentAccountEmail` / `parentAccountPassword` for enroll login.

### Lifecycle the UI expects

1. Create / edit enquiry  
2. Convert enquiry → admission (`POST .../enquiries/{id}/convert`)  
3. Create / edit admission directly  
4. Enroll admission → student + optional parent user (`POST .../admissions/{id}/enroll`)  
5. Soft-delete enquiry = status `In Active`

### API client contract (`src/services/admissionsApi.js`)

| Method | Path |
|---|---|
| GET/POST | `/admissions/enquiries` |
| GET/PATCH | `/admissions/enquiries/{id}` |
| POST | `/admissions/enquiries/{id}/convert` |
| GET/POST | `/admissions` |
| GET/PATCH | `/admissions/{id}` |
| POST | `/admissions/{id}/enroll` |

Responses are snake_case; mapper produces camelCase for screens.

## Backend gap (before this build)

| Item | Was on UUID stack |
|---|---|
| Model | Minimal `AdmissionEnquiry` (4 name fields) + `Student` + `Guardian` |
| Routes | `POST /enquiries`, `POST /enquiries/{id}/enroll` only |
| Schemas | Phase-0 `student_name` / `guardian_*` — not FE shape |
| Admission entity | Missing |
| Convert / list / patch | Missing |
| Parent login on enroll | Missing |
| Profile image file id | Missing |
| Docs | `FRONTEND_INTEGRATION.md` says flag stays off until port |

## Build plan

1. Expand `admission_enquiries` + add `admissions` table (migrate helper for existing DBs).  
2. Implement schemas + service + routes matching `admissionsApi.js`.  
3. Enroll creates `Student` + `Guardian`, optional `User` with role `parent`, marks admission `Enrolled`.  
4. Fix FE UUID bugs (`enquiry_id` / `profileImageFileId` must not use `Number()`).  
5. Flip default guidance to `VITE_USE_API_ADMISSIONS=true` once tests pass.  
6. Keep localStorage path when flag is false.

## Out of scope (this pass)

- Hard-delete admissions  
- Finance fee posting on enroll  
- SMS / email on parent create (password returned only if debug policy matches HR pattern — not required for FE)  
- Separate PRM-only UI changes (same data layer)

## Status (as of 9 October 2026)

Rich admissions are **live on the UUID stack**. Use `VITE_USE_API_ADMISSIONS=true`.  
Covered by `tests/test_admissions.py` and the chained campus E2E / smoke scripts.

## Test case results

Last run: 9 October 2026  
Full suite: **39 passed, 0 failed** (~22 seconds)

```
python -m pytest tests/ -q
```

### Admissions cases (`tests/test_admissions.py`)

| Test | Result | What was checked |
|---|---|---|
| `test_rich_enquiry_admission_enroll_with_parent` | Passed | Create enquiry → list → convert → patch admission → enroll with parent user → reject double enroll |
| `test_create_admission_direct` | Passed | Direct `POST /admissions` and list |

### Related suite (still green)

| Area | Result | Notes |
|---|---|---|
| Phase 0 legacy enroll | Passed | `POST /admissions/enquiries/{id}/enroll` shortcut still works |
| Campus E2E | Passed | Admissions hand-off into HR concession + Finance collect |
| HR modules + HR round trip | Passed | Partner closeout suite unchanged |

Full module table: `reports/testing-report.md`
