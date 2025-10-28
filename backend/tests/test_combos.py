"""
Tests for combo CRUD operations
"""
import pytest


def test_create_combo(client, user_token, store):
    """Test creating a combo"""
    # Create products
    p1_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Burger", "price": 5.00}
    )
    p1_id = p1_response.json()["id"]

    p2_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Fries", "price": 2.00}
    )
    p2_id = p2_response.json()["id"]

    # Create combo
    response = client.post(
        "/api/combos",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "name": "Meal Combo",
            "total_price": 6.00,
            "items": [
                {"product_id": p1_id, "quantity": 1},
                {"product_id": p2_id, "quantity": 1}
            ]
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Meal Combo"
    assert float(data["total_price"]) == 6.00
    assert len(data["items"]) == 2


def test_create_combo_invalid_product(client, user_token, store):
    """Test creating combo with invalid product ID"""
    response = client.post(
        "/api/combos",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "name": "Invalid Combo",
            "total_price": 10.00,
            "items": [
                {"product_id": "00000000-0000-0000-0000-000000000000", "quantity": 1}
            ]
        }
    )
    assert response.status_code == 400


def test_list_combos(client, user_token, store):
    """Test listing combos"""
    # Create product
    p_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Product", "price": 5.00}
    )
    p_id = p_response.json()["id"]

    # Create combos
    for i in range(2):
        client.post(
            "/api/combos",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "name": f"Combo {i}",
                "total_price": 10.00,
                "items": [{"product_id": p_id, "quantity": 2}]
            }
        )

    # List combos
    response = client.get(
        "/api/combos",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_get_combo(client, user_token, store):
    """Test getting a specific combo"""
    # Create product and combo
    p_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Product", "price": 5.00}
    )
    p_id = p_response.json()["id"]

    combo_response = client.post(
        "/api/combos",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "name": "Get Me Combo",
            "total_price": 10.00,
            "items": [{"product_id": p_id, "quantity": 2}]
        }
    )
    combo_id = combo_response.json()["id"]

    # Get combo
    response = client.get(
        f"/api/combos/{combo_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Get Me Combo"


def test_update_combo(client, user_token, store):
    """Test updating a combo"""
    # Create products
    p1_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Product 1", "price": 5.00}
    )
    p1_id = p1_response.json()["id"]

    p2_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Product 2", "price": 3.00}
    )
    p2_id = p2_response.json()["id"]

    # Create combo
    combo_response = client.post(
        "/api/combos",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "name": "Original Combo",
            "total_price": 10.00,
            "items": [{"product_id": p1_id, "quantity": 2}]
        }
    )
    combo_id = combo_response.json()["id"]

    # Update combo
    response = client.patch(
        f"/api/combos/{combo_id}",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "name": "Updated Combo",
            "total_price": 8.00,
            "items": [
                {"product_id": p1_id, "quantity": 1},
                {"product_id": p2_id, "quantity": 1}
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Combo"
    assert float(data["total_price"]) == 8.00
    assert len(data["items"]) == 2


def test_delete_combo(client, user_token, store):
    """Test deleting a combo"""
    # Create product and combo
    p_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Product", "price": 5.00}
    )
    p_id = p_response.json()["id"]

    combo_response = client.post(
        "/api/combos",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "name": "Delete Me",
            "total_price": 10.00,
            "items": [{"product_id": p_id, "quantity": 2}]
        }
    )
    combo_id = combo_response.json()["id"]

    # Delete combo
    response = client.delete(
        f"/api/combos/{combo_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 204

    # Verify it's gone
    response = client.get(
        f"/api/combos/{combo_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 404
