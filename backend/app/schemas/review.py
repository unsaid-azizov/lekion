import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


class ReviewUpdate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


class OwnerReply(BaseModel):
    text: str


class ReviewAuthor(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    photo_path: str | None = None

    model_config = {"from_attributes": True}


class ReviewOut(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    author: ReviewAuthor
    rating: int
    comment: str | None = None
    owner_reply: str | None = None
    owner_reply_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
