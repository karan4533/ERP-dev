from datetime import date, datetime

from pydantic import BaseModel, Field


class AcademicYearPublic(BaseModel):
    id: int
    campus_id: int
    name: str
    start_date: date | None
    end_date: date | None
    is_current: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SchoolClassPublic(BaseModel):
    id: int
    campus_id: int
    academic_year_id: int
    name: str
    display_order: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SectionPublic(BaseModel):
    id: int
    campus_id: int
    class_id: int
    name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SubjectPublic(BaseModel):
    id: int
    campus_id: int
    code: str
    name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AcademicYearCreate(BaseModel):
    name: str = Field(min_length=4, max_length=50)
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool = False


class SchoolClassCreate(BaseModel):
    academic_year_id: int
    name: str = Field(min_length=1, max_length=50)
    display_order: int = 0


class SectionCreate(BaseModel):
    class_id: int
    name: str = Field(min_length=1, max_length=20)


class SubjectCreate(BaseModel):
    code: str = Field(min_length=1, max_length=30)
    name: str = Field(min_length=1, max_length=100)
