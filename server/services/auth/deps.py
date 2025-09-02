from fastapi import Depends, HTTPException, status, Cookie, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from db.connection import get_db_conn
from models.users import User
from .jwt_handler import decode_access_token
from models.schemas.crud_schemas import UserOut

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    request: Request,
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db_conn),
) -> UserOut:
    try:
        print("Begin", access_token)
        if access_token:
            payload = decode_access_token(access_token)

        elif request.cookies.get("access_token"):
            access_token = request.cookies.get("access_token")
            print("Sec", access_token)
            payload = decode_access_token(access_token)

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
    return UserOut.model_validate(user)


# def require_mfa_verified(
#     user: User = Depends(get_current_user), token: str = Depends(oauth2_scheme)
# ) -> User:
#     payload = decode_token(token)
#     if not payload.get("mfa_verified") and user.mfa_enabled:
#         raise HTTPException(status_code=403, detail="MFA required")
#     return user
