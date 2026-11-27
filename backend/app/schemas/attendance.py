from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field


class AttendanceMarkIn(BaseModel):
    student_id: UUID = Field(alias="studentId")
    status: str = Field(min_length=1, max_length=20)
    in_out_status: str | None = Field(default=None, alias="inOutStatus")
    session: str | None = Field(default=None, max_length=2)  # FN | AN — defaults from payload.session
    check_in_time: str | None = Field(default=None, alias="checkInTime", max_length=20)
    check_out_time: str | None = Field(default=None, alias="checkOutTime", max_length=20)

    model_config = {"populate_by_name": True}


class AttendanceUpsertIn(BaseModel):
    date: date
    class_name: str = Field(alias="className", min_length=1, max_length=40)
    section: str | None = Field(default=None, max_length=20)
    session: str = Field(default="FN", max_length=2)  # FN | AN
    marks: list[AttendanceMarkIn] = Field(min_length=1)

    model_config = {"populate_by_name": True}


class AttendanceSyncIn(BaseModel):
    """Run-now biometric sync window. Empty body = today (campus time)."""

    day: date | None = Field(default=None, alias="date")
    from_date: date | None = Field(default=None, alias="fromDate")
    to_date: date | None = Field(default=None, alias="toDate")

    model_config = {"populate_by_name": True}
