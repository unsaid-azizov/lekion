import uuid
from datetime import datetime

from pydantic import BaseModel


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    patronymic: str | None = None
    profession: str | None = None
    bio: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    city: str | None = None
    country: str | None = None
    phone: str | None = None
    website: str | None = None
    telegram: str | None = None
    whatsapp: str | None = None
    instagram: str | None = None
    is_visible_on_map: bool | None = None


class ProjectOut(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    url: str | None = None
    sort_order: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    title: str
    description: str | None = None
    url: str | None = None
    sort_order: int = 0


class ProjectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    url: str | None = None
    sort_order: int | None = None


class LinkOut(BaseModel):
    id: uuid.UUID
    title: str
    url: str
    sort_order: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class LinkCreate(BaseModel):
    title: str
    url: str
    sort_order: int = 0


class LinkUpdate(BaseModel):
    title: str | None = None
    url: str | None = None
    sort_order: int | None = None


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    patronymic: str | None = None
    profession: str | None = None
    bio: str | None = None
    photo_path: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    city: str | None = None
    country: str | None = None
    phone: str | None = None
    website: str | None = None
    telegram: str | None = None
    whatsapp: str | None = None
    instagram: str | None = None
    status: str
    role: str
    referral_code: str
    is_visible_on_map: bool
    projects: list[ProjectOut] = []
    links: list[LinkOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class UserPublic(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    patronymic: str | None = None
    profession: str | None = None
    bio: str | None = None
    photo_path: str | None = None
    city: str | None = None
    country: str | None = None
    phone: str | None = None
    website: str | None = None
    telegram: str | None = None
    whatsapp: str | None = None
    instagram: str | None = None
    projects: list[ProjectOut] = []
    links: list[LinkOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class ReferralInfo(BaseModel):
    referral_code: str
    invites_used_this_week: int
    invites_remaining: int


class ReferralTreeNode(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    depth: int
