from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserPublicResponse


class ReviewCreateRequest(BaseModel):
    """Schema đánh giá người bán sau khi giao dịch thành công."""

    rating: int = Field(
        ...,
        ge=1,
        le=5,
        description="Điểm đánh giá từ 1 đến 5 sao",
    )
    comment: str | None = Field(
        default=None,
        max_length=2000,
        description="Nhận xét chi tiết về chất lượng món đồ và thái độ người bán",
    )


class ReviewResponse(BaseModel):
    """Schema phản hồi thông tin đánh giá sau giao dịch."""

    id: int
    listing_id: int
    reviewer_id: int
    seller_id: int
    rating: int
    comment: str | None = None
    created_at: datetime
    reviewer: UserPublicResponse | None = None
    listing_title: str | None = None

    model_config = ConfigDict(from_attributes=True)
