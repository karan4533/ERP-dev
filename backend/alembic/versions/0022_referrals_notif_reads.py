"""Admission referrals (record only) and per-user read receipts for role-wide notifications.

Revision ID: 0022_referrals_notif_reads
Revises: 0021_substitute_duties
Create Date: 2026-10-27
"""

from alembic import op

from app.services.schema_helpers import create_missing_tables, drop_tables_if_empty

revision = "0022_referrals_notif_reads"
down_revision = "0021_substitute_duties"
branch_labels = None
depends_on = None

TABLES = ["admission_referrals", "notification_reads"]


def upgrade_connection(conn) -> dict:
    return {"created": create_missing_tables(conn, TABLES)}


def downgrade_connection(conn) -> dict:
    return {"dropped": drop_tables_if_empty(conn, list(reversed(TABLES)))}


def upgrade() -> None:
    upgrade_connection(op.get_bind())


def downgrade() -> None:
    downgrade_connection(op.get_bind())
