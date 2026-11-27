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


def _widen_varchar(connection, table: str, column: str, length: int) -> None:
    """Widen a VARCHAR column when the live DB still has a shorter length (Postgres)."""
    if connection.dialect.name != "postgresql":
        return
    meta = next(
        (c for c in inspect(connection).get_columns(table) if c["name"] == column),
        None,
    )
    if not meta:
        return
    col_type = meta.get("type")
    current = getattr(col_type, "length", None)
    if current is not None and current >= length:
        return
    connection.execute(
        text(f"ALTER TABLE {table} ALTER COLUMN {column} TYPE VARCHAR({length})")
    )


def ensure_admissions_schema() -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if "admission_enquiries" not in tables:
        return

    present = {column["name"] for column in inspector.get_columns("admission_enquiries")}
    with engine.begin() as connection:
        if "admissions" in tables:
            _widen_varchar(connection, "admissions", "zip_code", 40)
            _widen_varchar(connection, "admissions", "parent_zip_code", 40)
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

        # Phase-0 NOT NULL leftovers block rich-form creates / list validation (Postgres only).
        if connection.dialect.name == "postgresql":
            for legacy_col in ("student_name", "guardian_name", "guardian_phone"):
                if legacy_col in cols:
                    connection.execute(
                        text(
                            f"ALTER TABLE admission_enquiries ALTER COLUMN {legacy_col} DROP NOT NULL"
                        )
                    )
            if "guardian_name" in cols:
                connection.execute(
                    text(
                        "UPDATE admission_enquiries SET guardian_name = 'Parent' "
                        "WHERE guardian_name IS NULL OR guardian_name = ''"
                    )
                )
            if "enquiry_code" in cols:
                connection.execute(
                    text(
                        "UPDATE admission_enquiries "
                        "SET enquiry_code = 'AE-' || upper(substr(replace(id::text, '-', ''), 1, 8)) "
                        "WHERE enquiry_code IS NULL OR enquiry_code = ''"
                    )
                )
            if "name" in cols:
                connection.execute(
                    text(
                        "UPDATE admission_enquiries "
                        "SET name = COALESCE(NULLIF(name, ''), student_name, 'Unknown') "
                        "WHERE name IS NULL OR name = ''"
                    )
                )
            if "mobile_number" in cols:
                connection.execute(
                    text(
                        "UPDATE admission_enquiries "
                        "SET mobile_number = COALESCE(NULLIF(mobile_number, ''), guardian_phone, '0000000000') "
                        "WHERE mobile_number IS NULL OR mobile_number = ''"
                    )
                )

        if "students" in tables:
            student_cols = {column["name"] for column in inspect(engine).get_columns("students")}
            for name, column_type in _STUDENT_COLUMNS:
                if name not in student_cols:
                    connection.execute(text(f"ALTER TABLE students ADD COLUMN {name} {column_type}"))
            if connection.dialect.name == "postgresql":
                # Align legacy varchar UUID columns with ORM UUID FKs when safe.
                for col in ("parent_user_id", "admission_id"):
                    meta = next(
                        (c for c in inspect(engine).get_columns("students") if c["name"] == col),
                        None,
                    )
                    if not meta:
                        continue
                    col_type = str(meta.get("type") or "").lower()
                    if "char" in col_type or col_type == "text":
                        connection.execute(
                            text(
                                f"ALTER TABLE students ALTER COLUMN {col} TYPE UUID "
                                f"USING NULLIF({col}, '')::uuid"
                            )
                        )
