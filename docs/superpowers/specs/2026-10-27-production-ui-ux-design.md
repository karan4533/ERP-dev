# Production ERP UI/UX Design

## Intent

Turn the existing browser-based ERP prototype into a coherent, accessible, API-ready school operations workspace without changing the business data layer being developed separately. The interface must help each role see what needs attention, understand record state, complete multi-step work safely, and move between high-density operational screens without losing context.

## Product character

The product should feel calm, authoritative, and operational rather than decorative. It serves school leaders, administrators, teachers, auditors, support staff, students, and guardians throughout long working days. Information density is welcome when hierarchy, spacing, and status language make it easy to scan.

The distinctive visual idea is a **daily operational spine**: the shell consistently exposes scope, urgent work, current context, and record status. Dashboards should behave like briefings, not galleries of interchangeable cards.

## Goals

- Establish one visual and interaction system across all 25 current role portals.
- Preserve current routes and browser-backed demo workflows while making components API-ready.
- Make navigation, page titles, scope, breadcrumbs, actions, filters, tables, forms, statuses, empty states, loading states, and errors consistent.
- Meet WCAG 2.2 AA interaction and contrast expectations.
- Support desktop, tablet, and mobile workflows without hiding essential actions.
- Make demo, unavailable, and non-integrated states explicit so they cannot be mistaken for authoritative production data.
- Create reusable primitives so module redesigns do not duplicate styling or behavior.

## Non-goals

- Building backend APIs, database models, payment capture, biometric sync, GPS ingestion, or notification delivery.
- Rewriting documented business rules in the frontend.
- Changing URL structure or deleting existing functional screens during the visual migration.
- Treating localStorage state as production-safe.

## Visual system

### Color tokens

- **Ink** `#172033`: navigation, primary text, and authoritative chrome.
- **Indigo** `#3F46C7`: primary actions, active navigation, focus identity.
- **Teal** `#087E8B`: healthy operational state and progress.
- **Canvas** `#F4F6FA`: low-glare application background.
- **Paper** `#FFFFFF`: forms, tables, drawers, and focused work surfaces.
- **Amber** `#C56A16`: deadlines, waiting states, and warnings.
- **Red** `#C43D4D`: destructive actions, failures, and overdue exceptions.
- **Slate** `#5B6475`: secondary copy and metadata.

Semantic colors must never be the only carrier of meaning. Every state includes text and, where useful, an icon.

### Type

Use `Inter, "Segoe UI", sans-serif` as the product face because the UI is data-heavy and the existing project already expects Inter. Use a disciplined scale: 12px metadata, 14px controls/body, 16px emphasized body, 20px section title, 28px page title. Avoid all-caps labels except legally required abbreviations.

### Shape and elevation

- 6px radius for controls and status elements.
- 10px radius for work surfaces and drawers.
- 14px radius only for major dashboard briefing regions.
- Borders define most hierarchy; shadows are reserved for overlays and floating navigation.
- Tables remain visually flat and dense rather than becoming grids of cards.

## Layout concept

```text
┌──────────────────────────────────────────────────────────────────────┐
│ School / campus scope     Search / quick actions     Alerts / user   │
├───────────────┬──────────────────────────────────────────────────────┤
│ Role + status │ Breadcrumbs and page title                           │
│               │ Context summary / deadline / workflow state          │
│ Navigation    ├──────────────────────────────────────────────────────┤
│ grouped by    │ Primary work surface                                 │
│ daily work    │ filters → table/form/detail → activity timeline      │
│               │                                                      │
│ Support       │                                                      │
└───────────────┴──────────────────────────────────────────────────────┘
```

Content is left-aligned. The desktop shell uses a 264px navigation rail and a bounded content width where appropriate; operational tables can use the full remaining width. Tablet navigation collapses to an icon rail. Mobile navigation becomes a modal drawer, page actions become a sticky bottom action area when needed, and wide tables switch to controlled horizontal scrolling or purpose-built row summaries.

## Interaction principles

1. **Show state before action.** Approval, attendance, finance, audit, and record pages show current status and ownership before action buttons.
2. **Actions say what happens.** Use “Save draft,” “Submit for review,” “Approve request,” and “Publish results,” not generic “Submit.”
3. **One source of navigation truth.** Sidebars, breadcrumbs, titles, and role routes must use consistent names.
4. **Failures explain recovery.** Errors state what failed, whether data was saved, and what the user should do next.
5. **Empty states direct work.** Empty lists explain filters or provide the permitted next action.
6. **Permission-aware, not permission-dependent.** The UI may hide unavailable actions, but copy never implies that this is the security boundary.
7. **Motion confirms change.** Use short drawer, collapse, and status transitions; respect `prefers-reduced-motion`.

## Shared component contract

- `AppShell`: navigation, header, mobile drawer, skip link, responsive content frame.
- `PageHeader`: breadcrumbs, title, description, scope, status, primary and secondary actions.
- `Surface`: consistent work region with optional title/action bar.
- `StatusBadge`: semantic label and icon with documented variants.
- `DataToolbar`: search, filters, saved view, column selector, export and bulk actions.
- `DataTable`: loading, error, empty, selected, pagination and responsive states.
- `FormField`: label, hint, required state, error, and accessible control association.
- `EmptyState`, `ErrorState`, `LoadingState`: shared feedback patterns.
- `WorkflowTimeline`: owner, step, decision, timestamp and remarks.
- `IntegrationNotice`: explicit demo, disconnected, syncing, connected and failed states.

## Navigation model

Navigation is grouped by work rather than by implementation folder:

- Overview
- My work
- People or students
- Core departmental work
- Approvals
- Reports
- Communication
- Configuration, only where allowed

Every role keeps its documented capabilities, but duplicate legacy paths redirect with an explanatory destination instead of silently returning to a dashboard.

## Accessibility and responsive baseline

- Keyboard-visible focus on every interactive element.
- Skip-to-content link and landmark structure.
- Semantic buttons/links instead of clickable generic elements.
- Dialog labelling, focus trap, Escape close, and focus restoration.
- All informative images have useful alt text; decorative images use empty alt text.
- Charts provide summaries or adjacent tables.
- Touch targets are at least 44px where practical.
- Forms announce errors and preserve entered data.
- Color contrast meets WCAG 2.2 AA.

## Rollout order

1. Design tokens and shared shell.
2. Navigation registry and role-aware sidebar.
3. Shared page, feedback, form, table, modal, drawer, and status primitives.
4. Authentication and profile selection.
5. Shared cross-role workflows.
6. Admin and governance.
7. Academics and front office.
8. HR and finance.
9. Operations.
10. Audit and executive views.
11. Accessibility, responsive, visual-regression, and consistency closure.

Each slice must leave the application usable and may not require backend availability.
