from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.enums import ListingStatus, OfferStatus
from app.models.listing import Listing
from app.models.offer import Offer
from app.models.user import User
from app.schemas.offer import OfferCreateRequest, OfferResponse
from app.security.auth import get_current_user

router = APIRouter(prefix="/api/v1", tags=["7. Đề nghị Mua hàng & Chốt đơn (Offers)"])

DbSessionDep = Annotated[Session, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]


@router.post(
    "/listings/{listing_id}/offers",
    response_model=OfferResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Gửi đề nghị mua / trả giá cho tin đăng",
    description=(
        "Sinh viên mua gửi mức giá đề xuất và lời nhắn cho chủ tin đăng. "
        "Hệ thống chặn tự trả giá tin của chính mình (`400 Bad Request`) và chỉ cho phép trả giá khi tin đang `APPROVED` (`409 Conflict` nếu tin đã bán hoặc chờ duyệt)."
    ),
)
def create_offer(
    listing_id: int,
    payload: OfferCreateRequest,
    db: DbSessionDep,
    current_user: CurrentUserDep,
) -> OfferResponse:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy tin đăng với ID={listing_id}.",
        )

    if listing.seller_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn không thể tự gửi đề nghị mua cho tin đăng của chính mình.",
        )

    if listing.status != ListingStatus.APPROVED.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Không thể gửi đề nghị mua vì tin đăng hiện đang ở trạng thái '{listing.status}' "
                "(chỉ nhận đề nghị mua khi tin đang hiển thị công khai APPROVED)."
            ),
        )

    now_utc = datetime.now(UTC).replace(tzinfo=None)
    new_offer = Offer(
        listing_id=listing_id,
        buyer_id=current_user.id,
        offered_price=payload.offered_price,
        message=payload.message.strip() if payload.message else None,
        status=OfferStatus.PENDING.value,
        created_at=now_utc,
        updated_at=now_utc,
    )
    db.add(new_offer)
    db.commit()

    created = (
        db.query(Offer)
        .options(joinedload(Offer.listing), joinedload(Offer.buyer))
        .filter(Offer.id == new_offer.id)
        .first()
    )
    return OfferResponse.model_validate(created)


@router.get(
    "/offers/received",
    response_model=list[OfferResponse],
    status_code=status.HTTP_200_OK,
    summary="Danh sách đề nghị mua gửi tới các tin đăng của tôi (Người bán)",
    description="Trả về tất cả các đề nghị mua hàng từ các bạn sinh viên khác gửi tới các tin đăng do người dùng hiện tại đăng bán.",
)
def get_received_offers(
    db: DbSessionDep,
    current_user: CurrentUserDep,
) -> list[OfferResponse]:
    offers = (
        db.query(Offer)
        .join(Listing, Offer.listing_id == Listing.id)
        .filter(Listing.seller_id == current_user.id)
        .options(joinedload(Offer.listing), joinedload(Offer.buyer))
        .order_by(Offer.created_at.desc(), Offer.id.desc())
        .all()
    )
    return [OfferResponse.model_validate(o) for o in offers]


@router.get(
    "/offers/sent",
    response_model=list[OfferResponse],
    status_code=status.HTTP_200_OK,
    summary="Danh sách đề nghị mua do tôi đã gửi đi (Người mua)",
    description="Trả về lịch sử các đề nghị mua hàng mà người dùng hiện tại đã gửi tới những người bán khác.",
)
def get_sent_offers(
    db: DbSessionDep,
    current_user: CurrentUserDep,
) -> list[OfferResponse]:
    offers = (
        db.query(Offer)
        .filter(Offer.buyer_id == current_user.id)
        .options(joinedload(Offer.listing), joinedload(Offer.buyer))
        .order_by(Offer.created_at.desc(), Offer.id.desc())
        .all()
    )
    return [OfferResponse.model_validate(o) for o in offers]


@router.patch(
    "/offers/{offer_id}/accept",
    response_model=OfferResponse,
    status_code=status.HTTP_200_OK,
    summary="Chấp nhận đề nghị mua & Tự động chốt đơn (Chuyển tin sang SOLD)",
    description=(
        "Người bán chấp nhận đề nghị mua hàng. Hệ thống sẽ thực hiện giao dịch nguyên tử (Atomic Transaction): "
        "1) Chuyển đề nghị mua này sang `ACCEPTED`; "
        "2) Tự động chuyển trạng thái tin đăng sang `SOLD`; "
        "3) Tự động từ chối (`REJECTED`) toàn bộ các đề nghị mua `PENDING` khác của cùng tin đăng đó."
    ),
)
def accept_offer(
    offer_id: int,
    db: DbSessionDep,
    current_user: CurrentUserDep,
) -> OfferResponse:
    offer = (
        db.query(Offer)
        .options(joinedload(Offer.listing), joinedload(Offer.buyer))
        .filter(Offer.id == offer_id)
        .first()
    )
    if offer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy đề nghị mua với ID={offer_id}.",
        )

    listing = offer.listing
    if listing is None or listing.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không phải chủ sở hữu của tin đăng này nên không có quyền chấp nhận đề nghị mua.",
        )

    if listing.status == ListingStatus.SOLD.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tin đăng này đã được chốt bán (SOLD) trước đó.",
        )

    if offer.status != OfferStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Đề nghị mua này hiện ở trạng thái '{offer.status}', không thể chấp nhận.",
        )

    now_utc = datetime.now(UTC).replace(tzinfo=None)

    # 1. Chấp nhận đề nghị mua được chọn
    offer.status = OfferStatus.ACCEPTED.value
    offer.updated_at = now_utc

    # 2. Tự động khóa tin đăng sang trạng thái Đã bán (SOLD)
    listing.status = ListingStatus.SOLD.value
    listing.updated_at = now_utc

    # 3. Tự động từ chối các đề nghị mua đang chờ khác của cùng tin đăng
    other_pending_offers = (
        db.query(Offer)
        .filter(
            Offer.listing_id == listing.id,
            Offer.id != offer.id,
            Offer.status == OfferStatus.PENDING.value,
        )
        .all()
    )
    for other in other_pending_offers:
        other.status = OfferStatus.REJECTED.value
        other.updated_at = now_utc

    db.commit()
    db.refresh(offer)
    return OfferResponse.model_validate(offer)


@router.patch(
    "/offers/{offer_id}/reject",
    response_model=OfferResponse,
    status_code=status.HTTP_200_OK,
    summary="Từ chối đề nghị mua hàng (Người bán)",
    description="Chủ tin đăng từ chối một đề nghị mua hàng đang ở trạng thái chờ (`PENDING`).",
)
def reject_offer(
    offer_id: int,
    db: DbSessionDep,
    current_user: CurrentUserDep,
) -> OfferResponse:
    offer = (
        db.query(Offer)
        .options(joinedload(Offer.listing), joinedload(Offer.buyer))
        .filter(Offer.id == offer_id)
        .first()
    )
    if offer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy đề nghị mua với ID={offer_id}.",
        )

    listing = offer.listing
    if listing is None or listing.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không phải chủ sở hữu của tin đăng này nên không có quyền từ chối đề nghị mua.",
        )

    if offer.status != OfferStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Đề nghị mua này hiện ở trạng thái '{offer.status}', không thể từ chối.",
        )

    offer.status = OfferStatus.REJECTED.value
    offer.updated_at = datetime.now(UTC).replace(tzinfo=None)
    db.commit()
    db.refresh(offer)
    return OfferResponse.model_validate(offer)
