# QMIS ERP — Production Database Schema (Code-Derived Audit)

**Audit date:** 2026-11-24 (UTC)
**Source of truth:** SQLAlchemy `Base.metadata` + Alembic `0001`→`0026_audit_logs_ip_ua` from verified integration/promotion backend. Frontend never talks to SQL directly.
**Safety:** Read-only. No models, Alembic files, databases, commits, pushes, or deploys were modified.

Related: [`DATABASE_SCHEMA_COMPARISON.md`](./DATABASE_SCHEMA_COMPARISON.md) · [`POSTGRESQL_MIGRATION_READINESS.md`](./POSTGRESQL_MIGRATION_READINESS.md) · [`ROLE_WISE_UI_BACKEND_INTEGRATION_TRACKER.md`](./ROLE_WISE_UI_BACKEND_INTEGRATION_TRACKER.md)

**GitHub / deployment DDL:** [`backend/schema/postgresql_schema_head.sql`](../backend/schema/postgresql_schema_head.sql) + [`backend/schema/schema_manifest.json`](../backend/schema/schema_manifest.json) (56 tables, head `0026_audit_logs_ip_ua`). See [`backend/schema/README.md`](../backend/schema/README.md).

---

## 1. Audit findings (stop point for implementation approval)

| Item | Finding |
|---|---|
| Registered physical tables | **56** |
| Alembic head | `0026_audit_logs_ip_ua` (linear) |
| Column-level FK references | **129** |
| Soft-delete columns | **None** (`deleted_at` / `is_deleted` absent) |
| Campus-scoped tables | **43 / 56** |
| AuthZ model | `roles` + `permissions` + `role_permissions`; 32 role codes in matrix |
| Ops/Library/Transport/Hostel/Gate persistence | Mostly **`ops_records` JSON collections**, not 1NF tables |
| Finance invoices/receipts | Inside **`finance_records`** snapshot/collections JSON |
| Dead / unused model modules on disk | `masters.py`, `audit_log.py` (`system_audit_logs`), `otp_challenge.py`, `permission.py`, `role_record.py` — **not** imported in `models/__init__.py` |

### What is NOT a physical table today

No first-class tables for: library books/issues, transport vehicles/routes/drivers as normalized entities, hostel rooms/beds, fee invoices as rows, CCTV, recognition awards, many enterprise ops screens. Those either use JSON bags or remain FE MOCK/LOCAL.

---

## 2. ER overview (actual relationships)

```mermaid
erDiagram
  campuses ||--o{ users : has
  roles ||--o{ users : assigns
  roles ||--o{ role_permissions : grants
  permissions ||--o{ role_permissions : granted_by
  users ||--o| user_profiles : profile
  campuses ||--o{ academic_years : runs
  campuses ||--o{ financial_years : runs
  academic_years ||--o{ school_classes : contains
  school_classes ||--o{ sections : has
  users ||--o{ sections : class_teacher
  campuses ||--o{ subjects : catalog
  campuses ||--o{ students : enrolls
  students ||--o{ guardians : has
  students }o--|| academic_years : year
  students }o--o| school_classes : class
  students }o--o| sections : section
  students }o--o| users : student_login
  admission_enquiries ||--o{ admissions : converts
  admissions }o--o| students : creates
  admissions ||--o{ admission_referrals : tracks
  campuses ||--o{ hr_employees : employs
  users ||--o| hr_employees : staff_link
  users ||--o{ leave_requests : requests
  approval_requests ||--o{ approval_events : timeline
  approval_requests ||--o{ leave_requests : gates
  approval_requests ||--o{ exams : gates
  approval_requests ||--o{ marks_batches : gates
  approval_requests ||--o{ lesson_plans : gates
  exam_types ||--o{ exams : classifies
  exams ||--o{ marks_batches : graded_in
  marks_batches ||--o{ mark_entries : lines
  students ||--o{ mark_entries : scored
  students ||--o{ student_attendance : daily
  users ||--o{ substitute_duties : covers
  students ||--o{ tc_requests : exits
  tc_requests ||--o{ tc_request_nocs : nocs
  campuses ||--o{ ops_records : json_bag
  campuses ||--o{ finance_records : json_bag
  campuses ||--o{ front_office_records : json_bag
  campuses ||--o{ academics_records : json_bag
  campuses ||--o{ hr_records : json_bag
  campuses ||--o{ audit_records : json_bag
  users ||--o{ audit_logs : actions
```

JSON bag tables store many logical entities as `collection` + `public_id` + `body` (see §4). They are campus-scoped but not relationally normalized.

---

## 3. Table-wise data dictionary

Types shown are SQLAlchemy’s string form. UUID PKs/FKs render as `CHAR(32)` in some SQLite type displays; PostgreSQL uses native `UUID`.

### `academic_years`

- **Domain:** Academics
- **Primary key:** `id`
- **Unique constraint:** `None` (campus_id, name)

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11BE8BC40> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `name` | `VARCHAR(50)` | False |  |  |
| `start_date` | `DATE` | True |  |  |
| `end_date` | `DATE` | True |  |  |
| `is_current` | `BOOLEAN` | False | False |  |
| `is_active` | `BOOLEAN` | False | True |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11BEF4C20> |  |

### `academics_records`

- **Domain:** Academics JSON
- **Primary key:** `id`
- **Unique constraint:** `uq_academics_record` (campus_id, collection, public_id)
- **Index:** `ix_academics_records_campus_id` unique=False cols=['campus_id']
- **Index:** `ix_academics_records_collection` unique=False cols=['collection']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11BF2F420> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `collection` | `VARCHAR(60)` | False |  |  |
| `public_id` | `VARCHAR(80)` | False |  |  |
| `body` | `JSON` | False |  |  |
| `created_by` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11BF2F740> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `activities`

- **Domain:** Activities
- **Primary key:** `id`
- **Unique constraint:** `uq_activities_campus_code` (campus_id, code)

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C009C60> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `code` | `VARCHAR(20)` | False |  |  |
| `activity_type` | `VARCHAR(16)` | False |  |  |
| `event_name` | `VARCHAR(200)` | False |  |  |
| `event_type` | `VARCHAR(80)` | False |  |  |
| `class_name` | `VARCHAR(80)` | False |  |  |
| `event_date` | `DATE` | False |  |  |
| `start_time` | `VARCHAR(16)` | False |  |  |
| `end_time` | `VARCHAR(16)` | False |  |  |
| `venue` | `VARCHAR(160)` | False |  |  |
| `coordinator` | `VARCHAR(80)` | False |  |  |
| `coach` | `VARCHAR(80)` | False |  |  |
| `description` | `TEXT` | False |  |  |
| `submitted_by` | `VARCHAR(80)` | False |  |  |
| `submitted_date` | `DATE` | False |  |  |
| `md_approval_status` | `VARCHAR(16)` | False | Pending |  |
| `created_by` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C00A020> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `activity_players`

- **Domain:** Activities
- **Primary key:** `id`
- **Index:** `ix_activity_players_activity_id` unique=False cols=['activity_id']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C00B740> |  |
| `activity_id` | `CHAR(32)` | False |  | activities.id |
| `rank` | `INTEGER` | False |  |  |
| `name` | `VARCHAR(80)` | False |  |  |
| `category` | `VARCHAR(40)` | False |  |  |
| `class_name` | `VARCHAR(40)` | False |  |  |
| `school` | `VARCHAR(80)` | False |  |  |
| `rating` | `VARCHAR(16)` | False |  |  |
| `score` | `VARCHAR(16)` | False |  |  |
| `tie_break` | `VARCHAR(16)` | False |  |  |
| `result` | `VARCHAR(24)` | False | Completed |  |

### `admission_enquiries`

- **Domain:** Admissions
- **Primary key:** `id`
- **Unique constraint:** `None` (enquiry_code)
- **Unique column:** `enquiry_code`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11BF62DE0> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `enquiry_code` | `VARCHAR(32)` | False |  |  |
| `name` | `VARCHAR(160)` | False |  |  |
| `mobile_number` | `VARCHAR(20)` | False |  |  |
| `email` | `VARCHAR(255)` | True |  |  |
| `gender` | `VARCHAR(20)` | True |  |  |
| `address` | `TEXT` | True |  |  |
| `description` | `TEXT` | True |  |  |
| `note` | `TEXT` | True |  |  |
| `enquiry_date` | `DATE` | True |  |  |
| `next_follow_up_date` | `DATE` | True |  |  |
| `assigned_to` | `VARCHAR(120)` | True |  |  |
| `reference` | `VARCHAR(80)` | True |  |  |
| `source` | `VARCHAR(80)` | True |  |  |
| `class_name` | `VARCHAR(40)` | False |  |  |
| `number_of_child` | `VARCHAR(20)` | True |  |  |
| `city` | `VARCHAR(80)` | True |  |  |
| `state` | `VARCHAR(80)` | True |  |  |
| `profile_image_file_id` | `CHAR(32)` | True |  | file_assets.id |
| `status` | `VARCHAR(32)` | False | Active |  |
| `converted_admission_id` | `CHAR(32)` | True |  |  |
| `student_name` | `VARCHAR(160)` | True |  |  |
| `guardian_name` | `VARCHAR(160)` | True |  |  |
| `guardian_phone` | `VARCHAR(20)` | True |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11BF631A0> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `admission_referrals`

- **Domain:** Admissions
- **Primary key:** `id`
- **Unique constraint:** `None` (admission_id)
- **Unique column:** `admission_id`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11BFD05E0> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `admission_id` | `CHAR(32)` | False |  | admissions.id |
| `referrer_type` | `VARCHAR(20)` | False |  |  |
| `referrer_name` | `VARCHAR(160)` | False |  |  |
| `referrer_contact` | `VARCHAR(80)` | True |  |  |
| `referrer_student_admission_no` | `VARCHAR(40)` | True |  |  |
| `notes` | `TEXT` | True |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11BFD0900> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `admissions`

- **Domain:** Admissions
- **Primary key:** `id`
- **Unique constraint:** `None` (admission_code)
- **Unique column:** `admission_code`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11BF98CC0> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `enquiry_id` | `CHAR(32)` | True |  | admission_enquiries.id |
| `admission_code` | `VARCHAR(32)` | False |  |  |
| `admission_date` | `DATE` | True |  |  |
| `class_name` | `VARCHAR(40)` | False |  |  |
| `registration_fees` | `VARCHAR(40)` | True |  |  |
| `batch_start_year` | `INTEGER` | True |  |  |
| `batch_end_year` | `INTEGER` | True |  |  |
| `first_name` | `VARCHAR(80)` | False |  |  |
| `middle_name` | `VARCHAR(80)` | True |  |  |
| `last_name` | `VARCHAR(80)` | True |  |  |
| `gender` | `VARCHAR(20)` | True |  |  |
| `religion` | `VARCHAR(40)` | True |  |  |
| `caste` | `VARCHAR(40)` | True |  |  |
| `address` | `TEXT` | True |  |  |
| `date_of_birth` | `DATE` | True |  |  |
| `country` | `VARCHAR(80)` | True |  |  |
| `state` | `VARCHAR(80)` | True |  |  |
| `city` | `VARCHAR(80)` | True |  |  |
| `zip_code` | `VARCHAR(40)` | True |  |  |
| `mobile_number` | `VARCHAR(20)` | False |  |  |
| `alt_mobile_number` | `VARCHAR(20)` | True |  |  |
| `email` | `VARCHAR(255)` | True |  |  |
| `previous_school` | `VARCHAR(160)` | True |  |  |
| `blood_group` | `VARCHAR(16)` | True |  |  |
| `height` | `VARCHAR(20)` | True |  |  |
| `weight` | `VARCHAR(20)` | True |  |  |
| `medical_history` | `TEXT` | True |  |  |
| `profile_image_file_id` | `CHAR(32)` | True |  | file_assets.id |
| `mode_of_transport` | `VARCHAR(40)` | True |  |  |
| `route` | `VARCHAR(80)` | True |  |  |
| `bus_stop` | `VARCHAR(80)` | True |  |  |
| `father_name` | `VARCHAR(160)` | True |  |  |
| `mother_name` | `VARCHAR(160)` | True |  |  |
| `father_occupation` | `VARCHAR(120)` | True |  |  |
| `mother_occupation` | `VARCHAR(120)` | True |  |  |
| `father_income` | `VARCHAR(40)` | True |  |  |
| `mother_income` | `VARCHAR(40)` | True |  |  |
| `siblings` | `VARCHAR(120)` | True |  |  |
| `parent_address` | `TEXT` | True |  |  |
| `parent_country` | `VARCHAR(80)` | True |  |  |
| `parent_state` | `VARCHAR(80)` | True |  |  |
| `parent_city` | `VARCHAR(80)` | True |  |  |
| `parent_zip_code` | `VARCHAR(40)` | True |  |  |
| `parent_mobile_number` | `VARCHAR(20)` | True |  |  |
| `parent_alt_mobile_number` | `VARCHAR(20)` | True |  |  |
| `parent_email` | `VARCHAR(255)` | True |  |  |
| `parent_account_email` | `VARCHAR(255)` | True |  |  |
| `student_account_email` | `VARCHAR(255)` | True |  |  |
| `parent_pending_password_hash` | `VARCHAR(255)` | True |  |  |
| `student_pending_password_hash` | `VARCHAR(255)` | True |  |  |
| `fees_group` | `VARCHAR(80)` | True |  |  |
| `status` | `VARCHAR(32)` | False | Active |  |
| `enrolled_student_id` | `CHAR(32)` | True |  | students.id |
| `enrolled_at` | `DATETIME` | True |  |  |
| `parent_user_id` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11BF99440> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `announcement_replies`

- **Domain:** Comms
- **Primary key:** `id`
- **Index:** `ix_announcement_replies_announcement_id` unique=False cols=['announcement_id']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C0328E0> |  |
| `announcement_id` | `CHAR(32)` | False |  | announcements.id |
| `user_id` | `CHAR(32)` | False |  | users.id |
| `role_code` | `VARCHAR(48)` | False |  |  |
| `text` | `TEXT` | False |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C0336A0> |  |

### `announcement_responses`

- **Domain:** Comms
- **Primary key:** `id`
- **Unique constraint:** `uq_announcement_responses_user` (announcement_id, user_id)
- **Index:** `ix_announcement_responses_announcement_id` unique=False cols=['announcement_id']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C032340> |  |
| `announcement_id` | `CHAR(32)` | False |  | announcements.id |
| `user_id` | `CHAR(32)` | False |  | users.id |
| `acknowledged_at` | `DATETIME` | False | <function utcnow at 0x000001B11C032660> |  |

### `announcements`

- **Domain:** Comms
- **Primary key:** `id`
- **Unique constraint:** `uq_announcements_campus_code` (campus_id, code)

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C030B80> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `code` | `VARCHAR(16)` | False |  |  |
| `title` | `VARCHAR(200)` | False |  |  |
| `category` | `VARCHAR(60)` | False |  |  |
| `message` | `TEXT` | False |  |  |
| `sent_by` | `VARCHAR(80)` | False |  |  |
| `sender_role` | `VARCHAR(48)` | False |  |  |
| `announcement_date` | `DATE` | False |  |  |
| `attachment_file_id` | `CHAR(32)` | True |  | file_assets.id |
| `audience` | `JSON` | False | <function list at 0x000001B11C030EA0> |  |
| `created_by` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C031080> |  |

### `approval_events`

- **Domain:** Workflow
- **Primary key:** `id`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C0C9A80> |  |
| `approval_id` | `CHAR(32)` | False |  | approval_requests.id |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `level` | `INTEGER` | False |  |  |
| `action` | `VARCHAR(20)` | False |  |  |
| `actor_id` | `CHAR(32)` | False |  | users.id |
| `actor_role` | `VARCHAR(48)` | False |  |  |
| `comment` | `TEXT` | True |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C0C9EE0> |  |

### `approval_requests`

- **Domain:** Workflow
- **Primary key:** `id`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C0C8680> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `entity_type` | `VARCHAR(48)` | False |  |  |
| `entity_id` | `VARCHAR(80)` | False |  |  |
| `title` | `VARCHAR(200)` | True |  |  |
| `initiator_id` | `CHAR(32)` | False |  | users.id |
| `initiator_role` | `VARCHAR(48)` | False |  |  |
| `chain_json` | `TEXT` | False |  |  |
| `current_level` | `INTEGER` | False | 0 |  |
| `status` | `VARCHAR(20)` | False | pending |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C0C89A0> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `audit_logs`

- **Domain:** Audit
- **Primary key:** `id`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C1ACAE0> |  |
| `actor_id` | `CHAR(32)` | True |  | users.id |
| `campus_id` | `CHAR(32)` | True |  | campuses.id |
| `action` | `VARCHAR(64)` | False |  |  |
| `entity_type` | `VARCHAR(64)` | False |  |  |
| `entity_id` | `VARCHAR(64)` | True |  |  |
| `details` | `TEXT` | True |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C1ACE00> |  |

### `audit_records`

- **Domain:** Audit JSON
- **Primary key:** `id`
- **Unique constraint:** `uq_campus_audit_record` (campus_id, collection, public_id)
- **Index:** `ix_audit_records_campus_id` unique=False cols=['campus_id']
- **Index:** `ix_audit_records_collection` unique=False cols=['collection']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11BF60680> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `collection` | `VARCHAR(80)` | False |  |  |
| `public_id` | `VARCHAR(80)` | False |  |  |
| `body` | `JSON` | False |  |  |
| `created_by` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11BF60A40> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `calendar_events`

- **Domain:** Calendar
- **Primary key:** `id`
- **Unique constraint:** `uq_calendar_events_campus_code` (campus_id, code)

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C0604A0> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `code` | `VARCHAR(32)` | False |  |  |
| `event_type` | `VARCHAR(16)` | False |  |  |
| `title` | `VARCHAR(200)` | False |  |  |
| `start_date` | `DATE` | False |  |  |
| `end_date` | `DATE` | False |  |  |
| `all_day` | `BOOLEAN` | False | True |  |
| `start_time` | `VARCHAR(5)` | True |  |  |
| `end_time` | `VARCHAR(5)` | True |  |  |
| `description` | `TEXT` | False |  |  |
| `created_by` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C060900> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `campuses`

- **Domain:** Tenant
- **Primary key:** `id`
- **Unique constraint:** `None` (code)
- **Unique column:** `code`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C1AFBA0> |  |
| `code` | `VARCHAR(32)` | False |  |  |
| `name` | `VARCHAR(200)` | False |  |  |
| `city` | `VARCHAR(80)` | False |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C1AFC40> |  |

### `conversation_participants`

- **Domain:** Comms
- **Primary key:** `id`
- **Unique constraint:** `uq_conversation_participants_user` (conversation_id, user_id)
- **Index:** `ix_conversation_participants_user_id` unique=False cols=['user_id']
- **Index:** `ix_conversation_participants_conversation_id` unique=False cols=['conversation_id']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C062160> |  |
| `conversation_id` | `CHAR(32)` | False |  | conversations.id |
| `user_id` | `CHAR(32)` | False |  | users.id |
| `archived` | `BOOLEAN` | False | False |  |
| `deleted` | `BOOLEAN` | False | False |  |
| `last_read_at` | `DATETIME` | True |  |  |

### `conversations`

- **Domain:** Comms
- **Primary key:** `id`
- **Unique constraint:** `uq_conversations_campus_pair` (campus_id, pair_key)

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C061D00> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `pair_key` | `VARCHAR(80)` | False |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C061EE0> |  |

### `coordinator_grade_bands`

- **Domain:** Admissions
- **Primary key:** `id`
- **Index:** `ix_coordinator_grade_bands_user_id` unique=False cols=['user_id']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11BFD3BA0> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `user_id` | `CHAR(32)` | False |  | users.id |
| `grade_from` | `INTEGER` | False |  |  |
| `grade_to` | `INTEGER` | False |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11BFD3EC0> |  |

### `document_items`

- **Domain:** Documents
- **Primary key:** `id`
- **Unique constraint:** `uq_document_items_record_key` (record_id, doc_key)
- **Index:** `ix_document_items_file_id` unique=False cols=['file_id']
- **Index:** `ix_document_items_record_id` unique=False cols=['record_id']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C1DE340> |  |
| `record_id` | `CHAR(32)` | False |  | document_records.id |
| `doc_key` | `VARCHAR(80)` | False |  |  |
| `label` | `VARCHAR(80)` | False |  |  |
| `file_id` | `CHAR(32)` | False |  | file_assets.id |
| `status` | `VARCHAR(16)` | False | Pending |  |
| `uploaded_by` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C1DE700> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `document_records`

- **Domain:** Documents
- **Primary key:** `id`
- **Unique constraint:** `uq_document_records_employee` (employee_id)
- **Unique constraint:** `uq_document_records_student` (student_id)

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C1DCAE0> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `subject_type` | `VARCHAR(16)` | False |  |  |
| `student_id` | `CHAR(32)` | True |  | students.id |
| `employee_id` | `CHAR(32)` | True |  | hr_employees.id |
| `submitted_date` | `DATE` | True |  |  |
| `status` | `VARCHAR(16)` | False | In Progress |  |
| `created_by` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C1DCFE0> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `escalations`

- **Domain:** Workflow
- **Primary key:** `id`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C0F53A0> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `esc_no` | `INTEGER` | False |  |  |
| `raised_by_id` | `CHAR(32)` | False |  | users.id |
| `raised_by_role` | `VARCHAR(48)` | False |  |  |
| `to_role` | `VARCHAR(48)` | False |  |  |
| `to_user_id` | `CHAR(32)` | True |  | users.id |
| `description` | `VARCHAR(300)` | False |  |  |
| `full_description` | `TEXT` | False |  |  |
| `remarks` | `TEXT` | True |  |  |
| `status` | `VARCHAR(16)` | False | Pending |  |
| `resolution_note` | `TEXT` | True |  |  |
| `level` | `INTEGER` | False | 0 |  |
| `resolve_by` | `DATETIME` | False |  |  |
| `resolved_at` | `DATETIME` | True |  |  |
| `trail_json` | `TEXT` | False | [] |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C0F5940> |  |

### `exam_types`

- **Domain:** Exams
- **Primary key:** `id`
- **Unique constraint:** `uq_exam_type_campus_code` (campus_id, code)

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C11DF80> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `code` | `VARCHAR(24)` | False |  |  |
| `name` | `VARCHAR(80)` | False |  |  |
| `active` | `BOOLEAN` | False | True |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C11E2A0> |  |

### `exam_weightages`

- **Domain:** Exams
- **Primary key:** `id`
- **Unique constraint:** `uq_weightage` (campus_id, class_name, exam_type_id)

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C148720> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `class_name` | `VARCHAR(40)` | False |  |  |
| `exam_type_id` | `CHAR(32)` | False |  | exam_types.id |
| `weight` | `FLOAT` | False |  |  |
| `updated_by` | `CHAR(32)` | True |  | users.id |
| `updated_at` | `DATETIME` | False | <function utcnow at 0x000001B11C148B80> |  |

### `exams`

- **Domain:** Exams
- **Primary key:** `id`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C11EF20> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `exam_type_id` | `CHAR(32)` | False |  | exam_types.id |
| `name` | `VARCHAR(120)` | False |  |  |
| `class_name` | `VARCHAR(40)` | False |  |  |
| `academic_year` | `VARCHAR(40)` | True |  |  |
| `start_date` | `DATE` | False |  |  |
| `end_date` | `DATE` | False |  |  |
| `schedule` | `JSON` | True |  |  |
| `created_by` | `CHAR(32)` | False |  | users.id |
| `approval_id` | `CHAR(32)` | True |  | approval_requests.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C11F560> |  |

### `file_assets`

- **Domain:** Documents
- **Primary key:** `id`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C1DFB00> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `uploaded_by` | `CHAR(32)` | True |  | users.id |
| `original_name` | `VARCHAR(255)` | False |  |  |
| `stored_name` | `VARCHAR(255)` | False |  |  |
| `content_type` | `VARCHAR(120)` | False | application/octet-stream |  |
| `size_bytes` | `INTEGER` | False | 0 |  |
| `resource_type` | `VARCHAR(64)` | False | attachment |  |
| `resource_id` | `VARCHAR(64)` | True |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C1DFE20> |  |

### `finance_records`

- **Domain:** Finance JSON
- **Primary key:** `id`
- **Unique constraint:** `uq_finance_record` (campus_id, collection, public_id)
- **Index:** `ix_finance_records_campus_id` unique=False cols=['campus_id']
- **Index:** `ix_finance_records_collection` unique=False cols=['collection']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C214E00> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `collection` | `VARCHAR(40)` | False |  |  |
| `public_id` | `VARCHAR(80)` | False |  |  |
| `body` | `JSON` | False |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C214FE0> |  |

### `financial_years`

- **Domain:** Academics
- **Primary key:** `id`
- **Unique constraint:** `None` (campus_id, name)

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11BEF68E0> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `name` | `VARCHAR(50)` | False |  |  |
| `start_date` | `DATE` | False |  |  |
| `end_date` | `DATE` | False |  |  |
| `is_current` | `BOOLEAN` | False | False |  |
| `is_active` | `BOOLEAN` | False | True |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11BEF6DE0> |  |

### `front_office_records`

- **Domain:** FO JSON
- **Primary key:** `id`
- **Unique constraint:** `uq_front_office_record` (campus_id, collection, public_id)
- **Index:** `ix_front_office_records_collection` unique=False cols=['collection']
- **Index:** `ix_front_office_records_campus_id` unique=False cols=['campus_id']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C215F80> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `collection` | `VARCHAR(40)` | False |  |  |
| `public_id` | `VARCHAR(80)` | False |  |  |
| `body` | `JSON` | False |  |  |
| `created_by` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C2162A0> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `guardians`

- **Domain:** Admissions
- **Primary key:** `id`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C008C20> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `student_id` | `CHAR(32)` | False |  | students.id |
| `full_name` | `VARCHAR(160)` | False |  |  |
| `phone` | `VARCHAR(20)` | False |  |  |
| `relationship` | `VARCHAR(40)` | False | parent |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C008F40> |  |

### `hr_employees`

- **Domain:** HR
- **Primary key:** `id`
- **Unique constraint:** `None` (employee_code)
- **Unique constraint:** `None` (email)
- **Unique column:** `employee_code`
- **Unique column:** `email`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C217380> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `employee_code` | `VARCHAR(40)` | False |  |  |
| `first_name` | `VARCHAR(80)` | False |  |  |
| `last_name` | `VARCHAR(80)` | False |  |  |
| `email` | `VARCHAR(255)` | False |  |  |
| `phone` | `VARCHAR(40)` | True |  |  |
| `gender` | `VARCHAR(20)` | True |  |  |
| `date_of_birth` | `VARCHAR(20)` | True |  |  |
| `address` | `VARCHAR(255)` | True |  |  |
| `department` | `VARCHAR(80)` | True |  |  |
| `designation` | `VARCHAR(120)` | True |  |  |
| `joining_date` | `VARCHAR(20)` | True |  |  |
| `status` | `VARCHAR(32)` | True | Active |  |
| `reporting_manager` | `VARCHAR(120)` | True |  |  |
| `role_title` | `VARCHAR(80)` | True |  |  |
| `qualification` | `VARCHAR(160)` | True |  |  |
| `experience` | `VARCHAR(80)` | True |  |  |
| `emergency_contact` | `VARCHAR(160)` | True |  |  |
| `employment_type` | `VARCHAR(40)` | True |  |  |
| `category` | `VARCHAR(80)` | True |  |  |
| `gross_salary` | `INTEGER` | True | 0 |  |
| `other_allowance` | `INTEGER` | True | 0 |  |
| `special_deduction` | `INTEGER` | True | 0 |  |
| `other_employer_benefits` | `INTEGER` | True | 0 |  |
| `extra` | `JSON` | True |  |  |
| `user_id` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C2176A0> |  |

### `hr_records`

- **Domain:** HR JSON
- **Primary key:** `id`
- **Unique constraint:** `uq_hr_record` (campus_id, collection, public_id)
- **Index:** `ix_hr_records_campus_id` unique=False cols=['campus_id']
- **Index:** `ix_hr_records_collection` unique=False cols=['collection']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C249300> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `collection` | `VARCHAR(40)` | False |  |  |
| `public_id` | `VARCHAR(80)` | False |  |  |
| `body` | `JSON` | False |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C2494E0> |  |

### `leave_requests`

- **Domain:** HR
- **Primary key:** `id`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C178220> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `request_no` | `INTEGER` | False |  |  |
| `requester_id` | `CHAR(32)` | False |  | users.id |
| `requester_role` | `VARCHAR(48)` | False |  |  |
| `leave_type` | `VARCHAR(32)` | False |  |  |
| `from_date` | `DATE` | False |  |  |
| `to_date` | `DATE` | False |  |  |
| `total_days` | `INTEGER` | False |  |  |
| `hours` | `FLOAT` | True |  |  |
| `reason` | `TEXT` | False |  |  |
| `approval_id` | `CHAR(32)` | True |  | approval_requests.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C178680> |  |

### `lesson_plans`

- **Domain:** Academics
- **Primary key:** `id`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C179A80> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `teacher_id` | `CHAR(32)` | False |  | users.id |
| `class_name` | `VARCHAR(64)` | False |  |  |
| `section` | `VARCHAR(16)` | True |  |  |
| `subject` | `VARCHAR(80)` | False |  |  |
| `month` | `VARCHAR(7)` | False |  |  |
| `title` | `VARCHAR(200)` | True |  |  |
| `content_json` | `TEXT` | False | {} |  |
| `file_id` | `CHAR(32)` | True |  |  |
| `version` | `INTEGER` | False | 1 |  |
| `approval_id` | `CHAR(32)` | True |  | approval_requests.id |
| `late` | `BOOLEAN` | False | False |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C17A020> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `mark_entries`

- **Domain:** Exams
- **Primary key:** `id`
- **Unique constraint:** `uq_mark_batch_student` (batch_id, student_id)

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C14B060> |  |
| `batch_id` | `CHAR(32)` | False |  | marks_batches.id |
| `student_id` | `CHAR(32)` | False |  | students.id |
| `marks` | `FLOAT` | True |  |  |
| `absent` | `BOOLEAN` | False | False |  |
| `remarks` | `TEXT` | True |  |  |

### `marks_batches`

- **Domain:** Exams
- **Primary key:** `id`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C149940> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `exam_id` | `CHAR(32)` | False |  | exams.id |
| `teacher_id` | `CHAR(32)` | False |  | users.id |
| `subject` | `VARCHAR(80)` | False |  |  |
| `section` | `VARCHAR(16)` | True |  |  |
| `max_marks` | `FLOAT` | False |  |  |
| `version` | `INTEGER` | False | 1 |  |
| `approval_id` | `CHAR(32)` | True |  | approval_requests.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C149F80> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `messages`

- **Domain:** Comms
- **Primary key:** `id`
- **Index:** `ix_messages_conversation_id` unique=False cols=['conversation_id']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C063EC0> |  |
| `conversation_id` | `CHAR(32)` | False |  | conversations.id |
| `sender_id` | `CHAR(32)` | False |  | users.id |
| `body` | `TEXT` | False |  |  |
| `file_id` | `CHAR(32)` | True |  | file_assets.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C090360> |  |

### `notification_reads`

- **Domain:** Workflow
- **Primary key:** `id`
- **Unique constraint:** `uq_notification_reads_user` (notification_id, user_id)
- **Index:** `ix_notification_reads_user_id` unique=False cols=['user_id']
- **Index:** `ix_notification_reads_notification_id` unique=False cols=['notification_id']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C0F4040> |  |
| `notification_id` | `CHAR(32)` | False |  | notifications.id |
| `user_id` | `CHAR(32)` | False |  | users.id |
| `read_at` | `DATETIME` | False | <function utcnow at 0x000001B11C0F4360> |  |

### `notifications`

- **Domain:** Workflow
- **Primary key:** `id`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C0CADE0> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `user_id` | `CHAR(32)` | True |  | users.id |
| `role_code` | `VARCHAR(48)` | True |  |  |
| `title` | `VARCHAR(200)` | False |  |  |
| `body` | `TEXT` | True |  |  |
| `entity_type` | `VARCHAR(48)` | True |  |  |
| `entity_id` | `VARCHAR(80)` | True |  |  |
| `read_at` | `DATETIME` | True |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C0CB100> |  |

### `ops_records`

- **Domain:** Ops JSON
- **Primary key:** `id`
- **Unique constraint:** `uq_ops_record` (campus_id, collection, public_id)
- **Index:** `ix_ops_records_collection` unique=False cols=['collection']
- **Index:** `ix_ops_records_campus_id` unique=False cols=['campus_id']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11BF619E0> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `collection` | `VARCHAR(80)` | False |  |  |
| `public_id` | `VARCHAR(80)` | False |  |  |
| `body` | `JSON` | False |  |  |
| `created_by` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11BF61DA0> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `otp_challenges`

- **Domain:** Identity
- **Primary key:** `id`
- **Index:** `ix_otp_challenges_email` unique=False cols=['email']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C24A3E0> |  |
| `email` | `VARCHAR(255)` | False |  |  |
| `code_hash` | `VARCHAR(255)` | False |  |  |
| `expires_at` | `DATETIME` | False |  |  |
| `consumed_at` | `DATETIME` | True |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C24A480> |  |

### `permissions`

- **Domain:** Identity
- **Primary key:** `id`
- **Unique constraint:** `None` (code)
- **Unique column:** `code`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C24B600> |  |
| `code` | `VARCHAR(80)` | False |  |  |
| `description` | `VARCHAR(200)` | False |  |  |

### `role_permissions`

- **Domain:** Identity
- **Primary key:** `id`
- **Unique constraint:** `None` (role_id, permission_id)

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C2680E0> |  |
| `role_id` | `CHAR(32)` | False |  | roles.id |
| `permission_id` | `CHAR(32)` | False |  | permissions.id |

### `roles`

- **Domain:** Identity
- **Primary key:** `id`
- **Unique constraint:** `None` (code)
- **Unique column:** `code`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C24B2E0> |  |
| `code` | `VARCHAR(64)` | False |  |  |
| `name` | `VARCHAR(120)` | False |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C24B380> |  |

### `school_classes`

- **Domain:** Academics
- **Primary key:** `id`
- **Unique constraint:** `uq_school_class_campus_year_name` (campus_id, academic_year_id, name)

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11BEF7BA0> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `academic_year_id` | `CHAR(32)` | False |  | academic_years.id |
| `name` | `VARCHAR(40)` | False |  |  |
| `section` | `VARCHAR(20)` | True |  |  |
| `is_active` | `BOOLEAN` | False | True |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11BF2C040> |  |

### `sections`

- **Domain:** Academics
- **Primary key:** `id`
- **Unique constraint:** `None` (campus_id, class_id, name)
- **Index:** `ix_sections_class_teacher_user_id` unique=False cols=['class_teacher_user_id']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11BF2CE00> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `class_id` | `CHAR(32)` | False |  | school_classes.id |
| `name` | `VARCHAR(20)` | False |  |  |
| `is_active` | `BOOLEAN` | False | True |  |
| `capacity` | `INTEGER` | True |  |  |
| `room_number` | `VARCHAR(20)` | True |  |  |
| `class_teacher_user_id` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11BF2D440> |  |

### `student_attendance`

- **Domain:** Attendance
- **Primary key:** `id`
- **Unique constraint:** `uq_student_attendance_day_session` (campus_id, student_id, attendance_date, session)

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C17B380> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `student_id` | `CHAR(32)` | False |  | students.id |
| `attendance_date` | `DATE` | False |  |  |
| `session` | `VARCHAR(2)` | False | FN |  |
| `class_name` | `VARCHAR(40)` | False |  |  |
| `section` | `VARCHAR(20)` | True |  |  |
| `status` | `VARCHAR(20)` | False |  |  |
| `in_out_status` | `VARCHAR(40)` | True |  |  |
| `check_in_time` | `VARCHAR(20)` | True |  |  |
| `check_out_time` | `VARCHAR(20)` | True |  |  |
| `marked_by_user_id` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C17B7E0> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `students`

- **Domain:** Admissions
- **Primary key:** `id`
- **Unique constraint:** `None` (admission_number)
- **Unique column:** `admission_number`
- **Index:** `ix_students_student_user_id` unique=False cols=['student_user_id']
- **Index:** `ix_students_placement_status` unique=False cols=['placement_status']
- **Index:** `ix_students_section_id` unique=False cols=['section_id']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11BFD19E0> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `enquiry_id` | `CHAR(32)` | True |  | admission_enquiries.id |
| `admission_id` | `CHAR(32)` | True |  |  |
| `admission_number` | `VARCHAR(32)` | False |  |  |
| `full_name` | `VARCHAR(160)` | False |  |  |
| `class_name` | `VARCHAR(40)` | False |  |  |
| `academic_year_id` | `CHAR(32)` | True |  | academic_years.id |
| `class_id` | `CHAR(32)` | True |  | school_classes.id |
| `section_id` | `CHAR(32)` | True |  | sections.id |
| `section` | `VARCHAR(20)` | True |  |  |
| `roll_number` | `INTEGER` | True |  |  |
| `placement_status` | `VARCHAR(20)` | False | pending |  |
| `parent_user_id` | `CHAR(32)` | True |  | users.id |
| `student_user_id` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11BFD2340> |  |

### `subjects`

- **Domain:** Academics
- **Primary key:** `id`
- **Unique constraint:** `None` (campus_id, code)

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11BF2E480> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `code` | `VARCHAR(20)` | False |  |  |
| `name` | `VARCHAR(120)` | False |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11BF2E660> |  |

### `substitute_duties`

- **Domain:** Attendance
- **Primary key:** `id`
- **Index:** `ix_substitute_duties_teacher_date` unique=False cols=['campus_id', 'teacher_user_id', 'duty_date']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C1ADD00> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `teacher_user_id` | `CHAR(32)` | False |  | users.id |
| `class_id` | `CHAR(32)` | False |  | school_classes.id |
| `section_id` | `CHAR(32)` | False |  | sections.id |
| `duty_date` | `DATE` | False |  |  |
| `period` | `VARCHAR(20)` | False |  |  |
| `start_time` | `TIME` | False |  |  |
| `end_time` | `TIME` | False |  |  |
| `status` | `VARCHAR(16)` | False | active |  |
| `note` | `TEXT` | True |  |  |
| `assigned_by` | `CHAR(32)` | False |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C1AE480> |  |
| `revoked_by` | `CHAR(32)` | True |  | users.id |
| `revoked_at` | `DATETIME` | True |  |  |
| `revoke_reason` | `TEXT` | True |  |  |

### `task_events`

- **Domain:** Workflow
- **Primary key:** `id`
- **Index:** `ix_task_events_client_ref` unique=False cols=['client_ref']
- **Index:** `ix_task_events_task_id` unique=False cols=['task_id']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C11C7C0> |  |
| `task_id` | `CHAR(32)` | False |  | tasks.id |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `action` | `VARCHAR(16)` | False |  |  |
| `from_status` | `VARCHAR(16)` | True |  |  |
| `to_status` | `VARCHAR(16)` | False |  |  |
| `actor_id` | `CHAR(32)` | False |  | users.id |
| `actor_role` | `VARCHAR(48)` | False |  |  |
| `remark` | `TEXT` | True |  |  |
| `client_ref` | `VARCHAR(64)` | True |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C11CC20> |  |

### `tasks`

- **Domain:** Workflow
- **Primary key:** `id`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C0F6D40> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `task_no` | `INTEGER` | False |  |  |
| `assigned_by_id` | `CHAR(32)` | False |  | users.id |
| `assigned_by_role` | `VARCHAR(48)` | False |  |  |
| `assignee_id` | `CHAR(32)` | False |  | users.id |
| `assignee_role` | `VARCHAR(48)` | False |  |  |
| `title` | `VARCHAR(200)` | False |  |  |
| `description` | `TEXT` | True |  |  |
| `priority` | `VARCHAR(8)` | False | Medium |  |
| `due_date` | `DATE` | False |  |  |
| `status` | `VARCHAR(16)` | False | Incomplete |  |
| `completed_at` | `DATETIME` | True |  |  |
| `overdue_notified` | `BOOLEAN` | False | False |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C0F7420> |  |

### `tc_request_nocs`

- **Domain:** TC
- **Primary key:** `id`
- **Unique constraint:** `uq_tc_request_nocs_request_role` (tc_request_id, role_code)
- **Index:** `ix_tc_request_nocs_tc_request_id` unique=False cols=['tc_request_id']
- **Index:** `ix_tc_request_nocs_campus_id` unique=False cols=['campus_id']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C092DE0> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `tc_request_id` | `CHAR(32)` | False |  | tc_requests.id |
| `role_code` | `VARCHAR(64)` | False |  |  |
| `role_label` | `VARCHAR(120)` | False |  |  |
| `status` | `VARCHAR(20)` | False | Pending |  |
| `remarks` | `TEXT` | False |  |  |
| `decided_by` | `CHAR(32)` | True |  | users.id |
| `decided_at` | `DATETIME` | True |  |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C0931A0> |  |

### `tc_requests`

- **Domain:** TC
- **Primary key:** `id`
- **Unique constraint:** `uq_tc_requests_campus_code` (campus_id, code)
- **Index:** `ix_tc_requests_student_id` unique=False cols=['student_id']

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C091300> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `code` | `VARCHAR(20)` | False |  |  |
| `student_id` | `CHAR(32)` | False |  | students.id |
| `reason` | `TEXT` | False |  |  |
| `transfer_to` | `VARCHAR(200)` | False |  |  |
| `last_date_of_attendance` | `DATE` | True |  |  |
| `requested_by` | `VARCHAR(80)` | False |  |  |
| `requested_on` | `DATE` | False |  |  |
| `status` | `VARCHAR(40)` | False | Pending PRM Review |  |
| `prm_remarks` | `TEXT` | False |  |  |
| `admin_remarks` | `TEXT` | False |  |  |
| `forwarded_on` | `DATE` | True |  |  |
| `decided_on` | `DATE` | True |  |  |
| `tc_number` | `VARCHAR(40)` | False |  |  |
| `created_by` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C0916C0> |  |
| `updated_at` | `DATETIME` | True |  |  |

### `user_profiles`

- **Domain:** Identity
- **Primary key:** `id`
- **Unique constraint:** `None` (user_id)
- **Unique constraint:** `None` (staff_code)
- **Unique column:** `user_id`
- **Unique column:** `staff_code`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C26ACA0> |  |
| `user_id` | `CHAR(32)` | False |  | users.id |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `staff_code` | `VARCHAR(32)` | False |  |  |
| `first_name` | `VARCHAR(120)` | False |  |  |
| `middle_name` | `VARCHAR(120)` | False |  |  |
| `last_name` | `VARCHAR(120)` | False |  |  |
| `gender` | `VARCHAR(24)` | False |  |  |
| `mobile_number` | `VARCHAR(32)` | False |  |  |
| `extra` | `JSON` | False | <function dict at 0x000001B11C26AFC0> |  |
| `created_by` | `CHAR(32)` | True |  | users.id |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C26B1A0> |  |
| `updated_at` | `DATETIME` | False | <function utcnow at 0x000001B11C26B240> |  |

### `users`

- **Domain:** Identity
- **Primary key:** `id`
- **Unique constraint:** `None` (email)
- **Unique column:** `email`

| Column | Type | Nullable | Default | FK |
|---|---|---|---|---|
| `id` | `CHAR(32)` | False | <function uuid4 at 0x000001B11C24B240> |  |
| `campus_id` | `CHAR(32)` | False |  | campuses.id |
| `role_id` | `CHAR(32)` | False |  | roles.id |
| `email` | `VARCHAR(255)` | False |  |  |
| `password_hash` | `VARCHAR(255)` | False |  |  |
| `is_active` | `BOOLEAN` | False | True |  |
| `must_change_password` | `BOOLEAN` | False | False |  |
| `created_at` | `DATETIME` | False | <function utcnow at 0x000001B11C269D00> |  |

---

## 4. JSON collection inventory (logical schema inside bags)

### 4.1 `ops_records`

Unique `(campus_id, collection, public_id)`. Body is free-form JSON validated lightly in services.

| Collection | Domain | Primary roles |
|---|---|---|
| `library-books` | Library | librarian, admin* |
| `library-issues` | Library | librarian, admin* |
| `library-members` | Library | librarian, admin* |
| `gate-visitors` | Gate | gatekeeper, gatekeepermanager, prm, admin* |
| `gate-registers` | Gate | gatekeeper, gatekeepermanager, prm, admin* |
| `gate-handover` | Gate | gatekeeper, gatekeepermanager, prm, admin* |
| `gate-vendors` | Gate | gatekeeper, gatekeepermanager, prm, admin* |
| `gate-incidents` | Gate | gatekeeper, gatekeepermanager, prm, admin* |
| `gate-duties` | Gate | gatekeeper, gatekeepermanager, prm, admin* |
| `gate-duty-assignments` | Gate | gatekeeper, gatekeepermanager, prm, admin* |
| `gate-team-attendance` | Gate | gatekeeper, gatekeepermanager, prm, admin* |
| `transport-drivers` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-vehicles` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-vehicle-health` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-routes` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-route-stops` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-student-assignments` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-duties` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-maintenance` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-expenses` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-budget-requests` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-approval-requests` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-service-centers` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-building-maintenance` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-driver-fuel` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-driver-maintenance` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-student-attendance` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `transport-driver-my-duties` | Transport | transportmanager, driver, admin* (+ principal/finance on subsets) |
| `canteen-menu` | Canteen | canteenmanager, admin* |
| `canteen-inventory` | Canteen | canteenmanager, admin* |
| `canteen-orders` | Canteen | canteenmanager, admin* |
| `canteen-requests` | Canteen | canteenmanager, admin* |
| `canteen-reports` | Canteen | canteenmanager, admin* |
| `it-assets` | IT | itsupportmanager, admin* |
| `it-asset-service` | IT | itsupportmanager, admin* |
| `it-asset-transfers` | IT | itsupportmanager, admin* |
| `it-support-tickets` | IT | itsupportmanager, admin* |
| `it-maintenance-inventory` | IT | itsupportmanager, admin* |
| `it-requests` | IT | itsupportmanager, admin* |
| `it-procurement` | IT | itsupportmanager, admin* |
| `stationery-inventory` | Stationery | stationerystoremanager, admin* |
| `stationery-issue-returns` | Stationery | stationerystoremanager, admin* |
| `stationery-requests` | Stationery | stationerystoremanager, admin* |
| `stationery-requirements` | Stationery | stationerystoremanager, admin* |
| `stationery-stock-issues` | Stationery | stationerystoremanager, admin* |
| `stationery-critical-alerts` | Stationery | stationerystoremanager, admin* |
| `stationery-procurement` | Stationery | stationerystoremanager, admin* |
| `hk-inventory` | Housekeeping | housekeepingmanager, admin* |
| `hk-requests` | Housekeeping | housekeepingmanager, admin* |
| `hk-duty-allotments` | Housekeeping | housekeepingmanager, admin* |
| `hk-schedules` | Housekeeping | housekeepingmanager, admin* |
| `hk-star-of-month` | Housekeeping | housekeepingmanager, admin* |
| `hk-ro-testing` | Housekeeping | housekeepingmanager, admin* |
| `hk-lost-found` | Housekeeping | housekeepingmanager, admin* |
| `hk-inventory-requirements` | Housekeeping | housekeepingmanager, admin* |
| `hk-procurement` | Housekeeping | housekeepingmanager, admin* |
| `shared-inventory` | Shared stores | store managers, admin* |
| `shared-inventory-movements` | Shared stores | store managers, admin* |
| `shared-inventory-requirements` | Shared stores | store managers, admin* |
| `shared-procurement` | Shared stores | store managers, admin* |
| `jd-meetings` | Joint Director | jointdirector*, admin* |
| `jd-request-approvals` | Joint Director | jointdirector*, admin* |
| `jd-escalations` | Joint Director | jointdirector*, admin* |
| `jd-assets` | Joint Director | jointdirector*, admin* |
| `jd-employee-views` | Joint Director | jointdirector*, admin* |
| `jd-tasks` | Joint Director | jointdirector*, admin* |
| `biometric-attendance` | Biometric | teacher/coordinator/principal/director/hr, admin* |
| `hostel-assignments` | Hostel | hostelwarden, admin* |
| `hostel-payments` | Hostel | hostelwarden, admin* |

### 4.2 `front_office_records`

- `student-gate-passes`
- `hostel-gate-passes`
- `material-gate-passes`
- `goods-received-passes`
- `student-transfers`
- `student-re-enrollments`
- `visitors` alias → prefer `ops_records.gate-visitors`

### 4.3 `academics_records`

- `class-timetables`
- `teacher-allocations`
- `class-timetable-change-requests`
- `extra-classes`
- `online-classes`
- `student-star-ratings`
- `unit-tests`
- `sample-questions`
- `home-fun`
- `study-materials`

### 4.4 `finance_records`

Account Head state is largely a campus snapshot with logical keys (not each key a SQL table):

- `students`
- `feeCategories`
- `feeStructures`
- `fineRules`
- `bankAccounts`
- `posTerminals`
- `concessions`
- `installments`
- `annualBudget`
- `chartOfAccounts`
- `journalVouchers`
- `bookFeeBreakup`
- `transactions`
- `receipts`
- `cheques`
- `paymentLinks`
- `auditLog`
- `glEntries`
- `dayBookEntries`
- `cashBookEntries`
- `bankBookEntries`
- `onlineBookEntries`
- `reconciliationItems`
- `activityFees`
- `wallets`
- `walletRecharges`
- `transportFleet`
- `transportMaintenance`

### 4.5 Other bags

- `hr_records` — HR module JSON documents (training and related campus collections).
- `audit_records` — campus audit JSON collections.

---

## 5. Role / module → storage mapping

| Role code | Primary physical tables | JSON / API bags | Typical UI honesty |
|---|---|---|---|
| `superadmin` / `admin` | users, roles, permissions, audit_logs, approvals, students, hr_employees | ops/finance/FO/academics bags | PARTIAL — many SA screens still MOCK |
| `prm` | front_office_records, admissions*, announcements | FO collections; visitors via ops `gate-visitors` | PARTIAL / LOCAL ONLY on some visitor paths |
| `hr` | hr_employees, leave_requests, announcements | hr_records | PARTIAL (employees LIVE; some workspaces MOCK) |
| `accounthead` / `finance_assistant` | finance_records, financial_years | finance state keys | PARTIAL (core LIVE; POS/Budget often MOCK/BLOCKED) |
| `principal` / `coordinator` / `teacher` | exams, marks_*, attendance, leave, lesson_plans, academics_records, substitute_duties | academics collections | PARTIAL |
| `parent` / `student` | students, guardians, attendance, leave/tc read paths | finance scoped fees; academics read | PARTIAL |
| `librarian` | — | `library-*` ops collections | LIVE via ops bag (Phase 2) |
| `transportmanager` / `driver` | — | `transport-*` ops collections | LIVE via ops bag (Phase 2) |
| `hostelwarden` | — | `hostel-*` ops (+ FO hostel gate passes) | PARTIAL / unsupported surfaces labeled |
| `gatekeeper` / `gatekeepermanager` | — | `gate-*` ops + FO gate-pass reads | Ops LIVE; full UI Gate Keeper phase not finished |
| Other specialist roles (cctv, fileroom, pro, auditors, stores, JD, …) | mixed approvals/comms | ops/jd/shared/canteen/it/hk collections | Often MOCK/PARTIAL in UI |

Backend role codes seeded/authorized:

`accounthead`, `admin`, `canteenmanager`, `cctv`, `coordinator`, `director`, `driver`, `fileroom`, `finance_assistant`, `gatekeeper`, `gatekeepermanager`, `hostelwarden`, `housekeepingmanager`, `hr`, `itsupportmanager`, `jointdirector`, `jointdirectorassistant`, `jointdirectoraudit`, `librarian`, `maintenancemanager`, `managing_director`, `parent`, `principal`, `prm`, `pro`, `processauditor`, `qualityauditor`, `stationerystoremanager`, `student`, `superadmin`, `teacher`, `transportmanager`

---

## 6. Foreign-key relationship map (high level)

| From | To | Meaning |
|---|---|---|
| `users.campus_id` | `campuses.id` | Tenant membership |
| `users.role_id` | `roles.id` | RBAC role |
| `role_permissions.*` | `roles` / `permissions` | M:N grants |
| `user_profiles.user_id` | `users.id` | 1:1 profile |
| `school_classes.academic_year_id` | `academic_years.id` | Year-scoped class |
| `sections.class_id` | `school_classes.id` | Sections |
| `sections.class_teacher_user_id` (if present) | `users.id` | Teacher link |
| `students.*` | campus / year / class / section / users | Enrollment + portal login |
| `guardians.student_id` | `students.id` | Parent/guardian |
| `admissions` / enquiries / referrals | campus, enquiry, student, users, files | Admissions pipeline |
| `hr_employees.user_id` | `users.id` | Staff identity |
| `leave_requests` / `lesson_plans` / `exams` / `marks_batches` | `approval_requests` | Multi-tier approval |
| `mark_entries` | `marks_batches`, `students` | Score lines |
| `student_attendance.student_id` | `students.id` | Attendance |
| `substitute_duties` | users, class, section, campus | Coverage |
| `tc_request_nocs.tc_request_id` | `tc_requests.id` | NOC rows |
| `*_records.campus_id` | `campuses.id` | JSON bags |
| `audit_logs.user_id` | `users.id` | Actor (nullable patterns exist in service writes) |

Full per-column FKs are listed in §3.

---

## 7. SQLite vs PostgreSQL compatibility

| Topic | Current code behavior | Production PG expectation |
|---|---|---|
| Driver | `psycopg` supported; SQLite used locally | `postgresql+psycopg://…` |
| Pooling | SQLite: `NullPool` / `:memory:` `StaticPool`; non-SQLite: default + `pool_pre_ping` | Sized QueuePool + pre_ping on ECS |
| UUID | SQLAlchemy UUID → CHAR-like on SQLite | Native UUID |
| JSON | SQLAlchemy `JSON` | Prefer JSONB in future migrations (not in 0001–0026); current JSON works on PG |
| Enums | Mostly strings in columns / JSON | Keep strings unless new migration adds PG ENUM |
| FK enforcement | SQLite often pragma off | PG enforces FKs — clean orphan data before cutover |
| Migrations | Linear 0001–0026 | Run `alembic upgrade head` on empty/staging PG; **do not edit history** |
| Startup | `create_all` + `seed_reference_data` | Prefer Alembic-only schema on PG; keep seed idempotent |
| Concurrent writes | File SQLite NullPool mitigations | PG handles concurrency; still keep short transactions |

---

## 8. Seed / initialization review

From `app/services/seed.py` (development):

| Step | Idempotent? | Notes |
|---|---|---|
| Campus `QMIS-MDU` | Yes | Created only if missing |
| Current academic + financial year | Yes | Helper upserts |
| Roles from `ALL_ROLES` | Yes | Insert missing codes |
| Permissions + role_permissions | Yes | Insert missing links |
| Demo users (admin/hr/…) | Yes when `ENVIRONMENT` development | Email unique; repairs hash/role if polluted |
| Parent–student demo link | Yes | Dev only |
| HR staff links for demo users | Yes | Dev only |

Production should keep `ENVIRONMENT` non-development so demo passwords are **not** seeded; create the real Super Admin via controlled bootstrap.

---

## 9. Missing schema / migration gaps (honest)

1. **No normalized Library / Transport / Hostel / Gate entity tables** — only `ops_records` collections.
2. **No normalized Fee Invoice / Payment / Receipt tables** — finance snapshot JSON.
3. **No soft-delete standard** across entities.
4. **`updated_at` inconsistent** (18 tables have it; many do not).
5. **Dead model files** on disk not in metadata (`system_audit_logs`, duplicate masters).
6. **Alembic 0019–0026** may be untracked/unapplied on older SQLite files; PG staging must apply full chain.
7. **FE MOCK/LOCAL modules** (recognition awards, some SA dashboards, POS gateway, driver “Live API required” surfaces, etc.) must not drive invented DDL.
8. **JSON bag querying/reporting** is weak for AWS analytics — future normalization would need **new** additive migrations after 0026, not rewrites.

---

## 10. Recommended production migration sequence (no execution yet)

1. Provision empty AWS RDS PostgreSQL (staging), least-privilege app role.
2. Point staging `DATABASE_URL` at that DB (secrets in SSM/Secrets Manager — never commit).
3. From backend at promotion tip: `alembic upgrade head` → verify `alembic_version = 0026_audit_logs_ip_ua`.
4. Run seed in controlled mode: roles/permissions/campus only (no demo passwords in prod).
5. Create initial Super Admin via secure break-glass procedure.
6. Import selected reference data deliberately (do **not** dump SQLite over existing PG users).
7. Enable FK checks / run integrity SQL; fix orphans before go-live.
8. Only after approval: plan **additive** `0027+` migrations for any true normalization.

---

## 11. Approval gate

This document is the audit deliverable. **No schema or migration implementation has been applied.** Await explicit approval before generating/executing any `0027+` migration or changing SQLAlchemy models.

