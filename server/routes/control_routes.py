from fastapi import APIRouter, Path, Depends, HTTPException, status
from models.schemas.crud_schemas import (
    ControlCreate,
    ControlOut,
    ControlUpdate,
    ControlRemove,
    ControlWithResponseOut,
)
from typing import Annotated
from models.schemas.crud_schemas import UserOut
from db.connection import get_db_conn
from services.auth.deps import get_current_user
from sqlalchemy.orm import Session
from controllers.controls_controller import (
    add_controls,
    get_controls,
    update_control,
    remove_controls,
    get_controls_with_responses,
)
from sqlalchemy import select
from models.users import User
from models.checklists import Checklist
from models.checklist_assignments import ChecklistAssignment

router = APIRouter(tags=["controls"])


@router.post("/checklists/{checklist_id}/control")
async def create_control(
    payload: Annotated[ControlCreate, "Data for creating a control"],
    checklist_id: Annotated[str, Path(title="Checklist Id")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
) -> Annotated[ControlOut, "Function to create a control and output it"]:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have the permission. {current_user.username}",
        )
    return add_controls(payload, checklist_id=checklist_id, db=db)


@router.get("/checklists/{checklist_id}/controls")
async def fetch_controls(
    checklist_id: Annotated[str, Path(title="Checklist Id")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
) -> Annotated[list[ControlOut], "Function to create a control and output it"]:
    # return {"msg":"Hello" }

    return get_controls(checklist_id=checklist_id, db=db, current_user=current_user)


@router.get("/checklists/{checklist_id}/controls-responses")
async def fetch_controls_with_responses(
    checklist_id: Annotated[str, Path(title="Checklist Id")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
) -> Annotated[
    list[ControlWithResponseOut], "Function to create a control and output it"
]:
    return get_controls_with_responses(
        checklist_id=checklist_id, db=db, current_user=current_user
    )


@router.patch("/control/{control_id}")
async def patch_control(
    payload: Annotated[ControlUpdate, ""],
    control_id: Annotated[str, Path(title="Checklist Id")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have the permission. {current_user.username}",
        )
    return update_control(payload, control_id, db)


@router.delete("/control/{control_id}")
async def delete_control(
    control_id: Annotated[str, Path(title="Checklist Id")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have the permission. {current_user.username}",
        )
    payload = ControlRemove(control_id=control_id)
    return remove_controls(payload, db)
