from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from controllers.application_controller import (
    create_app,
    delete_app,
    list_apps,
    update_app,
)
from db.connection import get_db_conn
from models.schemas.crud_schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationUpdate,
    UserOut,
)
from services.auth.deps import get_current_user

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("", summary="Create New Application")
async def create_application(
    payload: Annotated[ApplicationCreate, "Request fields for creating an application"],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
) -> Annotated[ApplicationOut, ""]:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    return create_app(payload=payload, db=db, creator=current_user)


@router.get("", response_model=list[ApplicationOut])
async def get_applications(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    print("Current user in app all route", current_user)
    return list_apps(db=db, user=current_user)


@router.patch("/{app_id}", response_model=ApplicationOut)
async def update_application(
    payload: Annotated[ApplicationUpdate, Body(title="App update payload")],
    app_id: Annotated[str, Path(title="App Id of the app to be updated")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
) -> Annotated[ApplicationOut, ""]:
    return update_app(payload, app_id, db, current_user)


@router.delete("/{app_id}", response_model=ApplicationOut)
async def delete_application(
    app_id: Annotated[str, Path(title="App Id of the app to be updated")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
) -> dict[str, Any]:
    return delete_app(app_id, db, current_user)
