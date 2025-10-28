"""
Tests for admin endpoints
"""
import pytest


def test_create_company(client, admin_token):
    """Test creating a company"""
    response = client.post(
        "/api/admin/companies",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "New Company",
            "currency_symbol": "€"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Company"
    assert data["currency_symbol"] == "€"
    assert "id" in data


def test_create_company_non_admin(client, user_token):
    """Test creating company without admin privileges"""
    response = client.post(
        "/api/admin/companies",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "name": "New Company",
            "currency_symbol": "$"
        }
    )
    assert response.status_code == 403


def test_list_companies(client, admin_token):
    """Test listing all companies"""
    # Create two companies
    client.post(
        "/api/admin/companies",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Company 1"}
    )
    client.post(
        "/api/admin/companies",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Company 2"}
    )

    response = client.get(
        "/api/admin/companies",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2  # At least the two we just created


def test_update_company(client, admin_token, db_session):
    """Test updating a company"""
    from app.models import Company

    # Create company
    company = Company(name="Old Name", currency_symbol="$")
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)

    # Update company
    response = client.patch(
        f"/api/admin/companies/{company.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "New Name"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"


def test_create_user(client, admin_token, db_session):
    """Test creating a user"""
    from app.models import Company

    # Create company first
    company = Company(name="User Company")
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)

    response = client.post(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "password123",
            "role": "user",
            "company_id": str(company.id)
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@test.com"
    assert data["role"] == "user"


def test_create_user_duplicate_username(client, admin_token, user_token):
    """Test creating user with duplicate username"""
    response = client.post(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "username": "testuser",  # Already exists
            "email": "different@test.com",
            "password": "password123",
            "role": "user"
        }
    )
    assert response.status_code == 400


def test_list_users(client, admin_token):
    """Test listing all users"""
    response = client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_update_user(client, admin_token, db_session):
    """Test updating a user"""
    from app.models import User
    from app.models.user import UserRole
    from app.security import get_password_hash

    # Create user
    user = User(
        username="updateme",
        email="old@test.com",
        password_hash=get_password_hash("pass"),
        role=UserRole.USER
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Update user
    response = client.patch(
        f"/api/admin/users/{user.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "email": "new@test.com",
            "is_active": False
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "new@test.com"
    assert data["is_active"] is False
