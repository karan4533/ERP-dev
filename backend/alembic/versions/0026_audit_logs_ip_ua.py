"""Add audit_logs.ip_address and audit_logs.user_agent.

Revision ID: 0026_audit_logs_ip_ua
Revises: 0025_tc_request_nocs
Create Date: 2026-11-21
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0026_audit_logs_ip_ua"
down_revision = "0025_tc_request_nocs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if not inspector.has_table("audit_logs"):
        return
    cols = {c["name"] for c in inspector.get_columns("audit_logs")}
    if "ip_address" not in cols:
        op.add_column("audit_logs", sa.Column("ip_address", sa.String(length=64), nullable=True))
    if "user_agent" not in cols:
        op.add_column("audit_logs", sa.Column("user_agent", sa.String(length=512), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if not inspector.has_table("audit_logs"):
        return
    cols = {c["name"] for c in inspector.get_columns("audit_logs")}
    if "user_agent" in cols:
        op.drop_column("audit_logs", "user_agent")
    if "ip_address" in cols:
        op.drop_column("audit_logs", "ip_address")
