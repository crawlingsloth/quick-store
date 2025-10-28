"""
Tests for authentication endpoints
"""
import pytest


def test_login_success(client, db_session, admin_token):
    """Test successful login"""
    response = client.post("/api/auth/login", json={
        "username": "testadmin",
        "password": "testpass"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, db_session, admin_token):
    """Test login with wrong password"""
    response = client.post("/api/auth/login", json={
        "username": "testadmin",
        "password": "wrongpass"
    })
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    """Test login with nonexistent user"""
    response = client.post("/api/auth/login", json={
        "username": "doesnotexist",
        "password": "testpass"
    })
    assert response.status_code == 401


def test_get_current_user(client, admin_token):
    """Test getting current user info"""
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testadmin"
    assert data["role"] == "admin"


def test_get_current_user_no_token(client):
    """Test getting current user without token"""
    response = client.get("/api/auth/me")
    assert response.status_code == 403
