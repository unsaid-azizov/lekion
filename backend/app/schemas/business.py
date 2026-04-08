import uuid
from datetime import datetime

from pydantic import BaseModel


class BusinessCreate(BaseModel):
    name: str
    description: str | None = None
    category_id: uuid.UUID | None = None
    tags: list[str] = []
    address: str
    city: str | None = None
    country: str | None = None
    latitude: float
    longitude: float
    phone: str | None = None
    website: str | None = None
    email: str | None = None
    telegram: str | None = None
    whatsapp: str | None = None
    working_hours: dict | None = None


class BusinessUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category_id: uuid.UUID | None = None
    tags: list[str] | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    phone: str | None = None
    website: str | None = None
    email: str | None = None
    telegram: str | None = None
    whatsapp: str | None = None
    working_hours: dict | None = None


class PhotoOut(BaseModel):
    id: uuid.UUID
    photo_path: str
    sort_order: int

    model_config = {"from_attributes": True}


class CategoryOut(BaseModel):
    id: uuid.UUID
    slug: str
    name_ru: str
    icon: str | None = None

    model_config = {"from_attributes": True}


class MemberOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    role: str
    first_name: str = ""
    last_name: str = ""
    photo_path: str | None = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_member(cls, member):
        return cls(
            id=member.id,
            user_id=member.user_id,
            role=member.role,
            first_name=member.user.first_name if member.user else "",
            last_name=member.user.last_name if member.user else "",
            photo_path=member.user.photo_path if member.user else None,
        )


class AddMember(BaseModel):
    user_id: uuid.UUID
    role: str = "editor"


class BusinessOut(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: str | None = None
    category: CategoryOut | None = None
    tags: list[str]
    address: str
    city: str | None = None
    country: str | None = None
    latitude: float
    longitude: float
    phone: str | None = None
    website: str | None = None
    email: str | None = None
    telegram: str | None = None
    whatsapp: str | None = None
    working_hours: dict | None = None
    is_active: bool
    average_rating: float
    review_count: int
    photos: list[PhotoOut] = []
    members: list[MemberOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}
