import math
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload, selectinload

from app.config import settings
from app.database import get_db
from app.models.category import Category
from app.models.enums import ItemCondition, ListingStatus, UserRole
from app.models.listing import Favorite, Listing, ListingImage
from app.models.user import User
from app.schemas.listing import (
    FavoriteToggleResponse,
    ListingCreateRequest,
    ListingResponse,
    ListingUpdateRequest,
    PaginatedListingResponse,
)
from app.security.auth import get_current_user, get_current_user_optional

router = APIRouter(prefix="/api/v1/listings", tags=["4. Tin đăng Đồ cũ (Listings)"])

DEFAULT_LISTING_IMAGE = (
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
)

DbSessionDep = Annotated[Session, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]
OptionalUserDep = Annotated[User | None, Depends(get_current_user_optional)]


def get_listing_load_options() -> list:
    """Cấu hình Eager Loading (joinedload / selectinload) để triệt tiêu lỗi truy vấn N+1."""
    return [
        joinedload(Listing.seller),
        joinedload(Listing.category),
        selectinload(Listing.images),
        selectinload(Listing.favorited_by),
    ]


def serialize_listing(
    listing: Listing,
    current_user: User | None = None,
) -> ListingResponse:
    """Chuyển đổi ORM Listing sang ListingResponse kèm trạng thái yêu thích của người dùng hiện tại."""
    favorited_list = listing.favorited_by or []
    favorites_count = len(favorited_list)
    is_favorited = False
    if current_user is not None:
        is_favorited = any(fav.user_id == current_user.id for fav in favorited_list)

    response = ListingResponse.model_validate(listing)
    response.favorites_count = favorites_count
    response.is_favorited = is_favorited
    return response


@router.get(
    "",
    response_model=PaginatedListingResponse,
    status_code=status.HTTP_200_OK,
    summary="Tìm kiếm, lọc và phân trang danh sách tin đăng công khai",
    description=(
        "Tìm kiếm tin đăng theo từ khóa `q` (trong tiêu đề hoặc mô tả), lọc theo danh mục `category_id`, "
        "khoảng giá `min_price` - `max_price`, tình trạng `condition`, người bán `seller_id`, "
        "sắp xếp theo `newest`, `price_asc`, `price_desc` và phân trang. "
        "Sử dụng `joinedload` và `selectinload` để chống lỗi truy vấn N+1."
    ),
)
def list_listings(
    db: DbSessionDep,
    current_user: OptionalUserDep,
    q: Annotated[
        str | None,
        Query(description="Từ khóa tìm kiếm theo tiêu đề hoặc mô tả"),
    ] = None,
    category_id: Annotated[
        int | None,
        Query(description="Lọc theo ID danh mục"),
    ] = None,
    min_price: Annotated[
        float | None,
        Query(ge=0, description="Giá tối thiểu (VNĐ)"),
    ] = None,
    max_price: Annotated[
        float | None,
        Query(ge=0, description="Giá tối đa (VNĐ)"),
    ] = None,
    condition: Annotated[
        ItemCondition | None,
        Query(description="Tình trạng món đồ"),
    ] = None,
    seller_id: Annotated[
        int | None,
        Query(description="Lọc theo ID người bán"),
    ] = None,
    status_filter: Annotated[
        ListingStatus | None,
        Query(
            alias="status",
            description="Lọc theo trạng thái tin đăng (mặc định chỉ hiển thị tin APPROVED trên chợ)",
        ),
    ] = None,
    include_sold: Annotated[
        bool,
        Query(
            description="Nếu True, bao gồm cả các tin đã bán (SOLD) trong danh sách chợ công khai"
        ),
    ] = False,
    sort_by: Annotated[
        str,
        Query(
            description="Tiêu chí sắp xếp: newest (mới nhất), price_asc (giá tăng dần), price_desc (giá giảm dần)"
        ),
    ] = "newest",
    page: Annotated[
        int,
        Query(ge=1, description="Số trang hiện tại (bắt đầu từ 1)"),
    ] = 1,
    page_size: Annotated[
        int,
        Query(ge=1, le=100, description="Số lượng tin trên mỗi trang"),
    ] = 12,
) -> PaginatedListingResponse:
    query = db.query(Listing)

    if status_filter is not None:
        query = query.filter(Listing.status == status_filter.value)
    elif include_sold:
        query = query.filter(
            Listing.status.in_([ListingStatus.APPROVED.value, ListingStatus.SOLD.value])
        )
    else:
        query = query.filter(Listing.status == ListingStatus.APPROVED.value)

    if q and q.strip():
        keyword = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Listing.title.ilike(keyword),
                Listing.description.ilike(keyword),
            )
        )

    if category_id is not None:
        query = query.filter(Listing.category_id == category_id)

    if min_price is not None:
        query = query.filter(Listing.price >= min_price)

    if max_price is not None:
        query = query.filter(Listing.price <= max_price)

    if condition is not None:
        query = query.filter(Listing.condition == condition.value)

    if seller_id is not None:
        query = query.filter(Listing.seller_id == seller_id)

    total = query.count()

    if sort_by == "price_asc":
        query = query.order_by(Listing.price.asc(), Listing.id.desc())
    elif sort_by == "price_desc":
        query = query.order_by(Listing.price.desc(), Listing.id.desc())
    else:
        query = query.order_by(Listing.created_at.desc(), Listing.id.desc())

    offset = (page - 1) * page_size
    listings = (
        query.options(*get_listing_load_options())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1

    return PaginatedListingResponse(
        items=[serialize_listing(item, current_user) for item in listings],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/my",
    response_model=list[ListingResponse],
    status_code=status.HTTP_200_OK,
    summary="Danh sách tin đăng của tôi (Người bán hiện tại)",
    description=(
        "Trả về toàn bộ các tin đăng của người dùng đang đăng nhập ở mọi trạng thái "
        "(`PENDING`, `APPROVED`, `REJECTED`, `SOLD`) để theo dõi kết quả kiểm duyệt và giao dịch."
    ),
)
def get_my_listings(
    db: DbSessionDep,
    current_user: CurrentUserDep,
) -> list[ListingResponse]:
    listings = (
        db.query(Listing)
        .options(*get_listing_load_options())
        .filter(Listing.seller_id == current_user.id)
        .order_by(Listing.created_at.desc(), Listing.id.desc())
        .all()
    )
    return [serialize_listing(item, current_user) for item in listings]


@router.post(
    "",
    response_model=ListingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Đăng tin bán đồ cũ mới (Có kiểm soát giới hạn đăng tin mỗi ngày)",
    description=(
        "Tạo tin đăng bán đồ cũ mới. Tin mới đăng luôn có trạng thái `PENDING` chờ Kiểm duyệt viên phê duyệt. "
        "Tích hợp quy tắc nghiệp vụ nâng cao: Giới hạn số tin đăng tối đa mỗi ngày (`DAILY_LISTING_LIMIT`) "
        "nhằm chống spam trên chợ sinh viên."
    ),
)
def create_listing(
    payload: ListingCreateRequest,
    db: DbSessionDep,
    current_user: CurrentUserDep,
) -> ListingResponse:
    category = db.query(Category).filter(Category.id == payload.category_id).first()
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Danh mục với ID={payload.category_id} không tồn tại.",
        )

    # Kiểm tra quy tắc nghiệp vụ nâng cao: Giới hạn số lượng tin đăng mới trong ngày
    now_utc = datetime.now(UTC).replace(tzinfo=None)
    start_of_day = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    today_listings_count = (
        db.query(func.count(Listing.id))
        .filter(
            Listing.seller_id == current_user.id,
            Listing.created_at >= start_of_day,
        )
        .scalar()
        or 0
    )
    if today_listings_count >= settings.DAILY_LISTING_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Bạn đã đạt giới hạn tối đa {settings.DAILY_LISTING_LIMIT} tin đăng mới trong ngày hôm nay. "
                "Vui lòng quay lại vào ngày mai để tránh spam chợ sinh viên."
            ),
        )

    listing = Listing(
        seller_id=current_user.id,
        category_id=payload.category_id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        price=payload.price,
        condition=payload.condition.value,
        status=ListingStatus.PENDING.value,
        created_at=now_utc,
        updated_at=now_utc,
    )
    db.add(listing)
    db.flush()

    clean_urls = [url.strip() for url in payload.image_urls if url and url.strip()]
    if not clean_urls:
        clean_urls = [DEFAULT_LISTING_IMAGE]

    for idx, img_url in enumerate(clean_urls):
        db.add(
            ListingImage(
                listing_id=listing.id,
                image_url=img_url,
                display_order=idx,
            )
        )

    db.commit()

    created = (
        db.query(Listing)
        .options(*get_listing_load_options())
        .filter(Listing.id == listing.id)
        .first()
    )
    return serialize_listing(created, current_user)


@router.get(
    "/{listing_id}",
    response_model=ListingResponse,
    status_code=status.HTTP_200_OK,
    summary="Xem chi tiết một tin đăng",
    description="Trả về thông tin chi tiết của tin đăng kèm thông tin người bán, danh mục, danh sách ảnh và lượt yêu thích.",
)
def get_listing_detail(
    listing_id: int,
    db: DbSessionDep,
    current_user: OptionalUserDep,
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
    return serialize_listing(listing, current_user)


@router.put(
    "/{listing_id}",
    response_model=ListingResponse,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin tin đăng (Chỉ dành cho chủ tin)",
    description=(
        "Cho phép người bán chỉnh sửa thông tin tin đăng của chính mình khi món đồ chưa bán (`SOLD`). "
        "Trả về `403 Forbidden` nếu không phải chủ tin, và `409 Conflict` nếu tin đã bán."
    ),
)
def update_listing(
    listing_id: int,
    payload: ListingUpdateRequest,
    db: DbSessionDep,
    current_user: CurrentUserDep,
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

    if listing.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không phải chủ sở hữu của tin đăng này nên không có quyền chỉnh sửa.",
        )

    if listing.status == ListingStatus.SOLD.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tin đăng đã được chốt bán (SOLD) nên không thể chỉnh sửa thông tin.",
        )

    if payload.category_id is not None:
        cat = db.query(Category).filter(Category.id == payload.category_id).first()
        if cat is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Danh mục với ID={payload.category_id} không tồn tại.",
            )
        listing.category_id = payload.category_id

    if payload.title is not None:
        listing.title = payload.title.strip()

    if payload.description is not None:
        listing.description = payload.description.strip()

    if payload.price is not None:
        listing.price = payload.price

    if payload.condition is not None:
        listing.condition = payload.condition.value

    if payload.image_urls is not None:
        db.query(ListingImage).filter(ListingImage.listing_id == listing.id).delete()
        clean_urls = [u.strip() for u in payload.image_urls if u and u.strip()]
        if not clean_urls:
            clean_urls = [DEFAULT_LISTING_IMAGE]
        for idx, img_url in enumerate(clean_urls):
            db.add(
                ListingImage(
                    listing_id=listing.id,
                    image_url=img_url,
                    display_order=idx,
                )
            )

    listing.updated_at = datetime.now(UTC).replace(tzinfo=None)
    db.commit()

    updated = (
        db.query(Listing)
        .options(*get_listing_load_options())
        .filter(Listing.id == listing_id)
        .first()
    )
    return serialize_listing(updated, current_user)


@router.delete(
    "/{listing_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa tin đăng (Chủ tin hoặc Kiểm duyệt viên / Quản trị viên)",
    description="Xóa vĩnh viễn tin đăng khỏi hệ thống. Chỉ chủ sở hữu tin hoặc `MODERATOR`/`ADMIN` mới có quyền xóa.",
)
def delete_listing(
    listing_id: int,
    db: DbSessionDep,
    current_user: CurrentUserDep,
) -> Response:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy tin đăng với ID={listing_id}.",
        )

    is_staff = current_user.role in (UserRole.MODERATOR.value, UserRole.ADMIN.value)
    if listing.seller_id != current_user.id and not is_staff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền xóa tin đăng của người dùng khác.",
        )

    db.delete(listing)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{listing_id}/favorite",
    response_model=FavoriteToggleResponse,
    status_code=status.HTTP_200_OK,
    summary="Thêm / Bỏ lưu tin đăng yêu thích (Toggle Favorite N:N)",
    description=(
        "Nếu người dùng chưa lưu tin đăng này thì thêm vào bảng trung gian `favorites` (N:N). "
        "Nếu đã lưu rồi thì xóa khỏi danh sách yêu thích."
    ),
)
def toggle_favorite(
    listing_id: int,
    db: DbSessionDep,
    current_user: CurrentUserDep,
) -> FavoriteToggleResponse:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy tin đăng với ID={listing_id}.",
        )

    existing_fav = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == current_user.id,
            Favorite.listing_id == listing_id,
        )
        .first()
    )

    if existing_fav is not None:
        db.delete(existing_fav)
        is_favorited = False
        message = "Đã bỏ lưu tin đăng khỏi danh sách yêu thích."
    else:
        new_fav = Favorite(
            user_id=current_user.id,
            listing_id=listing_id,
        )
        db.add(new_fav)
        is_favorited = True
        message = "Đã lưu tin đăng vào danh sách yêu thích."

    db.commit()

    favorites_count = (
        db.query(func.count(Favorite.user_id))
        .filter(Favorite.listing_id == listing_id)
        .scalar()
        or 0
    )

    return FavoriteToggleResponse(
        listing_id=listing_id,
        is_favorited=is_favorited,
        favorites_count=favorites_count,
        message=message,
    )
