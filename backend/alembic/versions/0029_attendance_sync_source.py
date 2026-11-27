"""Student attendance source (manual / auto biometric sync) + punch reference.

Revision ID: 0029_attendance_sync_source
Revises: 0028_finance_approval_limits
Create Date: 2026-11-14
"""

import sqlalchemy as sa
from alembic import op

revision = "0029_attendance_sync_source"
down_revision = "0028_finance_approval_limits"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "student_attendance" not in set(inspector.get_table_names()):
        return
    cols = {c["name"] for c in inspector.get_columns("student_attendance")}
    if "source" not in cols:
        op.add_column(
            "student_attendance",
            sa.Column("source", sa.String(length=10), nullable=False, server_default="manual"),
        )
    if "source_ref" not in cols:
        op.add_column("student_attendance", sa.Column("source_ref", sa.String(length=80), nullable=True))


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "student_attendance" not in set(inspector.get_table_names()):
        return
    cols = {c["name"] for c in inspector.get_columns("student_attendance")}
    for col in ("source_ref", "source"):
        if col in cols:
            op.drop_column("student_attendance", col)
