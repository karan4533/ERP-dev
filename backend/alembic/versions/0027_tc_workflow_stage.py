"""Add tc_requests.workflow_stage for client CT->...->MD overflow.

NOCs remain in existing table ``tc_request_nocs`` (revision 0025); this migration
does not add a duplicate ``noc_json`` column.

Revision ID: 0027_tc_workflow_stage
Revises: 0026_audit_logs_ip_ua
Create Date: 2026-11-25
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0027_tc_workflow_stage"
down_revision = "0026_audit_logs_ip_ua"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "tc_requests" not in set(inspector.get_table_names()):
        return
    cols = {c["name"] for c in inspector.get_columns("tc_requests")}
    if "workflow_stage" not in cols:
        op.add_column(
            "tc_requests",
            sa.Column("workflow_stage", sa.String(length=40), nullable=False, server_default="prm"),
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "tc_requests" not in set(inspector.get_table_names()):
        return
    cols = {c["name"] for c in inspector.get_columns("tc_requests")}
    if "workflow_stage" in cols:
        op.drop_column("tc_requests", "workflow_stage")
