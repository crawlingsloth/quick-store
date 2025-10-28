"""
Tests for customer endpoints
"""
import pytest


def test_list_customer_names(client, user_token, store):
    """Test listing customer names"""
    # Create product
    product_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Product", "price": 10.00}
    )
    product_id = product_response.json()["id"]

    # Create orders with customer names
    for name in ["Alice", "Bob", "Charlie"]:
        client.post(
            "/api/orders",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "customer_name": name,
                "items": [{"product_id": product_id, "quantity": 1}]
            }
        )

    # List customer names
    response = client.get(
        "/api/customers",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert all("name" in customer for customer in data)


def test_list_customer_names_simple(client, user_token, store):
    """Test listing simple customer names"""
    # Create product
    product_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Product", "price": 10.00}
    )
    product_id = product_response.json()["id"]

    # Create orders with customer names
    for name in ["Dave", "Eve"]:
        client.post(
            "/api/orders",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "customer_name": name,
                "items": [{"product_id": product_id, "quantity": 1}]
            }
        )

    # List simple customer names
    response = client.get(
        "/api/customers/names",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert "Dave" in data
    assert "Eve" in data


def test_customer_names_deduplicated(client, user_token, store):
    """Test that duplicate customer names are not stored"""
    # Create product
    product_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Product", "price": 10.00}
    )
    product_id = product_response.json()["id"]

    # Create multiple orders with same customer name
    for _ in range(3):
        client.post(
            "/api/orders",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "customer_name": "Same Customer",
                "items": [{"product_id": product_id, "quantity": 1}]
            }
        )

    # List customer names - should only have one entry
    response = client.get(
        "/api/customers/names",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    customer_count = data.count("Same Customer")
    assert customer_count == 1
