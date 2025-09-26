from models import PreAssessmentResDraft
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from fastapi import HTTPException, status
from models.schemas.drafts import CreatePreAssessDraft


def get_draft(db: Session, user_id: str, assessment_id: str):
    draft = db.scalar(
        select(PreAssessmentResDraft).where(
            and_(
                PreAssessmentResDraft.user_id == user_id,
                PreAssessmentResDraft.assessment_id == assessment_id,
            )
        )
    )

    return draft if draft else None


def save_draft(
    db: Session, user_id: str, assessment_id: str, draft: CreatePreAssessDraft
):
    existing = get_draft(db=db, user_id=user_id, assessment_id=assessment_id)
    print("DRAFT", draft)
    payload = [item.model_dump() for item in draft.responses]
    if existing:
        existing.responses = payload
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    new_draft = PreAssessmentResDraft(
        user_id=user_id, assessment_id=assessment_id, responses=payload
    )

    db.add(new_draft)
    db.commit()
    db.refresh(new_draft)
    return new_draft


def delete_draft(db: Session, user_id: str, assessment_id: str):
    draft = get_draft(db=db, user_id=user_id, assessment_id=assessment_id)
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Draft Not found oto delete"
        )
    db.delete(draft)
    db.commit()
