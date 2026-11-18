from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.listing import Favorite, Listing
from app.models.review import Review
from app.models.user import User
from app.routers.listings import get_listing_load_options, serialize_listing
from app.schemas.listing import ListingResponse
from app.schemas.review import ReviewResponse
from app.schemas.user import UserPublicResponse
from app.security.auth import get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["5. Hồ sơ Người dùng & Yêu thích (Users)"])

DbSessionDep = Annotated[Session, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]


@router.get(
    "/me/favorites",
    response_model=list[ListingResponse],
    status_code=status.HTTP_200_OK,
    summary="Danh sách các tin đăng yêu thích của tôi",
    description="Trả về danh sách các tin đăng đồ cũ mà người dùng hiện tại đã bấm lưu Yêu thích.",
)
def get_my_favorite_listings(
    db: DbSessionDep,
    current_user: CurrentUserDep,
) -> list[ListingResponse]:
    listings = (
        db.query(Listing)
        .join(Favorite, Favorite.listing_id == Listing.id)
        .filter(Favorite.user_id == current_user.id)
        .options(*get_listing_load_options())
        .order_by(Favorite.created_at.desc())
        .all()
    )
    return [serialize_listing(item, current_user) for item in listings]


@router.get(
    "/{user_id}",
    response_model=UserPublicResponse,
    status_code=status.HTTP_200_OK,
    summary="Xem hồ sơ công khai và điểm uy tín của người dùng",
    description="Trả về thông tin hồ sơ công khai, điểm uy tín trung bình và tổng số lượt đánh giá của sinh viên.",
)
def get_user_profile(
    user_id: int,
    db: DbSessionDep,
) -> UserPublicResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy người dùng với ID={user_id}.",
        )
    return UserPublicResponse.model_validate(user)


@router.get(
    "/{user_id}/reviews",
    response_model=list[ReviewResponse],
    status_code=status.HTTP_200_OK,
    summary="Danh sách các đánh giá mà người bán nhận được",
    description="Trả về lịch sử đánh giá từ những người mua đã giao dịch thành công với người bán này.",
)
def get_user_reviews(
    user_id: int,
    db: DbSessionDep,
) -> list[ReviewResponse]:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy người dùng với ID={user_id}.",
        )

    reviews = (
        db.query(Review)
        .options(joinedload(Review.reviewer), joinedload(Review.listing))
        .filter(Review.seller_id == user_id)
        .order_by(Review.created_at.desc(), Review.id.desc())
        .all()
    )

    result: list[ReviewResponse] = []
    for rev in reviews:
        item = ReviewResponse.model_validate(rev)
        item.listing_title = rev.listing.title if rev.listing else None
        result.append(item)
    return result
