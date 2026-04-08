from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GoogleAuthRequest(BaseModel):
    credential: str
    referral_code: str | None = None


class ReferralCheck(BaseModel):
    valid: bool
    inviter_name: str | None = None
