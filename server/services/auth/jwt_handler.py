from jose import JWTError, jwt
from datetime import datetime, timezone, timedelta
from typing import Any
import os


class JWTConfig:
    SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
    REFRESH_SECRET_KEY = os.getenv("JWT_REFRESH_SECRET_KEY", "your-refresh-secret")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(
        os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "15")
    )
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "15"))


def create_tokens(user_id: str, role: str, mfa_verified: bool) -> tuple[str, str]:
    now = datetime.now(timezone.utc)
    access_payload = {
        "sub": user_id,
        "role": role,
        "mfa_verified": mfa_verified,
        "iat": now,
        "exp": now + timedelta(minutes=JWTConfig.ACCESS_TOKEN_EXPIRE_MINUTES),
    }

    refresh_payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": now,
        "exp": now + timedelta(days=JWTConfig.REFRESH_TOKEN_EXPIRE_DAYS),
    }

    access_token = jwt.encode(
        access_payload, JWTConfig.SECRET_KEY, algorithm=JWTConfig.ALGORITHM
    )
    refresh_token = jwt.encode(
        refresh_payload, JWTConfig.REFRESH_SECRET_KEY, algorithm=JWTConfig.ALGORITHM
    )

    return access_token, refresh_token


def create_challenge_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "type": "mfa_challenge",
        "iat": now,
        "exp": now + timedelta(minutes=10),
    }
    return jwt.encode(payload, JWTConfig.SECRET_KEY, algorithm=JWTConfig.ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, JWTConfig.SECRET_KEY, algorithms=JWTConfig.ALGORITHM)
