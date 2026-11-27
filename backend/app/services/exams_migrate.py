"""Ensure exams table has columns introduced after the baseline schema."""

from __future__ import annotations

from sqlalchemy import inspect, text

from app.core.database import engine


def ensure_exams_schema() -> None:
    """Add exams columns introduced after baseline when create_all cannot alter existing tables.

    Matches Alembic ``0018`` (academic_year) and ``0022_exam_schedule_json`` (schedule JSON).
    Safe to run repeatedly; never drops data. Does not stamp alembic_version — operators
    should still run ``alembic upgrade head`` (or stamp after a verified manual ADD COLUMN).
    """
    try:
        inspector = inspect(engine)
        if not inspector.has_table("exams"):
            return
        cols = {c["name"] for c in inspector.get_columns("exams")}
        statements: list[str] = []
        if "academic_year" not in cols:
            statements.append("ALTER TABLE exams ADD COLUMN academic_year VARCHAR(40)")
        if "schedule" not in cols:
            # Same type as 0022 / model Mapped[dict | None] JSON nullable.
            statements.append("ALTER TABLE exams ADD COLUMN schedule JSON")
        if not statements:
            return
        with engine.begin() as conn:
            if engine.dialect.name == "postgresql":
                conn.execute(text("SET LOCAL lock_timeout = '5s'"))
            for sql in statements:
                conn.execute(text(sql))
    except Exception:
        # Never block API startup; Alembic revisions cover the same changes formally.
        pass
