import hashlib
import hmac
import time

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
from app.schemas.auth import GoogleAuthRequest, ReferralCheck, TelegramAuthRequest, TokenResponse
from app.services.auth_service import check_referral_code, register_google_user, register_telegram_user, register_yandex_user

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


@router.post("/telegram", response_model=TokenResponse)
async def telegram_auth(
    body: TelegramAuthRequest, response: Response, db: AsyncSession = Depends(get_db)
):
    if not settings.telegram_bot_token:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Telegram auth not configured")

    # Verify HMAC-SHA256 signature per Telegram docs:
    # https://core.telegram.org/widgets/login#checking-authorization
    data = body.model_dump(exclude={"hash", "referral_code"}, exclude_none=True)
    data_check_string = "\n".join(f"{k}={data[k]}" for k in sorted(data.keys()))
    secret_key = hashlib.sha256(settings.telegram_bot_token.encode()).digest()
    expected_hash = hmac.new(
        secret_key, data_check_string.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_hash, body.hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Telegram signature")

    # Reject data older than 1 day to prevent replay attacks
    if time.time() - body.auth_date > 86400:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Telegram auth data expired")

    user, access, refresh = await register_telegram_user(
        db, body.id, body.first_name, body.last_name, body.username, body.referral_code
    )
    response.set_cookie(
        "refresh_token", refresh, httponly=True, secure=True, samesite="strict", max_age=30 * 86400
    )
    return TokenResponse(access_token=access)


@router.get("/yandex")
async def yandex_auth_redirect(referral_code: str | None = None):
    """Redirect user to Yandex OAuth page."""
    import urllib.parse
    params = {
        "response_type": "code",
        "client_id": settings.yandex_client_id,
        "redirect_uri": f"{settings.frontend_url}/api/v1/auth/yandex/callback",
    }
    if referral_code:
        params["state"] = referral_code
    url = "https://oauth.yandex.ru/authorize?" + urllib.parse.urlencode(params)
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url)


@router.get("/yandex/callback")
async def yandex_callback(
    code: str,
    state: str | None = None,
    response: Response = None,
    db: AsyncSession = Depends(get_db),
):
    if not settings.yandex_client_id:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Yandex auth not configured")

    # Exchange code for token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth.yandex.ru/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": settings.yandex_client_id,
                "client_secret": settings.yandex_client_secret,
            },
        )
    if token_resp.status_code != 200:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Failed to get Yandex token")

    yandex_token = token_resp.json()["access_token"]

    # Get user info
    async with httpx.AsyncClient() as client:
        info_resp = await client.get(
            "https://login.yandex.ru/info",
            headers={"Authorization": f"OAuth {yandex_token}"},
        )
    if info_resp.status_code != 200:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Failed to get Yandex user info")

    info = info_resp.json()
    yandex_id = str(info["id"])
    email = info.get("default_email") or f"yandex_{yandex_id}@lekion.local"
    first_name = info.get("first_name") or info.get("login", "")
    last_name = info.get("last_name") or ""

    user, access, refresh = await register_yandex_user(db, yandex_id, email, first_name, last_name, state)
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="strict", max_age=30 * 86400)

    from fastapi.responses import RedirectResponse
    redirect = RedirectResponse(url=f"{settings.frontend_url}/auth/callback?token={access}")
    redirect.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="strict", max_age=30 * 86400)
    return redirect


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
