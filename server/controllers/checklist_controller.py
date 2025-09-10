from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session
import json
from models.applications import Application
from models.checklist_assignments import ChecklistAssignment
from models.checklists import Checklist
from models.controls import Control
from models.schemas.crud_schemas import (
    ChecklistCreate,
    ChecklistOut,
    ChecklistUpdate,
    UserOut,
)
from models.user_responses import UserResponse
from .application_controller import update_app_completion


def create_checklist(
    payload: ChecklistCreate, app_id: str, db: Session, creator: UserOut
) -> ChecklistOut:
    try:
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

        update_app_completion(app.id, db)
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
            print("admin")
            checklists = db.scalars(
                select(Checklist).where(
                    and_(Checklist.app_id == app.id, Checklist.is_active)
                )
            ).all()
            print(
                "Checklist is complete",
                [checklist.is_completed for checklist in checklists],
            )
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
                        is_completed=checklist.is_completed,
                        created_at=checklist.created_at,
                        updated_at=checklist.updated_at,
                    )
                )

        else:
            # Non-admins: only checklists assigned to them
            checklists = db.scalars(
                select(Checklist)
                .join(ChecklistAssignment)
                .where(
                    and_(
                        Checklist.app_id == app.id,
                        ChecklistAssignment.user_id == user.id,
                        Checklist.is_active,
                    )
                )
            ).all()

            for checklist in checklists:
                results.append(
                    ChecklistOut(
                        id=checklist.id,
                        app_name=app.name,
                        checklist_type=checklist.checklist_type,
                        is_completed=checklist.is_completed,
                        created_at=checklist.created_at,
                        updated_at=checklist.updated_at,
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
            .where(and_(ChecklistAssignment.user_id == user.id, Checklist.is_active))
        ).all()
        print(
            "Checklist is complete",
            [checklist.is_completed for checklist in checklists],
        )
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


# def remove_checklist(checklist_id: str, db: Session):
#     try:
#         checklist = db.scalar(select(Checklist).where(Checklist.id == checklist_id))
#         if not checklist:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail=f"no checklist found: {checklist_id}",
#             )

#         app = checklist.app
#         data = ChecklistOut.model_validate(checklist)

#         db.delete(checklist)
#         db.commit()

#         update_app_completion(app.id, db)

#         return data
#     except HTTPException:
#         raise
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to delete checklist {str(e)}",
#         )


def update_checklist_status(checklist_id: str, user: UserOut, db: Session):
    """
    Check if all controls in the checklist have responses for the given user.
    Update checklist.is_completed accordingly.
    """
    print("Inside checklist submission")
    checklist = db.get(Checklist, checklist_id)
    if not checklist:
        print(f"Checklist with ID {checklist_id} not found.")
        return

    # Get all control IDs for this checklist
    control_ids = db.scalars(
        select(Control.id).where(Control.checklist_id == checklist_id)
    ).all()

    if not control_ids:
        print(f"No controls found for checklist {checklist_id}.")
        checklist.is_completed = False
        return

    # Count responses by this user for these controls
    if user.role == "admin":
        # Admins can see all responses
        print("Admin user, counting all responses for controls.")
        responses_count = db.scalar(
            select(func.count(UserResponse.id)).where(
                UserResponse.control_id.in_(control_ids),
            )
        )
    else:
        print(f"Counting responses for user {user.id} for controls.")
        responses_count = db.scalar(
            select(func.count(UserResponse.id)).where(
                # UserResponse.user_id == user.id,
                UserResponse.control_id.in_(control_ids),
            )
        )
    print(
        f"Responses count, controls count for checklist {checklist_id}: {responses_count} , {len(control_ids)}"
    )
    checklist.is_completed = responses_count == len(control_ids)
    print(f"Updated checklist status {responses_count == len(control_ids)}")
    db.commit()  # ensures SQLAlchemy tracks the change
    db.refresh(checklist)  # refresh to get the updated state

    app = checklist.app
    print("app in chk controller")
    print(app)

    update_app_completion(app.id, db)


def remove_checklist(
    checklist_id: str,
    db: Session,
):
    try:
        checklist = db.scalar(select(Checklist).where(Checklist.id == checklist_id))
        if not checklist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Checklist not found to trash",
            )

        # if user.role != "admin":
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail=f"You are not authorised {user.username}",
        #     )
        # assigned_users = [
        #     assignment.user.to_dict_safe() for assignment in checklist.assignments
        # ]
        # if user.id not in [user_["id"] for user_ in assigned_users]:
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail=f"You are not authorised {user.username}",
        #     )
        if not checklist.is_active:
            print("FOUND FALSE::::::::::::::::::::::::")
            db.delete(checklist)
            db.commit()
            return {"msg": f"Checklist Deleted successfully {checklist.checklist_type}"}

        setattr(checklist, "is_active", False)

        controls = checklist.controls

        for control in controls:
            if control.is_active:
                setattr(control, "is_active", False)
            # with open("control.txt", "a", encoding="utf-8") as f:
            #     f.write(str(control.to_dict()))
            if control.responses:
                if control.responses.is_active:
                    setattr(control.responses, "is_active", False)

        db.commit()
        db.refresh(checklist)
        return {"msg": f"Checklist Deleted successfully {checklist.checklist_type}"}

    except HTTPException:
        raise
