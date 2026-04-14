import uuid

from pydantic import BaseModel


class PersonPin(BaseModel):
    id: uuid.UUID
    lat: float
    lng: float
    name: str
    profession: str | None = None
    photo_path: str | None = None
    precise: bool = False


class BusinessPin(BaseModel):
    id: uuid.UUID
    lat: float
    lng: float
    name: str
    category_slug: str | None = None
    average_rating: float = 0.0


class MapPinsResponse(BaseModel):
    people: list[PersonPin] = []
    businesses: list[BusinessPin] = []


class Paginated(BaseModel):
    items: list
    total: int
    page: int
    per_page: int
    pages: int
