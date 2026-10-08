from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserPublic(BaseModel):
    id: int
    campus_id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class MeResponse(UserPublic):
    role_label: str
    permissions: dict[str, bool]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: MeResponse


class OtpChallengeRequest(BaseModel):
    email: EmailStr
    role: str | None = None


class OtpChallengeResponse(BaseModel):
    challenge_id: int
    email: EmailStr
    expires_at: datetime
    message: str
    # Returned only when APP_DEBUG=true so local/frontend testing works without SMS
    debug_otp: str | None = None


class OtpVerifyRequest(BaseModel):
    challenge_id: int
    code: str = Field(min_length=6, max_length=6)


class MessageResponse(BaseModel):
    message: str
