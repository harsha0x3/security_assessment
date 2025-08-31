from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session

from controllers.checklist_controller import (
    create_checklist,
    get_checklists_for_app,
    get_checklists_for_user,
    update_checklist,
    remove_checklist,
)
from models.schemas.crud_schemas import UserOut
from db.connection import get_db_conn
from models.schemas.crud_schemas import ChecklistCreate, ChecklistOut, ChecklistUpdate
from models.users import User
from services.auth.deps import get_current_user

router = APIRouter(tags=["checklists"])


@router.post("/applications/{app_id}/checklists", response_model=ChecklistOut)
async def create_new_checklist(
    payload: Annotated[ChecklistCreate, ""],
    app_id: Annotated[str, Path(title="App ID")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    return create_checklist(payload=payload, app_id=app_id, db=db, creator=current_user)


@router.get("/applications/{app_id}/checklists", response_model=list[ChecklistOut])
async def get_app_checklists(
    app_id: str,
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    return get_checklists_for_app(app_id=app_id, db=db, user=current_user)


@router.get("/checklists/my-checklists", response_model=list[ChecklistOut])
async def get_user_checklists(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    return get_checklists_for_user(user=current_user, db=db)


@router.patch("/checklists/{checklist_id}", response_model=ChecklistOut)
async def patch_checklist(
    payload: Annotated[ChecklistUpdate, "Payload for updating the checklist"],
    checklist_id: Annotated[str, Path(title="Checklist id to be updated")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
) -> Annotated[ChecklistOut, "Function to update teh checklist"]:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You can't access to update {current_user.username}",
        )

    return update_checklist(payload, checklist_id, db)


@router.delete("/checklists/{checklist_id}", response_model=ChecklistOut)
async def delete_checklist(
    checklist_id: Annotated[str, Path(title="Checklist id to be updated")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You can't access to update {current_user.username}",
        )
    return remove_checklist(checklist_id, db)
