from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_approved
from app.database import get_db
from app.models.business import Business
from app.models.user import User
from app.schemas.map import BusinessPin, MapPinsResponse, PersonPin

router = APIRouter()


@router.get("/pins", response_model=MapPinsResponse)
async def get_pins(
    type: str = Query("all", pattern="^(people|businesses|all)$"),
    south: float = Query(...),
    west: float = Query(...),
    north: float = Query(...),
    east: float = Query(...),
    category_id: str | None = None,
    search: str | None = None,
    _: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    response = MapPinsResponse()

    if type in ("people", "all"):
        query = (
            select(User)
            .where(
                User.status == "approved",
                User.is_visible_on_map.is_(True),
                User.latitude.isnot(None),
                User.latitude.between(south, north),
                User.longitude.between(west, east),
            )
        )
        if search:
            from sqlalchemy import func, or_
            ts = func.plainto_tsquery("russian", search)
            query = query.where(
                or_(User.search_vector.op("@@")(ts), func.similarity(func.concat(User.first_name, " ", User.last_name), search) > 0.3)
            )
        result = await db.execute(query)
        response.people = [
            PersonPin(id=u.id, lat=u.latitude, lng=u.longitude, name=f"{u.first_name} {u.last_name}", profession=u.profession, photo_path=u.photo_path)
            for u in result.scalars()
        ]

    if type in ("businesses", "all"):
        query = (
            select(Business)
            .where(
                Business.is_active.is_(True),
                Business.latitude.between(south, north),
                Business.longitude.between(west, east),
            )
        )
        if category_id:
            query = query.where(Business.category_id == category_id)
        if search:
            from sqlalchemy import func, or_
            ts = func.plainto_tsquery("russian", search)
            query = query.where(
                or_(Business.search_vector.op("@@")(ts), func.similarity(Business.name, search) > 0.3)
            )
        result = await db.execute(query)
        response.businesses = [
            BusinessPin(
                id=b.id, lat=b.latitude, lng=b.longitude, name=b.name,
                category_slug=b.category.slug if b.category else None,
                average_rating=float(b.average_rating),
            )
            for b in result.scalars()
        ]

    return response
