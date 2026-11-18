from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import ReportStatus


class Report(Base):
    """Bảng 8: Báo cáo tin đăng vi phạm quy định cộng đồng."""

    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(
        Integer,
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reporter_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reason = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(
        String(30),
        nullable=False,
        default=ReportStatus.PENDING.value,
        index=True,
    )
    moderator_note = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    listing = relationship("Listing", back_populates="reports")
    reporter = relationship("User", back_populates="reports_made")
