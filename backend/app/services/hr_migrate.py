from sqlalchemy import inspect, text

from app.core.database import engine

_EMPLOYEE_COLUMNS = (
    ("phone", "VARCHAR(40)"),
    ("gender", "VARCHAR(20)"),
    ("date_of_birth", "VARCHAR(20)"),
    ("address", "VARCHAR(255)"),
    ("department", "VARCHAR(80)"),
    ("designation", "VARCHAR(120)"),
    ("joining_date", "VARCHAR(20)"),
    ("status", "VARCHAR(32)"),
    ("reporting_manager", "VARCHAR(120)"),
    ("role_title", "VARCHAR(80)"),
    ("qualification", "VARCHAR(160)"),
    ("experience", "VARCHAR(80)"),
    ("emergency_contact", "VARCHAR(160)"),
    ("employment_type", "VARCHAR(40)"),
    ("category", "VARCHAR(80)"),
    ("gross_salary", "INTEGER"),
    ("other_allowance", "INTEGER"),
    ("special_deduction", "INTEGER"),
    ("other_employer_benefits", "INTEGER"),
    ("extra", "JSON"),
    ("user_id", "VARCHAR(36)"),
)


def ensure_hr_employee_columns() -> None:
    """Add profile columns when the starter employee table already exists."""
    inspector = inspect(engine)
    if "hr_employees" not in inspector.get_table_names():
        return
    present = {column["name"] for column in inspector.get_columns("hr_employees")}
    with engine.begin() as connection:
        for name, column_type in _EMPLOYEE_COLUMNS:
            if name not in present:
                connection.execute(text(f"ALTER TABLE hr_employees ADD COLUMN {name} {column_type}"))
