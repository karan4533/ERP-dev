"""Migration 0020 (substitute_duties) on a real PostgreSQL server.

Opt-in only: set TEST_PG_URL to a role that may CREATE DATABASE, e.g.
    TEST_PG_URL=postgresql+psycopg://<user>:<password>@localhost:5432/postgres
The test creates its own uniquely named scratch database and drops it afterwards. Unlike the older
migration tests it never falls back to backend/.env, so it cannot touch the application database.
"""

import importlib.util
import os
import uuid
from pathlib import Path

import pytest
import sqlalchemy as sa
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from app.models import Base
from app.services.schema_helpers import MigrationAborted

REVISION = Path(__file__).resolve().parents[1] / "alembic" / "versions" / "0021_substitute_duties.py"


def _revision():
    spec = importlib.util.spec_from_file_location("rev_0020", REVISION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def pg():
    url = os.environ.get("TEST_PG_URL")
    if not url:
        pytest.skip("TEST_PG_URL not set (opt-in PostgreSQL migration test)")
    base = make_url(url)
    name = f"qmis_test_sub_{uuid.uuid4().hex[:10]}"
    admin = create_engine(base.set(database="postgres"), isolation_level="AUTOCOMMIT")
    try:
        with admin.connect() as connection:
            connection.execute(text(f'CREATE DATABASE "{name}"'))
    except Exception as error:
        admin.dispose()
        pytest.skip(f"Cannot create a scratch database with TEST_PG_URL: {type(error).__name__}")
    engine = create_engine(base.set(database=name))
    try:
        # The 0019 schema: every model table except the one 0020 adds.
        Base.metadata.create_all(engine, tables=[t for n, t in Base.metadata.tables.items() if n != "substitute_duties"])
        yield engine
    finally:
        engine.dispose()
        with admin.connect() as connection:
            connection.execute(text(f'DROP DATABASE IF EXISTS "{name}" WITH (FORCE)'))
        admin.dispose()


def _snapshot(conn) -> dict:
    inspector = sa.inspect(conn)
    return {
        t: (sorted(c["name"] for c in inspector.get_columns(t)), sorted(i["name"] for i in inspector.get_indexes(t)))
        for t in inspector.get_table_names()
        if t != "substitute_duties"
    }


def test_upgrade_adds_only_substitute_duties_and_downgrade_guards_data(pg):
    rev = _revision()
    with pg.begin() as conn:
        before = _snapshot(conn)
        assert rev.upgrade_connection(conn) == {"created": ["substitute_duties"]}
        assert rev.upgrade_connection(conn) == {"created": []}
        assert _snapshot(conn) == before
        inspector = sa.inspect(conn)
        assert {i["name"] for i in inspector.get_indexes("substitute_duties")} == {"ix_substitute_duties_teacher_date"}
        assert {c["name"] for c in inspector.get_check_constraints("substitute_duties")} == {"ck_substitute_duty_window"}
        assert {fk["referred_table"] for fk in inspector.get_foreign_keys("substitute_duties")} == {
            "campuses", "users", "school_classes", "sections"}

    bad_window = text(
        "INSERT INTO substitute_duties (id, campus_id, teacher_user_id, class_id, section_id, duty_date, period, "
        "start_time, end_time, status, assigned_by, created_at) VALUES (gen_random_uuid(), gen_random_uuid(), "
        "gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '2030-06-10', 'P3', '10:45', '10:00', 'active', "
        "gen_random_uuid(), now())"
    )
    with pytest.raises(sa.exc.IntegrityError):
        with pg.begin() as conn:
            conn.execute(bad_window)

    with pg.begin() as conn:
        conn.execute(text("SET session_replication_role = replica"))  # skip FKs for this scratch row only
        conn.execute(bad_window.text.replace("'10:45', '10:00'", "'10:00', '10:45'"))
        conn.execute(text("SET session_replication_role = DEFAULT"))
    with pytest.raises(MigrationAborted):
        with pg.begin() as conn:
            rev.downgrade_connection(conn)
    with pg.begin() as conn:
        assert conn.execute(text("SELECT count(*) FROM substitute_duties")).scalar() == 1
        conn.execute(text("DELETE FROM substitute_duties"))
        assert rev.downgrade_connection(conn) == {"dropped": ["substitute_duties"]}
        assert not sa.inspect(conn).has_table("substitute_duties")
