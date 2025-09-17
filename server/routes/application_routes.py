from typing import Annotated, Any, Literal

from fastapi import APIRouter, Body, Depends, HTTPException, Path, status, Query
from sqlalchemy.orm import Session

from controllers.application_controller import (
    create_app,
    delete_app,
    list_apps,
    restore_app,
    update_app,
    get_trashed_apps,
)
from db.connection import get_db_conn
from models.schemas.crud_schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationUpdate,
    UserOut,
)
from services.auth.deps import get_current_user
from models.schemas.params import AppQueryParams

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


@router.get("")
async def get_applications(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    sort_by: Annotated[str, Query()] = "created_at",
    sort_order: Annotated[Literal["asc", "desc"], Query()] = "desc",
    search: Annotated[str | None, Query()] = None,
    page: Annotated[int, Query()] = 1,
    page_size: Annotated[int, Query()] = 10,
    search_by: Annotated[
        Literal[
            "name", "platform", "region", "owner_name", "provider_name", "department"
        ],
        Query(),
    ] = "name",
) -> dict[str, Any]:
    params = AppQueryParams(
        sort_by=sort_by,
        sort_order=sort_order,
        search=search,
        page=page,
        page_size=page_size,
        search_by=search_by,
    )
    return list_apps(db=db, user=current_user, params=params)


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
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You are not authorised {current_user.username}",
        )
    return delete_app(app_id, db, current_user)


@router.patch("/restore/{app_id}")
async def restore_app_from_trash(
    app_id: Annotated[str, Path(title="App Id of the app to be updated")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    # return {"msg": "Hello"}
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You are not authorised {current_user.username}",
        )
    return restore_app(app_id=app_id, db=db)


@router.get("/trash", response_model=list[ApplicationOut])
async def get_apps_in_trash(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You are not authorised {current_user.username}",
        )
    return get_trashed_apps(db=db)
