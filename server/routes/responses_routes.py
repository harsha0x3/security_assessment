from fastapi import (
    APIRouter,
    Path,
    Depends,
    HTTPException,
    status,
    UploadFile,
    Form,
    File,
)
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
    save_uploaded_file,
    UPLOAD_DIR,
)
from uuid import uuid4
from models.user_responses import UserResponse
import os

router = APIRouter(tags=["responses"])


@router.post("/controls/{control_id}/responses")
async def create_user_response(
    current_setting: Annotated[str, Form(...)],
    review_comment: Annotated[str, Form(...)],
    control_id: Annotated[str, Path(title="Control Id to submit the response")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    evidence_file: UploadFile | None = File(None),
) -> Annotated[UserResponseOut, "Func to add user responses"]:
    eviddence_path = save_uploaded_file(evidence_file, current_user.id, control_id)
    payload = UserResponseCreate(
        current_setting=current_setting,
        review_comment=review_comment,
        evidence_path=eviddence_path,
    )
    return add_user_response(
        payload=payload, control_id=control_id, db=db, current_user=current_user
    )


@router.patch("/responses/{response_id}")
async def edit_user_response(
    response_id: Annotated[str, Path(title="Control Id to submit the response")],
    current_setting: Annotated[str, Form(...)],
    review_comment: Annotated[str, Form(...)],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    remove_evidence: Annotated[bool, Form(...)] = False,
    evidence_file: UploadFile | None = File(None),
) -> Annotated[UserResponseOut, "Func to update user responses"]:
    control_id = db.scalar(
        select(UserResponse.control_id).where(UserResponse.id == response_id)
    )
    if not control_id:
        control_id = f"{uuid4().hex}"
    if evidence_file:
        evidence_path = save_uploaded_file(evidence_file, current_user.id, control_id)
    elif remove_evidence:
        existing = db.scalar(select(UserResponse).where(UserResponse.id == response_id))
        if existing and existing.evidence_path:
            try:
                os.remove(os.path.join(UPLOAD_DIR, existing.evidence_path))
            except FileNotFoundError:
                pass
        evidence_path = None
    payload = UserResponseUpdate(
        current_setting=current_setting,
        review_comment=review_comment,
        evidence_path=evidence_path if evidence_file else None,
    )
    return update_user_response(
        payload=payload, response_id=response_id, db=db, current_user=current_user
    )
