"""ORM Base plus shared Session/engine.

Request handlers use ``app.core.database``. This module keeps ``Base`` for legacy
model imports and re-exports the same engine/session factory so audit middleware
does not open a second SQLite engine against the same file.
"""

from collections.abc import Generator

from sqlalchemy.orm import DeclarativeBase, Session

from app.core.database import SessionLocal, engine, get_db


class Base(DeclarativeBase):
    """Declarative base retained for modules that still import Base from here."""


__all__ = ["Base", "SessionLocal", "engine", "get_db", "Session", "Generator"]
