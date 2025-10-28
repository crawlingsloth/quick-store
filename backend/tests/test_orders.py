"""
Tests for order CRUD operations and inventory management
"""
import pytest
from datetime import date


def test_create_order(client, user_token, store):
    """Test creating an order"""
    # Create product first
    product_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Test Product", "price": 10.00, "inventory": 100}
    )
    product_id = product_response.json()["id"]

    # Create order
    response = client.post(
        "/api/orders",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "customer_name": "John Doe",
            "items": [
                {"product_id": product_id, "quantity": 2}
            ]
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["customer_name"] == "John Doe"
    assert float(data["total"]) == 20.00
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 2


def test_create_order_updates_inventory(client, user_token, store):
    """Test that creating an order decrements inventory"""
    # Create product with inventory
    product_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Inventory Test", "price": 10.00, "inventory": 100}
    )
    product_id = product_response.json()["id"]

    # Create order
    client.post(
        "/api/orders",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "items": [{"product_id": product_id, "quantity": 10}]
        }
    )

    # Check inventory was decremented
    product_response = client.get(
        f"/api/products/{product_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert product_response.json()["inventory"] == 90


def test_create_order_insufficient_inventory(client, user_token, store):
    """Test that order fails with insufficient inventory"""
    # Create product with limited inventory
    product_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Limited Stock", "price": 10.00, "inventory": 5}
    )
    product_id = product_response.json()["id"]

    # Try to order more than available
    response = client.post(
        "/api/orders",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "items": [{"product_id": product_id, "quantity": 10}]
        }
    )
    assert response.status_code == 400


def test_list_orders(client, user_token, store):
    """Test listing orders"""
    # Create product
    product_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Order Product", "price": 10.00, "inventory": 100}
    )
    product_id = product_response.json()["id"]

    # Create multiple orders
    for i in range(3):
        client.post(
            "/api/orders",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "customer_name": f"Customer {i}",
                "items": [{"product_id": product_id, "quantity": 1}]
            }
        )

    # List orders
    response = client.get(
        "/api/orders",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3


def test_list_today_orders(client, user_token, store):
    """Test listing today's orders"""
    # Create product
    product_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Today Product", "price": 10.00, "inventory": 100}
    )
    product_id = product_response.json()["id"]

    # Create order
    client.post(
        "/api/orders",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "items": [{"product_id": product_id, "quantity": 1}]
        }
    )

    # List today's orders
    response = client.get(
        "/api/orders/today",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1


def test_get_order(client, user_token, store):
    """Test getting a specific order"""
    # Create product and order
    product_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Get Order Product", "price": 10.00}
    )
    product_id = product_response.json()["id"]

    order_response = client.post(
        "/api/orders",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "customer_name": "Get Me",
            "items": [{"product_id": product_id, "quantity": 1}]
        }
    )
    order_id = order_response.json()["id"]

    # Get order
    response = client.get(
        f"/api/orders/{order_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["customer_name"] == "Get Me"


def test_update_order(client, user_token, store):
    """Test updating an order"""
    # Create products
    product1_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Product 1", "price": 10.00, "inventory": 100}
    )
    product1_id = product1_response.json()["id"]

    product2_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Product 2", "price": 20.00, "inventory": 100}
    )
    product2_id = product2_response.json()["id"]

    # Create order
    order_response = client.post(
        "/api/orders",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "customer_name": "Original",
            "items": [{"product_id": product1_id, "quantity": 2}]
        }
    )
    order_id = order_response.json()["id"]

    # Update order
    response = client.patch(
        f"/api/orders/{order_id}",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "customer_name": "Updated",
            "items": [{"product_id": product2_id, "quantity": 1}]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["customer_name"] == "Updated"
    assert data["is_edited"] is True
    assert float(data["total"]) == 20.00

    # Verify inventory was adjusted correctly
    # Product 1 should have inventory restored (100 - 2 + 2 = 100)
    p1_response = client.get(
        f"/api/products/{product1_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert p1_response.json()["inventory"] == 100

    # Product 2 should have inventory decremented (100 - 1 = 99)
    p2_response = client.get(
        f"/api/products/{product2_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert p2_response.json()["inventory"] == 99


def test_delete_order(client, user_token, store):
    """Test deleting an order"""
    # Create product and order
    product_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Delete Product", "price": 10.00, "inventory": 100}
    )
    product_id = product_response.json()["id"]

    order_response = client.post(
        "/api/orders",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "items": [{"product_id": product_id, "quantity": 10}]
        }
    )
    order_id = order_response.json()["id"]

    # Verify inventory was decremented
    p_response = client.get(
        f"/api/products/{product_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert p_response.json()["inventory"] == 90

    # Delete order
    response = client.delete(
        f"/api/orders/{order_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 204

    # Verify inventory was restored
    p_response = client.get(
        f"/api/products/{product_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert p_response.json()["inventory"] == 100

    # Verify order is gone
    response = client.get(
        f"/api/orders/{order_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 404


def test_order_saves_customer_name(client, user_token, store):
    """Test that creating an order saves customer name for autocomplete"""
    # Create product
    product_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Product", "price": 10.00}
    )
    product_id = product_response.json()["id"]

    # Create order with customer name
    client.post(
        "/api/orders",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "customer_name": "Saved Customer",
            "items": [{"product_id": product_id, "quantity": 1}]
        }
    )

    # Check customer names
    response = client.get(
        "/api/customers/names",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "Saved Customer" in data
