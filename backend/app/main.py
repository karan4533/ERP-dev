from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from app import __version__
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.base import Base  # noqa: F401 — registers models
from app.db.session import SessionLocal, engine
from app.middleware.audit_middleware import AuditMiddleware
from app.services.auth_service import ensure_seed_admin
from app.services.campus_service import ensure_default_campus
from app.services.masters_service import ensure_master_seeds
from app.services.role_service import ensure_role_permissions, ensure_roles


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    try:
        # Bootstrap tables for local/dev. Switch to Alembic migrations before production.
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            ensure_default_campus(db)
            ensure_roles(db)
            ensure_role_permissions(db)
            ensure_seed_admin(db)
            ensure_master_seeds(db)
        finally:
            db.close()
    except OperationalError as exc:
        raise RuntimeError(
            "Cannot connect to PostgreSQL. "
            "Start Postgres, create database `qmis_erp`, and check DATABASE_URL in .env. "
            f"Current URL host settings: {settings.database_url.split('@')[-1] if '@' in settings.database_url else settings.database_url}"
        ) from exc
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version=__version__,
        description=(
            "QMIS School ERP backend API — Phase 0 foundation. "
            "Auth, RBAC, masters, audit log, and HR employee starter."
        ),
        lifespan=lifespan,
    )

    application.add_middleware(AuditMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router, prefix="/api/v1")
    return application


app = create_app()
