from fastapi import APIRouter

from app.api.v1.endpoints import audit, auth, health, hr, masters, rbac

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(rbac.router, prefix="/rbac", tags=["rbac"])
api_router.include_router(masters.router, prefix="/masters", tags=["masters"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(hr.router, prefix="/hr", tags=["hr"])
