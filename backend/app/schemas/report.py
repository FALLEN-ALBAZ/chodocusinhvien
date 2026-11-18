from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import ReportStatus
from app.schemas.user import UserPublicResponse


class ReportCreateRequest(BaseModel):
    """Schema người dùng gửi báo cáo tin đăng vi phạm quy định cộng đồng."""

    reason: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Lý do báo cáo vi phạm (tối thiểu 3 ký tự)",
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
        description="Mô tả chi tiết bằng chứng hoặc dấu hiệu vi phạm",
    )


class ReportModerationRequest(BaseModel):
    """Schema Kiểm duyệt viên xử lý báo cáo vi phạm."""

    status: ReportStatus = Field(
        ...,
        description="Trạng thái xử lý: RESOLVED (Đã xử lý vi phạm) hoặc DISMISSED (Bác bỏ báo cáo)",
    )
    moderator_note: str | None = Field(
        default=None,
        max_length=1000,
        description="Ghi chú kết luận của Kiểm duyệt viên",
    )
    reject_listing: bool = Field(
        default=False,
        description="Nếu True hoặc khi RESOLVED, tự động gỡ/từ chối tin đăng vi phạm",
    )

    @model_validator(mode="after")
    def validate_report_status(self) -> "ReportModerationRequest":
        if self.status not in (ReportStatus.RESOLVED, ReportStatus.DISMISSED):
            raise ValueError(
                "Trạng thái xử lý báo cáo chỉ chấp nhận RESOLVED hoặc DISMISSED."
            )
        return self


class ReportListingSummary(BaseModel):
    """Thông tin tóm tắt của tin đăng bị báo cáo."""

    id: int
    title: str
    price: float
    status: str
    seller_id: int

    model_config = ConfigDict(from_attributes=True)


class ReportResponse(BaseModel):
    """Schema phản hồi thông tin báo cáo vi phạm."""

    id: int
    listing_id: int
    reporter_id: int
    reason: str
    description: str | None = None
    status: str
    moderator_note: str | None = None
    created_at: datetime
    updated_at: datetime
    listing: ReportListingSummary | None = None
    reporter: UserPublicResponse | None = None

    model_config = ConfigDict(from_attributes=True)
