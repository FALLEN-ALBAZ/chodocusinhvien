from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import UserRole


class User(Base):
    """Bảng 2: Thông tin tài khoản người dùng (Sinh viên Mua/Bán, Kiểm duyệt viên, Quản trị viên)."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=True)
    university = Column(String(200), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    role = Column(String(30), nullable=False, default=UserRole.STUDENT.value, index=True)
    reputation_score = Column(Float, nullable=False, default=5.0)
    total_reviews = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Quan hệ 1:N với listings (Người bán)
    listings = relationship(
        "Listing",
        back_populates="seller",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Quan hệ N:N với listings thông qua bảng trung gian favorites
    favorites = relationship(
        "Favorite",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    favorite_listings = relationship(
        "Listing",
        secondary="favorites",
        viewonly=True,
    )

    # Quan hệ 1:N với offers (Người mua trả giá)
    offers_made = relationship(
        "Offer",
        back_populates="buyer",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Quan hệ 1:N với reviews (Đánh giá đã viết & Đánh giá nhận được)
    reviews_written = relationship(
        "Review",
        foreign_keys="Review.reviewer_id",
        back_populates="reviewer",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    reviews_received = relationship(
        "Review",
        foreign_keys="Review.seller_id",
        back_populates="seller",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Quan hệ 1:N với reports (Báo cáo vi phạm đã gửi)
    reports_made = relationship(
        "Report",
        back_populates="reporter",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
