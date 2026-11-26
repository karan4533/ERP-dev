from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool, StaticPool

from app.core.config import settings

_url = settings.database_url
_engine_kwargs: dict = {"pool_pre_ping": True}

if _url.strip().lower().startswith("sqlite"):
    # FastAPI runs sync route deps in worker threads (anyio). SQLite connections
    # are not safe to share across threads.
    #
    # - :memory: must use StaticPool so every checkout sees the same in-memory DB
    #   (pytest). Single-threaded test clients make this safe enough.
    # - File SQLite (local uvicorn) must use NullPool so each Session gets its own
    #   connection. StaticPool + check_same_thread=False previously shared one
    #   connection across concurrent requests → sqlite3.InterfaceError / AV
    #   (exit 3221225477) under Transport Manager browser load.
    connect_args = {"check_same_thread": False, "timeout": 30}
    if ":memory:" in _url:
        _engine_kwargs = {
            "connect_args": connect_args,
            "poolclass": StaticPool,
        }
    else:
        _engine_kwargs = {
            "connect_args": connect_args,
            "poolclass": NullPool,
        }

engine = create_engine(_url, **_engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
