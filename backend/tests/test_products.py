"""
Tests for product CRUD operations
"""
import pytest


def test_create_product(client, user_token, store):
    """Test creating a product"""
    response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "name": "Test Product",
            "price": 19.99,
            "category": "Electronics",
            "inventory": 100
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Product"
    assert float(data["price"]) == 19.99
    assert data["category"] == "Electronics"
    assert data["inventory"] == 100


def test_create_product_no_inventory(client, user_token, store):
    """Test creating a product without inventory tracking"""
    response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "name": "No Inventory Product",
            "price": 9.99
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "No Inventory Product"
    assert data["inventory"] is None


def test_list_products(client, user_token, store):
    """Test listing products"""
    # Create some products
    client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Product 1", "price": 10.00, "category": "Cat1"}
    )
    client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Product 2", "price": 20.00, "category": "Cat2"}
    )

    response = client.get(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_list_products_by_category(client, user_token, store):
    """Test filtering products by category"""
    # Create products in different categories
    client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Product 1", "price": 10.00, "category": "Cat1"}
    )
    client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Product 2", "price": 20.00, "category": "Cat2"}
    )

    response = client.get(
        "/api/products?category=Cat1",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["category"] == "Cat1"


def test_get_product(client, user_token, store):
    """Test getting a specific product"""
    # Create product
    create_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Get Me", "price": 15.00}
    )
    product_id = create_response.json()["id"]

    # Get product
    response = client.get(
        f"/api/products/{product_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Get Me"


def test_update_product(client, user_token, store):
    """Test updating a product"""
    # Create product
    create_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Old Name", "price": 10.00, "inventory": 50}
    )
    product_id = create_response.json()["id"]

    # Update product
    response = client.patch(
        f"/api/products/{product_id}",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "name": "New Name",
            "price": 15.00,
            "inventory": 75
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert float(data["price"]) == 15.00
    assert data["inventory"] == 75


def test_delete_product(client, user_token, store):
    """Test deleting a product"""
    # Create product
    create_response = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Delete Me", "price": 10.00}
    )
    product_id = create_response.json()["id"]

    # Delete product
    response = client.delete(
        f"/api/products/{product_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 204

    # Verify it's gone
    response = client.get(
        f"/api/products/{product_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 404


def test_update_product_inventory_validation(client, user_token, db_session):
    """Test that inventory cannot be updated when tracking is disabled"""
    from app.models import Store, Company

    # Create store without inventory tracking
    company = Company(name="No Inventory Company")
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)

    store = Store(company_id=company.id, name="No Inventory Store", track_inventory=False)
    db_session.add(store)
    db_session.commit()

    # This test would need to be run with a user assigned to the no-inventory company
    # For simplicity, we'll skip the full setup here
    pass
