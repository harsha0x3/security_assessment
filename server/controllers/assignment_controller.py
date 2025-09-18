from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from models.core.checklist_assignments import ChecklistAssignment
from models.core.checklists import Checklist
from models.schemas.crud_schemas import AssignmentCreate, AssignmentOut, UserOut


def assign_users(
    payload: AssignmentCreate, checklist_id: str, db: Session, current_user: UserOut
):
    try:
        checklist = db.scalar(select(Checklist).where(Checklist.id == checklist_id))
        if not checklist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Checklist not found for id: {checklist_id}",
            )
        created_assignments = []
        for user_id in payload.user_ids:
            exists = db.scalar(
                select(ChecklistAssignment).where(
                    and_(
                        ChecklistAssignment.checklist_id == checklist_id,
                        ChecklistAssignment.user_id == user_id,
                    )
                )
            )
            if exists:
                continue
            assignment = ChecklistAssignment(checklist_id=checklist_id, user_id=user_id)
            db.add(assignment)
            created_assignments.append(assignment)
        db.commit()
        for a in created_assignments:
            db.refresh(a)
        assigned_users = [UserOut.model_validate(a.user) for a in created_assignments]
        return AssignmentOut(checklist_id=checklist_id, assigned_users=assigned_users)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign users: {str(e)}",
        )
