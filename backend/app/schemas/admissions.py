from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class EnquiryCreate(BaseModel):
    name: str | None = None
    mobile_number: str | None = None
    email: str | None = None
    gender: str | None = None
    address: str | None = None
    description: str | None = None
    note: str | None = None
    enquiry_date: date | None = None
    next_follow_up_date: date | None = None
    assigned_to: str | None = None
    reference: str | None = None
    source: str | None = None
    class_name: str = ""
    number_of_child: str | None = None
    city: str | None = None
    state: str | None = None
    profile_image_file_id: UUID | None = None
    status: str | None = "Active"
    # Phase-0 aliases (optional)
    student_name: str | None = None
    guardian_name: str | None = None
    guardian_phone: str | None = None


class EnquiryOut(BaseModel):
    id: UUID
    enquiry_code: str
    name: str
    mobile_number: str
    email: str | None = None
    gender: str | None = None
    address: str | None = None
    description: str | None = None
    note: str | None = None
    enquiry_date: date | None = None
    next_follow_up_date: date | None = None
    assigned_to: str | None = None
    reference: str | None = None
    source: str | None = None
    class_name: str
    number_of_child: str | None = None
    city: str | None = None
    state: str | None = None
    profile_image_file_id: UUID | None = None
    profile_image_url: str | None = None
    status: str
    converted_admission_id: UUID | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class AdmissionCreate(BaseModel):
    enquiry_id: UUID | None = None
    admission_date: date | None = None
    class_name: str = ""
    registration_fees: str | None = None
    batch_start_year: int | None = None
    batch_end_year: int | None = None
    first_name: str
    middle_name: str | None = None
    last_name: str | None = None
    gender: str | None = None
    religion: str | None = None
    caste: str | None = None
    address: str | None = None
    date_of_birth: date | None = None
    country: str | None = None
    state: str | None = None
    city: str | None = None
    zip_code: str | None = None
    mobile_number: str
    alt_mobile_number: str | None = None
    email: str | None = None
    previous_school: str | None = None
    blood_group: str | None = None
    height: str | None = None
    weight: str | None = None
    medical_history: str | None = None
    mode_of_transport: str | None = None
    route: str | None = None
    bus_stop: str | None = None
    father_name: str | None = None
    mother_name: str | None = None
    father_occupation: str | None = None
    mother_occupation: str | None = None
    father_income: str | None = None
    mother_income: str | None = None
    siblings: str | None = None
    parent_address: str | None = None
    parent_country: str | None = None
    parent_state: str | None = None
    parent_city: str | None = None
    parent_zip_code: str | None = None
    parent_mobile_number: str | None = None
    parent_alt_mobile_number: str | None = None
    parent_email: str | None = None
    parent_account_email: str | None = None
    parent_account_password: str | None = None
    fees_group: str | None = None
    profile_image_file_id: UUID | None = None
    status: str | None = "Active"


class AdmissionOut(BaseModel):
    id: UUID
    admission_code: str
    enquiry_id: UUID | None = None
    admission_date: date | None = None
    class_name: str
    registration_fees: str | None = None
    batch_start_year: int | None = None
    batch_end_year: int | None = None
    first_name: str
    middle_name: str | None = None
    last_name: str | None = None
    gender: str | None = None
    religion: str | None = None
    caste: str | None = None
    address: str | None = None
    date_of_birth: date | None = None
    country: str | None = None
    state: str | None = None
    city: str | None = None
    zip_code: str | None = None
    mobile_number: str
    alt_mobile_number: str | None = None
    email: str | None = None
    previous_school: str | None = None
    blood_group: str | None = None
    height: str | None = None
    weight: str | None = None
    medical_history: str | None = None
    profile_image_file_id: UUID | None = None
    profile_image_url: str | None = None
    mode_of_transport: str | None = None
    route: str | None = None
    bus_stop: str | None = None
    father_name: str | None = None
    mother_name: str | None = None
    father_occupation: str | None = None
    mother_occupation: str | None = None
    father_income: str | None = None
    mother_income: str | None = None
    siblings: str | None = None
    parent_address: str | None = None
    parent_country: str | None = None
    parent_state: str | None = None
    parent_city: str | None = None
    parent_zip_code: str | None = None
    parent_mobile_number: str | None = None
    parent_alt_mobile_number: str | None = None
    parent_email: str | None = None
    parent_account_email: str | None = None
    fees_group: str | None = None
    status: str
    enrolled_student_id: UUID | None = None
    enrolled_at: datetime | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class EnrollAdmissionIn(BaseModel):
    parent_account_email: str | None = None
    parent_account_password: str | None = None
    skip_parent_account: bool = False


class EnrollAdmissionOut(BaseModel):
    admission: AdmissionOut
    student_id: UUID
    student_code: str
    parent_user_id: UUID | None = None
    parent_created: bool = False
