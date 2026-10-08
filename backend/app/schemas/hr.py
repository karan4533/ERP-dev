from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field


class HrEmployeeCreate(BaseModel):
    employee_code: str = Field(min_length=1, max_length=50)
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr | None = None
    mobile: str | None = None
    department: str | None = None
    designation: str | None = None
    category: str | None = None
    role_id: str | None = None
    status: str = "Active"
    joining_date: date | None = None
    notes: str | None = None


class HrEmployeeUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    mobile: str | None = None
    department: str | None = None
    designation: str | None = None
    category: str | None = None
    role_id: str | None = None
    status: str | None = None
    joining_date: date | None = None
    notes: str | None = None


class HrEmployeePublic(BaseModel):
    id: int
    campus_id: int
    user_id: int | None
    employee_code: str
    full_name: str
    email: EmailStr | None
    mobile: str | None
    department: str | None
    designation: str | None
    category: str | None
    role_id: str | None
    status: str
    joining_date: date | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
