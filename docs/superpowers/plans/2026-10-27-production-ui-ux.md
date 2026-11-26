# Production ERP UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the existing ERP frontend into a consistent, accessible, responsive, API-ready production UI while preserving its current route and business-flow coverage.

**Architecture:** Introduce a token-driven shared UI layer and a single reusable application shell, then migrate role portals and modules in dependency order. Existing page data helpers remain temporarily intact behind the redesigned views because the production backend is being developed separately.

**Tech Stack:** React 19, React Router 7, Tailwind CSS 4, Lucide React, ECharts, existing Vite build.

**Spec:** `docs/superpowers/specs/2026-10-27-production-ui-ux-design.md`

## Global Constraints

- Do not add or change backend behavior.
- Preserve existing URLs unless a legacy URL already redirects.
- Do not represent seeded or browser-only data as live production data.
- Meet WCAG 2.2 AA for new or migrated shared components.
- Support desktop, tablet, and mobile layouts.
- Use semantic HTML and visible keyboard focus.
- Keep existing role and page functionality available during migration.
- Run Kluster automatic review immediately after every file change set when the service is available.

## Review Focus

- Long role labels and translated-like content must not clip navigation or headers.
- Empty, loading, disconnected, and error states must preserve the user’s next safe action.
- Permission-restricted actions must not flash during initial session loading.
- Tables with many columns must remain usable at 320px and 200% zoom.
- Dialogs and mobile navigation must restore focus and close by keyboard.

---

### Task 1: Design tokens and global accessibility baseline

**Files:**
- Modify: `src/index.css`
- Create: `src/Common/ui/tokens.js`
- Create: `src/Common/ui/VisuallyHidden.jsx`
- Create: `src/Common/ui/SkipLink.jsx`
- Test: `src/Common/ui/__tests__/tokens.test.js`

**Interfaces:**
- Produces: semantic color/status maps, shared CSS utilities, `VisuallyHidden`, and `SkipLink`.

- [ ] Add a dependency-validation gate before introducing a test runner.
- [ ] Add token tests that assert every semantic status has text, foreground and background values.
- [ ] Add CSS variables, base typography, focus rings, reduced-motion behavior and accessible selection styles.
- [ ] Add `VisuallyHidden({ children })` and `SkipLink({ targetId })`.
- [ ] Run the focused tests, lint, and production build.

### Task 2: Unified application shell

**Files:**
- Create: `src/Layout/AppShell.jsx`
- Create: `src/Layout/layoutRegistry.js`
- Modify: all files in `src/Layout/*Layout.jsx`
- Modify: `src/Common/CommonSidebar/CommonSidebar.jsx`
- Modify: `src/Common/CommonHeader/CommonHeader.jsx`
- Test: `src/Layout/__tests__/AppShell.test.jsx`

**Interfaces:**
- Consumes: Task 1 tokens and accessibility primitives.
- Produces: `AppShell({ roleKey, sidebarLinks, children })` and a registry mapping roles to shell metadata.

- [ ] Test desktop, collapsed, mobile-open and Escape-close shell states.
- [ ] Implement skip link, landmarks, mobile overlay, responsive content frame and focus restoration.
- [ ] Convert role layouts to thin `AppShell` wrappers without changing route output.
- [ ] Verify every role renders the correct identity and navigation.
- [ ] Run tests, lint, build and route smoke checks.

### Task 3: Navigation registry and information architecture

**Files:**
- Split: `src/Common/CommonSidebar/Components/sidebarLinks.js`
- Create: `src/Common/navigation/navigationRegistry.js`
- Create: `src/Common/navigation/navigationHelpers.js`
- Modify: `src/Common/CommonSidebar/CommonSidebar.jsx`
- Modify: `src/Common/CommonHeader/Components/TitleMappings.jsx`
- Test: `src/Common/navigation/__tests__/navigationRegistry.test.js`

**Interfaces:**
- Produces: `getNavigationForRole(role, permissions)`, `findNavigationItem(path)`, and canonical page labels.

- [ ] Test unique IDs, valid destinations, canonical labels, role filtering and active-path matching.
- [ ] Group links into Overview, My work, Department work, Approvals, Reports, Communication and Configuration.
- [ ] Replace `#0` pseudo-links with semantic disclosure buttons.
- [ ] Add search/filter for large role menus and meaningful unavailable-destination messaging.
- [ ] Run tests and verify all 25 current roles.

### Task 4: Shared page and feedback primitives

**Files:**
- Create: `src/Common/ui/PageHeader.jsx`
- Create: `src/Common/ui/Surface.jsx`
- Create: `src/Common/ui/StatusBadge.jsx`
- Create: `src/Common/ui/IntegrationNotice.jsx`
- Create: `src/Common/ui/FeedbackState.jsx`
- Test: `src/Common/ui/__tests__/feedback.test.jsx`

**Interfaces:**
- Produces: standard page framing and loading, empty, error, demo, disconnected and permission-denied states.

- [ ] Test accessible names and action behavior for every feedback state.
- [ ] Implement the shared components with semantic variants.
- [ ] Replace current demo disclaimers with `IntegrationNotice` in biometric, payment, email, WhatsApp, GPS and audit-log screens.
- [ ] Add explicit replacement screens for silent dashboard redirects.
- [ ] Run tests, lint and build.

### Task 5: Forms, dialogs and drawers

**Files:**
- Create: `src/Common/ui/FormField.jsx`
- Create: `src/Common/ui/Dialog.jsx`
- Create: `src/Common/ui/Drawer.jsx`
- Create: `src/Common/ui/ConfirmAction.jsx`
- Migrate: modal/drawer components under `src/Common` and `src/Pages`
- Test: `src/Common/ui/__tests__/overlays.test.jsx`

**Interfaces:**
- Produces: labelled form controls and keyboard-safe overlays.

- [ ] Test initial focus, Tab containment, Escape, backdrop, labelled errors and focus restoration.
- [ ] Implement primitives without introducing a second overlay dependency.
- [ ] Migrate highest-risk finance, admission, approval and audit overlays first.
- [ ] Replace clickable non-semantic overlays and controls.
- [ ] Complete remaining overlay migration by module.

### Task 6: Data toolbar and table system

**Files:**
- Create: `src/Common/ui/DataToolbar.jsx`
- Create: `src/Common/ui/DataTable.jsx`
- Create: `src/Common/ui/Pagination.jsx`
- Create: `src/Common/ui/ColumnChooser.jsx`
- Create: `src/Common/ui/ResponsiveRecordList.jsx`
- Test: `src/Common/ui/__tests__/dataTable.test.jsx`

**Interfaces:**
- Produces: controlled table state compatible with future server pagination.

- [ ] Test search, filters, columns, selection, empty/loading/error states and keyboard operation.
- [ ] Implement URL-serializable filter state without coupling to localStorage data helpers.
- [ ] Add mobile row summaries and explicit horizontal-scroll affordances.
- [ ] Migrate shared lists, then departmental lists.
- [ ] Remove decorative pagination after each migrated page has real controlled pagination.

### Task 7: Authentication and role entry experience

**Files:**
- Modify: `src/Pages/Authentication/*`
- Modify: `src/Layout/AuthLayout.jsx`
- Modify: `src/context/AuthContext.jsx` only for UI-safe session loading state
- Test: `src/Pages/Authentication/__tests__/authentication-ui.test.jsx`

**Interfaces:**
- Produces: accessible profile selection, sign-in feedback, pending session UI and role context.

- [ ] Test keyboard profile selection, invalid OTP feedback, loading state and route return.
- [ ] Redesign selection around role groups and clear responsibility descriptions.
- [ ] Add visible demo/non-production notice without exposing credentials.
- [ ] Prevent protected UI from flashing before session restoration completes.
- [ ] Verify mobile and 200% zoom layouts.

### Task 8: Shared cross-role workflows

**Files:**
- Migrate: `src/Common/TaskManagement`
- Migrate: `src/Common/LeaveRequest`
- Migrate: `src/Common/Announcement`
- Migrate: `src/Common/Communication`
- Migrate: `src/Common/EscalationManagement`
- Migrate: `src/Common/AcademicCalendar`
- Create: `src/Common/ui/WorkflowTimeline.jsx`

**Interfaces:**
- Produces: consistent list/detail/create/decision experience reused by all roles.

- [ ] Add workflow-state tests for draft, submitted, pending, approved, rejected, overdue and closed.
- [ ] Redesign shared inboxes around ownership, SLA and next action.
- [ ] Add timeline, remarks, evidence and safe confirmation patterns.
- [ ] Add complaint/reopen UX placeholders explicitly marked API-pending where requirements demand them.
- [ ] Verify every consuming role.

### Task 9: Admin, governance and front office

**Files:**
- Migrate: `src/Pages/SuperAdmin`
- Migrate: `src/Pages/Admin`
- Migrate: `src/Pages/FrontOffice`
- Migrate: `src/Common/RBAC`

**Interfaces:**
- Consumes: Tasks 1–8.
- Produces: consistent governance, people, admissions, document and pass workflows.

- [ ] Redesign dashboards as operational briefings with data provenance.
- [ ] Redesign admissions as a resumable staged workflow.
- [ ] Show role/scope/permission consequences before saving RBAC changes.
- [ ] Replace the Admin plain-text catch-all and clarify unavailable backend-only settings.
- [ ] Complete accessibility, responsive and role-route checks.

### Task 10: Academic, student and guardian portals

**Files:**
- Migrate: Teacher, Coordinator, Principal, Director, Student, Parent and Librarian page trees.
- Migrate: lesson-plan, mark-entry, allocation and Star of the Month common modules.

**Interfaces:**
- Produces: classroom workspaces, review queues, published student views and guardian summaries.

- [x] Redesign daily teacher work around class, deadline and pending-review context.
- [x] Standardize lesson-plan and mark-entry drafts, validation and approval history.
- [x] Make unmounted or unavailable workflows explicit instead of silently redirecting.
- [x] Redesign student/guardian mobile views around today, due work, attendance, results and payments.
- [x] Verify published/draft visibility and role-specific actions.

### Task 11: HR and finance portals

**Files:**
- Migrate: `src/Pages/HR`
- Migrate: `src/Pages/AccountHead`

**Interfaces:**
- Produces: high-density HR lifecycle, payroll, fee, accounting and approval workspaces.

- [x] Display period, lock, source and integration state on every financial or payroll screen.
- [x] Standardize money, date, status, approval and reconciliation presentation.
- [x] Redesign payroll and finance actions to distinguish calculate, review, approve, post, pay and reverse.
- [x] Preserve MFP as an explicit specification-pending state.
- [x] Verify large tables, print views, mobile approvals and destructive-action safeguards.

### Task 12: Operations portals

**Files:**
- Migrate: Canteen, IT, Stationery, Housekeeping, Transport, Driver, Gatekeeper, Gatekeeper Manager, Joint Director and Assistant page trees.

**Interfaces:**
- Produces: consistent assets, tickets, stock, procurement, duties, fleet, passes and incident workflows.

- [x] Standardize asset/location/owner/status context.
- [x] Add route/trip/vehicle state hierarchy to transport screens.
- [x] Add SLA/priority/assignment hierarchy to tickets and incidents.
- [x] Add stock movement and procurement timelines.
- [x] Mark missing File Room, CCTV, PRO and full Maintenance workflows as planned capabilities rather than fake completed modules.

### Task 13: Audit and executive experience

**Files:**
- Migrate: `src/Pages/JointDirectorAudit`
- Migrate: `src/Pages/ProcessAuditor`
- Migrate: `src/Pages/QualityAuditor`
- Extend: executive overview surfaces without inventing a new authenticated MD role.

**Interfaces:**
- Produces: version-aware audit configuration, execution, evidence, finding and CAPA experiences.

- [x] Show template version, rubric scale and evidence requirements before audit execution.
- [x] Redesign findings around severity, owner, due date, RCA, CAPA, verification and closure.
- [x] Make local/demo evidence limitations explicit.
- [x] Provide executive summaries that can later be assigned to the documented MD role.
- [x] Verify auditor/auditee action separation.

### Task 14: Production-quality closure

**Files:**
- Modify: all migrated UI files as findings require.
- Create: accessibility and route smoke-test suites.
- Create: visual-regression baselines once the test environment is approved.

**Interfaces:**
- Produces: release-ready frontend UI independent of backend completion.

- [ ] Run route smoke tests for all 25 roles and every sidebar destination.
- [ ] Run automated accessibility checks and manual keyboard/zoom review.
- [ ] Run responsive checks at 320, 768, 1024 and 1440 widths.
- [ ] Verify all demo/integration states are clearly identified.
- [ ] Remove orphaned legacy styling only after route equivalence is proven.
- [ ] Run lint, production build, tests and final Kluster review.
