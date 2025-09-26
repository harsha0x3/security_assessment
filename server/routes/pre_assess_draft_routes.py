from fastapi import APIRouter, Depends, Path, Body, HTTPException, status
from sqlalchemy.orm import Session
from controllers.pre_assessment_drafts import get_draft, save_draft, delete_draft
from services.auth.deps import get_current_user
from db.connection import get_db_conn
from models.schemas.drafts import CreatePreAssessDraft, PreAssessDraftOut, DraftAnsItem
from typing import Annotated
from models.schemas.crud_schemas import UserOut

router = APIRouter(prefix="/drafts/pre_assessments", tags=["draft"])


@router.get("/{assessment_id}")
async def get_saved_drafts(
    assessment_id: Annotated[str, Path(title="Id of the assessment the drafts needed")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[
        UserOut, Depends(get_current_user), "Fetching logged in user details"
    ],
):
    drafts = get_draft(db=db, user_id=current_user.id, assessment_id=assessment_id)

    return drafts


@router.post("/{assessment_id}")
async def save_drafts(
    assessment_id: Annotated[str, Path(title="Id of the assessment the drafts needed")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[
        UserOut, Depends(get_current_user), "Fetching logged in user details"
    ],
    payload: Annotated[
        CreatePreAssessDraft,
        Body(title="Valid payload with question id and answer text"),
    ],
):
    try:
        res = save_draft(
            db=db, user_id=current_user.id, assessment_id=assessment_id, draft=payload
        )
        return {"msg": "draft saved", "res": res}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save draft, {str(e)}",
        )


@router.delete("/{assessment_id}")
async def delete_drafts(
    assessment_id: Annotated[str, Path(title="Id of the assessment the drafts needed")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[
        UserOut, Depends(get_current_user), "Fetching logged in user details"
    ],
):
    delete_draft(
        db=db,
        user_id=current_user.id,
        assessment_id=assessment_id,
    )
