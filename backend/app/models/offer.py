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
from app.models.enums import OfferStatus


class Offer(Base):
    """Bảng 6: Đề nghị mua hàng / trả giá của sinh viên mua."""

    __tablename__ = "offers"
    __table_args__ = (
        CheckConstraint("offered_price > 0", name="check_offer_price_positive"),
    )

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(
        Integer,
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    buyer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    offered_price = Column(Float, nullable=False)
    message = Column(Text, nullable=True)
    status = Column(
        String(30),
        nullable=False,
        default=OfferStatus.PENDING.value,
        index=True,
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    listing = relationship("Listing", back_populates="offers")
    buyer = relationship("User", back_populates="offers_made")
