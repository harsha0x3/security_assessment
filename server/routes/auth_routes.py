from typing import Annotated, Any

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from controllers.auth_controller import (
    clear_jwt_cookies,
    login_user,
    refresh_access_token,
    register_user,
    update_user_profile,
)
from db.connection import get_db_conn
from models.schemas.auth_schemas import LoginRequest, RegisterRequest, UserUpdateRequest
from models.core.users import User
from services.auth.deps import get_current_user
from services.auth.csrf_handler import clear_csrf_cookie

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(
    payload: Annotated[RegisterRequest, "User registration form fields"],
    db: Annotated[Session, Depends(get_db_conn)],
    response: Annotated[Response, "response to pass down to set cookies"],
) -> Annotated[
    dict[str, Any], "Registers users and returns mfa uri and registration status"
]:
    return register_user(reg_user=payload, db=db, response=response)


@router.post("/login")
async def login(
    db: Annotated[Session, Depends(get_db_conn)],
    response: Annotated[Response, "response to pass down to set cookies"],
    login_data: Annotated[
        LoginRequest, "Login form fields, including email/username and password"
    ],
) -> Annotated[dict[str, Any], "Logs in users and returns Tokens"]:
    log_user = LoginRequest(
        email_or_username=login_data.email_or_username,
        password=login_data.password,
        mfa_code=login_data.mfa_code,
    )
    return login_user(log_user=log_user, db=db, response=response)


@router.post("/refresh")
async def refresh_auth_tokens(
    response: Annotated[Response, "response to pass down to set cookies"],
    db: Annotated[Session, Depends(get_db_conn)],
    refresh_token: Annotated[str | None, ""] = Cookie(default=None),
) -> Annotated[
    dict[str, Any],
    "Refreshes the access token before it expires and while the refresh token exists",
]:
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token"
        )
    return refresh_access_token(refresh_token=refresh_token, db=db, response=response)


@router.get("/all")
async def get_all_users(
    current_user: Annotated[
        User, Depends(get_current_user), "Fetching logged in user details"
    ],
    db: Annotated[Session, Depends(get_db_conn)],
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You are not authorised to access this. {current_user.username}",
        )

    all_users = db.scalars(select(User)).all()
    return [user.to_dict_admin() for user in all_users]


@router.get("/me")
def get_me(
    current_user: Annotated[
        User, Depends(get_current_user), "Fetching logged in user details"
    ],
):
    return current_user


@router.patch("/profile/{editing_user_id}")
def update_profile(
    editing_user_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db_conn)],
    request: UserUpdateRequest,
):
    return update_user_profile(
        current_user_id=current_user.id, user_id=editing_user_id, db=db, payload=request
    )


@router.post("/logout")
def logout_user(response: Response):
    """
    Logs out the user by clearing the JWT cookies.
    """
    clear_jwt_cookies(response)
    clear_csrf_cookie(response)
