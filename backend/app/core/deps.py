import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import redis_client
from app.core.security import decode_token
from app.database import get_db
from app.models.user import User

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    if await redis_client.is_blacklisted(payload["jti"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token revoked")

    user_id = uuid.UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


async def require_approved(user: User = Depends(get_current_user)) -> User:
    if user.status != "approved":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account not approved")
    return user


async def require_member(user: User = Depends(get_current_user)) -> User:
    """Allow any registered user except banned."""
    if user.status == "banned":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account banned")
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return user


async def is_superuser(user_id: uuid.UUID, db: AsyncSession) -> bool:
    """First registered user is the superuser."""
    result = await db.execute(
        select(User.id).order_by(User.created_at.asc()).limit(1)
    )
    first_id = result.scalar_one_or_none()
    return first_id == user_id
