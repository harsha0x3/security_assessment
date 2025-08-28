from typing import Annotated, Any

from controllers.auth_controller import login_user, refresh_access_token, register_user
from db.connection import get_db_conn
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from models.schemas import (
    LoginRequest,
    RegisterRequest,
)
from models.users import User
from services.auth.deps import get_current_user
from sqlalchemy.orm import Session

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
    form_data: Annotated[
        OAuth2PasswordRequestForm, Depends(), "User login form fields"
    ],
) -> Annotated[dict[str, Any], "Logs in users and returns Tokens"]:
    log_user = LoginRequest(
        email_or_username=form_data.username, password=form_data.password
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


@router.get("/me")
def get_me(
    current_user: Annotated[
        User, Depends(get_current_user), "Fetching logged in user details"
    ],
):
    return current_user
