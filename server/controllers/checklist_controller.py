from fastapi import HTTPException, status
from models.applications import Application
from models.checklists import Checklist
from models.schemas.crud_schemas import (
    ChecklistCreate,
    ChecklistOut,
)
from models.users import User
from sqlalchemy import select
from sqlalchemy.orm import Session


def create_checklist(
    payload: ChecklistCreate, db: Session, creator: User
) -> ChecklistOut:
    try:
        app = db.get(Application, payload.app_id)
        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application Not found. id: {payload.app_id}",
            )

        checklist = Checklist(**payload.model_dump(), creator=creator.id)
        db.add(checklist)
        db.commit()
        db.refresh(checklist)
        return ChecklistOut.model_validate(checklist)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checklist: {str(e)}",
        )


def get_checklists_for_app(app_id: str, db: Session, user: User) -> list[ChecklistOut]:
    try:
        app = db.scalar(select(Application).where(Application.id == app_id))

        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application not found. {app_id}",
            )

        checklists = db.scalars(
            select(Checklist).where(
                Checklist.app_id == app.id, Checklist.creator_id == user.id
            )
        ).all()

        user_ = db.scalar(select(User).where(User.id == user.id))
        if not user_:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User not found. {user.id}",
            )

        user_role = user_.role

        results: list[ChecklistOut] = []
        if user_role == "admin":
            for checklist in checklists:
                results.append(
                    ChecklistOut(
                        id=checklist.id,
                        app_name=app.name,
                        checklist_type=checklist.checklist_type,
                        assigned_users=[
                            assignment.user.to_dict_safe()
                            for assignment in checklist.assignments
                        ],
                    )
                )

        else:
            for checklist in checklists:
                results.append(
                    ChecklistOut(
                        id=checklist.id,
                        app_name=app.name,
                        checklist_type=checklist.checklist_type,
                    )
                )

        return results

    except Exception as e:
        print(f"Error while getting the checklists for app: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get checklissts for app {app_id}",
        )


def get_checklists_for_user(user: User, db: Session) -> list[ChecklistOut]:
    try:
        curr_user = db.scalar(select(User).where(User.id == user.id))
        if not curr_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User not found. {user.id}",
            )
        checklists = db.scalars(
            select(Checklist).where(Checklist.creator_id == user.id)
        ).all()

        return [ChecklistOut.model_validate(checklist) for checklist in checklists]
    except Exception as e:
        print(f"Error while getting the checklists for app: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get checklissts for user {user.id}",
        )
