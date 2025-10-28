"""
Test configuration and fixtures
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models import User
from app.models.user import UserRole
from app.security import get_password_hash

# Use PostgreSQL test database
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@192.168.50.62:5432/quickstore_test"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    # Create tables
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
        # Clean up all tables
        db = TestingSessionLocal()
        try:
            # Disable foreign key checks temporarily for cleanup
            db.execute(text("SET session_replication_role = 'replica';"))
            for table in reversed(Base.metadata.sorted_tables):
                db.execute(text(f"TRUNCATE TABLE {table.name} CASCADE;"))
            db.execute(text("SET session_replication_role = 'origin';"))
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client"""
    return TestClient(app)


@pytest.fixture(scope="function")
def admin_token(db_session, client):
    """Create an admin user and return auth token"""
    # Create admin user
    admin = User(
        username="testadmin",
        email="admin@test.com",
        password_hash=get_password_hash("testpass"),
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()

    # Login to get token
    response = client.post("/api/auth/login", json={
        "username": "testadmin",
        "password": "testpass"
    })
    return response.json()["access_token"]


@pytest.fixture(scope="function")
def user_token(db_session, client, admin_token):
    """Create a regular user with company and return auth token"""
    from app.models import Company

    # Create company
    company = Company(
        name="Test Company",
        currency_symbol="$"
    )
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)

    # Create user via API
    response = client.post(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "username": "testuser",
            "email": "user@test.com",
            "password": "testpass",
            "role": "user",
            "company_id": str(company.id)
        }
    )

    # Login to get token
    response = client.post("/api/auth/login", json={
        "username": "testuser",
        "password": "testpass"
    })
    return response.json()["access_token"]


@pytest.fixture(scope="function")
def store(db_session, client, user_token):
    """Create a store for testing"""
    response = client.post(
        "/api/stores",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "name": "Test Store",
            "track_inventory": True
        }
    )
    return response.json()
