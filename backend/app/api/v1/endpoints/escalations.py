from datetime import date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import require_permission
from app.models import User
from app.services import escalations as svc

router = APIRouter(prefix="/api/v1", tags=["escalations", "tasks"])


class EscalationIn(BaseModel):
    description: str = Field(min_length=1, max_length=300)
    fullDescription: str | None = Field(default=None, max_length=4000)
    remarks: str | None = Field(default=None, max_length=2000)
    recipientUserId: UUID | None = None


class StatusIn(BaseModel):
    status: str
    note: str | None = Field(default=None, max_length=2000)


class NoteIn(BaseModel):
    note: str | None = Field(default=None, max_length=2000)


class TaskIn(BaseModel):
    assigneeId: UUID
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    priority: str = "Medium"
    dueDate: date
    # Optional client-generated key (8-64 chars): a retried POST with the same key returns the existing task.
    clientRef: str | None = Field(default=None, min_length=8, max_length=64)


class TaskStatusIn(BaseModel):
    status: str
    remark: str | None = Field(default=None, max_length=2000)


# ------------------------------------------------------------- escalations


@router.post("/escalations", status_code=201)
def raise_route(
    body: EscalationIn, db: Session = Depends(get_db), user: User = Depends(require_permission("escalations.write"))
) -> dict:
    return svc.raise_escalation(
        db, user, description=body.description, full_description=body.fullDescription,
        remarks=body.remarks, to_user_id=body.recipientUserId,
    )


@router.get("/escalations")
def list_escalations_route(
    box: str = Query(default="mine", description="mine | received | all"),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("escalations.read")),
) -> list[dict]:
    return svc.list_escalations(db, user, box=box, status=status)


@router.post("/escalations/sla-sweep")
def sweep_route(
    as_of: datetime | None = Query(default=None, alias="asOf", description="Evaluate the clock as of this time"),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("escalations.sweep")),
) -> dict:
    """Run the 24h clock for the campus now (also runs automatically whenever escalations/tasks are listed)."""
    return svc.run_clock(db, user.campus_id, now=as_of)


@router.get("/escalations/recipients")
def recipients_route(
    db: Session = Depends(get_db), user: User = Depends(require_permission("escalations.write"))
) -> list[dict]:
    return svc.recipients(db, user)


@router.get("/escalations/{escalation_id}")
def get_escalation_route(
    escalation_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_permission("escalations.read"))
) -> dict:
    return svc.get_escalation(db, user, escalation_id)


@router.post("/escalations/{escalation_id}/status")
def status_route(
    escalation_id: UUID,
    body: StatusIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("escalations.resolve")),
) -> dict:
    return svc.update_status(db, user, escalation_id, status=body.status, note=body.note)


@router.post("/escalations/{escalation_id}/not-satisfied")
def not_satisfied_route(
    escalation_id: UUID,
    body: NoteIn | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("escalations.write")),
) -> dict:
    """Manual 'Not Satisfied' escalate to next level (client complaint overflow)."""
    note = body.note if body else None
    return svc.mark_not_satisfied(db, user, escalation_id, note=note)


# -------------------------------------------------------------------- tasks


@router.get("/tasks/assignees")
def assignees_route(
    role: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("tasks.write")),
) -> list[dict]:
    return svc.assignees(db, user, role=role)


@router.post("/tasks", status_code=201)
def create_task_route(
    body: TaskIn,
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("tasks.write")),
) -> dict:
    task = svc.create_task(
        db, user, assignee_id=body.assigneeId, title=body.title, description=body.description,
        priority=body.priority, due_date=body.dueDate, client_ref=body.clientRef,
    )
    if task.get("idempotentReplay"):
        response.status_code = 200  # same clientRef retried: the existing task, nothing new created
    return task


@router.get("/tasks")
def list_tasks_route(
    box: str = Query(default="mine", description="mine | assigned | all"),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("tasks.read")),
) -> list[dict]:
    return svc.list_tasks(db, user, box=box, status=status)


@router.get("/tasks/{task_id}")
def get_task_route(
    task_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_permission("tasks.read"))
) -> dict:
    return svc.get_task(db, user, task_id)


@router.post("/tasks/{task_id}/status")
def task_status_route(
    task_id: UUID,
    body: TaskStatusIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("tasks.write")),
) -> dict:
    return svc.set_task_status(db, user, task_id, status=body.status, remark=body.remark)
