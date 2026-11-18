from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.enums import ListingStatus, OfferStatus
from app.models.listing import Listing
from app.models.offer import Offer
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreateRequest, ReviewResponse
from app.security.auth import get_current_user

router = APIRouter(prefix="/api/v1", tags=["8. Đánh giá Uy tín sau Giao dịch (Reviews)"])

DbSessionDep = Annotated[Session, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]


@router.post(
    "/listings/{listing_id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Đánh giá người bán sau khi giao dịch thành công",
    description=(
        "Cho phép sinh viên mua (người có đề nghị mua được chấp nhận `ACCEPTED`) đánh giá từ 1 đến 5 sao "
        "sau khi tin đăng đã chuyển sang trạng thái `SOLD`. Mỗi tin đăng chỉ được đánh giá duy nhất 1 lần. "
        "Sau khi lưu đánh giá, hệ thống tự động tính lại điểm uy tín trung bình (`reputation_score`) của người bán."
    ),
)
def create_review(
    listing_id: int,
    payload: ReviewCreateRequest,
    db: DbSessionDep,
    current_user: CurrentUserDep,
) -> ReviewResponse:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy tin đăng với ID={listing_id}.",
        )

    if listing.status != ListingStatus.SOLD.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Chỉ có thể đánh giá người bán sau khi tin đăng đã hoàn tất giao dịch (SOLD).",
        )

    existing_review = (
        db.query(Review).filter(Review.listing_id == listing_id).first()
    )
    if existing_review is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Giao dịch của tin đăng này đã được đánh giá trước đó.",
        )

    accepted_offer = (
        db.query(Offer)
        .filter(
            Offer.listing_id == listing_id,
            Offer.buyer_id == current_user.id,
            Offer.status == OfferStatus.ACCEPTED.value,
        )
        .first()
    )
    if accepted_offer is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Chỉ người mua có đề nghị mua đã được chấp nhận (ACCEPTED) cho tin đăng này "
                "mới có quyền gửi đánh giá sau giao dịch."
            ),
        )

    now_utc = datetime.now(UTC).replace(tzinfo=None)
    new_review = Review(
        listing_id=listing_id,
        reviewer_id=current_user.id,
        seller_id=listing.seller_id,
        rating=payload.rating,
        comment=payload.comment.strip() if payload.comment else None,
        created_at=now_utc,
    )
    db.add(new_review)
    db.flush()

    # Tự động tính toán lại điểm uy tín trung bình (reputation_score) và tổng số đánh giá (total_reviews) của người bán
    stats_row = (
        db.query(
            func.count(Review.id),
            func.avg(Review.rating),
        )
        .filter(Review.seller_id == listing.seller_id)
        .first()
    )
    total_reviews = int(stats_row[0] or 0) if stats_row else 1
    avg_rating = float(stats_row[1] or payload.rating) if stats_row else float(payload.rating)

    seller = db.query(User).filter(User.id == listing.seller_id).first()
    if seller is not None:
        seller.total_reviews = total_reviews
        seller.reputation_score = round(avg_rating, 2)

    db.commit()

    created = (
        db.query(Review)
        .options(joinedload(Review.reviewer), joinedload(Review.listing))
        .filter(Review.id == new_review.id)
        .first()
    )
    response = ReviewResponse.model_validate(created)
    response.listing_title = listing.title
    return response
