import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.deps import get_current_user
from app.core.redis import redis_client
from app.core.security import create_access_token, decode_token
from app.database import get_db
from app.models.user import User
from app.schemas.auth import GoogleAuthRequest, ReferralCheck, TokenResponse
from app.services.auth_service import check_referral_code, register_google_user

router = APIRouter()


@router.post("/google", response_model=TokenResponse)
async def google_auth(body: GoogleAuthRequest, response: Response, db: AsyncSession = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": body.credential},
        )
    if resp.status_code != 200:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Google token")

    info = resp.json()
    if info.get("aud") != settings.google_client_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token audience mismatch")

    google_id = info["sub"]
    email = info["email"]
    first_name = info.get("given_name", "")
    last_name = info.get("family_name", "")

    user, access, refresh = await register_google_user(
        db, google_id, email, first_name, last_name, body.referral_code
    )
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="strict", max_age=30 * 86400)
    return TokenResponse(access_token=access)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(refresh_token: str = Cookie(None)):
    if not refresh_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No refresh token")
    try:
        payload = decode_token(refresh_token)
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

    if await redis_client.is_blacklisted(payload["jti"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token revoked")

    access = create_access_token(payload["sub"], payload["role"], payload["status"])
    return TokenResponse(access_token=access)


@router.post("/logout")
async def logout(user: User = Depends(get_current_user)):
    return {"ok": True}


@router.get("/check-referral", response_model=ReferralCheck)
async def check_referral(code: str, db: AsyncSession = Depends(get_db)):
    try:
        inviter = await check_referral_code(db, code)
        return ReferralCheck(valid=True, inviter_name=f"{inviter.first_name} {inviter.last_name}")
    except HTTPException:
        return ReferralCheck(valid=False)
