from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.enums import ReportStatus
from app.models.listing import Listing
from app.models.report import Report
from app.models.user import User
from app.schemas.report import ReportCreateRequest, ReportResponse
from app.security.auth import get_current_user

router = APIRouter(prefix="/api/v1", tags=["9. Báo cáo Vi phạm (Reports)"])

DbSessionDep = Annotated[Session, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]


@router.post(
    "/listings/{listing_id}/reports",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Gửi báo cáo tin đăng vi phạm quy định cộng đồng",
    description=(
        "Cho phép sinh viên báo cáo các tin đăng có dấu hiệu lừa đảo, hàng cấm hoặc sai thông tin. "
        "Không cho phép tự báo cáo tin của chính mình (`400 Bad Request`) hoặc gửi trùng báo cáo đang chờ xử lý (`409 Conflict`)."
    ),
)
def create_report(
    listing_id: int,
    payload: ReportCreateRequest,
    db: DbSessionDep,
    current_user: CurrentUserDep,
) -> ReportResponse:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy tin đăng với ID={listing_id}.",
        )

    if listing.seller_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn không thể tự báo cáo vi phạm đối với tin đăng của chính mình.",
        )

    existing_pending = (
        db.query(Report)
        .filter(
            Report.listing_id == listing_id,
            Report.reporter_id == current_user.id,
            Report.status == ReportStatus.PENDING.value,
        )
        .first()
    )
    if existing_pending is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bạn đã gửi báo cáo cho tin đăng này và báo cáo đang chờ Kiểm duyệt viên xử lý.",
        )

    now_utc = datetime.now(UTC).replace(tzinfo=None)
    new_report = Report(
        listing_id=listing_id,
        reporter_id=current_user.id,
        reason=payload.reason.strip(),
        description=payload.description.strip() if payload.description else None,
        status=ReportStatus.PENDING.value,
        created_at=now_utc,
        updated_at=now_utc,
    )
    db.add(new_report)
    db.commit()

    created = (
        db.query(Report)
        .options(joinedload(Report.listing), joinedload(Report.reporter))
        .filter(Report.id == new_report.id)
        .first()
    )
    return ReportResponse.model_validate(created)
