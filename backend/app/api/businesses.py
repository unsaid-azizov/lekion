import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.deps import require_approved
from app.database import get_db
from app.models.business import Business, BusinessMember, BusinessPhoto
from app.models.user import User
from app.schemas.business import (
    AddMember,
    BusinessCreate,
    BusinessOut,
    BusinessUpdate,
    MemberOut,
    PhotoOut,
)
from app.services.search_service import apply_business_search, paginate
from app.services.telegram_bot import notify_new_business
from app.utils.images import delete_image, save_image

router = APIRouter()


def _serialize_business(biz: Business) -> BusinessOut:
    data = BusinessOut.model_validate(biz)
    data.members = [MemberOut.from_member(m) for m in biz.members]
    return data


async def _check_member(db: AsyncSession, biz: Business, user: User) -> bool:
    """Check if user is owner or a member of the business."""
    if biz.owner_id == user.id or user.role == "admin":
        return True
    return any(m.user_id == user.id for m in biz.members)


async def _check_owner(db: AsyncSession, biz: Business, user: User) -> bool:
    """Check if user is the original owner or a member with 'owner' role."""
    if biz.owner_id == user.id or user.role == "admin":
        return True
    return any(m.user_id == user.id and m.role == "owner" for m in biz.members)


@router.post("", response_model=BusinessOut, status_code=201)
async def create_business(
    body: BusinessCreate,
    user: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    biz = Business(**body.model_dump(), owner_id=user.id)
    db.add(biz)
    await db.commit()
    await db.refresh(biz)
    await notify_new_business(biz, user, db)
    return _serialize_business(biz)


@router.get("", response_model=dict)
async def search_businesses(
    q: str | None = None,
    category_id: uuid.UUID | None = None,
    city: str | None = None,
    country: str | None = None,
    tags: str | None = None,
    min_rating: float | None = None,
    owner_id: uuid.UUID | None = None,
    page: int = 1,
    per_page: int = 20,
    _: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    tag_list = tags.split(",") if tags else None
    query = apply_business_search(select(Business), q, str(category_id) if category_id else None, city, country, tag_list, min_rating)
    count_query = apply_business_search(
        select(func.count()).select_from(Business), q, str(category_id) if category_id else None, city, country, tag_list, min_rating, for_count=True
    )

    if owner_id:
        # Show businesses where user is owner OR member
        member_biz_ids = select(BusinessMember.business_id).where(BusinessMember.user_id == owner_id)
        ownership_filter = (Business.owner_id == owner_id) | (Business.id.in_(member_biz_ids))
        query = query.where(ownership_filter)
        count_query = count_query.where(ownership_filter)

    result = await paginate(db, query, count_query, page, per_page)
    result["items"] = [_serialize_business(b) for b in result["items"]]
    return result


@router.get("/{business_id}", response_model=BusinessOut)
async def get_business(
    business_id: uuid.UUID,
    _: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == business_id))
    biz = result.scalar_one_or_none()
    if not biz:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Business not found")
    return _serialize_business(biz)


@router.put("/{business_id}", response_model=BusinessOut)
async def update_business(
    business_id: uuid.UUID,
    body: BusinessUpdate,
    user: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == business_id))
    biz = result.scalar_one_or_none()
    if not biz:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Business not found")
    if not await _check_member(db, biz, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(biz, field, value)
    await db.commit()
    await db.refresh(biz)
    return _serialize_business(biz)


@router.delete("/{business_id}")
async def delete_business(
    business_id: uuid.UUID,
    user: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == business_id))
    biz = result.scalar_one_or_none()
    if not biz:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Business not found")
    if not await _check_owner(db, biz, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not the owner")

    biz.is_active = False
    await db.commit()
    return {"ok": True}


# ─── Members ───


@router.get("/{business_id}/members", response_model=list[MemberOut])
async def list_members(
    business_id: uuid.UUID,
    _: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == business_id))
    biz = result.scalar_one_or_none()
    if not biz:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Business not found")
    return [MemberOut.from_member(m) for m in biz.members]


@router.post("/{business_id}/members", response_model=MemberOut, status_code=201)
async def add_member(
    business_id: uuid.UUID,
    body: AddMember,
    user: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == business_id))
    biz = result.scalar_one_or_none()
    if not biz:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Business not found")
    if not await _check_owner(db, biz, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only owners can add members")

    # Check target user exists
    target = await db.execute(select(User).where(User.id == body.user_id))
    if not target.scalar_one_or_none():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    # Check not already a member
    existing = await db.execute(
        select(BusinessMember).where(
            BusinessMember.business_id == business_id,
            BusinessMember.user_id == body.user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Already a member")

    if body.role not in ("owner", "editor"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Role must be 'owner' or 'editor'")

    member = BusinessMember(business_id=business_id, user_id=body.user_id, role=body.role)
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return MemberOut.from_member(member)


@router.delete("/{business_id}/members/{member_id}")
async def remove_member(
    business_id: uuid.UUID,
    member_id: uuid.UUID,
    user: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == business_id))
    biz = result.scalar_one_or_none()
    if not biz:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Business not found")
    if not await _check_owner(db, biz, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only owners can remove members")

    member = await db.execute(
        select(BusinessMember).where(
            BusinessMember.id == member_id,
            BusinessMember.business_id == business_id,
        )
    )
    member = member.scalar_one_or_none()
    if not member:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found")

    await db.delete(member)
    await db.commit()
    return {"ok": True}


# ─── Photos ───


@router.post("/{business_id}/photos", response_model=list[PhotoOut])
async def upload_photos(
    business_id: uuid.UUID,
    files: list[UploadFile],
    user: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == business_id))
    biz = result.scalar_one_or_none()
    if not biz or not await _check_member(db, biz, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member")

    if len(biz.photos) + len(files) > 10:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Max 10 photos per business")

    new_photos = []
    for i, file in enumerate(files):
        data = await file.read()
        if len(data) > settings.max_photo_size:
            raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"File {file.filename} too large")
        path = save_image(data, f"businesses/{business_id}", (1200, 900))
        photo = BusinessPhoto(business_id=business_id, photo_path=path, sort_order=len(biz.photos) + i)
        db.add(photo)
        new_photos.append(photo)

    await db.commit()
    return new_photos


@router.delete("/{business_id}/photos/{photo_id}")
async def delete_photo(
    business_id: uuid.UUID,
    photo_id: uuid.UUID,
    user: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BusinessPhoto).where(BusinessPhoto.id == photo_id, BusinessPhoto.business_id == business_id)
    )
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Photo not found")

    biz_result = await db.execute(select(Business).where(Business.id == business_id))
    biz = biz_result.scalar_one()
    if not await _check_member(db, biz, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member")

    delete_image(photo.photo_path)
    await db.delete(photo)
    await db.commit()
    return {"ok": True}
