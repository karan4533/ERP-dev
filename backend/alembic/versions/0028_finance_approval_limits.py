"""Add finance_approval_limits for campus per-role spend caps.

Revision ID: 0028_finance_approval_limits
Revises: 0027_tc_workflow_stage
Create Date: 2026-11-25
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0028_finance_approval_limits"
down_revision = "0027_tc_workflow_stage"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "finance_approval_limits" in set(inspector.get_table_names()):
        return
    op.create_table(
        "finance_approval_limits",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("campus_id", sa.Uuid(), sa.ForeignKey("campuses.id"), nullable=False),
        sa.Column("role_code", sa.String(length=64), nullable=False),
        sa.Column("role_label", sa.String(length=120), nullable=False, server_default=""),
        sa.Column(
            "category",
            sa.String(length=40),
            nullable=False,
            server_default="general",
        ),
        sa.Column("limit_inr", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("updated_by", sa.Uuid(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint(
            "campus_id",
            "role_code",
            "category",
            name="uq_finance_approval_limits_campus_role_cat",
        ),
        sa.CheckConstraint(
            "category IN ("
            "'general', 'purchase', 'material_request', 'expense', 'salary_advance'"
            ")",
            name="ck_finance_approval_limits_category",
        ),
        sa.CheckConstraint("limit_inr >= 0", name="ck_finance_approval_limits_nonneg"),
    )
    op.create_index(
        "ix_finance_approval_limits_campus_id",
        "finance_approval_limits",
        ["campus_id"],
    )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "finance_approval_limits" not in set(inspector.get_table_names()):
        return
    op.drop_index("ix_finance_approval_limits_campus_id", table_name="finance_approval_limits")
    op.drop_table("finance_approval_limits")
