from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from models.checklists import Checklist
from models.users import User
from models.checklist_assignments import ChecklistAssignment
from models.schemas.crud_schemas import AssignmentCreate, AssignmentOut


def assign_users(payload: AssignmentCreate, db: Session, curr_user: User):
    try:
        checklist = db.scalar(
            select(Checklist).where(Checklist.id == payload.checklist_id)
        )
        if not checklist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Checklist not found for id: {payload.checklist_id}",
            )
        created_assignments = []
        for user in payload.users:
            exists = db.scalar(
                select(ChecklistAssignment).where(
                    ChecklistAssignment.checklist_id == payload.checklist_id,
                    ChecklistAssignment.user_id == user.id,
                )
            )
            if exists:
                continue
            assignment = ChecklistAssignment(
                checklist_id=payload.checklist_id, user_id=user.id
            )
            db.add(assignment)
            created_assignments.append(assignment)
        db.commit()
        for a in created_assignments:
            db.refresh(a)

        return [AssignmentOut.model_validate(a) for a in created_assignments]
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign users: {str(e)}",
        )
