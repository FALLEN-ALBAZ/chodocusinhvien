from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.enums import ListingStatus, ReportStatus, UserRole
from app.models.listing import Listing
from app.models.report import Report
from app.models.user import User
from app.routers.listings import get_listing_load_options, serialize_listing
from app.schemas.listing import ListingResponse, ModerationStatusRequest
from app.schemas.report import ReportModerationRequest, ReportResponse
from app.security.auth import require_roles

router = APIRouter(
    prefix="/api/v1/moderation",
    tags=["6. Kiểm duyệt Tin đăng & Báo cáo (Moderation)"],
)

DbSessionDep = Annotated[Session, Depends(get_db)]
StaffUserDep = Annotated[User, Depends(require_roles(UserRole.MODERATOR, UserRole.ADMIN))]


@router.get(
    "/listings",
    response_model=list[ListingResponse],
    status_code=status.HTTP_200_OK,
    summary="Danh sách tin đăng phục vụ kiểm duyệt (Kiểm duyệt viên / Quản trị viên)",
    description=(
        "Trả về danh sách tin đăng cho Kiểm duyệt viên (`MODERATOR`) hoặc Quản trị viên (`ADMIN`), "
        "hỗ trợ lọc theo trạng thái `status` (`PENDING`, `APPROVED`, `REJECTED`, `SOLD`)."
    ),
)
def get_moderation_listings(
    db: DbSessionDep,
    current_user: StaffUserDep,
    status_filter: Annotated[
        ListingStatus | None,
        Query(
            alias="status",
            description="Lọc theo trạng thái tin đăng (ví dụ: PENDING)",
        ),
    ] = None,
) -> list[ListingResponse]:
    query = db.query(Listing).options(*get_listing_load_options())
    if status_filter is not None:
        query = query.filter(Listing.status == status_filter.value)

    listings = query.order_by(Listing.created_at.desc(), Listing.id.desc()).all()
    return [serialize_listing(item, current_user) for item in listings]


@router.patch(
    "/listings/{listing_id}/status",
    response_model=ListingResponse,
    status_code=status.HTTP_200_OK,
    summary="Duyệt hoặc Từ chối tin đăng (Kiểm duyệt viên / Quản trị viên)",
    description=(
        "Cập nhật trạng thái kiểm duyệt của tin đăng sang `APPROVED` (Hiển thị lên chợ) "
        "hoặc `REJECTED` (Từ chối kèm lý do `rejection_reason` bắt buộc)."
    ),
)
def moderate_listing_status(
    listing_id: int,
    payload: ModerationStatusRequest,
    db: DbSessionDep,
    current_user: StaffUserDep,
) -> ListingResponse:
    listing = (
        db.query(Listing)
        .options(*get_listing_load_options())
        .filter(Listing.id == listing_id)
        .first()
    )
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy tin đăng với ID={listing_id}.",
        )

    listing.status = payload.status.value
    if payload.status == ListingStatus.REJECTED:
        listing.rejection_reason = (payload.rejection_reason or "").strip()
    else:
        listing.rejection_reason = None

    listing.updated_at = datetime.now(UTC).replace(tzinfo=None)
    db.commit()

    refreshed = (
        db.query(Listing)
        .options(*get_listing_load_options())
        .filter(Listing.id == listing_id)
        .first()
    )
    return serialize_listing(refreshed, current_user)


@router.get(
    "/reports",
    response_model=list[ReportResponse],
    status_code=status.HTTP_200_OK,
    summary="Danh sách báo cáo vi phạm (Kiểm duyệt viên / Quản trị viên)",
    description="Xem toàn bộ các báo cáo tin đăng vi phạm do sinh viên gửi lên để xác minh và xử lý.",
)
def get_moderation_reports(
    db: DbSessionDep,
    _current_user: StaffUserDep,
    status_filter: Annotated[
        ReportStatus | None,
        Query(
            alias="status",
            description="Lọc theo trạng thái báo cáo: PENDING, RESOLVED, DISMISSED",
        ),
    ] = None,
) -> list[ReportResponse]:
    query = db.query(Report).options(
        joinedload(Report.listing),
        joinedload(Report.reporter),
    )
    if status_filter is not None:
        query = query.filter(Report.status == status_filter.value)

    reports = query.order_by(Report.created_at.desc(), Report.id.desc()).all()
    return [ReportResponse.model_validate(rep) for rep in reports]


@router.patch(
    "/reports/{report_id}",
    response_model=ReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Xử lý báo cáo vi phạm (Kiểm duyệt viên / Quản trị viên)",
    description=(
        "Cập nhật kết quả xử lý báo cáo (`RESOLVED` hoặc `DISMISSED`) kèm ghi chú của Kiểm duyệt viên. "
        "Khi trạng thái là `RESOLVED` hoặc `reject_listing=True`, hệ thống tự động chuyển tin đăng bị báo cáo sang `REJECTED`."
    ),
)
def handle_report(
    report_id: int,
    payload: ReportModerationRequest,
    db: DbSessionDep,
    _current_user: StaffUserDep,
) -> ReportResponse:
    report = (
        db.query(Report)
        .options(joinedload(Report.listing), joinedload(Report.reporter))
        .filter(Report.id == report_id)
        .first()
    )
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy báo cáo vi phạm với ID={report_id}.",
        )

    now_utc = datetime.now(UTC).replace(tzinfo=None)
    report.status = payload.status.value
    report.moderator_note = (
        payload.moderator_note.strip() if payload.moderator_note else None
    )
    report.updated_at = now_utc

    if (
        payload.status == ReportStatus.RESOLVED or payload.reject_listing
    ) and report.listing is not None:
        report.listing.status = ListingStatus.REJECTED.value
        note_reason = (
            payload.moderator_note.strip()
            if payload.moderator_note
            else f"Tin đăng bị gỡ do vi phạm quy định cộng đồng: {report.reason}"
        )
        report.listing.rejection_reason = note_reason
        report.listing.updated_at = now_utc

    db.commit()
    db.refresh(report)
    return ReportResponse.model_validate(report)
