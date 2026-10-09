"""
Build / refresh the single project-wide Archify architecture candidate.

Scans:
  - backend/app/main.py include_router(...) lines  → API modules (auto-added)
  - src/services/*Api.js and apiClient.js         → frontend clients

Re-run after adding a backend router or frontend API client:
  python .archify/build_project_overview.py
  node <archify>/bin/archify.mjs finalize architecture \\
    .archify/architecture-project-overview/candidate.json \\
    .archify/architecture-project-overview/qmis-erp-overview.html \\
    --repo-root . --quality showcase --json
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "backend" / "app" / "main.py"
SERVICES = ROOT / "src" / "services"
STABLE_DIR = ROOT / ".archify" / "architecture-project-overview"

# Known routers → display facts + evidence (unknown routers still get a node)
ROUTER_META = {
    "auth_router": {
        "id": "mod_auth",
        "label": "Auth",
        "sublabel": "/api/v1/auth",
        "path": "backend/app/api/v1/endpoints/auth.py",
        "line": 19,
        "end_line": 48,
    },
    "audit_router": {
        "id": "mod_audit",
        "label": "Audit",
        "sublabel": "/api/v1/audit-logs",
        "path": "backend/app/api/v1/endpoints/audit.py",
        "line": 9,
        "end_line": 20,
    },
    "masters_router": {
        "id": "mod_masters",
        "label": "Masters",
        "sublabel": "classes / subjects",
        "path": "backend/app/api/v1/endpoints/masters.py",
        "line": 12,
        "end_line": 40,
    },
    "admissions_router": {
        "id": "mod_admissions",
        "label": "Admissions",
        "sublabel": "enquiry + enroll",
        "path": "backend/app/api/v1/endpoints/admissions.py",
        "line": 12,
        "end_line": 30,
    },
    "hr_router": {
        "id": "mod_hr",
        "label": "HR",
        "sublabel": "full vertical",
        "path": "backend/app/api/v1/endpoints/hr.py",
        "line": 27,
        "end_line": 50,
    },
    "files_router": {
        "id": "mod_files",
        "label": "Files",
        "sublabel": "upload stub",
        "path": "backend/app/api/v1/endpoints/files.py",
        "line": 13,
        "end_line": 39,
    },
}

# Not mounted yet — shown dashed until include_router appears in main.py
PLANNED = [
    {
        "id": "mod_finance",
        "label": "Finance",
        "sublabel": "Phase 2",
        "tag": "planned",
        "path": "backend/app/main.py",
        "line": 43,
        "end_line": 48,
    },
    {
        "id": "mod_academics",
        "label": "Academics",
        "sublabel": "Phase 2",
        "tag": "planned",
        "path": "backend/app/main.py",
        "line": 43,
        "end_line": 48,
    },
    {
        "id": "mod_ops",
        "label": "Ops",
        "sublabel": "Phase 3+",
        "tag": "planned",
        "path": "backend/app/main.py",
        "line": 43,
        "end_line": 48,
    },
]


def git_rev() -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    except Exception:
        return "0" * 40


def scan_routers() -> list[dict]:
    text = MAIN.read_text(encoding="utf-8")
    modules = []
    for match in re.finditer(r"app\.include_router\((\w+)\)", text):
        name = match.group(1)
        line = text.count("\n", 0, match.start()) + 1
        meta = ROUTER_META.get(name)
        if meta:
            modules.append(dict(meta))
        else:
            slug = re.sub(r"_?router$", "", name)
            modules.append(
                {
                    "id": f"mod_{slug}",
                    "label": slug.replace("_", " ").title(),
                    "sublabel": "auto from main.py",
                    "path": "backend/app/main.py",
                    "line": line,
                    "end_line": line,
                    "tag": "auto",
                }
            )
    return modules


def scan_clients() -> list[str]:
    if not SERVICES.is_dir():
        return []
    apis = sorted(p.name for p in SERVICES.glob("*Api.js"))
    if (SERVICES / "apiClient.js").exists():
        apis.append("apiClient.js")
    return apis


def place_grid(modules: list[dict], start_x: int, start_y: int, cols: int, gap_x: int = 170, gap_y: int = 120) -> list[dict]:
    components = []
    for i, mod in enumerate(modules):
        col, row = i % cols, i // cols
        node_type = "cloud" if mod.get("tag") == "planned" else "backend"
        node = {
            "id": mod["id"],
            "type": node_type,
            "label": mod["label"],
            "sublabel": mod["sublabel"],
            "pos": [start_x + col * gap_x, start_y + row * gap_y],
            "size": [150, 64],
            "sources": [
                {
                    "path": mod["path"],
                    "line": mod["line"],
                    "end_line": mod.get("end_line", mod["line"]),
                }
            ],
        }
        if mod.get("tag"):
            node["tag"] = mod["tag"]
        components.append(node)
    return components


def build_candidate(modules: list[dict], clients: list[str], out_rel: str) -> dict:
    live = list(modules)
    planned = list(PLANNED)
    # Main journey: users → web → client → tall api; db/uploads under api; module rack on the right
    live_nodes = place_grid(live, 1080, 80, cols=2, gap_x=170, gap_y=100)
    planned_y = 80 + 100 * ((len(live) + 1) // 2)
    planned_nodes = place_grid(planned, 1080, planned_y + 20, cols=2, gap_x=170, gap_y=100)

    client_label = ", ".join(c.replace(".js", "") for c in clients[:3])
    if len(clients) > 3:
        client_label += "…"

    components = [
        {
            "id": "users",
            "type": "external",
            "label": "School users",
            "sublabel": "role portals",
            "pos": [40, 280],
            "size": [140, 64],
            "icon": "person",
            "sources": [{"path": "src/App.jsx", "line": 34, "end_line": 60}],
        },
        {
            "id": "web",
            "type": "frontend",
            "label": "React portal",
            "sublabel": "Vite :5173",
            "pos": [220, 280],
            "size": [140, 64],
            "sources": [{"path": "src/App.jsx", "line": 1, "end_line": 32}],
        },
        {
            "id": "client",
            "type": "frontend",
            "label": "API clients",
            "sublabel": client_label or "services",
            "pos": [400, 280],
            "size": [160, 64],
            "sources": [{"path": "src/services/apiClient.js", "line": 1, "end_line": 30}],
        },
        {
            "id": "api",
            "type": "backend",
            "label": "FastAPI",
            "sublabel": "QMIS ERP :8000",
            "pos": [600, 160],
            "size": [160, 200],
            "tag": "UUID stack",
            "sources": [{"path": "backend/app/main.py", "line": 35, "end_line": 53}],
        },
        {
            "id": "db",
            "type": "database",
            "label": "PostgreSQL",
            "sublabel": "qmis_erp",
            "pos": [610, 420],
            "size": [140, 64],
            "sources": [{"path": "backend/app/core/config.py", "line": 4, "end_line": 18}],
        },
        {
            "id": "uploads",
            "type": "database",
            "label": "Uploads",
            "sublabel": "backend/uploads",
            "pos": [610, 540],
            "size": [140, 64],
            "sources": [{"path": "backend/app/services/files.py", "line": 18, "end_line": 25}],
        },
        *live_nodes,
        *planned_nodes,
    ]

    live_ids = [n["id"] for n in live_nodes]
    planned_ids = [n["id"] for n in planned_nodes]

    connections = [
        {"id": "users-web", "from": "users", "to": "web", "label": "HTTPS", "variant": "emphasis"},
        {"id": "web-client", "from": "web", "to": "client", "label": "calls"},
        {"id": "client-api", "from": "client", "to": "api", "label": "JWT", "variant": "security"},
        {"id": "api-db", "from": "api", "to": "db", "label": "SQL"},
        {"id": "api-uploads", "from": "api", "to": "uploads", "label": "files", "variant": "dashed"},
    ]
    for nid in live_ids:
        connections.append({"id": f"api-{nid}", "from": "api", "to": nid})
    for nid in planned_ids:
        connections.append({"id": f"api-{nid}", "from": "api", "to": nid, "variant": "dashed"})

    return {
        "schema_version": 1,
        "diagram_type": "architecture",
        "meta": {
            "title": "QMIS School ERP — project overview",
            "subtitle": "Live routers from main.py; new modules appear when mounted",
            "locale": "en",
            "quality_profile": "showcase",
            "repository": {
                "url": "https://github.com/karan4533/ERP-dev.git",
                "provider": "github",
                "link_mode": "web",
                "revision": git_rev(),
            },
            "output": out_rel.replace("\\", "/"),
            "legend": {
                "entries": {
                    "backend": {"label": "API module"},
                    "cloud": {"label": "Planned module"},
                    "frontend": {"label": "Browser app"},
                    "database": {"label": "Store"},
                    "security": {"label": "Auth path"},
                    "external": {"label": "People"},
                }
            },
            "views": [
                {"id": "live", "label": "Live API", "focus": ["api", *live_ids], "note": "Routers mounted in main.py"},
                {"id": "planned", "label": "Planned", "focus": ["api", *planned_ids], "note": "Phase 2 / 3+"},
                {"id": "path", "label": "User path", "focus": ["users", "web", "client", "api", "db"]},
            ],
        },
        "components": components,
        "boundaries": [
            {"kind": "region", "label": "Frontend (Vite + React)", "wraps": ["web", "client"]},
            {"kind": "region", "label": "Backend (FastAPI)", "wraps": ["api", *live_ids]},
            {"kind": "region", "label": "Planned departments", "wraps": planned_ids},
            {"kind": "security-group", "label": "Authenticated API", "wraps": ["client", "api"]},
        ],
        "connections": connections,
        "cards": [
            {
                "dot": "emerald",
                "title": "Live now",
                "items": [f"{m['label']} — {m['sublabel']}" for m in live]
                + ["React role portals (Admin, HR, Teacher, PRM, …)"],
            },
            {
                "dot": "amber",
                "title": "Auto-add a module",
                "items": [
                    "Mount router in backend/app/main.py",
                    "Add src/services/<name>Api.js for the UI",
                    "Run python .archify/build_project_overview.py then finalize",
                ],
            },
            {
                "dot": "slate",
                "title": "Clients found",
                "items": clients or ["(none yet)"],
            },
        ],
    }


def write_candidate(candidate: dict, folder: Path) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / "candidate.json"
    path.write_text(json.dumps(candidate, indent=2), encoding="utf-8")
    return path


def main() -> None:
    modules = scan_routers()
    clients = scan_clients()
    candidate = build_candidate(
        modules, clients, ".archify/architecture-project-overview/qmis-erp-overview.html"
    )
    path = write_candidate(candidate, STABLE_DIR)
    print(
        json.dumps(
            {
                "candidate": str(path),
                "modules": [m["id"] for m in modules],
                "clients": clients,
            }
        )
    )


if __name__ == "__main__":
    main()
