from __future__ import annotations

import re
from pathlib import Path

from sqlalchemy import create_engine, text

BACKEND = Path(__file__).resolve().parents[1]
DUMP = BACKEND / "local" / "db_backups" / "qmis_erp_full_20261028-185143.sql"


def load_url() -> str:
    vals: dict[str, str] = {}
    for line in (BACKEND / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        vals[k.strip()] = v.strip().strip('"').strip("'")
    return vals["DATABASE_URL"]


def main() -> None:
    text_sql = DUMP.read_text(encoding="utf-8", errors="replace")
    creates = re.findall(r"^CREATE TABLE (?:public\.)?([a-zA-Z0-9_]+)", text_sql, re.M)
    row_counts: dict[str, int] = {}
    for m in re.finditer(
        r"^COPY (?:public\.)?([a-zA-Z0-9_]+) .*? FROM stdin;\n(.*?)(?=^\\\.$)",
        text_sql,
        re.M | re.S,
    ):
        name = m.group(1)
        body = m.group(2)
        if not body.strip():
            rows = 0
        else:
            rows = body.count("\n")
            if body and not body.endswith("\n"):
                rows += 1
        row_counts[name] = rows

    engine = create_engine(load_url())
    with engine.connect() as c:
        live = list(
            c.execute(
                text(
                    """
                    SELECT c.relname
                    FROM pg_class c
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE n.nspname = 'public' AND c.relkind = 'r'
                    ORDER BY 1
                    """
                )
            ).scalars()
        )
        live_counts = {}
        for t in live:
            live_counts[t] = c.execute(text(f'SELECT count(*) FROM "{t}"')).scalar()

    missing = sorted(set(live) - set(creates))
    extra = sorted(set(creates) - set(live))
    mismatches = []
    for t in sorted(set(live) & set(row_counts)):
        if live_counts[t] != row_counts[t]:
            mismatches.append((t, row_counts[t], live_counts[t]))

    print(f"dump_file={DUMP}")
    print(f"dump_bytes={DUMP.stat().st_size}")
    print(f"create_table_count={len(creates)}")
    print(f"live_public_tables={len(live)}")
    print(f"tables_with_rows={sum(1 for n, r in row_counts.items() if r > 0)}")
    print(f"tables_empty={sum(1 for n, r in row_counts.items() if r == 0)}")
    print(f"total_data_rows_approx={sum(row_counts.values())}")
    print(f"missing_in_dump={missing}")
    print(f"extra_in_dump={extra}")
    print(f"row_count_mismatches={len(mismatches)}")
    for item in mismatches[:20]:
        print(" ", item)

    print("\nKEY TABLES")
    for t in [
        "campuses",
        "roles",
        "permissions",
        "role_permissions",
        "users",
        "hr_employees",
        "user_profiles",
    ]:
        print(f"  {t}: dump={row_counts.get(t)} live={live_counts.get(t)}")

    print("\nALL TABLES (dump rows / live rows)")
    for t in live:
        print(f"  {t}: {row_counts.get(t, 'NO_COPY')} / {live_counts[t]}")


if __name__ == "__main__":
    main()
