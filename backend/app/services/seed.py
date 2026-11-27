from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models import AcademicYear, Campus, FinancialYear, HrEmployee, Permission, Role, RolePermission, Student, User
from app.permissions.matrix import ALL_ROLES, PERMISSIONS, ROLE_PERMISSIONS
from app.services.audit import write_audit

# Reuse one bcrypt hash per demo password so StaticPool test sessions can repair
# polluted seed logins with a string compare instead of hashing on every startup.
_SEED_PASSWORD_HASHES: dict[str, str] = {}


def _seed_password_hash(password: str) -> str:
    cached = _SEED_PASSWORD_HASHES.get(password)
    if cached is None:
        cached = hash_password(password)
        _SEED_PASSWORD_HASHES[password] = cached
    return cached


def seed_reference_data(db: Session) -> None:
    campus = db.scalar(select(Campus).where(Campus.code == "QMIS-MDU"))
    created_campus = campus is None
    if campus is None:
        campus = Campus(
            code="QMIS-MDU",
            name="Queen Mira International School",
            city="Madurai",
        )
        db.add(campus)
        db.flush()

    _seed_current_academic_year(db, campus)
    _seed_current_financial_year(db, campus)

    roles_by_code: dict[str, Role] = {role.code: role for role in db.scalars(select(Role)).all()}
    for code, name in ALL_ROLES:
        if code not in roles_by_code:
            role = Role(code=code, name=name)
            db.add(role)
            roles_by_code[code] = role
    db.flush()

    perms_by_code: dict[str, Permission] = {
        item.code: item for item in db.scalars(select(Permission)).all()
    }
    for code, description in PERMISSIONS:
        if code not in perms_by_code:
            item = Permission(code=code, description=description)
            db.add(item)
            perms_by_code[code] = item
    db.flush()

    existing_links = {
        (row.role_id, row.permission_id) for row in db.scalars(select(RolePermission)).all()
    }
    for role_code, codes in ROLE_PERMISSIONS.items():
        role = roles_by_code[role_code]
        for perm_code in codes:
            perm = perms_by_code[perm_code]
            key = (role.id, perm.id)
            if key not in existing_links:
                db.add(RolePermission(role_id=role.id, permission_id=perm.id))
                existing_links.add(key)

    # Demo logins have well-known passwords, so they exist only in explicit development mode.
    if settings.seed_demo_accounts:
        _seed_demo_users(db, campus, roles_by_code)
        # SessionLocal uses autoflush=False; HR link lookups must see pending users.
        db.flush()
        _seed_demo_parent_student_link(db, campus)
        _ensure_demo_staff_hr_links(db, campus)
        # Demo calendar holidays/exams for local UAT (not auto-seeded on every list).
        from app.services.calendar import ensure_defaults as ensure_calendar_defaults

        ensure_calendar_defaults(db, campus.id)
    if created_campus:
        write_audit(
            db,
            action="REFERENCE_SEEDED",
            entity_type="campus",
            entity_id=str(campus.id),
            campus_id=campus.id,
            details="Madurai campus, roles, and permissions",
        )
    db.commit()


def _seed_demo_users(db: Session, campus: Campus, roles_by_code: dict[str, Role]) -> None:
    if "superadmin" in roles_by_code:
        _seed_user(
            db,
            campus=campus,
            role=roles_by_code["superadmin"],
            email=settings.superadmin_seed_email,
            password=settings.superadmin_seed_password,
        )
    _seed_user(
        db,
        campus=campus,
        role=roles_by_code["admin"],
        email=settings.admin_seed_email,
        password=settings.admin_seed_password,
    )
    _seed_user(
        db,
        campus=campus,
        role=roles_by_code["hr"],
        email=settings.hr_seed_email,
        password=settings.hr_seed_password,
    )
    _seed_user(
        db,
        campus=campus,
        role=roles_by_code["accounthead"],
        email=settings.accounthead_seed_email,
        password=settings.accounthead_seed_password,
    )
    _seed_user(
        db,
        campus=campus,
        role=roles_by_code["finance_assistant"],
        email=settings.finance_assistant_seed_email,
        password=settings.finance_assistant_seed_password,
    )
    # Academics / approvals + ops portal demo logins (match SignIn.jsx DEMO_TEST_LOGINS).
    for role_code, email, password in (
        ("teacher", settings.teacher_seed_email, settings.teacher_seed_password),
        ("coordinator", settings.coordinator_seed_email, settings.coordinator_seed_password),
        ("principal", settings.principal_seed_email, settings.principal_seed_password),
        ("prm", settings.prm_seed_email, settings.prm_seed_password),
        ("pro", settings.pro_seed_email, settings.pro_seed_password),
        ("director", settings.director_seed_email, settings.director_seed_password),
        ("jointdirector", "jointdirector@qmis.edu", "jd12345678"),
        ("jointdirectorassistant", "jointdirectorassistant@qmis.edu", "jda1234567"),
        ("jointdirectoraudit", "jointdirectoraudit@qmis.edu", "jdaudit123"),
        ("processauditor", "processauditor@qmis.edu", "process123"),
        ("qualityauditor", "qualityauditor@qmis.edu", "quality123"),
        ("librarian", "librarian@qmis.edu", "librarian123"),
        ("hostelwarden", "hostelwarden@qmis.edu", "hostelwarden123"),
        ("transportmanager", "transportmanager@qmis.edu", "transport123"),
        ("driver", "driver@qmis.edu", "driver123"),
        ("gatekeeper", "gatekeeper@qmis.edu", "gatekeeper123"),
        ("gatekeepermanager", "gatekeepermanager@qmis.edu", "gkm1234567"),
        ("canteenmanager", "canteenmanager@qmis.edu", "canteen123"),
        ("itsupportmanager", "itsupportmanager@qmis.edu", "itsupport123"),
        ("stationerystoremanager", "stationerystoremanager@qmis.edu", "stationery123"),
        ("housekeepingmanager", "housekeepingmanager@qmis.edu", "housekeeping123"),
        ("maintenancemanager", settings.maintenance_seed_email, settings.maintenance_seed_password),
        ("fileroom", settings.fileroom_seed_email, settings.fileroom_seed_password),
        ("cctv", settings.cctv_seed_email, settings.cctv_seed_password),
        ("parent", "parent@qmis.edu", "parent123"),
        ("student", "student@qmis.edu", "student123"),
    ):
        if role_code in roles_by_code:
            _seed_user(
                db,
                campus=campus,
                role=roles_by_code[role_code],
                email=email,
                password=password,
            )


def _seed_demo_parent_student_link(db: Session, campus: Campus) -> None:
    """Link parent@qmis.edu + student@qmis.edu to one enrolled child so portals are not empty."""
    parent = db.scalar(select(User).where(User.email == "parent@qmis.edu"))
    student_user = db.scalar(select(User).where(User.email == "student@qmis.edu"))
    if parent is None or student_user is None:
        return

    admission_number = "ADM-DEMO-001"
    row = db.scalar(select(Student).where(Student.admission_number == admission_number))
    if row is None:
        row = Student(
            campus_id=campus.id,
            admission_number=admission_number,
            full_name="Demo Child Sharma",
            class_name="Class 10",
            section="A",
            roll_number=1,
            placement_status="placed",
            parent_user_id=parent.id,
            student_user_id=student_user.id,
        )
        db.add(row)
        db.flush()
        return

    changed = False
    if row.parent_user_id != parent.id:
        row.parent_user_id = parent.id
        changed = True
    if row.student_user_id != student_user.id:
        row.student_user_id = student_user.id
        changed = True
    if row.campus_id != campus.id:
        row.campus_id = campus.id
        changed = True
    if changed:
        db.flush()


def _seed_current_academic_year(db: Session, campus: Campus) -> None:
    existing = db.scalar(
        select(AcademicYear).where(AcademicYear.campus_id == campus.id, AcademicYear.name == "2026-27")
    )
    if existing is not None:
        return
    has_current = db.scalar(
        select(AcademicYear).where(AcademicYear.campus_id == campus.id, AcademicYear.is_current.is_(True))
    )
    db.add(
        AcademicYear(
            campus_id=campus.id,
            name="2026-27",
            start_date=date(2026, 4, 1),
            end_date=date(2027, 3, 31),
            is_current=has_current is None,
            is_active=True,
        )
    )


def _seed_current_financial_year(db: Session, campus: Campus) -> None:
    """April–March financial year — intentionally separate from academic year rows."""
    existing = db.scalar(
        select(FinancialYear).where(FinancialYear.campus_id == campus.id, FinancialYear.name == "FY 2026-27")
    )
    if existing is not None:
        return
    has_current = db.scalar(
        select(FinancialYear).where(
            FinancialYear.campus_id == campus.id, FinancialYear.is_current.is_(True)
        )
    )
    db.add(
        FinancialYear(
            campus_id=campus.id,
            name="FY 2026-27",
            start_date=date(2026, 4, 1),
            end_date=date(2027, 3, 31),
            is_current=has_current is None,
            is_active=True,
        )
    )


def _seed_user(db: Session, *, campus: Campus, role: Role, email: str, password: str) -> None:
    password_hash = _seed_password_hash(password)
    existing = db.scalar(select(User).where(User.email == email.lower()))
    if existing is not None:
        # Demo accounts share one StaticPool SQLite across TestClient sessions. Repair only
        # when a prior test left the well-known login unusable.
        needs_repair = (
            existing.password_hash != password_hash
            or not existing.is_active
            or existing.must_change_password
            or existing.role_id != role.id
        )
        if needs_repair:
            existing.password_hash = password_hash
            existing.role_id = role.id
            existing.is_active = True
            existing.must_change_password = False
        return
    db.add(
        User(
            campus_id=campus.id,
            role_id=role.id,
            email=email.lower(),
            password_hash=password_hash,
            is_active=True,
            must_change_password=False,
        )
    )


def _ensure_demo_staff_hr_links(db: Session, campus: Campus) -> None:
    """Link demo login Users to HrEmployee so /hr/attendance/mine can resolve identity.

    Creates or updates the staff profile only — does not invent attendance punches.
    Idempotent: safe on every startup when seed_demo_accounts is on.
    """
    profiles = (
        {
            "email": settings.director_seed_email.lower(),
            "employee_code": "EMP-DIR-001",
            "first_name": "Campus",
            "last_name": "Director",
            "department": "Academics",
            "designation": "Director",
            "role_title": "Director",
        },
        {
            "email": settings.coordinator_seed_email.lower(),
            "employee_code": "EMP-COO-001",
            "first_name": "Campus",
            "last_name": "Coordinator",
            "department": "Academics",
            "designation": "Coordinator",
            "role_title": "Coordinator",
        },
        {
            "email": settings.principal_seed_email.lower(),
            "employee_code": "EMP-PRI-001",
            "first_name": "Campus",
            "last_name": "Principal",
            "department": "Academics",
            "designation": "Principal",
            "role_title": "Principal",
        },
    )
    for profile in profiles:
        user = db.scalar(select(User).where(User.email == profile["email"]))
        if user is None:
            continue
        row = db.scalar(select(HrEmployee).where(HrEmployee.email == profile["email"]))
        if row is None:
            by_code = db.scalar(
                select(HrEmployee).where(HrEmployee.employee_code == profile["employee_code"])
            )
            if by_code is not None and by_code.email.lower() != profile["email"]:
                # Stable demo code already used by another person — allocate a unique code.
                prefix = profile["employee_code"].rsplit("-", 1)[0]
                profile = {**profile, "employee_code": f"{prefix}-{str(user.id).replace('-', '')[:8].upper()}"}
            row = HrEmployee(
                campus_id=campus.id,
                employee_code=profile["employee_code"],
                first_name=profile["first_name"],
                last_name=profile["last_name"],
                email=profile["email"],
                department=profile["department"],
                designation=profile["designation"],
                role_title=profile["role_title"],
                status="Active",
                employment_type="Full-time",
                user_id=user.id,
            )
            db.add(row)
        else:
            row.user_id = user.id
            if not row.role_title:
                row.role_title = profile["role_title"]
            if not row.department:
                row.department = profile["department"]
            if not row.designation:
                row.designation = profile["designation"]
    db.flush()
