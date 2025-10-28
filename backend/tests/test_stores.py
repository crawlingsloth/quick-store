"""
Tests for store CRUD operations
"""
import pytest


def test_create_store(client, user_token):
    """Test creating a store"""
    response = client.post(
        "/api/stores",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "name": "My Store",
            "track_inventory": True
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Store"
    assert data["track_inventory"] is True
    assert "id" in data


def test_create_store_duplicate(client, user_token, store):
    """Test creating a second store (should fail - one per company)"""
    response = client.post(
        "/api/stores",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "name": "Another Store",
            "track_inventory": False
        }
    )
    assert response.status_code == 400


def test_list_stores(client, user_token, store):
    """Test listing stores"""
    response = client.get(
        "/api/stores",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1


def test_get_current_store(client, user_token, store):
    """Test getting current store"""
    response = client.get(
        "/api/stores/current",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Store"


def test_update_store(client, user_token, store):
    """Test updating a store"""
    response = client.patch(
        f"/api/stores/{store['id']}",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "name": "Updated Store Name",
            "track_inventory": False
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Store Name"
    assert data["track_inventory"] is False


def test_delete_store(client, user_token, store):
    """Test deleting a store"""
    response = client.delete(
        f"/api/stores/{store['id']}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 204

    # Verify it's gone
    response = client.get(
        "/api/stores/current",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 404


def test_admin_cannot_access_stores(client, admin_token):
    """Test that admin users cannot access store endpoints"""
    response = client.get(
        "/api/stores",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 403
