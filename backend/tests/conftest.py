import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User, UserRole
from app.core.security import get_password_hash

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    # Seed default admin and user
    db = TestingSessionLocal()
    admin = User(
        username="admin",
        name="System Administrator",
        email="admin@taskflow.com",
        hashed_password=get_password_hash("Admin@12345"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    user = User(
        username="hari",
        name="Hari Prasath",
        email="hari@taskflow.com",
        hashed_password=get_password_hash("Hari@12345"),
        role=UserRole.USER,
        is_active=True,
    )
    db.add(admin)
    db.add(user)
    db.commit()
    db.close()

    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_auth(client):
    """Logs in as default Admin user."""
    res = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "Admin@12345"},
    )
    assert res.status_code == 200
    data = res.json()
    token = data["access_token"]
    return {
        "headers": {"Authorization": f"Bearer {token}"},
        "user": data["user"],
        "token": token,
    }

@pytest.fixture
def user_auth(client):
    """Logs in as default regular User (hari)."""
    res = client.post(
        "/api/auth/login",
        json={"username": "hari", "password": "Hari@12345"},
    )
    assert res.status_code == 200
    data = res.json()
    token = data["access_token"]
    return {
        "headers": {"Authorization": f"Bearer {token}"},
        "user": data["user"],
        "token": token,
    }

@pytest.fixture
def user_one_auth(admin_auth):
    """Compatibility alias pointing to admin."""
    return admin_auth

@pytest.fixture
def user_two_auth(user_auth):
    """Compatibility alias pointing to regular user."""
    return user_auth
