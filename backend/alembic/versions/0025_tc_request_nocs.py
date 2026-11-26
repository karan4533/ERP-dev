"""TC request manager NOC rows + widened status check.

Revision ID: 0025_tc_request_nocs
Revises: 0024_attendance_dual_session
Create Date: 2026-11-05
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

from app.services.schema_helpers import create_missing_tables, drop_tables_if_empty

revision = "0025_tc_request_nocs"
down_revision = "0024_attendance_dual_session"
branch_labels = None
depends_on = None

TABLES = ["tc_request_nocs"]

NEW_STATUS_CHECK = (
    "status IN ("
    "'Pending PRM Review', "
    "'Pending Manager NOCs', "
    "'Pending Super Admin Approval', "
    "'Approved', "
    "'Rejected'"
    ")"
)


def _refresh_status_check(conn) -> None:
    """Widen tc_requests status check when the dialect supports ALTER CONSTRAINT."""
    inspector = sa.inspect(conn)
    if not inspector.has_table("tc_requests"):
        return
    dialect = conn.dialect.name
    if dialect == "postgresql":
        # Drop by known name; ignore if already absent.
        conn.execute(sa.text("ALTER TABLE tc_requests DROP CONSTRAINT IF EXISTS ck_tc_requests_status"))
        conn.execute(
            sa.text(f"ALTER TABLE tc_requests ADD CONSTRAINT ck_tc_requests_status CHECK ({NEW_STATUS_CHECK})")
        )
    # SQLite cannot easily alter CHECK constraints; create_all / new DBs pick up the model.
    # Existing SQLite rows keep the old constraint only if it was baked into the table DDL.


def upgrade_connection(conn) -> dict:
    created = create_missing_tables(conn, TABLES)
    _refresh_status_check(conn)
    return {"created": created}


def downgrade_connection(conn) -> dict:
    dropped = drop_tables_if_empty(conn, list(reversed(TABLES)))
    return {"dropped": dropped}


def upgrade() -> None:
    upgrade_connection(op.get_bind())


def downgrade() -> None:
    downgrade_connection(op.get_bind())
