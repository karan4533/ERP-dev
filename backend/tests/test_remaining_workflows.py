import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["OTP_DEBUG"] = "true"
os.environ["JWT_SECRET"] = "test-secret-qmis-erp-workflows-ok"

from fastapi.testclient import TestClient

from app.main import app


def _client():
    return TestClient(app)


def _login(client, email, password):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _hire(client, hr, role, email, code):
    created = client.post(
        "/api/v1/hr/staff",
        headers=hr,
        json={"id": code, "name": role, "email": email, "role": role, "department": "Campus"},
    )
    assert created.status_code == 201, created.text
    temporary = created.json()["temporaryPassword"]
    login = client.post("/api/v1/auth/login", json={"email": email, "password": temporary})
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    changed = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": temporary, "new_password": "Secure-Pass-99"},
    )
    assert changed.status_code == 200, changed.text
    return _login(client, email, "Secure-Pass-99")


def test_driver_sees_only_assigned_vehicle():
    with _client() as client:
        hr = _login(client, "hr@qmis.edu", "hr12345")
        admin = _login(client, "admin@qmis.edu", "admin123")
        email = "driver.scope@example.com"
        driver = _hire(client, hr, "driver", email, "EMP-DRV-SCOPE")
        saved_drivers = client.put(
            "/api/v1/ops/transport-drivers",
            headers=admin,
            json=[{
                "id": "DRV-SCOPE",
                "email": email,
                "vehicleNumber": "TN01AA1111",
                "routeAssigned": "North Route",
            }],
        )
        assert saved_drivers.status_code == 200, saved_drivers.text
        saved_vehicles = client.put(
            "/api/v1/ops/transport-vehicles",
            headers=admin,
            json=[
                {"id": "VEH-MINE", "vehicleNumber": "TN01AA1111"},
                {"id": "VEH-OTHER", "vehicleNumber": "TN02BB2222"},
            ],
        )
        assert saved_vehicles.status_code == 200, saved_vehicles.text
        visible = client.get("/api/v1/ops/transport-vehicles", headers=driver)
        assert visible.status_code == 200, visible.text
        ids = {row["id"] for row in visible.json()}
        assert ids == {"VEH-MINE"}
        denied = client.put(
            "/api/v1/ops/transport-vehicles",
            headers=driver,
            json=[{"id": "VEH-OTHER", "vehicleNumber": "TN02BB2222"}],
        )
        assert denied.status_code == 403, denied.text
        still = client.get("/api/v1/ops/transport-vehicles", headers=admin)
        assert {row["id"] for row in still.json()} == {"VEH-MINE", "VEH-OTHER"}
        health = client.put(
            "/api/v1/ops/transport-vehicle-health",
            headers=driver,
            json=[{"id": "VHS-1", "vehicleNumber": "TN01AA1111", "engineStatus": "Good"}],
        )
        assert health.status_code == 200, health.text
        again = client.get("/api/v1/ops/transport-vehicle-health", headers=driver)
        assert again.json()[0]["engineStatus"] == "Good"


def test_department_roles_persist_their_own_records():
    # HR staff hire covers operational roles. Audit portals use seeded logins (HR cannot assign them).
    hire_cases = [
        ("librarian", "lib.flow@example.com", "EMP-LIB-1", "/api/v1/ops/library-books", {"id": "BK-1", "title": "Atlas"}),
        ("gatekeeper", "gate.flow@example.com", "EMP-GKP-1", "/api/v1/ops/gate-visitors", {"id": "VIS-1", "name": "Guest", "purpose": "Meeting"}),
        ("canteenmanager", "canteen.flow@example.com", "EMP-CAN-1", "/api/v1/ops/canteen-menu", {"id": "MENU-1", "item": "Idli"}),
        ("itsupportmanager", "it.flow@example.com", "EMP-IT-1", "/api/v1/ops/it-assets", {"id": "ASSET-1", "name": "Laptop"}),
        ("stationerystoremanager", "store.flow@example.com", "EMP-STO-1", "/api/v1/ops/stationery-inventory", {"id": "STK-1", "item": "Paper", "quantity": 10}),
        ("housekeepingmanager", "hk.flow@example.com", "EMP-HK-1", "/api/v1/ops/hk-schedules", {"id": "SCH-1", "area": "Block A"}),
    ]
    seeded_cases = [
        ("processauditor@qmis.edu", "process123", "/api/v1/campus-audit/process-observations", {"id": "OBS-1", "finding": "Late register"}),
        ("jointdirectoraudit@qmis.edu", "jdaudit123", "/api/v1/campus-audit/audit-assignments", {"id": "AAS-1", "title": "Term audit", "owner": "Process", "dueDate": "2026-11-01", "status": "Assigned"}),
    ]
    with _client() as client:
        hr = _login(client, "hr@qmis.edu", "hr12345")
        teacher = _login(client, "teacher@qmis.edu", "teacher123")
        for role, email, code, path, row in hire_cases:
            headers = _hire(client, hr, role, email, code)
            # Gate collections are item-upsert only (concurrent-safe).
            if path.endswith("/gate-visitors"):
                saved = client.put(f"{path}/items/{row['id']}", headers=headers, json=row)
            else:
                saved = client.put(path, headers=headers, json=[row])
            assert saved.status_code == 200, (role, saved.text)
            fresh = _login(client, email, "Secure-Pass-99")
            listed = client.get(path, headers=fresh)
            assert listed.status_code == 200, (role, listed.text)
            assert listed.json()[0]["id"] == row["id"]
            if path.endswith("/gate-visitors"):
                denied = client.put(f"{path}/items/{row['id']}", headers=teacher, json=row)
            else:
                denied = client.put(path, headers=teacher, json=[row])
            assert denied.status_code == 403, (role, denied.text)
        for email, password, path, row in seeded_cases:
            headers = _login(client, email, password)
            saved = client.put(path, headers=headers, json=[row])
            assert saved.status_code == 200, (email, saved.text)
            listed = client.get(path, headers=headers)
            assert listed.status_code == 200, (email, listed.text)
            assert listed.json()[0]["id"] == row["id"]
            denied = client.put(path, headers=teacher, json=[row])
            assert denied.status_code == 403, (email, denied.text)


def test_canteen_orders_persist_after_new_login():
    """Regression: canteen orders must survive replace + re-login (UI must not toast before this)."""
    with _client() as client:
        hr = _login(client, "hr@qmis.edu", "hr12345")
        headers = _hire(client, hr, "canteenmanager", "canteen.orders@example.com", "EMP-CAN-ORD")
        order = {
            "id": "ORD-REG-1",
            "orderId": "ORD-REG-1",
            "customerName": "Regression Student",
            "customerType": "Student",
            "customerId": "STU-REG-1",
            "items": ["Idli"],
            "itemsCount": 1,
            "totalAmount": "₹30",
            "paymentMethod": "Cash",
            "paymentStatus": "Paid",
            "orderStatus": "Preparing",
        }
        saved = client.put("/api/v1/ops/canteen-orders", headers=headers, json=[order])
        assert saved.status_code == 200, saved.text
        fresh = _login(client, "canteen.orders@example.com", "Secure-Pass-99")
        listed = client.get("/api/v1/ops/canteen-orders", headers=fresh)
        assert listed.status_code == 200, listed.text
        assert listed.json()[0]["orderId"] == "ORD-REG-1"
        teacher = _login(client, "teacher@qmis.edu", "teacher123")
        denied = client.put("/api/v1/ops/canteen-orders", headers=teacher, json=[order])
        assert denied.status_code == 403, denied.text
