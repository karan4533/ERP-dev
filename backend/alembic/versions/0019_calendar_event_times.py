"""Add all_day / start_time / end_time to calendar_events (NUI-SA-128).

Revision ID: 0019_calendar_event_times
Revises: 0018_exam_academic_year
Create Date: 2026-11-20
"""

import sqlalchemy as sa
from alembic import op

revision = "0019_calendar_event_times"
down_revision = "0018_exam_academic_year"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = set(inspector.get_table_names())
    if "calendar_events" not in tables:
        return
    cols = {c["name"] for c in inspector.get_columns("calendar_events")}
    if "all_day" not in cols:
        op.add_column(
            "calendar_events",
            sa.Column("all_day", sa.Boolean(), nullable=False, server_default=sa.true()),
        )
    if "start_time" not in cols:
        op.add_column("calendar_events", sa.Column("start_time", sa.String(length=5), nullable=True))
    if "end_time" not in cols:
        op.add_column("calendar_events", sa.Column("end_time", sa.String(length=5), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = set(inspector.get_table_names())
    if "calendar_events" not in tables:
        return
    cols = {c["name"] for c in inspector.get_columns("calendar_events")}
    if "end_time" in cols:
        op.drop_column("calendar_events", "end_time")
    if "start_time" in cols:
        op.drop_column("calendar_events", "start_time")
    if "all_day" in cols:
        op.drop_column("calendar_events", "all_day")
