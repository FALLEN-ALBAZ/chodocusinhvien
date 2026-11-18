from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import ItemCondition, ListingStatus
from app.schemas.category import CategoryResponse
from app.schemas.user import UserPublicResponse


class ListingCreateRequest(BaseModel):
    """Schema tạo tin đăng bán đồ cũ mới của sinh viên."""

    title: str = Field(
        ...,
        min_length=5,
        max_length=255,
        description="Tiêu đề tin đăng (tối thiểu 5 ký tự)",
    )
    description: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Mô tả chi tiết tình trạng sản phẩm (tối thiểu 10 ký tự)",
    )
    price: float = Field(
        ...,
        ge=0,
        description="Giá bán đề xuất (VNĐ, lớn hơn hoặc bằng 0)",
    )
    condition: ItemCondition = Field(
        default=ItemCondition.GOOD,
        description="Tình trạng món đồ: NEW, LIKE_NEW, GOOD, FAIR",
    )
    category_id: int = Field(
        ...,
        gt=0,
        description="ID danh mục sản phẩm",
    )
    image_urls: list[str] = Field(
        default_factory=list,
        description="Danh sách đường dẫn ảnh minh họa của sản phẩm",
    )


class ListingUpdateRequest(BaseModel):
    """Schema cập nhật thông tin tin đăng bán đồ cũ (chỉ dành cho chủ tin khi chưa bán)."""

    title: str | None = Field(default=None, min_length=5, max_length=255)
    description: str | None = Field(default=None, min_length=10, max_length=5000)
    price: float | None = Field(default=None, ge=0)
    condition: ItemCondition | None = None
    category_id: int | None = Field(default=None, gt=0)
    image_urls: list[str] | None = None


class ModerationStatusRequest(BaseModel):
    """Schema kiểm duyệt tin đăng (Duyệt APPROVED hoặc Từ chối REJECTED kèm lý do)."""

    status: ListingStatus = Field(
        ...,
        description="Trạng thái kiểm duyệt: APPROVED hoặc REJECTED",
    )
    rejection_reason: str | None = Field(
        default=None,
        max_length=1000,
        description="Lý do từ chối tin đăng (bắt buộc khi status = REJECTED)",
    )

    @model_validator(mode="after")
    def validate_moderation_rules(self) -> "ModerationStatusRequest":
        if self.status not in (ListingStatus.APPROVED, ListingStatus.REJECTED):
            raise ValueError(
                "Trạng thái kiểm duyệt chỉ chấp nhận APPROVED (Duyệt) hoặc REJECTED (Từ chối)."
            )
        if self.status == ListingStatus.REJECTED and (
            not self.rejection_reason or len(self.rejection_reason.strip()) < 3
        ):
            raise ValueError(
                "Vui lòng nhập lý do từ chối rõ ràng (tối thiểu 3 ký tự) khi từ chối tin đăng."
            )
        return self


class ListingImageResponse(BaseModel):
    """Schema hình ảnh minh họa của tin đăng."""

    id: int
    listing_id: int
    image_url: str
    display_order: int = 0

    model_config = ConfigDict(from_attributes=True)


class ListingResponse(BaseModel):
    """Schema thông tin đầy đủ của một tin đăng bán đồ cũ."""

    id: int
    seller_id: int
    category_id: int
    title: str
    description: str
    price: float
    condition: str
    status: str
    rejection_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    seller: UserPublicResponse
    category: CategoryResponse
    images: list[ListingImageResponse] = Field(default_factory=list)
    is_favorited: bool = False
    favorites_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class PaginatedListingResponse(BaseModel):
    """Schema danh sách tin đăng có phân trang."""

    items: list[ListingResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class FavoriteToggleResponse(BaseModel):
    """Schema phản hồi khi thêm/bỏ tin đăng khỏi danh sách Yêu thích."""

    listing_id: int
    is_favorited: bool
    favorites_count: int
    message: str
