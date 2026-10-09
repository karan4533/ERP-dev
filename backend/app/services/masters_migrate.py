"""Add academic_year_id on school_classes when an older Phase-0 DB already exists."""

from sqlalchemy import inspect, text

from app.core.database import engine


def ensure_masters_schema() -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if "school_classes" not in tables:
        return

    present = {column["name"] for column in inspector.get_columns("school_classes")}
    if "academic_year_id" in present:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE school_classes ADD COLUMN academic_year_id VARCHAR(36)"))
