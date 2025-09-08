from enum import Enum

from pydantic import BaseModel, EmailStr


class RoleEnum(str, Enum):
    admin = "admin"
    user = "user"


class RegisterRequest(BaseModel):
    id: str
    username: str
    email: EmailStr
    password: str
    first_name: str | None
    last_name: str | None
    role: RoleEnum = RoleEnum.user
    enable_mfa: bool = False


class UserUpdateRequest(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    role: RoleEnum | None = RoleEnum.user
    enable_mfa: bool = True


class LoginRequest(BaseModel):
    email_or_username: EmailStr | str
    password: str
    mfa_code: str | None = None


class Tokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class LoginResponse(BaseModel):
    requires_mfa: bool
    challenge_token: str | None = None
    tokens: Tokens | None | None


class MFAVerifyRequest(BaseModel):
    otpauth_uri: str
    qr_png_base64: str


class MFARecoveryVerifyRequest(BaseModel):
    recovery_code: str


class MFASetupVerifyResponse(BaseModel):
    enabled: bool
    recovery_codes: list[str]
