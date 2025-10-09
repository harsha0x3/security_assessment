import os
from typing import Annotated
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Path,
    Request,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from controllers.user_responses_controller import (
    UPLOAD_DIR,
    add_responses_from_csv,
    add_user_response,
    save_uploaded_file,
    update_user_response,
    get_s3_presigned_url,
)

from db.connection import get_db_conn
from models.core.user_responses import UserResponse
from models.schemas.crud_schemas import (
    UserOut,
    UserResponseCreate,
    UserResponseOut,
    UserResponseUpdate,
)
from services.auth.deps import get_current_user
from services.extensions.rate_limiter import limiter

router = APIRouter(tags=["responses"])


@router.post("/controls/{control_id}/responses")
@limiter.limit("300/minute")
async def create_user_response(
    request: Request,
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


# @router.patch("/checklist/{checklist_id}/responses")
# async def save_bulk_res(payload:Annotated[list[UserResponseCreateBulk],]):


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
    evidence_path = None
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


@router.post("/checklists/{checklist_id}/responses/upload")
async def upload_controls_file(
    checklist_id: Annotated[
        str,
        Path(...),
    ],
    input_file: Annotated[UploadFile, File(...)],
    db: Annotated[Session, Depends(get_db_conn), ""],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if not input_file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please Upload the file",
        )
    try:
        content = await input_file.read()
        if input_file.filename is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file must have a filename",
            )
        result = add_responses_from_csv(
            file_content=content,
            file_name=input_file.filename,
            current_user=current_user,
            checklist_id=checklist_id,
            db=db,
        )
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.get("/responses/file-view/{file_key}")
async def view_file(
    current_user: Annotated[UserOut, Depends(get_current_user)],
    file_key: Annotated[str, Path(description="S3 URL path")],
):
    url = get_s3_presigned_url(file_key=file_key, expires_in=3600)
    return {"file_url": url}
