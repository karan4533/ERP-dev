"""
ASGI middleware that records mutating HTTP requests into system_audit_logs.

Uses a short-lived DB session so it does not depend on request-scoped deps.
"""

from collections.abc import Callable

from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.services.audit_service import write_audit_log

MUTATING = {"POST", "PUT", "PATCH", "DELETE"}
SKIP_PREFIXES = (
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/v1/health",
    "/api/v1/auth",  # auth endpoints write LOGIN/LOGOUT explicitly
)


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        path = request.url.path
        if request.method not in MUTATING:
            return response
        if any(path.startswith(prefix) for prefix in SKIP_PREFIXES):
            return response

        actor_user_id = None
        actor_role = None
        campus_id = None
        auth = request.headers.get("authorization") or ""
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
            settings = get_settings()
            try:
                payload = jwt.decode(
                    token,
                    settings.jwt_secret_key,
                    algorithms=[settings.jwt_algorithm],
                )
                actor_user_id = int(payload["sub"]) if payload.get("sub") else None
                actor_role = payload.get("role")
                campus_id = payload.get("campus_id")
            except (JWTError, ValueError, TypeError):
                pass

        action = {
            "POST": "CREATE",
            "PUT": "UPDATE",
            "PATCH": "UPDATE",
            "DELETE": "DELETE",
        }.get(request.method, request.method)

        db = SessionLocal()
        try:
            write_audit_log(
                db,
                action_type=action,
                campus_id=campus_id,
                actor_user_id=actor_user_id,
                actor_role=actor_role,
                target_module=path.strip("/").split("/")[2] if path.count("/") >= 3 else None,
                path=path,
                method=request.method,
                status_code=response.status_code,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
        except Exception:
            # Never break the request because audit logging failed
            db.rollback()
        finally:
            db.close()

        return response
