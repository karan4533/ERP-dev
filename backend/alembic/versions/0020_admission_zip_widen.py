"""Widen admissions zip_code fields beyond VARCHAR(20).

Revision ID: 0020_admission_zip_widen
Revises: 0019_calendar_event_times
Create Date: 2026-10-27
"""

import sqlalchemy as sa
from alembic import op

revision = "0020_admission_zip_widen"
down_revision = "0019_calendar_event_times"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "admissions" not in inspector.get_table_names():
        return
    cols = {c["name"] for c in inspector.get_columns("admissions")}
    if "zip_code" in cols:
        op.execute("ALTER TABLE admissions ALTER COLUMN zip_code TYPE VARCHAR(40)")
    if "parent_zip_code" in cols:
        op.execute("ALTER TABLE admissions ALTER COLUMN parent_zip_code TYPE VARCHAR(40)")


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "admissions" not in inspector.get_table_names():
        return
    cols = {c["name"] for c in inspector.get_columns("admissions")}
    # May fail if values longer than 20 exist; intentional for downgrade.
    if "zip_code" in cols:
        op.execute("ALTER TABLE admissions ALTER COLUMN zip_code TYPE VARCHAR(20)")
    if "parent_zip_code" in cols:
        op.execute("ALTER TABLE admissions ALTER COLUMN parent_zip_code TYPE VARCHAR(20)")
