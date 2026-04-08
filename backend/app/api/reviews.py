import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_approved
from app.database import get_db
from app.models.business import Business
from app.models.review import Review
from app.models.user import User
from app.schemas.review import OwnerReply, ReviewCreate, ReviewOut, ReviewUpdate

router = APIRouter()


async def _update_business_rating(db: AsyncSession, business_id: uuid.UUID):
    result = await db.execute(
        select(func.avg(Review.rating), func.count()).where(Review.business_id == business_id)
    )
    avg, count = result.one()
    await db.execute(
        Business.__table__.update()
        .where(Business.id == business_id)
        .values(average_rating=round(avg or 0, 1), review_count=count)
    )


@router.post("/businesses/{business_id}/reviews", response_model=ReviewOut, status_code=201)
async def create_review(
    business_id: uuid.UUID,
    body: ReviewCreate,
    user: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    biz = await db.execute(select(Business).where(Business.id == business_id))
    if not biz.scalar_one_or_none():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Business not found")

    existing = await db.execute(
        select(Review).where(Review.business_id == business_id, Review.author_id == user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Already reviewed")

    review = Review(business_id=business_id, author_id=user.id, **body.model_dump())
    db.add(review)
    await db.flush()
    await _update_business_rating(db, business_id)
    await db.commit()
    await db.refresh(review)
    return review


@router.get("/businesses/{business_id}/reviews", response_model=list[ReviewOut])
async def list_reviews(
    business_id: uuid.UUID,
    page: int = 1,
    per_page: int = 20,
    _: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review)
        .where(Review.business_id == business_id)
        .order_by(Review.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    return list(result.scalars().all())


@router.put("/{review_id}", response_model=ReviewOut)
async def update_review(
    review_id: uuid.UUID,
    body: ReviewUpdate,
    user: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Review not found")
    if review.author_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not the author")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(review, field, value)
    await db.flush()
    await _update_business_rating(db, review.business_id)
    await db.commit()
    await db.refresh(review)
    return review


@router.delete("/{review_id}")
async def delete_review(
    review_id: uuid.UUID,
    user: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Review not found")
    if review.author_id != user.id and user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not the author")

    business_id = review.business_id
    await db.delete(review)
    await db.flush()
    await _update_business_rating(db, business_id)
    await db.commit()
    return {"ok": True}


@router.post("/{review_id}/reply", response_model=ReviewOut)
async def reply_to_review(
    review_id: uuid.UUID,
    body: OwnerReply,
    user: User = Depends(require_approved),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Review not found")

    biz_result = await db.execute(select(Business).where(Business.id == review.business_id))
    biz = biz_result.scalar_one()
    if biz.owner_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not the business owner")

    review.owner_reply = body.text
    review.owner_reply_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(review)
    return review
