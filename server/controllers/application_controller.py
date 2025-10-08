from fastapi import HTTPException, status
from sqlalchemy import select, and_, not_, desc, asc, func, or_
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models import Application
from models import ChecklistAssignment
from models import Checklist
from models.schemas.crud_schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationUpdate,
    UserOut,
    ListApplicationsOut,
    ChecklistOut,
)
from models.schemas.params import AppQueryParams
from typing import Any


def create_app(
    payload: ApplicationCreate, db: Session, creator: UserOut, owner: UserOut
) -> ApplicationOut:
    try:
        app = Application(
            **payload.model_dump(exclude={"priority"}),
            creator_id=creator.id,
            owner_id=owner.id,
        )

        db.add(app)
        db.flush()
        app.set_priority_for_user(user_id=creator.id, db=db, priority_val=2)
        db.commit()
        db.refresh(app)
        return ApplicationOut(
            **app.to_dict(),
            priority=app.get_priority_for_user(user_id=creator.id, db=db),
        )

    except IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="App with the same exists"
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create application: {str(e)}",
        )


def list_apps(db: Session, user: UserOut, params: AppQueryParams):
    stmt = select(Application).distinct().where(Application.is_active)

    if user.role != "admin":
        # join checklists and assignments to filter by user_id
        stmt = (
            stmt.outerjoin(Application.checklists)
            .outerjoin(Checklist.assignments)
            .where(
                or_(
                    ChecklistAssignment.user_id == user.id,
                    Application.owner_id == user.id,
                )
            )
        )
    # else:
    # stmt = stmt.where(Application.creator_id == user.id)

    total_count = db.scalar(select(func.count()).select_from(stmt.subquery()))
    sort_column = getattr(Application, params.sort_by)
    if params.sort_order == "desc":
        sort_column = desc(sort_column)
    else:
        sort_column = asc(sort_column)

    if params.search and params.search != "null" and params.search_by:
        print("FOUND SEARCH Q", params.search)
        print("FOUND SEARCH BY", params.search_by)
        search_value = f"%{params.search}%"
        search_column = getattr(Application, params.search_by, None)
        if search_column is not None:
            stmt = stmt.where(search_column.ilike(search_value))
            print(stmt)

    if params.page >= 1:
        apps = db.scalars(
            stmt.order_by(sort_column)
            .limit(params.page_size)
            .offset(params.page * params.page_size - params.page_size)
        ).all()
    else:
        print("\nIN ELSE", stmt)
        apps = db.scalars(stmt.order_by(sort_column)).all()

    apps_out = []

    for app in apps:
        if user.role != "admin":
            app_checklists = [
                ChecklistOut(
                    id=chk.id,
                    app_name=app.name,
                    checklist_type=chk.checklist_type,
                    assigned_users=[
                        UserOut.model_validate(a.user) for a in chk.assignments
                    ],
                    is_completed=chk.is_completed,
                    priority=chk.get_priority_for_user(user_id=user.id, db=db),
                    status=chk.status,
                    comment=chk.comment,
                    created_at=chk.created_at,
                    updated_at=chk.updated_at,
                )
                for chk in app.checklists or []
                if app.owner_id == user.id
                or any(a.user_id == user.id for a in chk.assignments)
            ]
        else:
            app_checklists = [
                ChecklistOut(
                    id=chk.id,
                    app_name=app.name,
                    checklist_type=chk.checklist_type,
                    assigned_users=[
                        UserOut.model_validate(a.user) for a in chk.assignments
                    ],
                    is_completed=chk.is_completed,
                    priority=chk.get_priority_for_user(user_id=user.id, db=db),
                    status=chk.status,
                    comment=chk.comment,
                    created_at=chk.created_at,
                    updated_at=chk.updated_at,
                )
                for chk in app.checklists or []
            ]

        apps_out.append(
            ListApplicationsOut(
                id=app.id,
                name=app.name,
                description=app.description,
                is_completed=app.is_completed,
                status=app.status,
                checklists=app_checklists,
                ticket_id=app.ticket_id,
                priority=app.get_priority_for_user(user_id=user.id, db=db),
            )
        )

    return {
        "apps": apps_out,
        "assigned_users": [],
        "total_count": total_count,
    }


def list_apps_with_details(
    db: Session, user: UserOut, params: AppQueryParams
) -> dict[str, Any | list[ApplicationOut]]:
    stmt = select(Application).distinct().where(Application.is_active)

    if user.role != "admin":
        # join checklists and assignments to filter by user_id
        stmt = (
            stmt.outerjoin(Application.checklists)
            .outerjoin(Checklist.assignments)
            .where(
                or_(
                    ChecklistAssignment.user_id == user.id,
                    Application.owner_id == user.id,
                )
            )
        )
    # else:
    # stmt = stmt.where(Application.creator_id == user.id)

    total_count = db.scalar(select(func.count()).select_from(stmt.subquery()))
    sort_column = getattr(Application, params.sort_by)
    if params.sort_order == "desc":
        sort_column = desc(sort_column)
    else:
        sort_column = asc(sort_column)

    if params.search and params.search != "null" and params.search_by:
        print("FOUND SEARCH Q", params.search)
        print("FOUND SEARCH BY", params.search_by)
        search_value = f"%{params.search}%"
        search_column = getattr(Application, params.search_by, None)
        if search_column is not None:
            stmt = stmt.where(search_column.ilike(search_value))

    if params.page >= 1:
        apps = db.scalars(
            stmt.order_by(sort_column)
            .limit(params.page_size)
            .offset(params.page * params.page_size - params.page_size)
        ).all()
    else:
        apps = db.scalars(stmt.order_by(sort_column)).all()

    return {
        "apps": [
            ApplicationOut(
                **app.to_dict(),
                priority=app.get_priority_for_user(user_id=user.id, db=db),
            )
            for app in apps
        ],
        "total_count": total_count,
    }


def update_app(
    payload: ApplicationUpdate, app_id: str, db: Session, current_user: UserOut
):
    try:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You don't have to update the application {current_user.username}",
            )
        app = db.scalar(select(Application).where(Application.id == app_id))
        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"App not found {app_id}"
            )
        if not app.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"App is in trash {app_id}",
            )

        for key, val in payload.model_dump(
            exclude_unset=True, exclude={"priority"}
        ).items():
            setattr(app, key, val)

        priority_val = payload.priority or 2
        app.set_priority_for_user(
            user_id=current_user.id, db=db, priority_val=priority_val
        )
        db.commit()
        db.refresh(app)
        return ApplicationOut(
            **app.to_dict(),
            priority=app.get_priority_for_user(user_id=current_user.id, db=db),
        )

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update the app {str(e)}",
        )


def get_app_details(app_id: str, db: Session, current_user: UserOut):
    try:
        app = db.scalar(
            select(Application).where(Application.id == app_id, Application.is_active)
        )
        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"App not found {app_id}"
            )

        if current_user.role != "admin" and app.owner_id != current_user.id:
            checklists = [
                chk
                for chk in app.checklists
                if any(a.user_id == current_user.id for a in chk.assignments)
            ]

            if not checklists:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorised to view this application",
                )

        return ApplicationOut(
            **app.to_dict(),
            priority=app.get_priority_for_user(user_id=current_user.id, db=db),
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch the app details {str(e)}",
        )


def delete_app(app_id: str, db: Session, current_user: UserOut):
    try:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You are not authorised to deleted {current_user.username}",
            )
        app = db.scalar(select(Application).where(Application.id == app_id))
        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"App not found {app_id}"
            )
        if not app.is_active:
            db.delete(app)
            db.commit()
            del_app = ApplicationOut(
                **app.to_dict(),
                priority=app.get_priority_for_user(user_id=current_user.id, db=db),
            ).model_dump()
            del_app["msg"] = "Successfully deleted app"
            return del_app

        setattr(app, "is_active", False)
        checklists = app.checklists

        for checklist in checklists:
            if checklist.is_active:
                setattr(checklist, "is_active", False)

            if checklist.assignments:
                for ass in checklist.assignments:
                    ass.is_active = False

                for control in checklist.controls:
                    if control.is_active:
                        control.is_active = False
                    if control.responses:
                        if control.responses.is_active:
                            control.responses.is_active = False

        db.commit()
        db.refresh(app)
        del_app = ApplicationOut(
            **app.to_dict(),
            priority=app.get_priority_for_user(user_id=current_user.id, db=db),
        ).model_dump()
        del_app["msg"] = "Successfully trashed app"
        return del_app

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete the app {str(e)}",
        )


def update_app_status(app_id: str, db: Session):
    try:
        app = db.get(Application, app_id)
        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="App not found"
            )

        checklists = app.checklists or []
        if not checklists:
            app.is_completed = False
            app.status = "pending"
            db.commit()
            db.refresh(app)
            return {"msg": f"App {app.name} marked pending (no checklists)"}

        completed = [c.is_completed for c in checklists]
        in_prog = [c.status == "in-progress" for c in checklists]

        if all(completed):
            app.status = "completed"
            app.is_completed = True
        elif any(completed) or any(in_prog):
            app.status = "in-progress"
            app.is_completed = False
        else:
            app.status = "pending"
            app.is_completed = False

        db.commit()
        db.refresh(app)

        return {"msg": f"App {app.name} marked {app.status}"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update application status for {app_id}: {str(e)}",
        )


def restore_app(app_id: str, db: Session):
    try:
        app = db.scalar(
            select(Application).where(
                and_(Application.id == app_id, not_(Application.is_active))
            )
        )

        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application not found id recieved: {app_id}",
            )

        app.is_active = True
        if app.checklists:
            for checklist in app.checklists:
                checklist.is_active = True
                if checklist.assignments:
                    for ass in checklist.assignments:
                        ass.is_active = False
                if checklist.controls:
                    for control in checklist.controls:
                        control.is_active = True
                        if control.responses:
                            control.responses.is_active = True

        db.commit()
        db.refresh(app)
        return {"msg": "App restored successfully"}

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error restoring application {str(e)}",
        )


def get_trashed_apps(db: Session):
    try:
        trashed_apps = db.scalars(
            select(Application).where(not_(Application.is_active))
        ).all()
        if not trashed_apps:
            raise HTTPException(
                status_code=status.HTTP_204_NO_CONTENT, detail="No apps in trash"
            )
        return [
            ApplicationOut(
                **trashed_app.to_dict(),
                priority=2,
            )
            for trashed_app in trashed_apps
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching trashed apps {str(e)}",
        )


def get_app_stats(current_user: UserOut, db: Session):
    stmt = select(Application).where(Application.is_active)

    if current_user.role != "admin":
        # join checklists and assignments to filter by user_id
        stmt = (
            stmt.join(Application.checklists)
            .join(Checklist.assignments)
            .where(ChecklistAssignment.user_id == current_user.id)
        )

    total_count = db.scalar(select(func.count()).select_from(stmt.subquery()))
    completed_apps = db.scalar(stmt.where(Application.is_completed))

    return {"total_apps": total_count, "completed_apps": completed_apps}
