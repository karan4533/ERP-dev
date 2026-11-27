from pathlib import Path
from sqlalchemy import create_engine, text

vals = {}
for line in Path(__file__).resolve().parents[1].joinpath(".env").read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    vals[k.strip()] = v.strip().strip('"').strip("'")

engine = create_engine(vals["DATABASE_URL"])
tables = [
    "campuses",
    "roles",
    "permissions",
    "role_permissions",
    "users",
    "hr_employees",
    "user_profiles",
]
with engine.connect() as c:
    for t in tables:
        n = c.execute(text(f"SELECT count(*) FROM {t}")).scalar()
        print(f"{t}: {n}")
