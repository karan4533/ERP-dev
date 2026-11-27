"""Ensure TC NOC table exists on startup (best-effort; Alembic 0024 is authoritative)."""

from __future__ import annotations

from sqlalchemy import inspect, text

from app.core.database import engine


def ensure_tc_schema() -> None:
    """Best-effort create of ``tc_request_nocs`` when Alembic 0024 has not run yet.

    Never raises. Intentionally does **not** ALTER ``tc_requests`` status CHECK on
    startup: DROP/ADD CONSTRAINT needs an ACCESS EXCLUSIVE lock and can block the
    new ECS task until health checks fail (circuit breaker rollback). Widen the
    CHECK via ``alembic upgrade head`` (revision 0024) with a maintenance window.
    """
    try:
        inspector = inspect(engine)
        if inspector.has_table("tc_request_nocs"):
            return
        from app.models import Base

        table = Base.metadata.tables.get("tc_request_nocs")
        if table is not None:
            # Short lock wait so a busy catalog cannot hang uvicorn forever.
            with engine.begin() as conn:
                if engine.dialect.name == "postgresql":
                    conn.execute(text("SET LOCAL lock_timeout = '5s'"))
                table.create(bind=conn, checkfirst=True)
    except Exception:
        # Never block API startup; Alembic 0024 covers the same change formally.
        pass
