"""Add masters columns when an older Phase-0 DB already exists."""

from sqlalchemy import inspect, text

from app.core.database import engine

_TABLE_COLUMNS = {
    "school_classes": (("academic_year_id", "VARCHAR(36)"),),
    "academic_years": (("is_active", "BOOLEAN DEFAULT 1"),),
    "sections": (("is_active", "BOOLEAN DEFAULT 1"),),
}


def ensure_masters_schema() -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    with engine.begin() as connection:
        for table, columns in _TABLE_COLUMNS.items():
            if table not in tables:
                continue
            present = {column["name"] for column in inspect(engine).get_columns(table)}
            for name, column_type in columns:
                if name not in present:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {column_type}"))
