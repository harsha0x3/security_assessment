from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from db.connection import get_db_conn
from models.users import User
from auth.jwt_handler import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db_conn)
) -> User:
    try:
        payload = decode_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Token"
        )
    user = db.query(User).get(payload.get("sub"))

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user"
        )
    return user


def require_mfa_verified(
    user: User = Depends(get_current_user), token: str = Depends(oauth2_scheme)
) -> User:
    payload = decode_token(token)
    if not payload.get("mfa_verified") and user.mfa_enabled:
        raise HTTPException(status_code=403, detail="MFA required")
    return user
