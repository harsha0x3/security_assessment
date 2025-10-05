from fastapi import Cookie, Depends, HTTPException, Request, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from db.connection import get_db_conn
from models.schemas.crud_schemas import UserOut
from models.core.users import User

from .jwt_handler import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    request: Request,
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db_conn),
    csrf_token: str | None = Cookie(default=None, alias="csrf_token"),
    csrf_header: str | None = Header(default=None, alias="X-CSRF-Token"),
) -> UserOut:
    try:
        if access_token:
            payload = decode_access_token(access_token)

        elif request.cookies.get("access_token"):
            access_token = request.cookies.get("access_token")
            payload = decode_access_token(access_token)  # type: ignore

        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="No access token"
            )

    except Exception as e:
        print(f"ERROR IN current User {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Token"
        )
    user_id = payload.get("sub")
    user = db.get(User, user_id)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user"
        )

    # 🔒 CSRF check (for unsafe methods only)
    if request.method not in ("GET", "HEAD", "OPTIONS", "TRACE"):
        if not csrf_token:
            csrf_token = request.cookies.get("csrf_token")
            print("INSIDE NOT FOUND CSRF")
        if not csrf_token:
            print(" NOPE NOT FOUND INSIDE NOT FOUND CSRF")

        if not csrf_header:
            print("INSIDE NOT FOUND CSRF HEADER")
            csrf_header = request.headers.get("X-CSRF-Token")

        if not csrf_header:
            print(" NOPE NOT FOUND INSIDE NOT FOUND CSRF HEADER")

        if not csrf_token or not csrf_header or csrf_token != csrf_header:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token missing or invalid",
            )

    return UserOut.model_validate(user)


# def require_mfa_verified(
#     user: User = Depends(get_current_user), token: str = Depends(oauth2_scheme)
# ) -> User:
#     payload = decode_token(token)
#     if not payload.get("mfa_verified") and user.mfa_enabled:
#         raise HTTPException(status_code=403, detail="MFA required")
#     return user
