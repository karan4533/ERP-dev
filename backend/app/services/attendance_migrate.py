"""Ensure dual-session + sync-source student attendance columns exist (Alembic 0023 / 0025)."""

from __future__ import annotations

from sqlalchemy import inspect, text

from app.core.database import engine


def ensure_attendance_schema() -> None:
    """Best-effort add ``session`` / check-in/out columns when create_all cannot alter.

    Matches Alembic ``0023_attendance_dual_session``. Never raises — a missing column
    otherwise makes every Manual Attendance list/upsert return HTTP 500.
    """
    try:
        inspector = inspect(engine)
        if not inspector.has_table("student_attendance"):
            return
        cols = {c["name"] for c in inspector.get_columns("student_attendance")}
        statements: list[str] = []
        if "session" not in cols:
            statements.append(
                "ALTER TABLE student_attendance ADD COLUMN session VARCHAR(2) NOT NULL DEFAULT 'FN'"
            )
        if "check_in_time" not in cols:
            statements.append("ALTER TABLE student_attendance ADD COLUMN check_in_time VARCHAR(20)")
        if "check_out_time" not in cols:
            statements.append("ALTER TABLE student_attendance ADD COLUMN check_out_time VARCHAR(20)")
        if "source" not in cols:
            statements.append(
                "ALTER TABLE student_attendance ADD COLUMN source VARCHAR(10) NOT NULL DEFAULT 'manual'"
            )
        if "source_ref" not in cols:
            statements.append("ALTER TABLE student_attendance ADD COLUMN source_ref VARCHAR(80)")
        if not statements:
            return
        with engine.begin() as conn:
            if engine.dialect.name == "postgresql":
                conn.execute(text("SET LOCAL lock_timeout = '5s'"))
            for sql in statements:
                conn.execute(text(sql))
            # Unique (campus, student, date, session) — only when the day-only unique still exists.
            if engine.dialect.name == "postgresql" and "session" not in cols:
                conn.execute(
                    text("ALTER TABLE student_attendance DROP CONSTRAINT IF EXISTS uq_student_attendance_day")
                )
                conn.execute(
                    text(
                        "ALTER TABLE student_attendance DROP CONSTRAINT IF EXISTS "
                        "uq_student_attendance_day_session"
                    )
                )
                conn.execute(
                    text(
                        "ALTER TABLE student_attendance ADD CONSTRAINT "
                        "uq_student_attendance_day_session "
                        "UNIQUE (campus_id, student_id, attendance_date, session)"
                    )
                )
    except Exception:
        pass
