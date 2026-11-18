from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegisterRequest(BaseModel):
    """
    Schema đăng ký tài khoản sinh viên mới.
    Lưu ý bảo mật: Không cho phép người dùng truyền trường `role` để chống tấn công tự nâng quyền (Privilege Escalation).
    """

    email: EmailStr = Field(
        ...,
        description="Địa chỉ email sinh viên (ví dụ: sinhvien@sv.edu.vn)",
    )
    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        description="Mật khẩu tối thiểu 6 ký tự",
    )
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Họ và tên đầy đủ của sinh viên",
    )
    phone: str | None = Field(
        default=None,
        max_length=30,
        description="Số điện thoại liên hệ giao dịch",
    )
    university: str | None = Field(
        default="Trường ĐH Quản lý và Công nghệ Hải Phòng (HPU)",
        max_length=200,
        description="Trường đại học đang theo học",
    )


class UserLoginRequest(BaseModel):
    """Schema đăng nhập bằng email và mật khẩu."""

    email: EmailStr = Field(..., description="Email đăng nhập")
    password: str = Field(..., min_length=1, description="Mật khẩu")


class UserPublicResponse(BaseModel):
    """Schema thông tin công khai của người dùng (ẩn password_hash)."""

    id: int
    email: EmailStr
    full_name: str
    phone: str | None = None
    university: str | None = None
    avatar_url: str | None = None
    role: str
    reputation_score: float = 5.0
    total_reviews: int = 0
    is_active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Schema phản hồi sau khi đăng ký hoặc đăng nhập thành công."""

    access_token: str
    token_type: str = "bearer"
    user: UserPublicResponse
    id: int | None = None
    email: EmailStr | None = None
    full_name: str | None = None
    role: str | None = None
