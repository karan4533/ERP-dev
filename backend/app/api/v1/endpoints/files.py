from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import bearer, get_current_user, require_any
from app.models import User
from app.services.files import get_file, save_upload

router = APIRouter(prefix="/api/v1/files", tags=["files"])


@router.post("", status_code=201)
async def upload_file_route(
    file: UploadFile = File(...),
    resource_type: str = Form("attachment"),
    resource_id: str | None = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_any("hr.write", "hr.employees.write", "admissions.write")),
) -> dict:
    return save_upload(db, user, file, resource_type=resource_type, resource_id=resource_id)


@router.get("/{file_id}/download")
def download_file_route(
    file_id: UUID,
    token: str | None = Query(None),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
):
    auth = credentials
    if auth is None and token:
        auth = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    user = get_current_user(auth, db)
    row, path = get_file(db, user, file_id)
    return FileResponse(path, media_type=row.content_type, filename=row.original_name)
