from fastapi import HTTPException, status
from models.applications import Application
from models.checklists import Checklist
from models.schemas.crud_schemas import (
    ChecklistCreate,
    ChecklistOut,
    UserOut,
    ChecklistUpdate,
)
from models.users import User
from models.checklist_assignments import ChecklistAssignment
from sqlalchemy import select, and_
from sqlalchemy.orm import Session


def create_checklist(
    payload: ChecklistCreate, app_id: str, db: Session, creator: UserOut
) -> ChecklistOut:
    try:
        app_ = db.get(Application, app_id)
        if not app_:
            print("APP NOt found")

        app = db.scalar(select(Application).where(Application.id == app_id))
        if not app:
            print("Another")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application Not found. id: {app_id}",
            )

        checklist = Checklist(
            **payload.model_dump(), creator_id=creator.id, app_id=app_id
        )
        db.add(checklist)
        db.commit()
        db.refresh(checklist)
        data = checklist.to_dict()
        data["app_name"] = checklist.app.name
        return ChecklistOut(**data)

    except Exception as e:
        db.rollback()
        print("Error", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checklist: {str(e)}",
        )


def get_checklists_for_app(
    app_id: str, db: Session, user: UserOut
) -> list[ChecklistOut]:
    try:
        app = db.scalar(select(Application).where(Application.id == app_id))

        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application not found. {app_id}",
            )

        results: list[ChecklistOut] = []
        if user.role == "admin":
            checklists = db.scalars(
                select(Checklist).where(
                    and_(Checklist.app_id == app.id, Checklist.creator_id == user.id)
                )
            ).all()
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
            checklists = db.scalars(
                select(Checklist).where(
                    and_(
                        Checklist.app_id == app.id,
                        Checklist.assignments.user_id == user.id,
                    )
                )
            ).all()

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


def get_checklists_for_user(user: UserOut, db: Session) -> list[ChecklistOut]:
    try:
        checklists = db.scalars(
            select(Checklist)
            .join(ChecklistAssignment)
            .where(ChecklistAssignment.user_id == user.id)
        ).all()

        return [ChecklistOut.model_validate(checklist) for checklist in checklists]

    except Exception as e:
        print(f"Error while getting checklists for user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get checklists for user {user.id}",
        )


def update_checklist(payload: ChecklistUpdate, checklist_id: str, db: Session):
    try:
        checklist = db.scalar(select(Checklist).where(Checklist.id == checklist_id))
        if not checklist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"no checklist found: {checklist_id}",
            )

        for key, val in payload.model_dump(exclude_unset=True, exclude_none=True):
            setattr(checklist, key, val)

        db.commit()
        db.refresh(checklist)
        return ChecklistOut.model_validate(checklist)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update checklists {str(e)}",
        )


def remove_checklist(checklist_id: str, db: Session):
    try:
        checklist = db.scalar(select(Checklist).where(Checklist.id == checklist_id))
        if not checklist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"no checklist found: {checklist_id}",
            )
        db.delete(checklist)
        db.commit()
        db.refresh(checklist)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete checklist {str(e)}",
        )
