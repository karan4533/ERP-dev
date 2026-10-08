"""
HR APIs — partner owns this module.

Week 1 starter: employees CRUD.
Next: documents, recruitment, onboarding, payroll (see docs/TEAM_ROADMAP.md).
"""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.hr import HrEmployeeCreate, HrEmployeePublic, HrEmployeeUpdate
from app.services import hr_employee_service

router = APIRouter()


@router.get("/employees", response_model=list[HrEmployeePublic])
def list_hr_employees(db: DbSession, current_user: CurrentUser) -> list[HrEmployeePublic]:
    rows = hr_employee_service.list_employees(db, campus_id=current_user.campus_id)
    return [HrEmployeePublic.model_validate(row) for row in rows]


@router.post(
    "/employees",
    response_model=HrEmployeePublic,
    status_code=status.HTTP_201_CREATED,
)
def create_hr_employee(
    payload: HrEmployeeCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> HrEmployeePublic:
    # TODO(partner): enforce HR role-only create when RBAC is ready
    employee = hr_employee_service.create_employee(
        db, payload, campus_id=current_user.campus_id
    )
    return HrEmployeePublic.model_validate(employee)


@router.get("/employees/{employee_id}", response_model=HrEmployeePublic)
def get_hr_employee(
    employee_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> HrEmployeePublic:
    employee = hr_employee_service.get_employee(
        db, employee_id, campus_id=current_user.campus_id
    )
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return HrEmployeePublic.model_validate(employee)


@router.patch("/employees/{employee_id}", response_model=HrEmployeePublic)
def patch_hr_employee(
    employee_id: int,
    payload: HrEmployeeUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> HrEmployeePublic:
    employee = hr_employee_service.get_employee(
        db, employee_id, campus_id=current_user.campus_id
    )
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    updated = hr_employee_service.update_employee(db, employee, payload)
    return HrEmployeePublic.model_validate(updated)
