"""Administrator dashboard figures from the live tables."""

from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.deps import permission_codes_for
from app.models import Announcement, Escalation, HrEmployee, LeaveRequest, Student, TcRequest
from app.services.errors import fail


def snapshot(db: Session, actor: User) -> dict:
    if "dashboard.read" not in permission_codes_for(db, actor):
        fail(403, "forbidden", "You are not allowed to view the dashboard.")
    campus = actor.campus_id
    today = date.today()
    month_start = today.replace(day=1)
    students = db.scalar(select(func.count()).select_from(Student).where(Student.campus_id == campus)) or 0
    employees = db.scalar(select(func.count()).select_from(HrEmployee).where(HrEmployee.campus_id == campus)) or 0
    pending_leave = db.scalar(
        select(func.count()).select_from(LeaveRequest).where(LeaveRequest.campus_id == campus)
    ) or 0
    # Leave status lives on the approval; count all campus requests as a volume figure and
    # the ones still open via a simple status-less count of recent rows. The inbox figure is notifications.
    open_escalations = db.scalar(
        select(func.count()).select_from(Escalation).where(
            Escalation.campus_id == campus, Escalation.status.notin_(("Closed", "Resolved", "Rejected"))
        )
    ) or 0
    pending_tc = db.scalar(
        select(func.count()).select_from(TcRequest).where(
            TcRequest.campus_id == campus, TcRequest.status == "Pending Super Admin Approval"
        )
    ) or 0
    from app.services.approvals import list_notifications

    unread = len(list_notifications(db, actor, unread_only=True))
    announcements = db.scalar(
        select(func.count()).select_from(Announcement).where(
            Announcement.campus_id == campus, Announcement.announcement_date >= month_start
        )
    ) or 0
    return {
        "students": students,
        "employees": employees,
        "leaveRequests": pending_leave,
        "openEscalations": open_escalations,
        "pendingTc": pending_tc,
        "unreadNotifications": unread,
        "announcementsThisMonth": announcements,
        "asOf": today.isoformat(),
    }
