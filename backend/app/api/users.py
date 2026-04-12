import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.deps import get_current_user, require_approved
from app.database import get_db
from app.models.link import UserLink
from app.models.project import Project
from app.models.referral import ReferralInvite
from app.models.user import User
from app.schemas.user import LinkCreate, LinkOut, LinkUpdate, ProjectCreate, ProjectOut, ProjectUpdate, ReferralInfo, ReferralTreeNode, UserOut, UserPublic, UserUpdate
from app.services.search_service import apply_user_search, paginate
from app.services.telegram_bot import notify_admin_new_application
from app.utils.images import delete_image, save_image

router = APIRouter()


@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserOut)
async def update_me(
    body: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    was_pending = user.status == "pending"
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    # When a pending user submits their profile, enforce all required fields
    if was_pending and (user.profession or user.bio or user.city):
        missing = []
        if not (user.first_name or "").strip():
            missing.append("first_name")
        if not (user.last_name or "").strip():
            missing.append("last_name")
        if not (user.profession or "").strip():
            missing.append("profession")
        if not (user.bio or "").strip():
            missing.append("bio")
        if not (user.city or "").strip():
            missing.append("city")
        if not (user.phone or "").strip() and not (user.telegram or "").strip():
            missing.append("phone or telegram")
        if not user.photo_path:
            missing.append("photo")
        if missing:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                f"Required fields missing: {', '.join(missing)}",
            )

    await db.commit()
    await db.refresh(user)
    # Notify admin when a pending user completes their profile
    if was_pending and user.profession and user.bio and user.city:
        await notify_admin_new_application(user, db)
    return user


@router.post("/me/photo", response_model=UserOut)
async def upload_avatar(
    file: UploadFile,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await file.read()
    if len(data) > settings.max_avatar_size:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File too large")

    if user.photo_path:
        delete_image(user.photo_path)

    user.photo_path = save_image(data, f"avatars/{user.id}", (400, 400))
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/me/photo")
async def delete_avatar(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.photo_path:
        delete_image(user.photo_path)
        user.photo_path = None
        await db.commit()
    return {"ok": True}


@router.get("/{user_id}", response_model=UserPublic)
async def get_user(
    user_id: uuid.UUID,
    _: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id, User.status == "approved"))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user


@router.get("", response_model=dict)
async def search_users(
    q: str | None = None,
    profession: str | None = None,
    city: str | None = None,
    country: str | None = None,
    page: int = 1,
    per_page: int = 20,
    _: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    query = apply_user_search(select(User), q, profession, city, country)
    count_query = apply_user_search(select(func.count()).select_from(User), q, profession, city, country, for_count=True)
    result = await paginate(db, query, count_query, page, per_page)
    result["items"] = [UserPublic.model_validate(u) for u in result["items"]]
    return result


@router.post("/me/projects", response_model=ProjectOut)
async def create_project(
    body: ProjectCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = Project(user_id=user.id, **body.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.put("/me/projects/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_id == user.id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.commit()
    await db.refresh(project)
    return project


@router.delete("/me/projects/{project_id}")
async def delete_project(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_id == user.id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    await db.delete(project)
    await db.commit()
    return {"ok": True}


@router.post("/me/links", response_model=LinkOut)
async def create_link(
    body: LinkCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    link = UserLink(user_id=user.id, **body.model_dump())
    db.add(link)
    await db.commit()
    await db.refresh(link)
    return link


@router.put("/me/links/{link_id}", response_model=LinkOut)
async def update_link(
    link_id: uuid.UUID,
    body: LinkUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserLink).where(UserLink.id == link_id, UserLink.user_id == user.id))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Link not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(link, field, value)
    await db.commit()
    await db.refresh(link)
    return link


@router.delete("/me/links/{link_id}")
async def delete_link(
    link_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserLink).where(UserLink.id == link_id, UserLink.user_id == user.id))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Link not found")
    await db.delete(link)
    await db.commit()
    return {"ok": True}


@router.get("/me/referral", response_model=ReferralInfo)
async def get_referral_info(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.referral_window_days)
    result = await db.execute(
        select(func.count())
        .select_from(ReferralInvite)
        .where(ReferralInvite.inviter_id == user.id, ReferralInvite.created_at > cutoff)
    )
    used = result.scalar()
    return ReferralInfo(
        referral_code=user.referral_code,
        invites_used_this_week=used,
        invites_remaining=max(0, settings.referral_limit - used),
    )
