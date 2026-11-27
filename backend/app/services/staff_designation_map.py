"""Designation → RBAC role mapping for Queen Mira staff roster.

Single source of truth for import, reconciliation, and tests.
Role codes must exist in ``app.permissions.matrix.ALL_ROLES``.
"""

from __future__ import annotations

import re

# Designations that must never receive a portal login role.
_LOGIN_EXCLUDED_SUBSTRINGS = (
    "digital marketing",
)

_EMAIL_SPLIT_RE = re.compile(r"[,/;|\n]+")
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def parse_emails(raw: str) -> list[str]:
    """Split a spreadsheet email cell into distinct addresses (order preserved)."""
    text = (raw or "").strip()
    if not text:
        return []
    seen: set[str] = set()
    out: list[str] = []
    for part in _EMAIL_SPLIT_RE.split(text):
        email = part.strip().lower()
        if not email or email in seen:
            continue
        seen.add(email)
        out.append(email)
    return out


def primary_login_email(raw: str) -> str:
    """First syntactically valid email, else first token, else empty."""
    emails = parse_emails(raw)
    for email in emails:
        if _EMAIL_RE.match(email):
            return email
    return emails[0] if emails else ""


def is_login_excluded_designation(designation: str) -> bool:
    d = (designation or "").lower().strip()
    return any(token in d for token in _LOGIN_EXCLUDED_SUBSTRINGS)


def map_role_from_designation(designation: str) -> str:
    """Map a staff designation to an RBAC role code, or '' for directory-only.

    Approved abbreviations / titles:
    - MD / Managing Director → superadmin
    - DA / Director of Audit / Joint Director Audit → jointdirectoraudit
    - JD (Admin) → jointdirector
    - Director — Academics → director
    - Principal → principal
    - Senior Principal / Principal — Quality Audit → qualityauditor
    - Executive Audit / Audit Executive → processauditor
    - Coordinator → coordinator
    - PRO / Assistant PRO / Public Relations → pro
    - PRM / Parent Relationship Manager → prm
    - Finance Manager → financemanager
    - Accountant / Accounts Trainee / Senior Accountant → accountassistant
    - HR Executive / Audit Cum HR Facilitator → hr
    - System Administrator → itsupportmanager
    - HK Supervisor / Housekeeping → housekeepingmanager
    - Maintenance Officer / Maintenance Manager → maintenancemanager
    - Transport Manager → transportmanager
    - Driver → driver
    - Librarian → librarian
    - Teaching designations → teacher
    """
    d = (designation or "").lower().strip()
    if not d:
        return ""
    if is_login_excluded_designation(d):
        return ""

    # Executive assistants / PA — directory only (do not match MD / DA / Principal).
    if (
        d.startswith("ea to ")
        or d.startswith("executive assistant")
        or d.startswith("pa to ")
        or "ea to md" in d
        or "ea to da" in d
    ):
        return ""

    # MD → Super Admin (exact managing director / lone "md", not "EA to MD").
    compact = re.sub(r"[^a-z0-9]+", "", d)
    if d in {"md", "managing director"} or compact in {"md", "managingdirector"}:
        return "superadmin"
    if "managing director" in d and "ea" not in d and "assistant" not in d:
        return "superadmin"

    # DA / Joint Director — Audit (before generic director / joint director).
    if (
        d in {"da", "director of audit", "director - audit", "director – audit"}
        or compact in {"da", "directorofaudit"}
        or ("joint director" in d and "audit" in d)
        or ("director" in d and "audit" in d and "quality" not in d and "process" not in d and "executive" not in d)
    ):
        return "jointdirectoraudit"

    if "joint director" in d:
        return "jointdirector"

    if "quality audit" in d or compact in {"qualityauditor", "seniorprincipalqualityaudit"}:
        return "qualityauditor"

    if (
        "process audit" in d
        or d in {"executive - audit", "executive audit", "audit executive"}
        or "executive - audit" in d
        or (d.startswith("executive") and "audit" in d)
    ):
        return "processauditor"

    if d == "principal" or (d.startswith("principal") and "audit" not in d and "quality" not in d):
        return "principal"

    # Director — Academics (not Director of Audit; not Joint Director).
    if "director" in d and "joint" not in d and "audit" not in d:
        return "director"

    if "coordinator" in d:
        return "coordinator"

    # PRM vs PRO — keep separate.
    if "parent relationship" in d or "parents relationship" in d:
        return "prm"
    if (
        "public relations" in d
        or d in {"assistant pro", "pro", "assistant pro"}
        or "assistant pro" in d
        or compact in {"pro", "assistantpro", "publicrelationsofficer"}
    ):
        return "pro"

    if "librarian" in d:
        return "librarian"

    if d.startswith("hr ") or d == "hr executive" or "hr facilitator" in d or "hr executive" in d:
        return "hr"

    if "finance manager" in d:
        return "financemanager"

    if "accountant" in d or "accounts trainee" in d or "senior accountant" in d:
        return "accountassistant"

    if "system administrator" in d:
        return "itsupportmanager"

    # Housekeeping stays on the Housekeeping Manager portal.
    if (
        "hk supervisor" in d
        or "housekeep" in d
        or compact in {"hksupervisor", "housekeepingmanager"}
    ):
        return "housekeepingmanager"

    # Maintenance is a separate department head portal (Facilities tickets + maint-* ops).
    if (
        "maintenance officer" in d
        or "maintenance manager" in d
        or "maintenance" in d
        or "facilities manager" in d
        or compact in {"maintenanceofficer", "maintenancemanager", "facilitiesmanager"}
    ):
        return "maintenancemanager"

    if (
        "transport manager" in d
        or compact in {"transportmanager", "transportincharge"}
        or (d.startswith("transport") and "student" not in d)
    ):
        return "transportmanager"

    if d == "driver" or d.startswith("driver ") or "bus driver" in d:
        return "driver"

    if "file room" in d or compact in {"fileroom", "fileroomofficer", "fileroomandincharge"}:
        return "fileroom"

    if (
        "control room" in d
        or "cctv" in d
        or "camera room" in d
        or compact in {"cctv", "cctvroom", "controlroom", "controlroomofficer"}
    ):
        return "cctv"

    teacher_tokens = (
        "prt",
        "tgt",
        "pgt",
        "sgt",
        "nursery trained",
        "facilitat",
        "faciliti",  # Excel typo: Facilitiator
        "teacher",
        "avp",
        "vp (",
        "hod ",
        "hod-",
        "special educator",
        "school counsellor",
        "school counselor",
        "robotics",
        "physical education",
        "rifle trainer",
        "lab assistant",
        "ano/",
        "ncc",
        "cso-ncc",
    )
    if any(tok in d for tok in teacher_tokens):
        return "teacher"

    return ""
