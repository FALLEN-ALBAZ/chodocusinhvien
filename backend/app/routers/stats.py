from typing import Annotated, Any

from fastapi import APIRouter, Depends, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.category import Category
from app.models.enums import ListingStatus, OfferStatus, ReportStatus, UserRole
from app.models.listing import Listing
from app.models.offer import Offer
from app.models.report import Report
from app.models.review import Review
from app.models.user import User

router = APIRouter(prefix="/api/v1/stats", tags=["10. Thống kê Hệ thống (Statistics)"])


@router.get(
    "/overview",
    status_code=status.HTTP_200_OK,
    summary="Số liệu thống kê tổng quan của Chợ Đồ Cũ Sinh Viên",
    description=(
        "Trả về các chỉ số tổng hợp theo thời gian thực: tổng số sinh viên, tổng số danh mục, "
        "số lượng tin theo từng trạng thái (`APPROVED`, `PENDING`, `SOLD`, `REJECTED`), "
        "số lượng đề nghị mua, đánh giá uy tín, báo cáo vi phạm và phân bố tin theo từng danh mục."
    ),
)
def get_system_overview_stats(
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, Any]:
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_students = (
        db.query(func.count(User.id))
        .filter(User.role == UserRole.STUDENT.value)
        .scalar()
        or 0
    )
    total_categories = db.query(func.count(Category.id)).scalar() or 0

    total_listings = db.query(func.count(Listing.id)).scalar() or 0
    approved_listings = (
        db.query(func.count(Listing.id))
        .filter(Listing.status == ListingStatus.APPROVED.value)
        .scalar()
        or 0
    )
    pending_listings = (
        db.query(func.count(Listing.id))
        .filter(Listing.status == ListingStatus.PENDING.value)
        .scalar()
        or 0
    )
    sold_listings = (
        db.query(func.count(Listing.id))
        .filter(Listing.status == ListingStatus.SOLD.value)
        .scalar()
        or 0
    )
    rejected_listings = (
        db.query(func.count(Listing.id))
        .filter(Listing.status == ListingStatus.REJECTED.value)
        .scalar()
        or 0
    )

    total_offers = db.query(func.count(Offer.id)).scalar() or 0
    accepted_offers = (
        db.query(func.count(Offer.id))
        .filter(Offer.status == OfferStatus.ACCEPTED.value)
        .scalar()
        or 0
    )

    total_reviews = db.query(func.count(Review.id)).scalar() or 0

    total_reports = db.query(func.count(Report.id)).scalar() or 0
    pending_reports = (
        db.query(func.count(Report.id))
        .filter(Report.status == ReportStatus.PENDING.value)
        .scalar()
        or 0
    )

    category_rows = (
        db.query(
            Category.id,
            Category.name,
            Category.slug,
            Category.icon,
            func.count(Listing.id).label("listing_count"),
        )
        .outerjoin(Listing, Listing.category_id == Category.id)
        .group_by(Category.id, Category.name, Category.slug, Category.icon)
        .order_by(Category.id.asc())
        .all()
    )

    listings_by_category = [
        {
            "category_id": row.id,
            "category_name": row.name,
            "slug": row.slug,
            "icon": row.icon,
            "count": int(row.listing_count or 0),
        }
        for row in category_rows
    ]

    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_categories": total_categories,
        "total_listings": total_listings,
        "approved_listings": approved_listings,
        "pending_listings": pending_listings,
        "sold_listings": sold_listings,
        "rejected_listings": rejected_listings,
        "total_offers": total_offers,
        "accepted_offers": accepted_offers,
        "total_reviews": total_reviews,
        "total_reports": total_reports,
        "pending_reports": pending_reports,
        "listings_by_category": listings_by_category,
    }
