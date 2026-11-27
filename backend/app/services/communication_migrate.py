"""Ensure group-conversation columns exist on ``conversations`` (Alembic 0026)."""

from __future__ import annotations

from sqlalchemy import inspect, text

from app.core.database import engine


def ensure_communication_schema() -> None:
    """Best-effort add ``is_group`` / ``title`` / ``created_by_id`` when create_all cannot alter.

    Matches Alembic ``0026_communication_groups``. Never raises — a missing column otherwise makes
    every inbox list / open / send return HTTP 500.
    """
    try:
        inspector = inspect(engine)
        if not inspector.has_table("conversations"):
            return
        cols = {c["name"] for c in inspector.get_columns("conversations")}
        statements: list[str] = []
        if "is_group" not in cols:
            statements.append("ALTER TABLE conversations ADD COLUMN is_group BOOLEAN NOT NULL DEFAULT false")
        if "title" not in cols:
            statements.append("ALTER TABLE conversations ADD COLUMN title VARCHAR(120)")
        if "created_by_id" not in cols:
            if engine.dialect.name == "postgresql":
                statements.append("ALTER TABLE conversations ADD COLUMN created_by_id UUID REFERENCES users(id)")
            else:
                statements.append("ALTER TABLE conversations ADD COLUMN created_by_id CHAR(32)")
        if not statements:
            return
        with engine.begin() as conn:
            if engine.dialect.name == "postgresql":
                conn.execute(text("SET LOCAL lock_timeout = '5s'"))
            for sql in statements:
                conn.execute(text(sql))
    except Exception:
        pass
