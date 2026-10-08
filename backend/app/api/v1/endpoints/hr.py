from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_any, require_permission
from app.models import User
from app.schemas.phase0 import EmployeeCreate, EmployeeOut
from app.services.hr import (
    LIST_COLLECTIONS,
    create_employee,
    create_staff,
    create_item,
    documents_for_employee,
    get_employee,
    leave_bundle,
    list_employees,
    list_items,
    patch_item,
    payroll_bundle,
    portal_employees,
    replace_items,
    replace_portal_employees,
    save_leave_bundle,
    save_payroll_bundle,
)

router = APIRouter(prefix="/api/v1/hr", tags=["hr"])


@router.get("/employees", response_model=list[EmployeeOut])
def list_employees_route(
    db: Session = Depends(get_db),
    user: User = Depends(require_any("hr.employees.read", "hr.self")),
) -> list:
    return list_employees(db, user)


@router.post("/employees", response_model=EmployeeOut, status_code=201)
def create_employee_route(
    body: EmployeeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("hr.employees.write")),
):
    return create_employee(db, user, body)


@router.post("/staff", status_code=201)
def create_staff_route(
    body: dict,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("hr.write")),
) -> dict:
    return create_staff(db, user, body)


@router.get("/employees/{employee_code}", response_model=EmployeeOut)
def get_employee_route(
    employee_code: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_any("hr.employees.read", "hr.self")),
):
    return get_employee(db, user, employee_code)


@router.get("/employees/{employee_code}/documents")
def employee_documents_route(
    employee_code: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_any("hr.read", "hr.self")),
) -> list[dict]:
    return documents_for_employee(db, user, employee_code)


@router.get("/portal/employees")
def list_portal_employees_route(
    db: Session = Depends(get_db),
    user: User = Depends(require_any("hr.read", "hr.self")),
) -> list[dict]:
    return portal_employees(db, user)


@router.put("/portal/employees")
def replace_portal_employees_route(
    body: list[dict] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("hr.write")),
) -> list[dict]:
    return replace_portal_employees(db, user, body)


def _register_collection(collection: str) -> None:
    slug = collection.replace("-", "_")

    def list_route(
        db: Session = Depends(get_db),
        user: User = Depends(require_any("hr.read", "hr.self")),
    ) -> list[dict]:
        return list_items(db, user, collection)

    def create_route(
        body: dict,
        db: Session = Depends(get_db),
        user: User = Depends(require_permission("hr.write")),
    ) -> dict:
        return create_item(db, user, collection, body)

    def replace_route(
        body: list[dict] = Body(...),
        db: Session = Depends(get_db),
        user: User = Depends(require_permission("hr.write")),
    ) -> list[dict]:
        return replace_items(db, user, collection, body)

    def update_route(
        public_id: str,
        body: dict,
        db: Session = Depends(get_db),
        user: User = Depends(require_permission("hr.write")),
    ) -> dict:
        return patch_item(db, user, collection, public_id, body)

    router.add_api_route(f"/{collection}", list_route, methods=["GET"], operation_id=f"list_hr_{slug}")
    router.add_api_route(
        f"/{collection}",
        create_route,
        methods=["POST"],
        status_code=201,
        operation_id=f"create_hr_{slug}",
    )
    router.add_api_route(f"/{collection}", replace_route, methods=["PUT"], operation_id=f"replace_hr_{slug}")
    router.add_api_route(
        f"/{collection}/{{public_id}}",
        update_route,
        methods=["PATCH"],
        operation_id=f"update_hr_{slug}",
    )


for _name in LIST_COLLECTIONS:
    _register_collection(_name)


@router.get("/leave", operation_id="get_hr_leave")
def get_leave_route(
    db: Session = Depends(get_db),
    user: User = Depends(require_any("hr.read", "hr.self")),
) -> dict:
    return leave_bundle(db, user)


@router.put("/leave", operation_id="save_hr_leave")
def save_leave_route(
    body: dict,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("hr.write")),
) -> dict:
    return save_leave_bundle(db, user, body)


@router.get("/payroll", operation_id="get_hr_payroll")
def get_payroll_route(
    db: Session = Depends(get_db),
    user: User = Depends(require_any("hr.read", "hr.self")),
) -> dict:
    return payroll_bundle(db, user)


@router.put("/payroll", operation_id="save_hr_payroll")
def save_payroll_route(
    body: dict,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("hr.write")),
) -> dict:
    return save_payroll_bundle(db, user, body)
