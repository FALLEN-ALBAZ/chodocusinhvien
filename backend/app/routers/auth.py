import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import (
    TokenResponse,
    UserLoginRequest,
    UserPublicResponse,
    UserRegisterRequest,
)
from app.security.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/v1/auth", tags=["1. Xác thực & Phân quyền (Auth)"])


def _build_token_response(user: User) -> TokenResponse:
    """Tạo đối tượng phản hồi TokenResponse chuẩn kèm thông tin User."""
    access_token = create_access_token(user)
    user_public = UserPublicResponse.model_validate(user)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_public,
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user_public.role,
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Đăng ký tài khoản Sinh viên mới",
    description=(
        "Tạo mới tài khoản cho sinh viên tham gia mua bán đồ cũ. "
        "Mật khẩu được băm bằng `bcrypt` và vai trò luôn được gán cứng là `STUDENT` "
        "nhằm ngăn chặn lỗ hổng tự nâng quyền (Privilege Escalation)."
    ),
)
def register_user(
    payload: UserRegisterRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    normalized_email = payload.email.strip().lower()
    existing = (
        db.query(User)
        .filter(func.lower(User.email) == normalized_email)
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email này đã được đăng ký trong hệ thống. Vui lòng sử dụng email khác.",
        )

    seed_name = normalized_email.split("@")[0]
    new_user = User(
        email=normalized_email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        phone=payload.phone.strip() if payload.phone else None,
        university=(
            payload.university.strip()
            if payload.university
            else "Trường ĐH Quản lý và Công nghệ Hải Phòng (HPU)"
        ),
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed_name}",
        role=UserRole.STUDENT.value,
        reputation_score=5.0,
        total_reviews=0,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return _build_token_response(new_user)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Đăng nhập hệ thống (Nhận JWT Access Token)",
    description=(
        "Xác thực thông tin tài khoản bằng `email` và `password` (hỗ trợ cả JSON Body "
        "từ Frontend/Postman và OAuth2 Form từ nút Authorize trên Swagger UI)."
    ),
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": UserLoginRequest.model_json_schema(),
                }
            },
            "required": True,
        }
    },
)
async def login_user(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    content_type = request.headers.get("content-type", "")
    email: str | None = None
    password: str | None = None

    if (
        "application/x-www-form-urlencoded" in content_type
        or "multipart/form-data" in content_type
    ):
        form_data = await request.form()
        email = str(form_data.get("username") or form_data.get("email") or "").strip()
        password = str(form_data.get("password") or "")
        if not email or not password:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Vui lòng nhập đầy đủ email/username và mật khẩu.",
            )
    else:
        try:
            raw_body = await request.json()
        except (json.JSONDecodeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Dữ liệu JSON gửi lên không hợp lệ.",
            ) from None

        try:
            validated = UserLoginRequest.model_validate(raw_body)
            email = validated.email.strip().lower()
            password = validated.password
        except ValidationError as exc:
            raise RequestValidationError(exc.errors()) from exc

    user = (
        db.query(User)
        .filter(func.lower(User.email) == email.lower())
        .first()
    )
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đã bị khóa tạm thời.",
        )

    return _build_token_response(user)


@router.get(
    "/me",
    response_model=UserPublicResponse,
    status_code=status.HTTP_200_OK,
    summary="Lấy thông tin tài khoản hiện tại",
    description="Trả về hồ sơ cá nhân, vai trò và điểm uy tín của người dùng đang đăng nhập.",
)
def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserPublicResponse:
    return UserPublicResponse.model_validate(current_user)
