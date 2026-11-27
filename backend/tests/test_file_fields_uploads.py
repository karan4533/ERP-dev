"""File fields (#42/#43/#44): task and ticket attachments are real uploads with type, size and access checks."""

import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-file-fields"

import struct
import zlib
from datetime import date, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from tests.conftest import reset_sqlite_memory_schema

ADMIN = (settings.admin_seed_email, settings.admin_seed_password)
TEACHER = (settings.teacher_seed_email, settings.teacher_seed_password)
PRINCIPAL = (settings.principal_seed_email, settings.principal_seed_password)
COORDINATOR = (settings.coordinator_seed_email, settings.coordinator_seed_password)
HR = (settings.hr_seed_email, settings.hr_seed_password)
HK = ("housekeepingmanager@qmis.edu", "housekeeping123")
MAINT = ("maintenancemanager@qmis.edu", "maintenance123")
IT = ("itsupportmanager@qmis.edu", "itsupport123")

FILES = "/api/v1/files"
ATTACHED = "/api/v1/files/attached"
RAISE = "/api/v1/ops/it-support-tickets/raise"
PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"
EXE = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00" + b"\x00" * 64
SRC = Path(__file__).resolve().parents[2] / "src"


def _png() -> bytes:
    """A real 1x1 RGB PNG (signature, IHDR, IDAT, IEND with valid CRCs)."""

    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    header = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(b"\x00\xff\x00\x00"))
        + chunk(b"IEND", b"")
    )


PNG = _png()


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    reset_sqlite_memory_schema()
    with TestClient(app) as test_client:
        yield test_client


def _h(client, who) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": who[0], "password": who[1]})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _upload(client, headers, resource_type, resource_id, name, data, content_type="application/octet-stream"):
    return client.post(
        FILES,
        data={"resource_type": resource_type, "resource_id": resource_id},
        files={"file": (name, data, content_type)},
        headers=headers,
    )


@pytest.fixture()
def task(client):
    principal = _h(client, PRINCIPAL)
    teachers = client.get("/api/v1/tasks/assignees?role=teacher", headers=principal).json()
    teacher_id = next(row["id"] for row in teachers if row["email"] == TEACHER[0])
    response = client.post(
        "/api/v1/tasks",
        json={
            "assigneeId": teacher_id,
            "title": "Collect lab permission slips",
            "priority": "High",
            "dueDate": (date.today() + timedelta(days=3)).isoformat(),
        },
        headers=principal,
    )
    assert response.status_code == 201, response.text
    assert response.json()["attachments"] == []
    return response.json()


# ---------------------------------------------------------------- task attachments


def test_task_creator_and_assignee_upload_and_attachments_are_listed_on_the_task(client, task):
    principal, teacher = _h(client, PRINCIPAL), _h(client, TEACHER)

    png = _upload(client, principal, "task-attachment", task["id"], "slip.png", PNG, "image/png")
    assert png.status_code == 201, png.text
    assert png.json()["content_type"] == "image/png"
    assert png.json()["resource_id"] == task["id"] and png.json()["size_bytes"] == len(PNG)

    pdf = _upload(client, teacher, "task-attachment", task["id"], "signed.pdf", PDF, "application/pdf")
    assert pdf.status_code == 201, pdf.text

    expected = {png.json()["id"], pdf.json()["id"]}
    for who in (principal, teacher, _h(client, ADMIN)):
        listed = client.get(ATTACHED, params={"resource_type": "task-attachment", "resource_id": task["id"]}, headers=who)
        assert listed.status_code == 200, listed.text
        assert {row["id"] for row in listed.json()} == expected

    mine = client.get("/api/v1/tasks?box=mine", headers=teacher).json()
    assert {f["id"] for f in next(t for t in mine if t["id"] == task["id"])["attachments"]} == expected
    detail = client.get(f"/api/v1/tasks/{task['id']}", headers=principal).json()
    assert [f["original_name"] for f in detail["attachments"]] == ["slip.png", "signed.pdf"]


def test_people_outside_the_task_cannot_upload_list_or_download(client, task):
    principal = _h(client, PRINCIPAL)
    stored = _upload(client, principal, "task-attachment", task["id"], "slip.png", PNG, "image/png").json()

    for outsider in (_h(client, COORDINATOR), _h(client, HR)):  # HR has hr.write, which must not open tasks
        assert _upload(client, outsider, "task-attachment", task["id"], "x.pdf", PDF).status_code == 403
        listed = client.get(ATTACHED, params={"resource_type": "task-attachment", "resource_id": task["id"]},
                            headers=outsider)
        assert listed.status_code == 403
        assert client.get(f"{FILES}/{stored['id']}/download", headers=outsider).status_code == 403
        assert all(t["id"] != task["id"] for t in client.get("/api/v1/tasks?box=mine", headers=outsider).json())

    assert _upload(client, principal, "task-attachment", "00000000-0000-0000-0000-000000000000", "x.pdf",
                   PDF).status_code == 404
    assert _upload(client, principal, "task-attachment", "not-a-task", "x.pdf", PDF).status_code == 404
    assert client.get(ATTACHED, params={"resource_type": "library", "resource_id": task["id"]},
                      headers=principal).status_code == 400


def test_task_attachment_download_is_scoped_to_people_who_see_the_task(client, task):
    stored = _upload(client, _h(client, PRINCIPAL), "task-attachment", task["id"], "slip.png", PNG, "image/png").json()
    url = f"{FILES}/{stored['id']}/download"
    for who in (PRINCIPAL, TEACHER, ADMIN):
        response = client.get(url, headers=_h(client, who))
        assert response.status_code == 200, response.text
        assert response.content == PNG and response.headers["content-type"] == "image/png"
    token = _h(client, TEACHER)["Authorization"].split(" ", 1)[1]
    assert client.get(url, params={"token": token}).status_code == 200  # <a href> download links
    assert client.get(url).status_code == 401


def test_invalid_or_disguised_files_are_rejected_with_415(client, task):
    principal = _h(client, PRINCIPAL)
    for name, data in (
        ("setup.exe", EXE),
        ("photo.png", EXE),  # an executable renamed to .png
        ("photo.png", PDF),  # contents do not match the extension
        ("notes.txt", b"plain text"),
        ("empty.pdf", b""),
    ):
        response = _upload(client, principal, "task-attachment", task["id"], name, data, "image/png")
        assert response.status_code == 415, (name, response.text)
    listed = client.get(ATTACHED, params={"resource_type": "task-attachment", "resource_id": task["id"]},
                        headers=principal)
    assert listed.json() == []


def test_attachment_size_limit_is_enforced(client, task):
    big = PDF + b"0" * (10 * 1024 * 1024)
    response = _upload(client, _h(client, PRINCIPAL), "task-attachment", task["id"], "big.pdf", big, "application/pdf")
    assert response.status_code == 413, response.text


def test_a_record_holds_at_most_ten_attachments(client, task):
    principal = _h(client, PRINCIPAL)
    for index in range(10):
        assert _upload(client, principal, "task-attachment", task["id"], f"p{index}.pdf", PDF).status_code == 201
    assert _upload(client, principal, "task-attachment", task["id"], "p10.pdf", PDF).status_code == 409


# ---------------------------------------------------------------- ticket attachments


def _ticket(client, headers, department="Housekeeping"):
    response = client.post(
        RAISE,
        json={"subject": "Leaking tap", "description": "Washroom near 8-A.", "issueType": "Other",
              "priority": "High", "department": department},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()["ticketId"]


def test_ticket_requester_attaches_a_png_and_only_the_owning_department_and_it_can_read_it(client):
    teacher = _h(client, TEACHER)
    ticket_id = _ticket(client, teacher)

    stored = _upload(client, teacher, "it-ticket-attachment", ticket_id, "leak.png", PNG, "image/png")
    assert stored.status_code == 201, stored.text
    assert stored.json()["content_type"] == "image/png" and stored.json()["resource_id"] == ticket_id
    url = f"{FILES}/{stored.json()['id']}/download"
    params = {"resource_type": "it-ticket-attachment", "resource_id": ticket_id}

    for reader in (teacher, _h(client, HK), _h(client, IT)):
        listed = client.get(ATTACHED, params=params, headers=reader)
        assert listed.status_code == 200 and [row["id"] for row in listed.json()] == [stored.json()["id"]]
        assert client.get(url, headers=reader).status_code == 200

    for outsider in (_h(client, MAINT), _h(client, COORDINATOR), _h(client, HR)):
        assert client.get(ATTACHED, params=params, headers=outsider).status_code == 403
        assert client.get(url, headers=outsider).status_code == 403
        assert _upload(client, outsider, "it-ticket-attachment", ticket_id, "x.pdf", PDF).status_code == 403

    assert _upload(client, teacher, "it-ticket-attachment", ticket_id, "virus.exe", EXE).status_code == 415
    assert _upload(client, teacher, "it-ticket-attachment", "TKT-1999-9999", "x.pdf", PDF).status_code == 404


def test_generic_uploads_still_require_their_module_permission(client):
    # The attachment types do not widen the generic POST /files rule.
    assert _upload(client, _h(client, TEACHER), "attachment", "", "x.pdf", PDF).status_code == 403


# ---------------------------------------------------------------- frontend wiring (static)


def _src(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_star_of_the_month_browse_button_still_uploads_through_files_api():
    page = _src("Common/StudentStarRatings/SomMatrixPage.jsx")
    browse = page.index("Browse")
    window = page[browse: browse + 600]
    assert "type='file'" in window and "onChange={onUpload}" in window
    assert "uploadProfileImage(file, 'som-matrix-doc'" in page
    assert "import { fileDownloadUrl, uploadProfileImage } from '../../services/filesApi'" in page
    files_api = _src("services/filesApi.js")
    upload = files_api[files_api.index("export const uploadProfileImage"):]
    assert "apiRequest('/files'" in upload[: upload.index("\n}\n")]


def test_shared_uploader_accepts_png_and_task_and_ticket_forms_use_it():
    rules = _src("Common/CommonComponents/fileUploadRules.js")
    assert "'image/png'" in rules and "'.png'" in rules
    field = _src("Common/CommonComponents/FileUploadField.jsx")
    assert "accept={accept}" in field and "type='file'" in field and "Browse" in field
    assert "uploadFileWithProgress" in field and "fileDownloadUrl" in field and "from './fileUploadRules'" in field

    task_form = _src("Common/TaskManagement/AddAssignTaskPage.jsx")
    assert "not available for tasks yet" not in task_form
    assert "FileUploadField" in task_form and "uploadTaskAttachmentsViaApi" in task_form
    task_data = _src("Common/TaskManagement/taskManagementData.js")
    assert "export const TASK_ATTACHMENT_RESOURCE = 'task-attachment'" in task_data
    assert "uploadFileWithProgress(file, { resourceType: TASK_ATTACHMENT_RESOURCE, resourceId: item.id })" in task_data

    ticket_form = _src("Common/RaiseItTicket/RaiseItTicketModal.jsx")
    assert "FileUploadField" in ticket_form and "'it-ticket-attachment'" in ticket_form

    files_api = _src("services/filesApi.js")
    assert "export const uploadFileWithProgress" in files_api
    assert "export const listAttachedFilesApi" in files_api

    helpers = _src("services/academicAttachments.js")
    assert "study-material-attachment" in helpers and "home-fun-attachment" in helpers
    assert "sample-question-attachment" in helpers and "lesson-plan-attachment" in helpers
    assert "FileUploadField" in _src(
        "Pages/Teacher/StudentDeliverables/StudyMaterials/Components/StudyMaterialForm.jsx"
    )
    assert "FileUploadField" in _src(
        "Pages/Teacher/StudentDeliverables/HomeFun/Components/HomeFunForm.jsx"
    )
    assert "FileUploadField" in _src(
        "Pages/Teacher/StudentDeliverables/SampleQuestions/Components/SampleQuestionForm.jsx"
    )
    assert "FileUploadField" in _src("Common/LessonPlanApproval/Components/LessonPlanEntryForm.jsx")
    assert "serverUpload" in _src("Pages/Admin/FrontOffice/AdminssionList/Components/ProfileUpload.jsx")
    assert "uploadProfileImage" in _src("Pages/Admin/FrontOffice/AdminssionList/Components/ProfileUpload.jsx")


# ---------------------------------------------------------------- academics deliverable attachments


def test_study_material_attachment_png_ok_exe_rejected_and_outsiders_forbidden(client):
    principal, hr = _h(client, PRINCIPAL), _h(client, HR)
    seed = [
        {
            "id": "SM-UPLOAD-1",
            "title": "Fractions notes",
            "className": "Grade 5",
            "section": "A",
            "subject": "Maths",
            "fileName": "—",
        }
    ]
    put = client.put("/api/v1/academics/study-materials", json=seed, headers=principal)
    assert put.status_code == 200, put.text

    png = _upload(client, principal, "study-material-attachment", "SM-UPLOAD-1", "notes.png", PNG, "image/png")
    assert png.status_code == 201, png.text
    assert png.json()["content_type"] == "image/png"
    assert png.json()["resource_id"] == "SM-UPLOAD-1"

    listed = client.get(
        ATTACHED,
        params={"resource_type": "study-material-attachment", "resource_id": "SM-UPLOAD-1"},
        headers=principal,
    )
    assert listed.status_code == 200 and [row["id"] for row in listed.json()] == [png.json()["id"]]
    assert client.get(f"{FILES}/{png.json()['id']}/download", headers=principal).status_code == 200

    assert _upload(client, principal, "study-material-attachment", "SM-UPLOAD-1", "virus.exe", EXE).status_code == 415
    assert _upload(client, principal, "study-material-attachment", "SM-UPLOAD-1", "fake.png", EXE).status_code == 415

    assert _upload(client, hr, "study-material-attachment", "SM-UPLOAD-1", "x.pdf", PDF).status_code == 403
    assert client.get(
        ATTACHED,
        params={"resource_type": "study-material-attachment", "resource_id": "SM-UPLOAD-1"},
        headers=hr,
    ).status_code == 403
    assert client.get(f"{FILES}/{png.json()['id']}/download", headers=hr).status_code == 403
    assert _upload(client, principal, "study-material-attachment", "SM-MISSING", "x.pdf", PDF).status_code == 404


# ---------------------------------------------------------------- FO / admissions profile uploads


def test_admission_profile_upload_png_ok_exe_rejected_and_teacher_forbidden(client):
    admin, teacher = _h(client, ADMIN), _h(client, TEACHER)

    png = _upload(client, admin, "admission", None, "photo.png", PNG, "image/png")
    assert png.status_code == 201, png.text
    assert png.json()["content_type"] == "image/png"
    assert client.get(f"{FILES}/{png.json()['id']}/download", headers=admin).status_code == 200

    assert _upload(client, admin, "admission", None, "malware.exe", EXE).status_code == 415
    assert _upload(client, admin, "admission", None, "photo.png", EXE).status_code == 415
    assert _upload(client, teacher, "admission", None, "photo.png", PNG, "image/png").status_code == 403
