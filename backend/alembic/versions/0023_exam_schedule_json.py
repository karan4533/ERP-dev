"""Persist exam subject timelines on exams.schedule JSON.

Revision ID: 0023_exam_schedule_json
Revises: 0022_referrals_notif_reads
Create Date: 2026-10-27
"""

import sqlalchemy as sa
from alembic import op

revision = "0023_exam_schedule_json"
down_revision = "0022_referrals_notif_reads"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = set(inspector.get_table_names())
    if "exams" not in tables:
        return
    cols = {c["name"] for c in inspector.get_columns("exams")}
    if "schedule" not in cols:
        op.add_column("exams", sa.Column("schedule", sa.JSON(), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = set(inspector.get_table_names())
    if "exams" not in tables:
        return
    cols = {c["name"] for c in inspector.get_columns("exams")}
    if "schedule" in cols:
        op.drop_column("exams", "schedule")
