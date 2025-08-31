from fastapi import APIRouter, Path, Depends, HTTPException, status
from models.schemas.crud_schemas import (
    ControlCreate,
    ControlOut,
    ControlUpdate,
    ControlRemove,
    UserResponseCreate,
    UserResponseOut,
    UserResponseUpdate,
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
)
from sqlalchemy import select
from models.users import User
from models.checklists import Checklist
from models.checklist_assignments import ChecklistAssignment
from controllers.user_responses_controller import (
    add_user_response,
    update_user_response,
)

from models.user_responses import UserResponse

router = APIRouter(tags=["responses"])


@router.post("/controls/{control_id}/responses")
async def create_user_response(
    payload: Annotated[UserResponseCreate, ""],
    control_id: Annotated[str, Path(title="Control Id to submit the response")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
) -> Annotated[UserResponseOut, "Func to add user responses"]:
    return add_user_response(
        payload=payload, control_id=control_id, db=db, current_user=current_user
    )


@router.patch("/responses/{response_id}")
async def edit_user_response(
    payload: Annotated[UserResponseUpdate, ""],
    response_id: Annotated[str, Path(title="Control Id to submit the response")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
) -> Annotated[UserResponseOut, "Func to update user responses"]:
    return update_user_response(
        payload=payload, response_id=response_id, db=db, current_user=current_user
    )
