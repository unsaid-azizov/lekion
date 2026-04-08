import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import create_access_token, create_refresh_token
from app.models.referral import ReferralInvite
from app.models.user import User


def generate_referral_code() -> str:
    return secrets.token_urlsafe(6)[:8].upper()


async def check_referral_code(db: AsyncSession, code: str) -> User:
    result = await db.execute(select(User).where(User.referral_code == code))
    inviter = result.scalar_one_or_none()
    if not inviter or inviter.status != "approved":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid referral code")

    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.referral_window_days)
    count_result = await db.execute(
        select(func.count())
        .select_from(ReferralInvite)
        .where(ReferralInvite.inviter_id == inviter.id, ReferralInvite.created_at > cutoff)
    )
    if count_result.scalar() >= settings.referral_limit:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Referral limit reached")

    return inviter


async def register_google_user(
    db: AsyncSession, google_id: str, email: str, first_name: str, last_name: str, referral_code: str | None
) -> tuple[User, str, str]:
    existing = await db.execute(select(User).where(User.google_id == google_id))
    user = existing.scalar_one_or_none()
    if user:
        access = create_access_token(user.id, user.role, user.status)
        refresh = create_refresh_token(user.id, user.role, user.status)
        return user, access, refresh

    existing_email = await db.execute(select(User).where(User.email == email))
    user = existing_email.scalar_one_or_none()
    if user:
        user.google_id = google_id
        user.email_verified = True
        await db.commit()
        await db.refresh(user)
        access = create_access_token(user.id, user.role, user.status)
        refresh = create_refresh_token(user.id, user.role, user.status)
        return user, access, refresh

    inviter = None
    if referral_code:
        inviter = await check_referral_code(db, referral_code)

    # First user becomes superuser (admin + approved)
    user_count = await db.execute(select(func.count()).select_from(User))
    is_first = user_count.scalar() == 0

    user = User(
        email=email,
        google_id=google_id,
        first_name=first_name,
        last_name=last_name,
        referral_code=generate_referral_code(),
        referred_by=inviter.id if inviter else None,
        email_verified=True,
        role="admin" if is_first else "user",
        status="approved" if is_first else "pending",
    )
    db.add(user)

    if inviter:
        invite = ReferralInvite(inviter_id=inviter.id, invited_email=email, used_by=user.id, used_at=func.now())
        db.add(invite)

    await db.flush()
    access = create_access_token(user.id, user.role, user.status)
    refresh = create_refresh_token(user.id, user.role, user.status)
    await db.commit()
    return user, access, refresh
