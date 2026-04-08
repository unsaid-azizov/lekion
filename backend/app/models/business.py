import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, TSVECTOR, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text)
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID, ForeignKey("categories.id"), index=True
    )
    tags: Mapped[list[str]] = mapped_column(ARRAY(String(100)), default=list)

    address: Mapped[str] = mapped_column(String(500))
    city: Mapped[str | None] = mapped_column(String(200))
    country: Mapped[str | None] = mapped_column(String(100))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)

    phone: Mapped[str | None] = mapped_column(String(50))
    website: Mapped[str | None] = mapped_column(String(500))
    email: Mapped[str | None] = mapped_column(String(255))
    telegram: Mapped[str | None] = mapped_column(String(100))
    whatsapp: Mapped[str | None] = mapped_column(String(50))
    working_hours: Mapped[dict | None] = mapped_column(JSONB)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    average_rating: Mapped[float] = mapped_column(Numeric(2, 1), default=0.0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)

    search_vector: Mapped[str | None] = mapped_column(TSVECTOR)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    owner = relationship("User", back_populates="businesses", lazy="selectin")
    category = relationship("Category", lazy="selectin")
    members = relationship("BusinessMember", back_populates="business", lazy="selectin", cascade="all, delete-orphan")
    photos = relationship("BusinessPhoto", back_populates="business", lazy="selectin", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="business", lazy="noload", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_businesses_location", "latitude", "longitude"),
        Index("idx_businesses_search", "search_vector", postgresql_using="gin"),
        Index("idx_businesses_tags", "tags", postgresql_using="gin"),
        Index("idx_businesses_rating", average_rating.desc()),
    )


class BusinessMember(Base):
    __tablename__ = "business_members"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("businesses.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[str] = mapped_column(String(20), default="editor")  # owner | editor
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    business = relationship("Business", back_populates="members")
    user = relationship("User", lazy="selectin")

    __table_args__ = (
        Index("idx_business_members_unique", "business_id", "user_id", unique=True),
    )


class BusinessPhoto(Base):
    __tablename__ = "business_photos"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("businesses.id", ondelete="CASCADE"), index=True
    )
    photo_path: Mapped[str] = mapped_column(String(500))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    business = relationship("Business", back_populates="photos")
