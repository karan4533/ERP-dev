"""Dual-session student attendance (FN morning / AN afternoon).

Revision ID: 0024_attendance_dual_session
Revises: 0023_exam_schedule_json
Create Date: 2026-10-28
"""

import sqlalchemy as sa
from alembic import op

revision = "0024_attendance_dual_session"
down_revision = "0023_exam_schedule_json"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = set(inspector.get_table_names())
    if "student_attendance" not in tables:
        return
    cols = {c["name"] for c in inspector.get_columns("student_attendance")}
    if "session" not in cols:
        op.add_column(
            "student_attendance",
            sa.Column("session", sa.String(length=2), nullable=False, server_default="FN"),
        )
    if "check_in_time" not in cols:
        op.add_column("student_attendance", sa.Column("check_in_time", sa.String(length=20), nullable=True))
    if "check_out_time" not in cols:
        op.add_column("student_attendance", sa.Column("check_out_time", sa.String(length=20), nullable=True))

    # Replace day-unique with day+session unique.
    uqs = {u["name"] for u in inspector.get_unique_constraints("student_attendance")}
    if "uq_student_attendance_day" in uqs:
        op.drop_constraint("uq_student_attendance_day", "student_attendance", type_="unique")
    uqs = {u["name"] for u in sa.inspect(conn).get_unique_constraints("student_attendance")}
    if "uq_student_attendance_day_session" not in uqs:
        op.create_unique_constraint(
            "uq_student_attendance_day_session",
            "student_attendance",
            ["campus_id", "student_id", "attendance_date", "session"],
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = set(inspector.get_table_names())
    if "student_attendance" not in tables:
        return
    uqs = {u["name"] for u in inspector.get_unique_constraints("student_attendance")}
    if "uq_student_attendance_day_session" in uqs:
        op.drop_constraint("uq_student_attendance_day_session", "student_attendance", type_="unique")
    uqs = {u["name"] for u in sa.inspect(conn).get_unique_constraints("student_attendance")}
    if "uq_student_attendance_day" not in uqs:
        op.create_unique_constraint(
            "uq_student_attendance_day",
            "student_attendance",
            ["campus_id", "student_id", "attendance_date"],
        )
    cols = {c["name"] for c in inspector.get_columns("student_attendance")}
    for col in ("check_out_time", "check_in_time", "session"):
        if col in cols:
            op.drop_column("student_attendance", col)
