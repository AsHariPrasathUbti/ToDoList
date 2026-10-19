import pytest
from app.models.user import User, UserRole
from app.core.security import get_password_hash

@pytest.fixture
def seeded_users(db_session):
    # Ensure admin and hari exist in test db
    admin = db_session.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            name="System Admin",
            email="admin@taskflow.com",
            hashed_password=get_password_hash("Admin@12345"),
            role=UserRole.ADMIN.value,
            is_active=True,
        )
        db_session.add(admin)

    hari = db_session.query(User).filter(User.username == "hari").first()
    if not hari:
        hari = User(
            username="hari",
            name="Hari Prasath",
            email="hari@taskflow.com",
            hashed_password=get_password_hash("Hari@12345"),
            role=UserRole.USER.value,
            is_active=True,
        )
        db_session.add(hari)

    user2 = db_session.query(User).filter(User.username == "user2").first()
    if not user2:
        user2 = User(
            username="user2",
            name="User Two",
            email="user2@taskflow.com",
            hashed_password=get_password_hash("User2@12345"),
            role=UserRole.USER.value,
            is_active=True,
        )
        db_session.add(user2)

    db_session.commit()
    db_session.refresh(admin)
    db_session.refresh(hari)
    db_session.refresh(user2)
    return {"admin": admin, "hari": hari, "user2": user2}

@pytest.fixture
def admin_token(client, seeded_users):
    res = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@12345"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def hari_token(client, seeded_users):
    res = client.post("/api/auth/login", json={"username": "hari", "password": "Hari@12345"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def user2_token(client, seeded_users):
    res = client.post("/api/auth/login", json={"username": "user2", "password": "User2@12345"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_admin_and_user_login(client, seeded_users):
    r_admin = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@12345"})
    assert r_admin.status_code == 200
    assert r_admin.json()["user"]["role"] == "Admin"

    r_user = client.post("/api/auth/login", json={"username": "hari", "password": "Hari@12345"})
    assert r_user.status_code == 200
    assert r_user.json()["user"]["role"] == "User"

def test_invalid_login_credentials(client, seeded_users):
    r = client.post("/api/auth/login", json={"username": "admin", "password": "WrongPassword"})
    assert r.status_code == 401

def test_inactive_user_cannot_login(client, db_session, seeded_users):
    hari = seeded_users["hari"]
    hari.is_active = False
    db_session.commit()

    r = client.post("/api/auth/login", json={"username": "hari", "password": "Hari@12345"})
    assert r.status_code == 403
    assert "deactivated" in r.json()["detail"].lower()

def test_admin_can_create_task_and_assign_multiple_users(client, admin_token, seeded_users):
    hari_id = seeded_users["hari"].id
    user2_id = seeded_users["user2"].id

    payload = {
        "title": "Prepare Annual Financial Audit",
        "description": "Cross-departmental financial statements review",
        "priority": "Urgent",
        "assigned_user_ids": [hari_id, user2_id],
    }
    res = client.post("/api/tasks/", json=payload, headers=admin_token)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Prepare Annual Financial Audit"
    assert len(data["assignments"]) == 2
    assigned_uids = {a["user_id"] for a in data["assignments"]}
    assert assigned_uids == {hari_id, user2_id}

def test_regular_user_cannot_create_tasks(client, hari_token, seeded_users):
    payload = {
        "title": "Unauthorized User Task",
        "priority": "High",
        "assigned_user_ids": [seeded_users["hari"].id],
    }
    res = client.post("/api/tasks/", json=payload, headers=hari_token)
    assert res.status_code == 403

def test_user_sees_only_assigned_tasks(client, admin_token, hari_token, user2_token, seeded_users):
    hari_id = seeded_users["hari"].id
    user2_id = seeded_users["user2"].id

    # Task for Hari only
    client.post("/api/tasks/", json={"title": "Hari Task Only", "assigned_user_ids": [hari_id]}, headers=admin_token)
    # Task for User 2 only
    client.post("/api/tasks/", json={"title": "User2 Task Only", "assigned_user_ids": [user2_id]}, headers=admin_token)

    # Hari fetches tasks
    r_hari = client.get("/api/tasks/", headers=hari_token)
    assert r_hari.status_code == 200
    hari_titles = [t["title"] for t in r_hari.json()["items"]]
    assert "Hari Task Only" in hari_titles
    assert "User2 Task Only" not in hari_titles

    # User 2 fetches tasks
    r_u2 = client.get("/api/tasks/", headers=user2_token)
    assert r_u2.status_code == 200
    u2_titles = [t["title"] for t in r_u2.json()["items"]]
    assert "User2 Task Only" in u2_titles
    assert "Hari Task Only" not in u2_titles

def test_user_can_update_own_status_independent_progress(client, admin_token, hari_token, user2_token, seeded_users):
    hari_id = seeded_users["hari"].id
    user2_id = seeded_users["user2"].id

    # Task assigned to both
    created = client.post(
        "/api/tasks/",
        json={"title": "Shared Project", "assigned_user_ids": [hari_id, user2_id]},
        headers=admin_token,
    ).json()
    task_id = created["id"]

    # Hari updates their assignment status to "Completed"
    r_status = client.patch(
        f"/api/tasks/{task_id}/assignments/{hari_id}/status",
        json={"status": "Completed"},
        headers=hari_token,
    )
    assert r_status.status_code == 200

    # Verify User 2's assignment remains "Pending"
    task_admin_view = client.get(f"/api/tasks/{task_id}", headers=admin_token).json()
    assignments_by_uid = {a["user_id"]: a["status"] for a in task_admin_view["assignments"]}
    assert assignments_by_uid[hari_id] == "Completed"
    assert assignments_by_uid[user2_id] == "Pending"

def test_user_cannot_update_another_users_status(client, hari_token, admin_token, seeded_users):
    hari_id = seeded_users["hari"].id
    user2_id = seeded_users["user2"].id

    created = client.post(
        "/api/tasks/",
        json={"title": "Security Check", "assigned_user_ids": [hari_id, user2_id]},
        headers=admin_token,
    ).json()
    task_id = created["id"]

    # Hari attempts to update User 2's status -> 403 Forbidden
    r = client.patch(
        f"/api/tasks/{task_id}/assignments/{user2_id}/status",
        json={"status": "Completed"},
        headers=hari_token,
    )
    assert r.status_code == 403

def test_user_cannot_edit_task_details_or_delete(client, hari_token, admin_token, seeded_users):
    hari_id = seeded_users["hari"].id
    created = client.post(
        "/api/tasks/",
        json={"title": "Important Document", "assigned_user_ids": [hari_id]},
        headers=admin_token,
    ).json()
    task_id = created["id"]

    # User attempts to edit task details -> 403
    r_edit = client.put(f"/api/tasks/{task_id}", json={"title": "Hacked Title"}, headers=hari_token)
    assert r_edit.status_code == 403

    # User attempts to delete task -> 403
    r_del = client.delete(f"/api/tasks/{task_id}", headers=hari_token)
    assert r_del.status_code == 403

def test_user_cannot_access_admin_endpoints(client, hari_token):
    # User tries to access user management
    r1 = client.get("/api/users/", headers=hari_token)
    assert r1.status_code == 403

    # User tries to access admin dashboard stats
    r2 = client.get("/api/dashboard/admin-stats", headers=hari_token)
    assert r2.status_code == 403

def test_admin_dashboard_stats_vs_user_dashboard_stats(client, admin_token, hari_token, user2_token, seeded_users):
    hari_id = seeded_users["hari"].id
    user2_id = seeded_users["user2"].id

    # Create task for Hari (Pending) and task for User 2 (Completed)
    t1 = client.post("/api/tasks/", json={"title": "T1", "assigned_user_ids": [hari_id]}, headers=admin_token).json()
    t2 = client.post("/api/tasks/", json={"title": "T2", "assigned_user_ids": [user2_id]}, headers=admin_token).json()
    client.patch(f"/api/tasks/{t2['id']}/assignments/{user2_id}/status", json={"status": "Completed"}, headers=user2_token)

    # Admin stats sees all tasks & assignments
    admin_stats = client.get("/api/dashboard/admin-stats", headers=admin_token).json()
    assert admin_stats["total_tasks"] >= 2
    assert admin_stats["completed_assignments"] >= 1
    assert admin_stats["pending_assignments"] >= 1

    # Hari stats sees only Hari's assignment (1 total, 0 completed, 1 pending)
    hari_stats = client.get("/api/dashboard/user-stats", headers=hari_token).json()
    assert hari_stats["total_assigned_tasks"] == 1
    assert hari_stats["pending_tasks"] == 1
    assert hari_stats["completed_tasks"] == 0

def test_admin_can_reassign_tasks(client, admin_token, hari_token, user2_token, seeded_users):
    hari_id = seeded_users["hari"].id
    user2_id = seeded_users["user2"].id

    # Task initially assigned only to Hari
    created = client.post("/api/tasks/", json={"title": "Reassignment Task", "assigned_user_ids": [hari_id]}, headers=admin_token).json()
    task_id = created["id"]

    # Reassign to User 2
    reassign_res = client.patch(
        f"/api/tasks/{task_id}/assignments",
        json={"assigned_user_ids": [user2_id]},
        headers=admin_token,
    )
    assert reassign_res.status_code == 200
    new_uids = [a["user_id"] for a in reassign_res.json()["assignments"]]
    assert new_uids == [user2_id]

    # Hari can no longer access this task
    r_hari = client.get(f"/api/tasks/{task_id}", headers=hari_token)
    assert r_hari.status_code == 404

    # User 2 can now access it
    r_u2 = client.get(f"/api/tasks/{task_id}", headers=user2_token)
    assert r_u2.status_code == 200
