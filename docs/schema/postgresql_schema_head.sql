-- QMIS ERP PostgreSQL deployment schema
-- Generated from SQLAlchemy Base.metadata (integration/promotion models).
-- Compatible with Alembic head intent: 0026_audit_logs_ip_ua
-- DO NOT put secrets in this file.
-- Apply to an EMPTY database as the app role (or migrate via Alembic after bootstrap).
--
-- Recommended empty-DB bootstrap order:
--   1) psql -f postgresql_schema_head.sql
--   2) alembic stamp 0026_audit_logs_ip_ua   # if using Alembic thereafter
-- OR keep using Alembic once a true baseline migration exists.

BEGIN;

CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);


CREATE TABLE IF NOT EXISTS campuses (
	id UUID NOT NULL, 
	code VARCHAR(32) NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	city VARCHAR(80) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (code)
)

;


CREATE TABLE IF NOT EXISTS otp_challenges (
	id UUID NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	code_hash VARCHAR(255) NOT NULL, 
	expires_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	consumed_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
)

;

CREATE INDEX IF NOT EXISTS ix_otp_challenges_email ON otp_challenges (email);


CREATE TABLE IF NOT EXISTS permissions (
	id UUID NOT NULL, 
	code VARCHAR(80) NOT NULL, 
	description VARCHAR(200) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (code)
)

;


CREATE TABLE IF NOT EXISTS roles (
	id UUID NOT NULL, 
	code VARCHAR(64) NOT NULL, 
	name VARCHAR(120) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (code)
)

;


CREATE TABLE IF NOT EXISTS academic_years (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	name VARCHAR(50) NOT NULL, 
	start_date DATE, 
	end_date DATE, 
	is_current BOOLEAN NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (campus_id, name), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id)
)

;


CREATE TABLE IF NOT EXISTS conversations (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	pair_key VARCHAR(80) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_conversations_campus_pair UNIQUE (campus_id, pair_key), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id)
)

;


CREATE TABLE IF NOT EXISTS exam_types (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	code VARCHAR(24) NOT NULL, 
	name VARCHAR(80) NOT NULL, 
	active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_exam_type_campus_code UNIQUE (campus_id, code), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id)
)

;


CREATE TABLE IF NOT EXISTS finance_records (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	collection VARCHAR(40) NOT NULL, 
	public_id VARCHAR(80) NOT NULL, 
	body JSON NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_finance_record UNIQUE (campus_id, collection, public_id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id)
)

;

CREATE INDEX IF NOT EXISTS ix_finance_records_collection ON finance_records (collection);

CREATE INDEX IF NOT EXISTS ix_finance_records_campus_id ON finance_records (campus_id);


CREATE TABLE IF NOT EXISTS financial_years (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	name VARCHAR(50) NOT NULL, 
	start_date DATE NOT NULL, 
	end_date DATE NOT NULL, 
	is_current BOOLEAN NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (campus_id, name), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id)
)

;


CREATE TABLE IF NOT EXISTS hr_records (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	collection VARCHAR(40) NOT NULL, 
	public_id VARCHAR(80) NOT NULL, 
	body JSON NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_hr_record UNIQUE (campus_id, collection, public_id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id)
)

;

CREATE INDEX IF NOT EXISTS ix_hr_records_collection ON hr_records (collection);

CREATE INDEX IF NOT EXISTS ix_hr_records_campus_id ON hr_records (campus_id);


CREATE TABLE IF NOT EXISTS role_permissions (
	id UUID NOT NULL, 
	role_id UUID NOT NULL, 
	permission_id UUID NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (role_id, permission_id), 
	FOREIGN KEY(role_id) REFERENCES roles (id), 
	FOREIGN KEY(permission_id) REFERENCES permissions (id)
)

;


CREATE TABLE IF NOT EXISTS subjects (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	code VARCHAR(20) NOT NULL, 
	name VARCHAR(120) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (campus_id, code), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id)
)

;


CREATE TABLE IF NOT EXISTS users (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	role_id UUID NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	must_change_password BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(role_id) REFERENCES roles (id), 
	UNIQUE (email)
)

;


CREATE TABLE IF NOT EXISTS academics_records (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	collection VARCHAR(60) NOT NULL, 
	public_id VARCHAR(80) NOT NULL, 
	body JSON NOT NULL, 
	created_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_academics_record UNIQUE (campus_id, collection, public_id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_academics_records_collection ON academics_records (collection);

CREATE INDEX IF NOT EXISTS ix_academics_records_campus_id ON academics_records (campus_id);


CREATE TABLE IF NOT EXISTS activities (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	code VARCHAR(20) NOT NULL, 
	activity_type VARCHAR(16) NOT NULL, 
	event_name VARCHAR(200) NOT NULL, 
	event_type VARCHAR(80) NOT NULL, 
	class_name VARCHAR(80) NOT NULL, 
	event_date DATE NOT NULL, 
	start_time VARCHAR(16) NOT NULL, 
	end_time VARCHAR(16) NOT NULL, 
	venue VARCHAR(160) NOT NULL, 
	coordinator VARCHAR(80) NOT NULL, 
	coach VARCHAR(80) NOT NULL, 
	description TEXT NOT NULL, 
	submitted_by VARCHAR(80) NOT NULL, 
	submitted_date DATE NOT NULL, 
	md_approval_status VARCHAR(16) NOT NULL, 
	created_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_activities_campus_code UNIQUE (campus_id, code), 
	CONSTRAINT ck_activities_type CHECK (activity_type IN ('cultural', 'sports', 'competition')), 
	CONSTRAINT ck_activities_approval CHECK (md_approval_status IN ('Pending', 'Approved', 'Rejected')), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
)

;


CREATE TABLE IF NOT EXISTS approval_requests (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	entity_type VARCHAR(48) NOT NULL, 
	entity_id VARCHAR(80) NOT NULL, 
	title VARCHAR(200), 
	initiator_id UUID NOT NULL, 
	initiator_role VARCHAR(48) NOT NULL, 
	chain_json TEXT NOT NULL, 
	current_level INTEGER NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(initiator_id) REFERENCES users (id)
)

;


CREATE TABLE IF NOT EXISTS audit_logs (
	id UUID NOT NULL, 
	actor_id UUID, 
	campus_id UUID, 
	action VARCHAR(64) NOT NULL, 
	entity_type VARCHAR(64) NOT NULL, 
	entity_id VARCHAR(64), 
	details TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(actor_id) REFERENCES users (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id)
)

;


CREATE TABLE IF NOT EXISTS audit_records (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	collection VARCHAR(80) NOT NULL, 
	public_id VARCHAR(80) NOT NULL, 
	body JSON NOT NULL, 
	created_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_campus_audit_record UNIQUE (campus_id, collection, public_id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_audit_records_collection ON audit_records (collection);

CREATE INDEX IF NOT EXISTS ix_audit_records_campus_id ON audit_records (campus_id);


CREATE TABLE IF NOT EXISTS calendar_events (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	code VARCHAR(32) NOT NULL, 
	event_type VARCHAR(16) NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	start_date DATE NOT NULL, 
	end_date DATE NOT NULL, 
	all_day BOOLEAN NOT NULL, 
	start_time VARCHAR(5), 
	end_time VARCHAR(5), 
	description TEXT NOT NULL, 
	created_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_calendar_events_campus_code UNIQUE (campus_id, code), 
	CONSTRAINT ck_calendar_events_type CHECK (event_type IN ('holiday', 'exam', 'event')), 
	CONSTRAINT ck_calendar_events_dates CHECK (end_date >= start_date), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
)

;


CREATE TABLE IF NOT EXISTS conversation_participants (
	id UUID NOT NULL, 
	conversation_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	archived BOOLEAN NOT NULL, 
	deleted BOOLEAN NOT NULL, 
	last_read_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_conversation_participants_user UNIQUE (conversation_id, user_id), 
	FOREIGN KEY(conversation_id) REFERENCES conversations (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_conversation_participants_user_id ON conversation_participants (user_id);

CREATE INDEX IF NOT EXISTS ix_conversation_participants_conversation_id ON conversation_participants (conversation_id);


CREATE TABLE IF NOT EXISTS coordinator_grade_bands (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	grade_from INTEGER NOT NULL, 
	grade_to INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_coordinator_grade_bands_user_id ON coordinator_grade_bands (user_id);


CREATE TABLE IF NOT EXISTS escalations (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	esc_no INTEGER NOT NULL, 
	raised_by_id UUID NOT NULL, 
	raised_by_role VARCHAR(48) NOT NULL, 
	to_role VARCHAR(48) NOT NULL, 
	to_user_id UUID, 
	description VARCHAR(300) NOT NULL, 
	full_description TEXT NOT NULL, 
	remarks TEXT, 
	status VARCHAR(16) NOT NULL, 
	resolution_note TEXT, 
	level INTEGER NOT NULL, 
	resolve_by TIMESTAMP WITH TIME ZONE NOT NULL, 
	resolved_at TIMESTAMP WITH TIME ZONE, 
	trail_json TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(raised_by_id) REFERENCES users (id), 
	FOREIGN KEY(to_user_id) REFERENCES users (id)
)

;


CREATE TABLE IF NOT EXISTS exam_weightages (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	class_name VARCHAR(40) NOT NULL, 
	exam_type_id UUID NOT NULL, 
	weight FLOAT NOT NULL, 
	updated_by UUID, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_weightage UNIQUE (campus_id, class_name, exam_type_id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(exam_type_id) REFERENCES exam_types (id), 
	FOREIGN KEY(updated_by) REFERENCES users (id)
)

;


CREATE TABLE IF NOT EXISTS file_assets (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	uploaded_by UUID, 
	original_name VARCHAR(255) NOT NULL, 
	stored_name VARCHAR(255) NOT NULL, 
	content_type VARCHAR(120) NOT NULL, 
	size_bytes INTEGER NOT NULL, 
	resource_type VARCHAR(64) NOT NULL, 
	resource_id VARCHAR(64), 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(uploaded_by) REFERENCES users (id)
)

;


CREATE TABLE IF NOT EXISTS front_office_records (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	collection VARCHAR(40) NOT NULL, 
	public_id VARCHAR(80) NOT NULL, 
	body JSON NOT NULL, 
	created_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_front_office_record UNIQUE (campus_id, collection, public_id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_front_office_records_collection ON front_office_records (collection);

CREATE INDEX IF NOT EXISTS ix_front_office_records_campus_id ON front_office_records (campus_id);


CREATE TABLE IF NOT EXISTS hr_employees (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	employee_code VARCHAR(40) NOT NULL, 
	first_name VARCHAR(80) NOT NULL, 
	last_name VARCHAR(80) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	phone VARCHAR(40), 
	gender VARCHAR(20), 
	date_of_birth VARCHAR(20), 
	address VARCHAR(255), 
	department VARCHAR(80), 
	designation VARCHAR(120), 
	joining_date VARCHAR(20), 
	status VARCHAR(32), 
	reporting_manager VARCHAR(120), 
	role_title VARCHAR(80), 
	qualification VARCHAR(160), 
	experience VARCHAR(80), 
	emergency_contact VARCHAR(160), 
	employment_type VARCHAR(40), 
	category VARCHAR(80), 
	gross_salary INTEGER, 
	other_allowance INTEGER, 
	special_deduction INTEGER, 
	other_employer_benefits INTEGER, 
	extra JSON, 
	user_id UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	UNIQUE (employee_code), 
	UNIQUE (email), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;


CREATE TABLE IF NOT EXISTS notifications (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	user_id UUID, 
	role_code VARCHAR(48), 
	title VARCHAR(200) NOT NULL, 
	body TEXT, 
	entity_type VARCHAR(48), 
	entity_id VARCHAR(80), 
	read_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;


CREATE TABLE IF NOT EXISTS ops_records (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	collection VARCHAR(80) NOT NULL, 
	public_id VARCHAR(80) NOT NULL, 
	body JSON NOT NULL, 
	created_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_ops_record UNIQUE (campus_id, collection, public_id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_ops_records_collection ON ops_records (collection);

CREATE INDEX IF NOT EXISTS ix_ops_records_campus_id ON ops_records (campus_id);


CREATE TABLE IF NOT EXISTS school_classes (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	academic_year_id UUID NOT NULL, 
	name VARCHAR(40) NOT NULL, 
	section VARCHAR(20), 
	is_active BOOLEAN DEFAULT true NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_school_class_campus_year_name UNIQUE (campus_id, academic_year_id, name), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(academic_year_id) REFERENCES academic_years (id)
)

;


CREATE TABLE IF NOT EXISTS tasks (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	task_no INTEGER NOT NULL, 
	assigned_by_id UUID NOT NULL, 
	assigned_by_role VARCHAR(48) NOT NULL, 
	assignee_id UUID NOT NULL, 
	assignee_role VARCHAR(48) NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	description TEXT, 
	priority VARCHAR(8) NOT NULL, 
	due_date DATE NOT NULL, 
	status VARCHAR(16) NOT NULL, 
	completed_at TIMESTAMP WITH TIME ZONE, 
	overdue_notified BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(assigned_by_id) REFERENCES users (id), 
	FOREIGN KEY(assignee_id) REFERENCES users (id)
)

;


CREATE TABLE IF NOT EXISTS user_profiles (
	id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	staff_code VARCHAR(32) NOT NULL, 
	first_name VARCHAR(120) NOT NULL, 
	middle_name VARCHAR(120) NOT NULL, 
	last_name VARCHAR(120) NOT NULL, 
	gender VARCHAR(24) NOT NULL, 
	mobile_number VARCHAR(32) NOT NULL, 
	extra JSON NOT NULL, 
	created_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	UNIQUE (staff_code), 
	FOREIGN KEY(created_by) REFERENCES users (id)
)

;


CREATE TABLE IF NOT EXISTS activity_players (
	id UUID NOT NULL, 
	activity_id UUID NOT NULL, 
	rank INTEGER NOT NULL, 
	name VARCHAR(80) NOT NULL, 
	category VARCHAR(40) NOT NULL, 
	class_name VARCHAR(40) NOT NULL, 
	school VARCHAR(80) NOT NULL, 
	rating VARCHAR(16) NOT NULL, 
	score VARCHAR(16) NOT NULL, 
	tie_break VARCHAR(16) NOT NULL, 
	result VARCHAR(24) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(activity_id) REFERENCES activities (id)
)

;

CREATE INDEX IF NOT EXISTS ix_activity_players_activity_id ON activity_players (activity_id);


CREATE TABLE IF NOT EXISTS admission_enquiries (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	enquiry_code VARCHAR(32) NOT NULL, 
	name VARCHAR(160) NOT NULL, 
	mobile_number VARCHAR(20) NOT NULL, 
	email VARCHAR(255), 
	gender VARCHAR(20), 
	address TEXT, 
	description TEXT, 
	note TEXT, 
	enquiry_date DATE, 
	next_follow_up_date DATE, 
	assigned_to VARCHAR(120), 
	reference VARCHAR(80), 
	source VARCHAR(80), 
	class_name VARCHAR(40) NOT NULL, 
	number_of_child VARCHAR(20), 
	city VARCHAR(80), 
	state VARCHAR(80), 
	profile_image_file_id UUID, 
	status VARCHAR(32) NOT NULL, 
	converted_admission_id UUID, 
	student_name VARCHAR(160), 
	guardian_name VARCHAR(160), 
	guardian_phone VARCHAR(20), 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	UNIQUE (enquiry_code), 
	FOREIGN KEY(profile_image_file_id) REFERENCES file_assets (id)
)

;


CREATE TABLE IF NOT EXISTS announcements (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	code VARCHAR(16) NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	category VARCHAR(60) NOT NULL, 
	message TEXT NOT NULL, 
	sent_by VARCHAR(80) NOT NULL, 
	sender_role VARCHAR(48) NOT NULL, 
	announcement_date DATE NOT NULL, 
	attachment_file_id UUID, 
	audience JSON NOT NULL, 
	created_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_announcements_campus_code UNIQUE (campus_id, code), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(attachment_file_id) REFERENCES file_assets (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
)

;


CREATE TABLE IF NOT EXISTS approval_events (
	id UUID NOT NULL, 
	approval_id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	level INTEGER NOT NULL, 
	action VARCHAR(20) NOT NULL, 
	actor_id UUID NOT NULL, 
	actor_role VARCHAR(48) NOT NULL, 
	comment TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(approval_id) REFERENCES approval_requests (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(actor_id) REFERENCES users (id)
)

;


CREATE TABLE IF NOT EXISTS exams (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	exam_type_id UUID NOT NULL, 
	name VARCHAR(120) NOT NULL, 
	class_name VARCHAR(40) NOT NULL, 
	academic_year VARCHAR(40), 
	start_date DATE NOT NULL, 
	end_date DATE NOT NULL, 
	schedule JSON, 
	created_by UUID NOT NULL, 
	approval_id UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(exam_type_id) REFERENCES exam_types (id), 
	FOREIGN KEY(created_by) REFERENCES users (id), 
	FOREIGN KEY(approval_id) REFERENCES approval_requests (id)
)

;


CREATE TABLE IF NOT EXISTS leave_requests (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	request_no INTEGER NOT NULL, 
	requester_id UUID NOT NULL, 
	requester_role VARCHAR(48) NOT NULL, 
	leave_type VARCHAR(32) NOT NULL, 
	from_date DATE NOT NULL, 
	to_date DATE NOT NULL, 
	total_days INTEGER NOT NULL, 
	hours FLOAT, 
	reason TEXT NOT NULL, 
	approval_id UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(requester_id) REFERENCES users (id), 
	FOREIGN KEY(approval_id) REFERENCES approval_requests (id)
)

;


CREATE TABLE IF NOT EXISTS lesson_plans (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	teacher_id UUID NOT NULL, 
	class_name VARCHAR(64) NOT NULL, 
	section VARCHAR(16), 
	subject VARCHAR(80) NOT NULL, 
	month VARCHAR(7) NOT NULL, 
	title VARCHAR(200), 
	content_json TEXT NOT NULL, 
	file_id UUID, 
	version INTEGER NOT NULL, 
	approval_id UUID, 
	late BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(teacher_id) REFERENCES users (id), 
	FOREIGN KEY(approval_id) REFERENCES approval_requests (id)
)

;


CREATE TABLE IF NOT EXISTS messages (
	id UUID NOT NULL, 
	conversation_id UUID NOT NULL, 
	sender_id UUID NOT NULL, 
	body TEXT NOT NULL, 
	file_id UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(conversation_id) REFERENCES conversations (id), 
	FOREIGN KEY(sender_id) REFERENCES users (id), 
	FOREIGN KEY(file_id) REFERENCES file_assets (id)
)

;

CREATE INDEX IF NOT EXISTS ix_messages_conversation_id ON messages (conversation_id);


CREATE TABLE IF NOT EXISTS notification_reads (
	id UUID NOT NULL, 
	notification_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	read_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_notification_reads_user UNIQUE (notification_id, user_id), 
	FOREIGN KEY(notification_id) REFERENCES notifications (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_notification_reads_notification_id ON notification_reads (notification_id);

CREATE INDEX IF NOT EXISTS ix_notification_reads_user_id ON notification_reads (user_id);


CREATE TABLE IF NOT EXISTS sections (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	class_id UUID NOT NULL, 
	name VARCHAR(20) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	capacity INTEGER, 
	room_number VARCHAR(20), 
	class_teacher_user_id UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (campus_id, class_id, name), 
	CONSTRAINT ck_sections_capacity_positive CHECK (capacity IS NULL OR capacity > 0), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(class_id) REFERENCES school_classes (id), 
	FOREIGN KEY(class_teacher_user_id) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_sections_class_teacher_user_id ON sections (class_teacher_user_id);


CREATE TABLE IF NOT EXISTS task_events (
	id UUID NOT NULL, 
	task_id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	action VARCHAR(16) NOT NULL, 
	from_status VARCHAR(16), 
	to_status VARCHAR(16) NOT NULL, 
	actor_id UUID NOT NULL, 
	actor_role VARCHAR(48) NOT NULL, 
	remark TEXT, 
	client_ref VARCHAR(64), 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(task_id) REFERENCES tasks (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(actor_id) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_task_events_client_ref ON task_events (client_ref);

CREATE INDEX IF NOT EXISTS ix_task_events_task_id ON task_events (task_id);


CREATE TABLE IF NOT EXISTS announcement_replies (
	id UUID NOT NULL, 
	announcement_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	role_code VARCHAR(48) NOT NULL, 
	text TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(announcement_id) REFERENCES announcements (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_announcement_replies_announcement_id ON announcement_replies (announcement_id);


CREATE TABLE IF NOT EXISTS announcement_responses (
	id UUID NOT NULL, 
	announcement_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_announcement_responses_user UNIQUE (announcement_id, user_id), 
	FOREIGN KEY(announcement_id) REFERENCES announcements (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_announcement_responses_announcement_id ON announcement_responses (announcement_id);


CREATE TABLE IF NOT EXISTS marks_batches (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	exam_id UUID NOT NULL, 
	teacher_id UUID NOT NULL, 
	subject VARCHAR(80) NOT NULL, 
	section VARCHAR(16), 
	max_marks FLOAT NOT NULL, 
	version INTEGER NOT NULL, 
	approval_id UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(exam_id) REFERENCES exams (id), 
	FOREIGN KEY(teacher_id) REFERENCES users (id), 
	FOREIGN KEY(approval_id) REFERENCES approval_requests (id)
)

;


CREATE TABLE IF NOT EXISTS students (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	enquiry_id UUID, 
	admission_id UUID, 
	admission_number VARCHAR(32) NOT NULL, 
	full_name VARCHAR(160) NOT NULL, 
	class_name VARCHAR(40) NOT NULL, 
	academic_year_id UUID, 
	class_id UUID, 
	section_id UUID, 
	section VARCHAR(20), 
	roll_number INTEGER, 
	placement_status VARCHAR(20) NOT NULL, 
	parent_user_id UUID, 
	student_user_id UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(enquiry_id) REFERENCES admission_enquiries (id), 
	UNIQUE (admission_number), 
	FOREIGN KEY(academic_year_id) REFERENCES academic_years (id), 
	FOREIGN KEY(class_id) REFERENCES school_classes (id), 
	FOREIGN KEY(section_id) REFERENCES sections (id), 
	FOREIGN KEY(parent_user_id) REFERENCES users (id), 
	FOREIGN KEY(student_user_id) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_students_student_user_id ON students (student_user_id);

CREATE INDEX IF NOT EXISTS ix_students_placement_status ON students (placement_status);

CREATE INDEX IF NOT EXISTS ix_students_section_id ON students (section_id);


CREATE TABLE IF NOT EXISTS substitute_duties (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	teacher_user_id UUID NOT NULL, 
	class_id UUID NOT NULL, 
	section_id UUID NOT NULL, 
	duty_date DATE NOT NULL, 
	period VARCHAR(20) NOT NULL, 
	start_time TIME WITHOUT TIME ZONE NOT NULL, 
	end_time TIME WITHOUT TIME ZONE NOT NULL, 
	status VARCHAR(16) NOT NULL, 
	note TEXT, 
	assigned_by UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	revoked_by UUID, 
	revoked_at TIMESTAMP WITH TIME ZONE, 
	revoke_reason TEXT, 
	PRIMARY KEY (id), 
	CONSTRAINT ck_substitute_duty_window CHECK (start_time < end_time), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(teacher_user_id) REFERENCES users (id), 
	FOREIGN KEY(class_id) REFERENCES school_classes (id), 
	FOREIGN KEY(section_id) REFERENCES sections (id), 
	FOREIGN KEY(assigned_by) REFERENCES users (id), 
	FOREIGN KEY(revoked_by) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_substitute_duties_teacher_date ON substitute_duties (campus_id, teacher_user_id, duty_date);


CREATE TABLE IF NOT EXISTS admissions (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	enquiry_id UUID, 
	admission_code VARCHAR(32) NOT NULL, 
	admission_date DATE, 
	class_name VARCHAR(40) NOT NULL, 
	registration_fees VARCHAR(40), 
	batch_start_year INTEGER, 
	batch_end_year INTEGER, 
	first_name VARCHAR(80) NOT NULL, 
	middle_name VARCHAR(80), 
	last_name VARCHAR(80), 
	gender VARCHAR(20), 
	religion VARCHAR(40), 
	caste VARCHAR(40), 
	address TEXT, 
	date_of_birth DATE, 
	country VARCHAR(80), 
	state VARCHAR(80), 
	city VARCHAR(80), 
	zip_code VARCHAR(40), 
	mobile_number VARCHAR(20) NOT NULL, 
	alt_mobile_number VARCHAR(20), 
	email VARCHAR(255), 
	previous_school VARCHAR(160), 
	blood_group VARCHAR(16), 
	height VARCHAR(20), 
	weight VARCHAR(20), 
	medical_history TEXT, 
	profile_image_file_id UUID, 
	mode_of_transport VARCHAR(40), 
	route VARCHAR(80), 
	bus_stop VARCHAR(80), 
	father_name VARCHAR(160), 
	mother_name VARCHAR(160), 
	father_occupation VARCHAR(120), 
	mother_occupation VARCHAR(120), 
	father_income VARCHAR(40), 
	mother_income VARCHAR(40), 
	siblings VARCHAR(120), 
	parent_address TEXT, 
	parent_country VARCHAR(80), 
	parent_state VARCHAR(80), 
	parent_city VARCHAR(80), 
	parent_zip_code VARCHAR(40), 
	parent_mobile_number VARCHAR(20), 
	parent_alt_mobile_number VARCHAR(20), 
	parent_email VARCHAR(255), 
	parent_account_email VARCHAR(255), 
	student_account_email VARCHAR(255), 
	parent_pending_password_hash VARCHAR(255), 
	student_pending_password_hash VARCHAR(255), 
	fees_group VARCHAR(80), 
	status VARCHAR(32) NOT NULL, 
	enrolled_student_id UUID, 
	enrolled_at TIMESTAMP WITH TIME ZONE, 
	parent_user_id UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(enquiry_id) REFERENCES admission_enquiries (id), 
	UNIQUE (admission_code), 
	FOREIGN KEY(profile_image_file_id) REFERENCES file_assets (id), 
	FOREIGN KEY(enrolled_student_id) REFERENCES students (id), 
	FOREIGN KEY(parent_user_id) REFERENCES users (id)
)

;


CREATE TABLE IF NOT EXISTS document_records (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	subject_type VARCHAR(16) NOT NULL, 
	student_id UUID, 
	employee_id UUID, 
	submitted_date DATE, 
	status VARCHAR(16) NOT NULL, 
	created_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT ck_document_records_one_subject CHECK ((subject_type = 'student' AND student_id IS NOT NULL AND employee_id IS NULL) OR (subject_type = 'employee' AND employee_id IS NOT NULL AND student_id IS NULL)), 
	CONSTRAINT ck_document_records_status CHECK (status IN ('In Progress', 'Completed')), 
	CONSTRAINT uq_document_records_student UNIQUE (student_id), 
	CONSTRAINT uq_document_records_employee UNIQUE (employee_id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(student_id) REFERENCES students (id), 
	FOREIGN KEY(employee_id) REFERENCES hr_employees (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
)

;


CREATE TABLE IF NOT EXISTS guardians (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	student_id UUID NOT NULL, 
	full_name VARCHAR(160) NOT NULL, 
	phone VARCHAR(20) NOT NULL, 
	relationship VARCHAR(40) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(student_id) REFERENCES students (id)
)

;


CREATE TABLE IF NOT EXISTS mark_entries (
	id UUID NOT NULL, 
	batch_id UUID NOT NULL, 
	student_id UUID NOT NULL, 
	marks FLOAT, 
	absent BOOLEAN NOT NULL, 
	remarks TEXT, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_mark_batch_student UNIQUE (batch_id, student_id), 
	FOREIGN KEY(batch_id) REFERENCES marks_batches (id), 
	FOREIGN KEY(student_id) REFERENCES students (id)
)

;


CREATE TABLE IF NOT EXISTS student_attendance (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	student_id UUID NOT NULL, 
	attendance_date DATE NOT NULL, 
	session VARCHAR(2) NOT NULL, 
	class_name VARCHAR(40) NOT NULL, 
	section VARCHAR(20), 
	status VARCHAR(20) NOT NULL, 
	in_out_status VARCHAR(40), 
	check_in_time VARCHAR(20), 
	check_out_time VARCHAR(20), 
	marked_by_user_id UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_student_attendance_day_session UNIQUE (campus_id, student_id, attendance_date, session), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(student_id) REFERENCES students (id), 
	FOREIGN KEY(marked_by_user_id) REFERENCES users (id)
)

;


CREATE TABLE IF NOT EXISTS tc_requests (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	code VARCHAR(20) NOT NULL, 
	student_id UUID NOT NULL, 
	reason TEXT NOT NULL, 
	transfer_to VARCHAR(200) NOT NULL, 
	last_date_of_attendance DATE, 
	requested_by VARCHAR(80) NOT NULL, 
	requested_on DATE NOT NULL, 
	status VARCHAR(40) NOT NULL, 
	prm_remarks TEXT NOT NULL, 
	admin_remarks TEXT NOT NULL, 
	forwarded_on DATE, 
	decided_on DATE, 
	tc_number VARCHAR(40) NOT NULL, 
	created_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_tc_requests_campus_code UNIQUE (campus_id, code), 
	CONSTRAINT ck_tc_requests_status CHECK (status IN ('Pending PRM Review', 'Pending Manager NOCs', 'Pending Super Admin Approval', 'Approved', 'Rejected')), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(student_id) REFERENCES students (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_tc_requests_student_id ON tc_requests (student_id);


CREATE TABLE IF NOT EXISTS admission_referrals (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	admission_id UUID NOT NULL, 
	referrer_type VARCHAR(20) NOT NULL, 
	referrer_name VARCHAR(160) NOT NULL, 
	referrer_contact VARCHAR(80), 
	referrer_student_admission_no VARCHAR(40), 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	UNIQUE (admission_id), 
	FOREIGN KEY(admission_id) REFERENCES admissions (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS document_items (
	id UUID NOT NULL, 
	record_id UUID NOT NULL, 
	doc_key VARCHAR(80) NOT NULL, 
	label VARCHAR(80) NOT NULL, 
	file_id UUID NOT NULL, 
	status VARCHAR(16) NOT NULL, 
	uploaded_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT ck_document_items_status CHECK (status IN ('Submitted', 'Pending', 'Approved')), 
	CONSTRAINT uq_document_items_record_key UNIQUE (record_id, doc_key), 
	FOREIGN KEY(record_id) REFERENCES document_records (id), 
	FOREIGN KEY(file_id) REFERENCES file_assets (id), 
	FOREIGN KEY(uploaded_by) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_document_items_file_id ON document_items (file_id);

CREATE INDEX IF NOT EXISTS ix_document_items_record_id ON document_items (record_id);


CREATE TABLE IF NOT EXISTS tc_request_nocs (
	id UUID NOT NULL, 
	campus_id UUID NOT NULL, 
	tc_request_id UUID NOT NULL, 
	role_code VARCHAR(64) NOT NULL, 
	role_label VARCHAR(120) NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	remarks TEXT NOT NULL, 
	decided_by UUID, 
	decided_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_tc_request_nocs_request_role UNIQUE (tc_request_id, role_code), 
	CONSTRAINT ck_tc_request_nocs_status CHECK (status IN ('Pending', 'Approved', 'Rejected')), 
	FOREIGN KEY(campus_id) REFERENCES campuses (id), 
	FOREIGN KEY(tc_request_id) REFERENCES tc_requests (id), 
	FOREIGN KEY(decided_by) REFERENCES users (id)
)

;

CREATE INDEX IF NOT EXISTS ix_tc_request_nocs_tc_request_id ON tc_request_nocs (tc_request_id);

CREATE INDEX IF NOT EXISTS ix_tc_request_nocs_campus_id ON tc_request_nocs (campus_id);

INSERT INTO alembic_version (version_num) VALUES ('0026_audit_logs_ip_ua')
ON CONFLICT (version_num) DO NOTHING;

COMMIT;

