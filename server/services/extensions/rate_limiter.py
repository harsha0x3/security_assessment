# services/extensions/rate_limiter.py

from slowapi import Limiter
from slowapi.util import get_remote_address
from jose import jwt
from typing import Optional

from services.auth.jwt_handler import decode_access_token


def user_or_ip_key(request) -> str:
    """
    Identify a unique user for rate limiting.
    - If user is authenticated (via access_token cookie), use user_id from JWT.
    - Otherwise, fall back to client IP.
    """

    # Try to read token from Cookie or Authorization header
    token: str | None = None

    if "access_token" in request.cookies:
        token = request.cookies.get("access_token")

    # Try to decode user_id from JWT
    if token:
        try:
            payload = decode_access_token(token)
            user_id = payload.get("sub")
            if user_id:
                return f"user:{user_id}"
        except Exception:
            pass

    # Fallback for unauthenticated users
    return f"ip:{get_remote_address(request)}"


limiter = Limiter(
    key_func=user_or_ip_key,
    default_limits=["100/minute"],
)
