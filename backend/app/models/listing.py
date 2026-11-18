from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import ItemCondition, ListingStatus


class Favorite(Base):
    """Bảng 1: Bảng trung gian quan hệ N:N giữa users và listings (Danh sách tin yêu thích)."""

    __tablename__ = "favorites"

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    listing_id = Column(
        Integer,
        ForeignKey("listings.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="favorites")
    listing = relationship("Listing", back_populates="favorited_by")


class Listing(Base):
    """Bảng 4: Tin đăng bán đồ cũ sinh viên."""

    __tablename__ = "listings"
    __table_args__ = (
        CheckConstraint("price >= 0", name="check_listing_price_non_negative"),
    )

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    condition = Column(
        String(30),
        nullable=False,
        default=ItemCondition.GOOD.value,
    )
    status = Column(
        String(30),
        nullable=False,
        default=ListingStatus.PENDING.value,
        index=True,
    )
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Quan hệ N:1 với User (Người bán) và Category
    seller = relationship("User", back_populates="listings")
    category = relationship("Category", back_populates="listings")

    # Quan hệ 1:N với ListingImage (sắp xếp theo display_order)
    images = relationship(
        "ListingImage",
        back_populates="listing",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ListingImage.display_order",
    )

    # Quan hệ N:N với User qua bảng trung gian favorites
    favorited_by = relationship(
        "Favorite",
        back_populates="listing",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    favorited_by_users = relationship(
        "User",
        secondary="favorites",
        viewonly=True,
    )

    # Quan hệ 1:N với Offer
    offers = relationship(
        "Offer",
        back_populates="listing",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Quan hệ 1:1 với Review (mỗi tin đã bán chỉ có tối đa 1 đánh giá)
    review = relationship(
        "Review",
        back_populates="listing",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Quan hệ 1:N với Report
    reports = relationship(
        "Report",
        back_populates="listing",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class ListingImage(Base):
    """Bảng 5: Hình ảnh minh họa của tin đăng (Quan hệ 1:N với listings)."""

    __tablename__ = "listing_images"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(
        Integer,
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_url = Column(String(500), nullable=False)
    display_order = Column(Integer, nullable=False, default=0)

    listing = relationship("Listing", back_populates="images")
