from typing import Annotated, Any

from fastapi import HTTPException, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from models.schemas.auth_schemas import LoginRequest, RegisterRequest
from models.users import User
from services.auth.jwt_handler import (
    create_tokens,
    set_jwt_cookies,
    verify_refresh_token,
)
from services.auth.utils import qr_png_data_url
from dotenv import load_dotenv
import os

is_prod = os.getenv("PROD_ENV", "false").lower() == "true"

load_dotenv()


def register_user(
    reg_user: RegisterRequest, db: Session, response: Response
) -> dict[str, Any]:
    existing_user = db.scalar(
        select(User).where(
            or_(User.username == reg_user.username, User.email == reg_user.email)
        )
    )
    if existing_user:
        if existing_user.username == reg_user.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    try:
        new_user = User(
            username=reg_user.username,
            email=reg_user.email,
            first_name=reg_user.first_name,
            last_name=reg_user.last_name,
            role=reg_user.role,
        )
        new_user.set_password(reg_user.password)
        if reg_user.enable_mfa:
            recovery_codes = new_user.enable_mfa()
            mfa_uri = new_user.get_mfa_uri()
            qr_code_url = qr_png_data_url(mfa_uri)
        else:
            recovery_codes = None
            mfa_uri = None
            qr_code_url = None

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        access, refresh = create_tokens(
            new_user.id, role=new_user.role, mfa_verified=False
        )

        set_jwt_cookies(response=response, access_token=access, refresh_token=refresh)

        return {
            "user": new_user.to_dict_safe(),
            "mfa_uri": mfa_uri,
            "qr_code": qr_code_url,
            "recovery_codes": recovery_codes,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration Failed {str(e)}",
        )


def login_user(
    log_user: LoginRequest, db: Session, response: Response
) -> dict[str, Any]:
    user = db.scalar(
        select(User).where(
            or_(
                User.username == log_user.email_or_username,
                User.email == log_user.email_or_username,
            )
        )
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not exists.",
        )
    if not user.verify_password(log_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account disabled"
        )

    if user.mfa_enabled:
        if not log_user.mfa_code:
            raise HTTPException(status_code=400, detail="MFA code required")
        if not user.verify_mfa_code(log_user.mfa_code):
            raise HTTPException(status_code=401, detail="Invalid MFA code")

    mfa_verified = user.mfa_enabled
    access, refresh = create_tokens(
        user_id=user.id, role=user.role, mfa_verified=mfa_verified
    )
    set_jwt_cookies(response=response, access_token=access, refresh_token=refresh)

    return user.to_dict_safe()


def refresh_access_token(
    refresh_token: Annotated[str, "refresh token"],
    db: Annotated[Session, "Getting db connectoion"],
    response: Annotated[Response, ""],
):
    payload = verify_refresh_token(token=refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or Expired Refresh Token",
        )
    user_id = payload.get("sub")
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    access, refresh = create_tokens(
        user_id=user.id, role=user.role, mfa_verified=user.mfa_enabled
    )

    set_jwt_cookies(response=response, access_token=access, refresh_token=refresh)

    return {
        "msg": "Token Refreshed successfully",
        "user": user.to_dict_safe(),
    }


def clear_jwt_cookies(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=not is_prod,
        samesite="lax" if is_prod else "none",
        path="/",
    )
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=not is_prod,
        samesite="lax" if is_prod else "none",
        path="/",
    )
