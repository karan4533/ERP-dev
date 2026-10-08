from sqlalchemy.orm import Session

from app.models.hr_employee import HrEmployee
from app.schemas.hr import HrEmployeeCreate, HrEmployeeUpdate


def list_employees(db: Session, *, campus_id: int) -> list[HrEmployee]:
    return (
        db.query(HrEmployee)
        .filter(HrEmployee.campus_id == campus_id)
        .order_by(HrEmployee.id.desc())
        .all()
    )


def get_employee(db: Session, employee_id: int, *, campus_id: int) -> HrEmployee | None:
    return (
        db.query(HrEmployee)
        .filter(HrEmployee.id == employee_id, HrEmployee.campus_id == campus_id)
        .first()
    )


def create_employee(
    db: Session,
    payload: HrEmployeeCreate,
    *,
    campus_id: int,
) -> HrEmployee:
    employee = HrEmployee(
        campus_id=campus_id,
        **payload.model_dump(),
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


def update_employee(
    db: Session,
    employee: HrEmployee,
    payload: HrEmployeeUpdate,
) -> HrEmployee:
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(employee, key, value)
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee
