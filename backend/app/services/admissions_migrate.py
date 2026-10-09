"""Add rich admissions columns when a Phase-0 DB already exists."""

from sqlalchemy import inspect, text

from app.core.database import engine

_ENQUIRY_COLUMNS = (
    ("enquiry_code", "VARCHAR(32)"),
    ("name", "VARCHAR(160)"),
    ("mobile_number", "VARCHAR(20)"),
    ("email", "VARCHAR(255)"),
    ("gender", "VARCHAR(20)"),
    ("address", "TEXT"),
    ("description", "TEXT"),
    ("note", "TEXT"),
    ("enquiry_date", "DATE"),
    ("next_follow_up_date", "DATE"),
    ("assigned_to", "VARCHAR(120)"),
    ("reference", "VARCHAR(80)"),
    ("source", "VARCHAR(80)"),
    ("number_of_child", "VARCHAR(20)"),
    ("city", "VARCHAR(80)"),
    ("state", "VARCHAR(80)"),
    ("profile_image_file_id", "VARCHAR(36)"),
    ("converted_admission_id", "VARCHAR(36)"),
    ("updated_at", "TIMESTAMP"),
)

_STUDENT_COLUMNS = (
    ("admission_id", "VARCHAR(36)"),
    ("parent_user_id", "VARCHAR(36)"),
)


def ensure_admissions_schema() -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if "admission_enquiries" not in tables:
        return

    present = {column["name"] for column in inspector.get_columns("admission_enquiries")}
    with engine.begin() as connection:
        for name, column_type in _ENQUIRY_COLUMNS:
            if name not in present:
                connection.execute(text(f"ALTER TABLE admission_enquiries ADD COLUMN {name} {column_type}"))

        cols = {column["name"] for column in inspect(engine).get_columns("admission_enquiries")}
        if "student_name" in cols and "name" in cols:
            connection.execute(
                text(
                    "UPDATE admission_enquiries SET name = student_name "
                    "WHERE (name IS NULL OR name = '') AND student_name IS NOT NULL"
                )
            )
        if "guardian_phone" in cols and "mobile_number" in cols:
            connection.execute(
                text(
                    "UPDATE admission_enquiries SET mobile_number = guardian_phone "
                    "WHERE (mobile_number IS NULL OR mobile_number = '') AND guardian_phone IS NOT NULL"
                )
            )
        if "status" in cols:
            connection.execute(
                text("UPDATE admission_enquiries SET status = 'Active' WHERE lower(status) = 'open'")
            )
            connection.execute(
                text("UPDATE admission_enquiries SET status = 'Success' WHERE lower(status) = 'enrolled'")
            )

        if "students" in tables:
            student_cols = {column["name"] for column in inspect(engine).get_columns("students")}
            for name, column_type in _STUDENT_COLUMNS:
                if name not in student_cols:
                    connection.execute(text(f"ALTER TABLE students ADD COLUMN {name} {column_type}"))
