from datetime import datetime

from pydantic import BaseModel


class AuditLogPublic(BaseModel):
    id: int
    campus_id: int | None
    actor_user_id: int | None
    actor_role: str | None
    action_type: str
    target_module: str | None
    target_record_id: str | None
    path: str | None
    method: str | None
    status_code: int | None
    ip_address: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
