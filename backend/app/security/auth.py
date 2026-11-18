from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Annotated

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
    OAuth2PasswordBearer,
)
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.enums import UserRole
from app.models.user import User

# Hỗ trợ đồng thời cả OAuth2PasswordBearer (cho nút Authorize trên Swagger UI)
# và HTTPBearer (cho Bearer Token trực tiếp từ Frontend/Postman/cURL)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)
http_bearer = HTTPBearer(auto_error=False)


def hash_password(plain_password: str) -> str:
    """Băm mật khẩu bằng thuật toán bcrypt chuẩn bảo mật (đồng bộ với seed.py)."""
    return bcrypt.hashpw(
        plain_password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Kiểm tra mật khẩu người dùng nhập vào so với chuỗi băm bcrypt trong CSDL."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except ValueError:
        return False


def create_access_token(user: User, expires_delta: timedelta | None = None) -> str:
    """
    Khởi tạo JWT Access Token chứa định danh và vai trò của người dùng.
    Payload gồm: sub (user_id), email, role, exp.
    """
    expire = datetime.now(UTC) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    role_val = user.role.value if isinstance(user.role, UserRole) else str(user.role)
    to_encode = {
        "sub": str(user.id),
        "email": user.email,
        "role": role_val,
        "exp": expire,
    }
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    """Giải mã và xác thực chữ ký số cũng như thời hạn của JWT Access Token."""
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


def _extract_token(
    oauth_token: Annotated[str | None, Depends(oauth2_scheme)] = None,
    bearer_creds: Annotated[
        HTTPAuthorizationCredentials | None, Depends(http_bearer)
    ] = None,
) -> str | None:
    """Trích xuất Bearer token từ header Authorization."""
    if bearer_creds and bearer_creds.credentials:
        return bearer_creds.credentials
    if oauth_token:
        return oauth_token
    return None


def get_current_user(
    token: Annotated[str | None, Depends(_extract_token)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """
    Dependency bắt buộc đăng nhập: Xác thực JWT token và trả về đối tượng User hiện tại.
    Trả mã 401 Unauthorized nếu thiếu token, token hết hạn hoặc không hợp lệ.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = decode_access_token(token)
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception from None

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception

    return user


def get_current_user_optional(
    token: Annotated[str | None, Depends(_extract_token)],
    db: Annotated[Session, Depends(get_db)],
) -> User | None:
    """
    Dependency tùy chọn: Trả về User nếu có token hợp lệ, hoặc None nếu khách vãng lai.
    Dùng cho các API công khai (danh sách tin đăng, chi tiết tin đăng) để kiểm tra trạng thái Yêu thích
    hoặc quyền xem tin đang chờ duyệt (PENDING) / bị từ chối (REJECTED).
    """
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            return None
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        return None

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        return None
    return user


def require_roles(*allowed_roles: UserRole | str) -> Callable:
    """
    Dependency phân quyền dựa trên vai trò (RBAC - Role-Based Access Control).
    Trả về 403 Forbidden với thông báo tiếng Việt rõ ràng nếu người dùng không đủ quyền hạn.
    """
    allowed_set = {
        r.value if isinstance(r, UserRole) else str(r) for r in allowed_roles
    }

    def role_checker(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        user_role = (
            current_user.role.value
            if isinstance(current_user.role, UserRole)
            else str(current_user.role)
        )
        if user_role not in allowed_set:
            roles_display = ", ".join(sorted(allowed_set))
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Truy cập bị từ chối: Tài khoản của bạn có vai trò '{user_role}', "
                    f"không đủ quyền thực hiện chức năng này (yêu cầu quyền: {roles_display})."
                ),
            )
        return current_user

    return role_checker
