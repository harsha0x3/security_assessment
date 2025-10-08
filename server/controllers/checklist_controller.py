from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import and_, asc, desc, func, not_, select, or_
from sqlalchemy.orm import Session

from models.core.applications import Application
from models.core.checklist_assignments import ChecklistAssignment
from models.core.checklists import Checklist
from models.core.controls import Control
from models.schemas.crud_schemas import (
    ChecklistCreate,
    ChecklistOut,
    ChecklistUpdate,
    UserOut,
)
from models.schemas.params import ChecklistQueryParams
from models.core.user_responses import UserResponse
from models import UserPriority

from .application_controller import update_app_status


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
            **payload.model_dump(exclude={"priority"}),
            creator_id=creator.id,
            app_id=app_id,
        )
        db.add(checklist)
        db.flush()

        priority_val = payload.priority or 2
        checklist.set_priority_for_user(
            user_id=creator.id, db=db, priority_val=priority_val
        )
        db.commit()
        db.refresh(checklist)
        data = checklist.to_dict()
        data["app_name"] = checklist.app.name
        data["priority"] = checklist.get_priority_for_user(user_id=creator.id, db=db)

        update_app_status(app.id, db)
        return ChecklistOut(**data)

    except Exception as e:
        db.rollback()
        print("Error", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checklist: {str(e)}",
        )


def get_checklists_for_app(
    app_id: str, db: Session, user: UserOut, params: ChecklistQueryParams
) -> dict[str, list[ChecklistOut] | Any]:
    try:
        app = db.scalar(select(Application).where(Application.id == app_id))

        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application not found. {app_id}",
            )

        stmt = (
            select(Checklist)
            .distinct()
            .where(and_(Checklist.app_id == app.id, Checklist.is_active))
        )

        total_count = db.scalar(select(func.count()).select_from(stmt.subquery()))

        sort_column = getattr(Checklist, params.sort_by)
        if params.sort_order == "asc":
            sort_column = asc(sort_column)
        else:
            sort_column = desc(sort_column)

        if params.search and params.search != "null" and params.search_by:
            search_value = f"%{params.search}%"
            search_column = getattr(Checklist, params.search_by)
            if search_column is not None:
                stmt = stmt.where(search_column.ilike(search_value))

        results: list[ChecklistOut] = []
        if user.role == "admin":
            if params.page >= 1:
                checklists = db.scalars(
                    stmt.order_by(sort_column)
                    .limit(params.page_size)
                    .offset(params.page * params.page_size - params.page_size)
                ).all()
            else:
                checklists = db.scalars(stmt.order_by(sort_column)).all()
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
                            UserOut.model_validate(assignment.user)
                            for assignment in checklist.assignments
                        ],
                        is_completed=checklist.is_completed,
                        priority=checklist.get_priority_for_user(
                            user_id=user.id, db=db
                        ),
                        created_at=checklist.created_at,
                        updated_at=checklist.updated_at,
                        status=checklist.status,
                    )
                )

        else:
            # Non-admins: only checklists assigned to them

            stmt = stmt.outerjoin(ChecklistAssignment).where(
                or_(
                    ChecklistAssignment.user_id == user.id,  # assigned to user
                    Application.owner_id == user.id,  # owner sees all
                )
            )

            if params.page >= 1:
                checklists = db.scalars(
                    stmt.order_by(sort_column)
                    .limit(params.page_size)
                    .offset(params.page * params.page_size - params.page_size)
                ).all()
            else:
                checklists = db.scalars(stmt.order_by(sort_column)).all()

            for checklist in checklists:
                results.append(
                    ChecklistOut(
                        id=checklist.id,
                        app_name=app.name,
                        checklist_type=checklist.checklist_type,
                        is_completed=checklist.is_completed,
                        created_at=checklist.created_at,
                        updated_at=checklist.updated_at,
                        priority=checklist.get_priority_for_user(
                            user_id=user.id, db=db
                        ),
                        status=checklist.status,
                        comment=checklist.comment,
                    )
                )

        return {"checklists": results, "total_count": total_count}

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
        return [
            ChecklistOut(
                **checklist.to_dict(),
                priority=checklist.get_priority_for_user(user_id=user.id, db=db),
            )
            for checklist in checklists
        ]

    except Exception as e:
        print(f"Error while getting checklists for user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get checklists for user {user.id}",
        )


def update_checklist(
    payload: ChecklistUpdate, checklist_id: str, db: Session, current_user: UserOut
):
    try:
        checklist = db.scalar(select(Checklist).where(Checklist.id == checklist_id))
        if not checklist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"no checklist found: {checklist_id}",
            )

        for key, val in payload.model_dump(
            exclude_unset=True, exclude_none=True, exclude={"priority"}
        ).items():
            setattr(checklist, key, val)
        priority_val = payload.priority or 2
        checklist.set_priority_for_user(
            user_id=current_user.id, db=db, priority_val=priority_val
        )

        db.commit()
        db.refresh(checklist)
        return ChecklistOut(
            id=checklist.id,
            app_name=checklist.app.name,
            checklist_type=checklist.checklist_type,
            is_completed=checklist.is_completed,
            created_at=checklist.created_at,
            updated_at=checklist.updated_at,
            priority=checklist.get_priority_for_user(user_id=current_user.id, db=db),
            status=checklist.status,
        )
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


def update_checklist_status(
    checklist_id: str,
    db: Session,
    checklist_status: str | None = None,
    comment: str | None = None,
):
    """
    Update checklist status manually (if checklist_status provided)
    or automatically based on related control responses.
    """
    checklist = db.get(Checklist, checklist_id)
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist with ID {checklist_id} not found.",
        )

    # --- Manual status update case ---
    if checklist_status:
        checklist.status = checklist_status
        checklist.is_completed = checklist_status in {"approved", "rejected"}
        checklist.comment = comment

        db.commit()
        db.refresh(checklist)
        update_app_status(checklist.app_id, db)

        return {
            "msg": f"Checklist '{checklist.checklist_type}' marked as {checklist.status}",
            "status": checklist.status,
            "is_completed": checklist.is_completed,
            "checklist": ChecklistOut.model_validate(checklist),
            "Recieved status": checklist_status,
        }

    # --- Automatic update case ---

    control_count = (
        db.scalar(
            select(func.count())
            .select_from(Control)
            .where(Control.checklist_id == checklist_id)
        )
        or 0
    )

    if control_count == 0:
        checklist.status = "pending"
        checklist.is_completed = False

    else:
        responses_count = (
            db.scalar(
                select(func.count(UserResponse.id))
                .join(Control, UserResponse.control_id == Control.id)
                .where(Control.checklist_id == checklist_id)
            )
            or 0
        )

        if responses_count == 0:
            checklist.status = "pending"
            checklist.is_completed = False
        elif responses_count < control_count:
            checklist.status = "in-progress"
            checklist.is_completed = False
        else:
            checklist.status = "completed"
            checklist.is_completed = True

    db.commit()
    db.refresh(checklist)
    update_app_status(checklist.app_id, db)

    return {
        "msg": f"Checklist '{checklist.checklist_type}' marked as {checklist.status}",
        "status": checklist.status,
        "is_completed": checklist.is_completed,
        "checklist": ChecklistOut.model_validate(checklist),
    }


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


def restore_checklits(checklist_id: str, db: Session):
    try:
        checklist = db.scalar(
            select(Checklist).where(
                and_(Checklist.id == checklist_id, not_(Checklist.is_active))
            )
        )
        if not checklist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"no checklist found: {checklist_id}",
            )
        checklist.is_active = True

        if checklist.assignments:
            for ass in checklist.assignments:
                ass.is_active = False
        if checklist.controls:
            for control in checklist.controls:
                control.is_active = True
                if control.responses:
                    control.responses.is_active = True

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error restoring checklist {str(e)}",
        )


def get_trash_checklists(
    app_id: str, db: Session, user: UserOut, params: ChecklistQueryParams
) -> list[ChecklistOut]:
    try:
        app = db.scalar(
            select(Application).where(
                and_(Application.id == app_id, not_(Application.is_active))
            )
        )

        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application not found. {app_id}",
            )

        results = []

        checklists = db.scalars(
            select(Checklist)
            .where(and_(Checklist.app_id == app.id, not_(Checklist.is_active)))
            .order_by(desc(Checklist.updated_at))
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
                        UserOut.model_validate(assignment.user)
                        for assignment in checklist.assignments
                    ],
                    is_completed=checklist.is_completed,
                    created_at=checklist.created_at,
                    updated_at=checklist.updated_at,
                    status=checklist.status,
                )
            )

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching trash checklists {str(e)}",
        )
