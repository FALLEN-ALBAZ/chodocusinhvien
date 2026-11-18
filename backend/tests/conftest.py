import os
import shutil
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.security.auth import create_access_token
from app.seed import seed_database

# Thiết lập CSDL kiểm thử độc lập tại /tmp để không ảnh hưởng tới chodocu.db
TEST_DB_PATH = Path("/tmp/test_chodocu.db")
TEST_UPLOAD_DIR = Path("/tmp/test_chodocu_uploads")

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["UPLOAD_DIR"] = str(TEST_UPLOAD_DIR)
settings.DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"
settings.UPLOAD_DIR = str(TEST_UPLOAD_DIR)

test_engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    pool_pre_ping=True,
)


@event.listens_for(test_engine, "connect")
def _enable_sqlite_fk(dbapi_connection, _connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


def override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment() -> Generator[None, None, None]:
    """Khởi tạo CSDL SQLite độc lập tại /tmp/test_chodocu.db và nạp dữ liệu mẫu chuẩn."""
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()
    if TEST_UPLOAD_DIR.exists():
        shutil.rmtree(TEST_UPLOAD_DIR)
    TEST_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    yield

    test_engine.dispose()
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()
    if TEST_UPLOAD_DIR.exists():
        shutil.rmtree(TEST_UPLOAD_DIR)


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    """Cung cấp phiên làm việc CSDL kiểm thử."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    """Khởi tạo FastAPI TestClient cho các bài kiểm thử tích hợp API."""
    with TestClient(app) as test_client:
        yield test_client


def _auth_header_for_email(db: Session, email: str) -> dict[str, str]:
    user = db.query(User).filter(User.email == email).first()
    assert user is not None, f"Không tìm thấy tài khoản seed {email}"
    token = create_access_token(user)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def seller_headers(db_session: Session) -> dict[str, str]:
    """Header xác thực của Sinh viên Bán hàng (nguyenvana@sv.edu.vn)."""
    return _auth_header_for_email(db_session, "nguyenvana@sv.edu.vn")


@pytest.fixture()
def buyer_headers(db_session: Session) -> dict[str, str]:
    """Header xác thực của Sinh viên Mua hàng (tranthib@sv.edu.vn)."""
    return _auth_header_for_email(db_session, "tranthib@sv.edu.vn")


@pytest.fixture()
def moderator_headers(db_session: Session) -> dict[str, str]:
    """Header xác thực của Kiểm duyệt viên (kiemduyet@sv.edu.vn)."""
    return _auth_header_for_email(db_session, "kiemduyet@sv.edu.vn")


@pytest.fixture()
def admin_headers(db_session: Session) -> dict[str, str]:
    """Header xác thực của Quản trị viên (admin@sv.edu.vn)."""
    return _auth_header_for_email(db_session, "admin@sv.edu.vn")
