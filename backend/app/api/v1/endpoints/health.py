from fastapi import APIRouter

from app import __version__
from app.core.config import get_settings
from app.schemas.common import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        app=settings.app_name,
        env=settings.app_env,
        version=__version__,
    )
