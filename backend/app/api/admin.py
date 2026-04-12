import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import is_superuser, require_admin
from app.services.telegram_bot import announce_new_member, notify_user_approved
from app.database import get_db
from app.models.business import Business
from app.models.review import Review
from app.models.user import User
from app.schemas.user import UserOut

router = APIRouter()


class RejectRequest(BaseModel):
    reason: str | None = None


class RoleRequest(BaseModel):
    role: str


@router.get("/users/pending", response_model=list[UserOut])
async def pending_users(
    page: int = 1,
    per_page: int = 20,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .where(User.status == "pending")
        .order_by(User.created_at.asc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    return list(result.scalars().all())


@router.post("/users/{user_id}/approve", response_model=UserOut)
async def approve_user(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    user.status = "approved"
    await db.commit()
    await db.refresh(user)
    await notify_user_approved(user)
    await announce_new_member(user)
    return user


@router.post("/users/{user_id}/reject")
async def reject_user(
    user_id: uuid.UUID,
    body: RejectRequest,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if await is_superuser(user_id, db):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot modify superuser")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    user.status = "rejected"
    await db.commit()
    return {"ok": True}


@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if await is_superuser(user_id, db):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot modify superuser")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    user.status = "banned"
    await db.commit()
    return {"ok": True}


@router.put("/users/{user_id}/role", response_model=UserOut)
async def change_role(
    user_id: uuid.UUID,
    body: RoleRequest,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if await is_superuser(user_id, db):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot modify superuser")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    user.role = body.role
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/users", response_model=list[UserOut])
async def list_all_users(
    status_filter: str | None = None,
    q: str | None = None,
    page: int = 1,
    per_page: int = 20,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).order_by(User.created_at.desc())
    if status_filter:
        query = query.where(User.status == status_filter)
    if q:
        query = query.where(
            func.concat(User.first_name, " ", User.last_name).ilike(f"%{q}%")
        )
    result = await db.execute(query.offset((page - 1) * per_page).limit(per_page))
    return list(result.scalars().all())


@router.delete("/businesses/{business_id}")
async def admin_delete_business(
    business_id: uuid.UUID,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == business_id))
    biz = result.scalar_one_or_none()
    if not biz:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Business not found")
    await db.delete(biz)
    await db.commit()
    return {"ok": True}


@router.delete("/reviews/{review_id}")
async def admin_delete_review(
    review_id: uuid.UUID,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Review not found")
    await db.delete(review)
    await db.commit()
    return {"ok": True}


@router.get("/superuser")
async def get_superuser_id(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User.id).order_by(User.created_at.asc()).limit(1)
    )
    return {"user_id": result.scalar_one_or_none()}


@router.get("/stats")
async def admin_stats(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    users_by_status = {}
    for s in ("pending", "approved", "rejected", "banned"):
        result = await db.execute(select(func.count()).select_from(User).where(User.status == s))
        users_by_status[s] = result.scalar()

    biz_result = await db.execute(select(func.count()).select_from(Business).where(Business.is_active.is_(True)))
    review_result = await db.execute(select(func.count()).select_from(Review))

    return {
        "users": users_by_status,
        "businesses": biz_result.scalar(),
        "reviews": review_result.scalar(),
    }
