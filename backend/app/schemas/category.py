import re
import unicodedata
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


def slugify_vietnamese(text: str) -> str:
    """Chuyển đổi chuỗi tiếng Việt có dấu thành định dạng slug chuẩn URL."""
    text = text.strip().lower()
    text = text.replace("đ", "d")
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = "".join(c for c in normalized if not unicodedata.combining(c))
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text).strip("-")
    return slug or "danh-muc"


class CategoryCreateRequest(BaseModel):
    """Schema tạo mới danh mục đồ cũ sinh viên (Dành cho Kiểm duyệt viên / Quản trị viên)."""

    name: str = Field(
        ...,
        min_length=2,
        max_length=120,
        description="Tên danh mục (ví dụ: Giáo trình & Sách tham khảo)",
    )
    slug: str | None = Field(
        default=None,
        max_length=120,
        description="Đường dẫn tĩnh thân thiện (tự động sinh từ tên nếu bỏ trống)",
    )
    description: str | None = Field(
        default=None,
        max_length=1000,
        description="Mô tả chi tiết danh mục",
    )
    icon: str | None = Field(
        default="Package",
        max_length=100,
        description="Tên biểu tượng Lucide Icon hiển thị trên giao diện",
    )

    @model_validator(mode="after")
    def ensure_slug(self) -> "CategoryCreateRequest":
        if not self.slug or not self.slug.strip():
            self.slug = slugify_vietnamese(self.name)
        else:
            self.slug = slugify_vietnamese(self.slug)
        return self


class CategoryResponse(BaseModel):
    """Schema phản hồi thông tin danh mục sản phẩm."""

    id: int
    name: str
    slug: str
    description: str | None = None
    icon: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
