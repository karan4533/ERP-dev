"""Group conversations: is_group / title / created_by on conversations.

Revision ID: 0030_communication_groups
Revises: 0029_attendance_sync_source
Create Date: 2026-11-14
"""

import sqlalchemy as sa
from alembic import op

revision = "0030_communication_groups"
down_revision = "0029_attendance_sync_source"
branch_labels = None
depends_on = None


FK_NAME = "fk_conversations_created_by_id_users"


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "conversations" not in set(inspector.get_table_names()):
        return
    cols = {c["name"] for c in inspector.get_columns("conversations")}
    if "is_group" not in cols:
        op.add_column(
            "conversations",
            sa.Column("is_group", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
    if "title" not in cols:
        op.add_column("conversations", sa.Column("title", sa.String(length=120), nullable=True))
    if "created_by_id" not in cols:
        op.add_column("conversations", sa.Column("created_by_id", sa.Uuid(), nullable=True))
    if conn.dialect.name == "postgresql":
        existing_fks = {fk.get("name") for fk in inspector.get_foreign_keys("conversations")}
        if FK_NAME not in existing_fks:
            op.create_foreign_key(FK_NAME, "conversations", "users", ["created_by_id"], ["id"])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "conversations" not in set(inspector.get_table_names()):
        return
    cols = {c["name"] for c in inspector.get_columns("conversations")}
    if "created_by_id" in cols:
        if conn.dialect.name == "postgresql":
            existing_fks = {fk.get("name") for fk in inspector.get_foreign_keys("conversations")}
            if FK_NAME in existing_fks:
                op.drop_constraint(FK_NAME, "conversations", type_="foreignkey")
        op.drop_column("conversations", "created_by_id")
    for col in ("title", "is_group"):
        if col in cols:
            op.drop_column("conversations", col)
