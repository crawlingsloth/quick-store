"""
Tests for session endpoints
"""
import pytest
from datetime import date


def test_get_today_session(client, user_token, store):
    """Test getting today's session"""
    response = client.get(
        "/api/sessions/today",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == str(date.today())
    assert data["exported"] is False


def test_get_session_by_date(client, user_token, store):
    """Test getting session for a specific date"""
    test_date = "2025-01-15"
    response = client.get(
        f"/api/sessions/{test_date}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == test_date


def test_mark_session_exported(client, user_token, store):
    """Test marking a session as exported"""
    # Get today's session
    session_response = client.get(
        "/api/sessions/today",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    session_id = session_response.json()["id"]

    # Mark as exported
    response = client.patch(
        f"/api/sessions/{session_id}/export",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["exported"] is True


def test_get_session_invalid_date(client, user_token, store):
    """Test getting session with invalid date format"""
    response = client.get(
        "/api/sessions/invalid-date",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 400
