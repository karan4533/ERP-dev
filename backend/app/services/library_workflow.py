"""Library issue / return as single server actions.

Issuing checks availability and the borrower limit (students 1 open loan, staff 5) and updates the book,
the member and the loan together, so the counts cannot drift and the limit cannot be skipped by the browser.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.deps import role_code_for
from app.models import OpsRecord, User
from app.services.audit import write_audit
from app.services.errors import fail

BOOKS = "library-books"
ISSUES = "library-issues"
MEMBERS = "library-members"
LIBRARY_DESK = {"librarian", "admin", "superadmin", "managing_director"}
STUDENT_LIMIT = 1
STAFF_LIMIT = 5


def _now() -> datetime:
    return datetime.now(timezone.utc)


def borrow_limit(member_role: str) -> int:
    return STUDENT_LIMIT if "student" in str(member_role or "").lower() else STAFF_LIMIT


def _require_desk(db: Session, actor: User) -> str:
    code = role_code_for(db, actor)
    if code not in LIBRARY_DESK:
        fail(403, "forbidden", "Only the library desk can issue or return books.")
    return code


def _row(db: Session, campus_id, collection: str, public_id: str) -> OpsRecord | None:
    return db.scalar(
        select(OpsRecord).where(
            OpsRecord.campus_id == campus_id,
            OpsRecord.collection == collection,
            OpsRecord.public_id == str(public_id),
        )
    )


def _rows(db: Session, campus_id, collection: str) -> list[OpsRecord]:
    return db.scalars(select(OpsRecord).where(OpsRecord.campus_id == campus_id, OpsRecord.collection == collection)).all()


def _set(row: OpsRecord, body: dict) -> None:
    row.body = body
    row.updated_at = _now()
    flag_modified(row, "body")


def _item(row: OpsRecord) -> dict:
    return {**dict(row.body or {}), "id": row.public_id}


def _as_int(value, default: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def issue_book(db: Session, actor: User, body: dict) -> dict:
    _require_desk(db, actor)
    if not isinstance(body, dict):
        fail(422, "invalid_body", "Body must be a JSON object.")
    client_key = str(body.get("clientRequestId") or "").strip()[:80]
    if client_key:
        for row in _rows(db, actor.campus_id, ISSUES):
            if str((row.body or {}).get("clientRequestId") or "") == client_key:
                return {**_item(row), "idempotent": True}

    book_row = _row(db, actor.campus_id, BOOKS, str(body.get("bookId") or ""))
    if book_row is None:
        fail(404, "not_found", "Choose a book from the catalogue.")
    member_row = _row(db, actor.campus_id, MEMBERS, str(body.get("memberId") or ""))
    if member_row is None:
        fail(404, "not_found", "Select a library member.")
    book = dict(book_row.body or {})
    member = dict(member_row.body or {})
    if str(member.get("status") or "Active") == "Inactive":
        fail(409, "member_inactive", f"{member.get('name')} is not an active member.")
    available = _as_int(book.get("available"))
    if available <= 0:
        fail(409, "unavailable", f"No copies of {book.get('title')} are available to issue.")

    role = str(member.get("role") or "Student")
    open_loans = sum(
        1
        for row in _rows(db, actor.campus_id, ISSUES)
        if (row.body or {}).get("status") == "Issued" and str((row.body or {}).get("memberId") or "") == member_row.public_id
    )
    limit = borrow_limit(role)
    if open_loans >= limit:
        fail(409, "limit_reached", f"{role} borrowing limit is {limit}. {member.get('name')} already has {open_loans} open loan(s).")

    issue_id = f"LIS-{uuid.uuid4().hex[:10].upper()}"
    issue = {
        "id": issue_id,
        "bookId": book_row.public_id,
        "bookTitle": book.get("title") or "",
        "memberId": member_row.public_id,
        "memberName": member.get("name") or "",
        "memberRole": role,
        "issueDate": str(body.get("issueDate") or _now().date().isoformat()),
        "dueDate": str(body.get("dueDate") or ""),
        "status": "Issued",
        "issuedByEmail": actor.email or "",
        "issuedAt": _now().isoformat(),
        "clientRequestId": client_key or None,
    }
    remaining = available - 1
    _set(book_row, {**book, "available": remaining, "status": "Available" if remaining > 0 else "Issued Out"})
    _set(member_row, {**member, "booksIssued": open_loans + 1})
    db.add(
        OpsRecord(
            id=uuid.uuid4(),
            campus_id=actor.campus_id,
            collection=ISSUES,
            public_id=issue_id,
            body=issue,
            created_by=actor.id,
            updated_at=_now(),
        )
    )
    write_audit(
        db,
        action="LIBRARY_BOOK_ISSUED",
        entity_type="library_issue",
        entity_id=issue_id,
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{book.get('title')} -> {member.get('name')} ({role}, {open_loans + 1}/{limit})",
    )
    db.commit()
    return issue


def return_book(db: Session, actor: User, issue_id: str) -> dict:
    _require_desk(db, actor)
    issue_row = _row(db, actor.campus_id, ISSUES, issue_id)
    if issue_row is None:
        fail(404, "not_found", "Loan not found.")
    issue = dict(issue_row.body or {})
    if issue.get("status") != "Issued":
        fail(409, "already_returned", "That loan is already closed.")
    issue.update({"status": "Returned", "returnDate": _now().date().isoformat(), "returnedByEmail": actor.email or ""})
    _set(issue_row, issue)
    book_row = _row(db, actor.campus_id, BOOKS, str(issue.get("bookId") or ""))
    if book_row is not None:
        book = dict(book_row.body or {})
        available = _as_int(book.get("available")) + 1
        _set(book_row, {**book, "available": available, "copies": max(_as_int(book.get("copies")), available), "status": "Available"})
    member_row = _row(db, actor.campus_id, MEMBERS, str(issue.get("memberId") or ""))
    if member_row is not None:
        member = dict(member_row.body or {})
        _set(member_row, {**member, "booksIssued": max(0, _as_int(member.get("booksIssued")) - 1)})
    write_audit(
        db,
        action="LIBRARY_BOOK_RETURNED",
        entity_type="library_issue",
        entity_id=issue_row.public_id,
        actor_id=actor.id,
        campus_id=actor.campus_id,
        details=f"{issue.get('bookTitle')} <- {issue.get('memberName')}",
    )
    db.commit()
    return {**issue, "id": issue_row.public_id}


def guard_issue_write(collection: str) -> None:
    """Loans are created and closed only through issue_book / return_book."""
    if collection == ISSUES:
        fail(403, "forbidden", "Issue and return books from Issue Book; loans cannot be edited directly.")
