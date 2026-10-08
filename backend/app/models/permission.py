from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base

# Mirrors frontend ROLE_PERMISSION_MODULES (Admin RBAC matrix)
PERMISSION_MODULES: tuple[tuple[str, str, bool], ...] = (
    ("dashboard", "Dashboard", True),
    ("assignedClass", "Assigned Class", False),
    ("lessonPlans", "Lesson Plans", False),
    ("markEntry", "Mark Entry", False),
    ("unitTests", "Unit Tests", False),
    ("deliverables", "Deliverables", False),
    ("taskManagement", "Task Management", False),
    ("admissions", "Admissions / Front Office", False),
    ("userDatabase", "User Database", False),
    ("attendance", "Attendance", False),
    ("communication", "Communication", False),
    ("announcement", "Announcement", False),
    ("calendar", "Calendar", False),
    ("leaveRequest", "Leave Request", False),
    ("rbac", "RBAC", False),
)


class RolePermission(Base):
    __tablename__ = "role_permissions"
    __table_args__ = (UniqueConstraint("role_id", "module_key", name="uq_role_module"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role_id: Mapped[str] = mapped_column(String(50), ForeignKey("roles.id"), index=True, nullable=False)
    module_key: Mapped[str] = mapped_column(String(50), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
