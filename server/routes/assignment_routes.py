from fastapi import APIRouter, Path, Depends, HTTPException, status
from models.schemas.crud_schemas import AssignmentCreate, AssignmentOut
from controllers.assignment_controller import assign_users
from typing import Annotated
from models.schemas.crud_schemas import UserOut
from db.connection import get_db_conn
from services.auth.deps import get_current_user
from sqlalchemy.orm import Session

router = APIRouter(tags=["assignments"])


@router.post("/checklists/{checklist_id}/assignments")
async def user_assignment(
    users: Annotated[AssignmentCreate, "List of users ids to assign for a checklist"],
    checklist_id: Annotated[str, Path(title="Id of the checklist")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
) -> Annotated[AssignmentOut, "List of the useres assigned to a checklist"]:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have the permission. {current_user.username}",
        )
    return assign_users(
        payload=users, checklist_id=checklist_id, db=db, current_user=current_user
    )
