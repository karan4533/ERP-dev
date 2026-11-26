# Super Admin + Director — 50 FAIL Verification Checklist

**Path:** `docs/SUPER_ADMIN_DIRECTOR_50_FAIL_VERIFICATION_CHECKLIST.md`\
**Updated:** 2026-11-21\
**Official Test IDs:** preserved exactly as supplied (9 High / 31 Medium / 7 Low / 3 Unspecified).\
**Enhancement (not FAIL):** `NUI-SA-128` — see section at end.\
**Rules:** No invented evidence. FIXED + VERIFIED only with case-specific UAT evidence.

## Count reconciliation

| Bucket | Count |
|---|---:|
| FAIL cases | **50** |
| High | **9** |
| Medium | **31** |
| Low | **7** |
| Unspecified | **3** |
| Enhancement (not FAIL) | **1** (`NUI-SA-128`) |

## Status legend

| Final Status | Meaning |
|---|---|
| FIXED + VERIFIED | Failure addressed and exact case passed browser UAT with evidence |
| PARTIALLY FIXED | Some behaviour works; full requirement (often LIVE persistence) not satisfied |
| NOT FIXED | Original issue still occurs |
| NOT VERIFIED | Implementation present but sufficient case-specific UAT evidence missing |
| BLOCKED | Cannot verify due to environment/dependency |

## FAIL cases (50)

| # | Test ID | Module | Severity | Original issue | Expected | Root cause / fix summary | Automated test | Browser UAT | Persistence | Evidence | Final Status |
|---:|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `NUI-SA-048` | Star of Year | High | Eligible when Audit Gates GPA fails | One consistent eligibility; GPA fail => ineligible | soyEligibility shared gates; mock/local recognition SoT; no dedicated REST | Pass (soyEligibility) | Not fully re-walked 2026-11-21 | Partial / mock / LS | code + unit | **PARTIALLY FIXED** |
| 2 | `NUI-SA-049` | Star of Year | High | Nominate rejected while shown eligible | Display eligibility matches nominate rules/backend | nominate uses same evaluator + somWinsCount bridge; ID namespace still split | Pass (soyEligibility) | Not fully re-walked 2026-11-21 | Partial / mock / LS | code + unit | **PARTIALLY FIXED** |
| 3 | `NUI-SA-051` | Star of Year | High | Gate 2 GPA NaN; UI says all gates passed | Invalid/missing GPA fails; never show all four passed | NaN GPA gate fail in soyEligibility | Pass (soyEligibility) | Not fully re-walked 2026-11-21 | Partial / mock / LS | code + unit | **PARTIALLY FIXED** |
| 4 | `NUI-SA-082` | Physical File Room | High | Docket Inward fileNumber undefined | Correct request/response mapping and file number | fileRoomData mapping fixed; inward UI no crash; SoT still localStorage | Pass/partial | Pass (UI; no fileNumber crash) | Partial / LS (`schoolerp-file-*`) | UAT 2026-11-21 Docket Inward | **PARTIALLY FIXED** |
| 5 | `NUI-SA-083` | Physical File Room | High | Receive Back outward issue not found | Correct outward issue identifier/lookup | issueId mapping fixed; localStorage SoT | Pass/partial | Not re-verified Receive Back end-to-end | Partial / LS | code + audit | **PARTIALLY FIXED** |
| 6 | `NUI-SA-125` | Academic Calendar | High | Accepts End Date before Start Date | Reject inverted dates FE+BE | FE validateCalendarDateRange + BE _dates | Pass | Pass | N/A (rejected) | toast End date must be on or after start | **FIXED + VERIFIED** |
| 7 | `NUI-SA-130` | Exam Timetable (Director) | High | Principal/Director mismatch; missing submissions | Same exam details; Principal submits appear | shared SoT + live/shared merge | Pass | Pass | Pass (shared) | EXM003 Unit -4a alignment | **FIXED + VERIFIED** |
| 8 | `NUI-SA-131` | Exam Timetable (Director) | High | Approved reverts after refresh | Persist Approved via backend workflow | decideApproval approve/deny; LIVE API create→submit→decide persists; seed EXM* often lack approvalId (LS path) | Pass/partial | Browser Director walk incomplete | LIVE proven via API re-list; seed rows still LS | API decide status=approved | **PARTIALLY FIXED** |
| 9 | `NUI-157` | Progress Report Cards | High | classFilteredStudents TDZ crash | Fix init order; filtering works | classFilteredStudents before trackingReport | Pass | Pass | N/A | Report Cards no TDZ | **FIXED + VERIFIED** |
| 10 | `NUI-SA-046` | Star of Month | Medium | Nomination popup behind sidebar | Popup above sidebar, fully visible | RecognitionModalOverlay z-[400] present | Pass/partial | Not captured (session redirects) | See module SoT | incomplete UAT | **NOT VERIFIED** |
| 11 | `NUI-SA-052` | Star of Year | Medium | Leaderboard cramped / clipped | Readable columns; badges not clipped | Eligibility text present; spacing not visually signed off | Pass/partial | Incomplete visual sign-off | See module SoT | incomplete UAT | **NOT VERIFIED** |
| 12 | `NUI-SA-054` | Star Ratings | Medium | Sidebar/URL/tab desync | Sidebar, URL, tab synchronized | Tab navigates star-of-month ↔ star-of-year; URL matches breadcrumb | Pass/partial | Pass (SA path) | Partial (other roles may local-toggle) | URL `/star-ratings/star-of-year` + SOY content | **FIXED + VERIFIED** |
| 13 | `NUI-SA-064` | Data Changes | Medium | Inspect opens Login History | Opens Data Changes details | Category routes + ViewActivityLog fromType; breadcrumb fix for view routes | Pass | Pass | N/A (audit demo) | Detail `Log type: Data Changes`; Back works | **FIXED + VERIFIED** |
| 14 | `NUI-SA-065` | Data Changes | Medium | Back not to Data Changes | Back to Data Changes list | resolveActivityBackRoute | Pass | Pass | N/A | Back → `/activity-logs/data-changes` | **FIXED + VERIFIED** |
| 15 | `NUI-SA-067` | Deleted Records | Medium | Inspect opens Login History | Opens Deleted Records details | Category view + Back to Deleted Records | Pass | Pass | N/A | Deleted Records detail + Back label | **FIXED + VERIFIED** |
| 16 | `NUI-SA-069` | Demo Activity | Medium | Inspect opens Login History | Opens Demo Activity details | demo-activity view route | Pass | Pass | N/A | Demo Activity detail URL + Back | **FIXED + VERIFIED** |
| 17 | `NUI-SA-074` | Stores & Procurement | Medium | View Restock RFQ blank/blink | Opens actual RFQ content | Stores tabs + RFQ content | Pass/partial | Pass | See module SoT | View Restock RFQ /requirements content | **FIXED + VERIFIED** |
| 18 | `NUI-SA-075` | Stores & Procurement | Medium | Inventory Catalog broken | Renders catalog content | Inventory tab content load | Pass/partial | Pass | See module SoT | `/inventory` content loaded | **FIXED + VERIFIED** |
| 19 | `NUI-SA-076` | Stores & Procurement | Medium | Procurement tabs blink/disappear | Selected tab opens content reliably | Tab URL sync inventory/requirements/grn | Pass/partial | Pass | See module SoT | Tabs stay with content | **FIXED + VERIFIED** |
| 20 | `NUI-SA-077` | Stores & Procurement | Medium | Missing Edit for requests | Edit when status/permissions allow | Edit affordance present; eligibility matrix not fully evidenced | Pass/partial | Incomplete (edit vs status) | See module SoT | incomplete UAT | **NOT VERIFIED** |
| 21 | `NUI-SA-078` | Stores & Procurement | Medium | Request Product popup oversized | Responsive; no horiz scroll; fields intact | Raise Material Requisition modal | Pass/partial | Pass | See module SoT | Modal + Select from Store / Request New Product | **FIXED + VERIFIED** |
| 22 | `NUI-SA-089` | Helpdesk | Medium | Ticket numbers blank | Show actual ticket numbers | Ticket # column from seed/service | Pass/partial | Pass | Partial / LS tickets | TICK-2026-001/002/003 | **FIXED + VERIFIED** |
| 23 | `NUI-SA-090` | Helpdesk | Medium | Action column empty | Permitted actions per ticket | Resolve / Rate & Close / Assign | Pass/partial | Pass | Partial / LS | ACTION column populated | **FIXED + VERIFIED** |
| 24 | `NUI-SA-092` | Helpdesk | Medium | Category blank | Actual category labels | issueCategory on tickets + raise modal | Pass/partial | Pass | Partial / LS | Classroom Interactive Smartboard / Projector | **FIXED + VERIFIED** |
| 25 | `NUI-SA-093` | Helpdesk | Medium | SLA CSV no download | Valid CSV downloads | downloadCsv SLA export | Pass | Pass | N/A (export) | CSV header + 3 ticket rows | **FIXED + VERIFIED** |
| 26 | `NUI-SA-094` | Helpdesk | Medium | Feedback CSV no download | Valid CSV downloads | Seed rated ticket; Feedback Register export | Pass | Pass (after seed) | Partial / LS | CSV with TICK-2026-002 rating 5 + comments | **FIXED + VERIFIED** |
| 27 | `NUI-SA-099` | Activity Monitoring | Medium | Dept filter redirects Overview | Filter stays on current view | Dept filter on activity stream | Pass/partial | Pass | See module SoT | Stays on stream; filter applied | **FIXED + VERIFIED** |
| 28 | `NUI-SA-100` | Activity Monitoring | Medium | Employee filter redirects Overview | Filter stays on current view | Implementation present | Pass/partial | Interrupted / not completed | See module SoT | incomplete UAT | **NOT VERIFIED** |
| 29 | `NUI-SA-102` | Activity Monitoring | Medium | Review redirects Overview | Preserve monitoring context | Implementation present | Pass/partial | Not exercised | See module SoT | incomplete UAT | **NOT VERIFIED** |
| 30 | `NUI-SA-103` | Activity Monitoring | Medium | Approved popup stays open | Close after success; accurate feedback | Implementation present | Pass/partial | Not exercised | See module SoT | incomplete UAT | **NOT VERIFIED** |
| 31 | `NUI-SA-111` | Lost & Found | Medium | Custody CSV no download | Valid CSV downloads | downloadCsv + local seed fallback when remote empty | Pass | Pass | Partial / LS seed | CSV 3 FOUND rows incl. Claim Approved | **FIXED + VERIFIED** |
| 32 | `NUI-SA-115` | Attendance & Leave | Medium | Leave needs manual refresh | Appears immediately after create | memory-first refresh; workspace MOCK/PARTIAL | Pass/partial | Not re-verified | Partial / mock | code + audit | **PARTIALLY FIXED** |
| 33 | `NUI-SA-119` | Task Management | Medium | Task needs manual refresh | Appears immediately after create | created-tab refresh; tasks MOCK | Pass/partial | Not re-verified | Partial / mock | code + audit | **PARTIALLY FIXED** |
| 34 | `NUI-SA-126` | Academic Calendar | Medium | Success toast on invalid dates | No success; validation error; no create | success only after validate | Pass | Pass | N/A | no success toast; modal stayed | **FIXED + VERIFIED** |
| 35 | `NUI-SA-127` | Academic Calendar | Medium | New event needs refresh | Appears immediately after create | UI refresh + live create when enabled; hydrate incomplete | Pass/partial | Timed LIVE browser create incomplete | Partial | code + API tests | **PARTIALLY FIXED** |
| 36 | `NUI-SA-135` | Student Profile | Medium | Session label-only; wrong effective date | Session loads correct data | session-scoped integrator; not full REST history | Pass/partial | Not re-verified | Partial | code + audit | **PARTIALLY FIXED** |
| 37 | `NUI-SA-139` | Teacher Database | Medium | Year label-only | Year updates displayed data | year assignment column; local SoT | Pass/partial | Not re-verified | Partial | code + audit | **PARTIALLY FIXED** |
| 38 | `NUI-149` | Cultural Activities | Medium | Activity needs refresh | Appears immediately after create | ACTIVITIES_UPDATED_EVENT; local SoT | Pass/partial | Not re-verified | Partial / LS | code + audit | **PARTIALLY FIXED** |
| 39 | `NUI-160` | Student Home Fun | Medium | Eye preview no response | Working attachment preview | Preview wired; Director LMS under SA redirected | Pass/partial | Blocked (role redirect) | See module SoT | incomplete UAT | **NOT VERIFIED** |
| 40 | `NUI-161` | Student Home Fun | Medium | Download broken | Correct file downloads/opens | Blob download; mock attachments remain | Pass/partial | Not re-verified file content | Partial / mock | code + audit | **PARTIALLY FIXED** |
| 41 | `NUI-SA-011` | Approvals | Low | Refresh no loading/feedback | Loading + success/error feedback | Refresh → Refreshing… + success toast | Pass/partial | Pass | N/A | toast “Approval records refreshed successfully.” | **FIXED + VERIFIED** |
| 42 | `NUI-SA-039` | Compliance Score | Low | Excess empty space under 91% | Tighten space; preserve layout | layout tightened; scores remain MOCK | Pass/partial | Layout not re-measured this pass | Partial / MOCK score | code + audit | **PARTIALLY FIXED** |
| 43 | `NUI-SA-053` | Audit Gates | Low | Popup heading obscured | Complete heading visible | Audit Gates controls + pipeline heading | Pass/partial | Pass (heading visible on SOY) | See module SoT | Star of the Year Governance Pipeline | **FIXED + VERIFIED** |
| 44 | `NUI-SA-079` | Procurement | Low | Tab labels clipped | Readable labels; horiz scroll on small screens | Tab labels readable | Pass/partial | Pass | See module SoT | Inventory Catalog / RFQ / GRN labels | **FIXED + VERIFIED** |
| 45 | `NUI-SA-091` | Helpdesk | Low | SLA 'h' / blank dept head | Numeric SLA + dept head mapping | `12h target` + Head names | Pass/partial | Pass | Partial / LS | SLA + Head: Rakesh Nair etc. | **FIXED + VERIFIED** |
| 46 | `NUI-SA-110` | Lost & Found | Low | Claim Approved badge overflow | Badge wraps in card | whitespace-normal + Claim Approved seed | Pass/partial | Pass | Partial / LS seed | Badge wraps h≈36 overflow visible | **FIXED + VERIFIED** |
| 47 | `NUI-169` | Academic Calendar | Low | Opens July 2026 hardcoded | Opens current month | currentDate = new Date() | Pass | Pass | N/A | November 2026 on open | **FIXED + VERIFIED** |
| 48 | `NUI-SA-017` | Gate Pass | Unspecified | Exported PDF invalid/unreadable | Valid readable PDF | SuperAdminExportModal + buildValidPdf | Pass/partial | Pass | N/A (export) | createObjectURL application/pdf ~933 bytes | **FIXED + VERIFIED** |
| 49 | `NUI-SA-063` | Data Changes | Unspecified | undefined → undefined values | Actual old/new values | CHANGE column mapping | Pass | Pass | N/A | `9944076990 → 9944076993` | **FIXED + VERIFIED** |
| 50 | `NUI-SA-085` | Physical File Room | Unspecified | Log Inward Letter submission error | Independent verify; may share 082 | shared logFileInward; no crash; LS SoT | Pass/partial | Pass (UI path) | Partial / LS | inward flow clickable; no fileNumber crash | **PARTIALLY FIXED** |

## Final status totals (must sum to 50)

| Status | Count |
|---|---:|
| FIXED + VERIFIED | **28** |
| PARTIALLY FIXED | **15** |
| NOT FIXED | **0** |
| NOT VERIFIED | **7** |
| BLOCKED | **0** |
| **Total** | **50** |

### FIXED + VERIFIED IDs (28)

`NUI-SA-125`, `NUI-SA-130`, `NUI-157`, `NUI-SA-126`, `NUI-169`, `NUI-SA-054`, `NUI-SA-064`, `NUI-SA-065`, `NUI-SA-067`, `NUI-SA-069`, `NUI-SA-074`, `NUI-SA-075`, `NUI-SA-076`, `NUI-SA-078`, `NUI-SA-089`, `NUI-SA-090`, `NUI-SA-092`, `NUI-SA-093`, `NUI-SA-094`, `NUI-SA-099`, `NUI-SA-111`, `NUI-SA-011`, `NUI-SA-053`, `NUI-SA-079`, `NUI-SA-091`, `NUI-SA-110`, `NUI-SA-017`, `NUI-SA-063`

### PARTIALLY FIXED IDs (15)

`NUI-SA-048`, `NUI-SA-049`, `NUI-SA-051`, `NUI-SA-082`, `NUI-SA-083`, `NUI-SA-131`, `NUI-SA-115`, `NUI-SA-119`, `NUI-SA-127`, `NUI-SA-135`, `NUI-SA-139`, `NUI-149`, `NUI-161`, `NUI-SA-039`, `NUI-SA-085`

### NOT VERIFIED IDs (7)

`NUI-SA-046`, `NUI-SA-052`, `NUI-SA-077`, `NUI-SA-100`, `NUI-SA-102`, `NUI-SA-103`, `NUI-160`

## Enhancement — NUI-SA-128 (not counted in 50)

| Field | Value |
|---|---|
| Test ID | `NUI-SA-128` |
| Module | Academic Calendar — Schedule Event |
| Type | Enhancement |
| Delivered | FE All-Day + Start/End Time UI; BE columns `all_day`/`start_time`/`end_time` (alembic `0019_calendar_event_times`); API EventIn/Out; `calendarApiService.createCalendarEvent`; pytest timed persist + invalid times |
| Browser UAT | All-Day checkbox observed earlier; timed LIVE browser create + refresh still incomplete (API LIVE create previously proven) |
| Final Status | **PARTIALLY FIXED** |

## Shared root-cause groups

1. **List refresh:** NUI-SA-115, NUI-SA-119, NUI-SA-127, NUI-149 — FE immediate refresh implemented; LIVE persistence varies by module SoT.
2. **Inspect/Back:** NUI-SA-064/065/067/069 — category routes `/:logType/view/:id` + Back resolver (+ breadcrumb fix).
3. **CSV exports:** NUI-SA-093/094/111 — `downloadCsv` real Blob downloads with data rows.
4. **File Room:** NUI-SA-082/083/085 — shared `logFileInward` / `issueId` mapping; still localStorage SoT.
5. **SOY eligibility:** NUI-SA-048/049/051/052 — `soyEligibility.js` single gate evaluator; recognition still mock SoT.
6. **Exam approvals:** NUI-SA-130/131 — shared SoT + merge; `decideApproval` vocabulary fixed to `approve`/`deny`.

## Notes

- Active frontend tree: `ERP_QMIS/src` (Vite :5175).
- No commit/push performed for this work.
- Focused FE node tests (2026-11-21): **12 passed** (calendar validation + soyEligibility + decide vocab).
- L&F fix this pass: `LostAndFoundWorkspace` local seed fallback (`loadLocalLostFoundDirectory`) when remote items empty; Claim Approved seed; Feedback Register rated ticket seed.
- Breadcrumb: Activity Log detail routes no longer falsely show Login History parent.
- **Not 50/50:** 15 PARTIAL + 7 NOT VERIFIED remain.
