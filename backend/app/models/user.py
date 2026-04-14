import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Float, Index, String, Text, func
from sqlalchemy.dialects.postgresql import TSVECTOR, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    yandex_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    telegram_id: Mapped[int | None] = mapped_column(BigInteger, unique=True)

    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    patronymic: Mapped[str | None] = mapped_column(String(100))
    profession: Mapped[str | None] = mapped_column(String(200))
    bio: Mapped[str | None] = mapped_column(Text)
    photo_path: Mapped[str | None] = mapped_column(String(500))

    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    location_precision: Mapped[str] = mapped_column(String(20), default="city")
    city: Mapped[str | None] = mapped_column(String(200))
    country: Mapped[str | None] = mapped_column(String(100))

    phone: Mapped[str | None] = mapped_column(String(50))
    website: Mapped[str | None] = mapped_column(String(500))
    telegram: Mapped[str | None] = mapped_column(String(100))
    whatsapp: Mapped[str | None] = mapped_column(String(50))
    instagram: Mapped[str | None] = mapped_column(String(100))

    status: Mapped[str] = mapped_column(String(20), default="incomplete", index=True)
    role: Mapped[str] = mapped_column(String(20), default="user")
    referred_by: Mapped[uuid.UUID | None] = mapped_column(UUID, index=True)
    referral_code: Mapped[str] = mapped_column(String(20), unique=True)
    is_visible_on_map: Mapped[bool] = mapped_column(Boolean, default=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    search_vector: Mapped[str | None] = mapped_column(TSVECTOR)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    businesses = relationship("Business", back_populates="owner", lazy="selectin")
    projects = relationship("Project", back_populates="user", lazy="selectin", order_by="Project.sort_order")
    links = relationship("UserLink", back_populates="user", lazy="selectin", order_by="UserLink.sort_order")

    __table_args__ = (
        Index("idx_users_location", "latitude", "longitude"),
        Index("idx_users_search", "search_vector", postgresql_using="gin"),
    )
