from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool, StaticPool

from app.core.config import settings


def sqlite_engine_kwargs(url: str) -> dict:
    """Engine options for SQLite URLs.

    In-memory DBs need StaticPool so every checkout sees the same schema (pytest).
    File-backed SQLite must not share one StaticPool connection across uvicorn's
    sync threadpool — that races into sqlite3.InterfaceError and process crashes.
    """
    connect_args = {"check_same_thread": False}
    if ":memory:" in url:
        return {"connect_args": connect_args, "poolclass": StaticPool}
    return {"connect_args": connect_args, "poolclass": NullPool}


_url = settings.database_url
_engine_kwargs: dict = {"pool_pre_ping": True}
if _url.strip().lower().startswith("sqlite"):
    _engine_kwargs = sqlite_engine_kwargs(_url)

engine = create_engine(_url, **_engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


if engine.dialect.name == "sqlite":

    @event.listens_for(engine, "connect")
    def _sqlite_pragma(dbapi_connection, _connection_record) -> None:  # noqa: ANN001
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
