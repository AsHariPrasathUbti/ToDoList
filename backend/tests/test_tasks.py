def test_admin_create_task(client, admin_auth, user_auth):
    user_id = user_auth["user"]["id"]
    res = client.post(
        "/api/tasks/",
        json={
            "title": "System Architecture Review",
            "description": "Evaluate FastAPI and React models",
            "priority": "High",
            "assigned_user_ids": [user_id]
        },
        headers=admin_auth["headers"]
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "System Architecture Review"
    assert len(data["assignments"]) == 1
    assert data["assignments"][0]["user_id"] == user_id

def test_admin_update_task(client, admin_auth):
    create_res = client.post(
        "/api/tasks/",
        json={"title": "Initial Title", "priority": "Low"},
        headers=admin_auth["headers"]
    )
    task_id = create_res.json()["id"]

    update_res = client.put(
        f"/api/tasks/{task_id}",
        json={"title": "Updated Title", "priority": "Urgent"},
        headers=admin_auth["headers"]
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Title"
    assert update_res.json()["priority"] == "Urgent"

def test_admin_delete_task(client, admin_auth):
    create_res = client.post(
        "/api/tasks/",
        json={"title": "Task to Delete", "priority": "Low"},
        headers=admin_auth["headers"]
    )
    task_id = create_res.json()["id"]

    del_res = client.delete(f"/api/tasks/{task_id}", headers=admin_auth["headers"])
    assert del_res.status_code == 200

    get_res = client.get(f"/api/tasks/{task_id}", headers=admin_auth["headers"])
    assert get_res.status_code == 404

def test_admin_reassign_task(client, admin_auth, user_auth):
    user_id = user_auth["user"]["id"]
    create_res = client.post(
        "/api/tasks/",
        json={"title": "Reassignment Task", "priority": "Medium", "assigned_user_ids": []},
        headers=admin_auth["headers"]
    )
    task_id = create_res.json()["id"]

    reassign_res = client.patch(
        f"/api/tasks/{task_id}/assignments",
        json={"assigned_user_ids": [user_id]},
        headers=admin_auth["headers"]
    )
    assert reassign_res.status_code == 200
    data = reassign_res.json()
    assert len(data["assignments"]) == 1
    assert data["assignments"][0]["user_id"] == user_id
