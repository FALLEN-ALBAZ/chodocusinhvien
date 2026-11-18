from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserPublicResponse


class OfferCreateRequest(BaseModel):
    """Schema người mua gửi đề nghị mua / trả giá cho một tin đăng."""

    offered_price: float = Field(
        ...,
        gt=0,
        description="Mức giá người mua đề xuất (VNĐ, phải lớn hơn 0)",
    )
    message: str | None = Field(
        default=None,
        max_length=1000,
        description="Lời nhắn gửi tới người bán (thời gian, địa điểm nhận đồ...)",
    )


class OfferListingSummary(BaseModel):
    """Thông tin tóm tắt của tin đăng đi kèm trong đề nghị mua."""

    id: int
    title: str
    price: float
    status: str
    seller_id: int

    model_config = ConfigDict(from_attributes=True)


class OfferResponse(BaseModel):
    """Schema phản hồi thông tin đề nghị mua hàng."""

    id: int
    listing_id: int
    buyer_id: int
    offered_price: float
    message: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime
    listing: OfferListingSummary | None = None
    buyer: UserPublicResponse | None = None

    model_config = ConfigDict(from_attributes=True)
