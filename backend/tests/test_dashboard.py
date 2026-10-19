def test_admin_dashboard_stats(client, admin_auth, user_auth):
    # Admin fetches stats
    response = client.get("/api/dashboard/admin-stats", headers=admin_auth["headers"])
    assert response.status_code == 200
    data = response.json()
    assert "total_tasks" in data
    assert "total_users" in data
    assert "overall_completion_percentage" in data

    # User cannot access admin stats
    res_user = client.get("/api/dashboard/admin-stats", headers=user_auth["headers"])
    assert res_user.status_code == 403

def test_user_dashboard_stats(client, admin_auth, user_auth):
    user_id = user_auth["user"]["id"]

    # Admin creates a task and assigns to user
    res_task = client.post(
        "/api/tasks/",
        json={
            "title": "Review PR",
            "priority": "High",
            "assigned_user_ids": [user_id]
        },
        headers=admin_auth["headers"]
    )
    assert res_task.status_code == 201

    # User checks their own stats
    response = client.get("/api/dashboard/user-stats", headers=user_auth["headers"])
    assert response.status_code == 200
    data = response.json()
    assert data["total_assigned_tasks"] >= 1
    assert data["pending_tasks"] >= 1
