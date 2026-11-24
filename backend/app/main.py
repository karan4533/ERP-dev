from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints.admissions import router as admissions_router
from app.api.v1.endpoints.admin_users import router as admin_users_router
from app.api.v1.endpoints.audit import router as audit_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.activities import router as activities_router
from app.api.v1.endpoints.announcements import router as announcements_router
from app.api.v1.endpoints.calendar import router as calendar_router
from app.api.v1.endpoints.communication import router as communication_router
from app.api.v1.endpoints.dashboard import router as dashboard_router
from app.api.v1.endpoints.documents import router as documents_router
from app.api.v1.endpoints.front_office import router as front_office_router
from app.api.v1.endpoints.academics_collections import router as academics_collections_router
from app.api.v1.endpoints.ops_collections import router as ops_collections_router
from app.api.v1.endpoints.campus_audit_collections import router as campus_audit_collections_router
from app.api.v1.endpoints.protrack import router as protrack_router
from app.api.v1.endpoints.geo import router as geo_router
from app.api.v1.endpoints.webhooks import router as webhooks_router
from app.api.v1.endpoints.tc_requests import router as tc_requests_router
from app.api.v1.endpoints.files import router as files_router
from app.api.v1.endpoints.finance import router as finance_router
from app.api.v1.endpoints.hr import router as hr_router
from app.api.v1.endpoints.masters import router as masters_router
from app.api.v1.endpoints.parents import router as parents_router
from app.api.v1.endpoints.students import router as students_router
from app.api.v1.endpoints.attendance import router as attendance_router
from app.api.v1.endpoints.approvals import router as approvals_router
from app.api.v1.endpoints.lesson_plans import router as lesson_plans_router
from app.api.v1.endpoints.exams import router as exams_router
from app.api.v1.endpoints.escalations import router as escalations_router
from app.api.v1.endpoints.leave import router as leave_router
from app.api.v1.endpoints.substitute_duties import router as substitute_duties_router
from app.core.config import settings
from app.core.database import SessionLocal, engine
from app.models import Base
from app.services.admissions_migrate import ensure_admissions_schema
from app.services.exams_migrate import ensure_exams_schema
from app.services.hr_migrate import ensure_hr_employee_columns
from app.services.masters_migrate import ensure_masters_schema
from app.services.schema_check import warn_if_schema_behind
from app.services.seed import seed_reference_data


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_hr_employee_columns()
    ensure_admissions_schema()
    ensure_masters_schema()
    ensure_exams_schema()
    warn_if_schema_behind()
    db = SessionLocal()
    try:
        seed_reference_data(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title=settings.app_name, version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(audit_router)
app.include_router(admin_users_router)
app.include_router(masters_router)
app.include_router(admissions_router)
app.include_router(parents_router)
app.include_router(students_router)
app.include_router(attendance_router)
app.include_router(approvals_router)
app.include_router(lesson_plans_router)
app.include_router(exams_router)
app.include_router(leave_router)
app.include_router(substitute_duties_router)
app.include_router(escalations_router)
app.include_router(finance_router)
app.include_router(hr_router)
app.include_router(files_router)
app.include_router(documents_router)
app.include_router(announcements_router)
app.include_router(calendar_router)
app.include_router(tc_requests_router)
app.include_router(activities_router)
app.include_router(communication_router)
app.include_router(dashboard_router)
app.include_router(front_office_router)
app.include_router(academics_collections_router)
app.include_router(ops_collections_router)
app.include_router(campus_audit_collections_router)
app.include_router(protrack_router)
app.include_router(geo_router)
app.include_router(webhooks_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
