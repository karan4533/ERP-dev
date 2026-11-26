"""Administrator-assigned substitute duties (attendance access for one section, date and period).

Revision ID: 0021_substitute_duties
Revises: 0020_admission_zip_widen
Create Date: 2026-10-27
"""

from alembic import op

from app.services.schema_helpers import create_missing_tables, drop_tables_if_empty

revision = "0021_substitute_duties"
down_revision = "0020_admission_zip_widen"
branch_labels = None
depends_on = None

TABLES = ["substitute_duties"]


def upgrade_connection(conn) -> dict:
    return {"created": create_missing_tables(conn, TABLES)}


def downgrade_connection(conn) -> dict:
    return {"dropped": drop_tables_if_empty(conn, list(reversed(TABLES)))}


def upgrade() -> None:
    upgrade_connection(op.get_bind())


def downgrade() -> None:
    downgrade_connection(op.get_bind())
