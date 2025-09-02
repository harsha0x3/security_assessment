from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from models.applications import Application
from models.schemas.crud_schemas import (
    ApplicationCreate,
    ApplicationOut,
    UserOut,
    ApplicationUpdate,
)
from models.checklists import Checklist
from models.checklist_assignments import ChecklistAssignment


def create_app(
    payload: ApplicationCreate, db: Session, creator: UserOut
) -> ApplicationOut:
    try:
        app = Application(**payload.model_dump(), creator_id=creator.id)
        db.add(app)
        db.commit()
        db.refresh(app)
        return ApplicationOut.model_validate(app)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create application: {str(e)}",
        )


def list_apps(db: Session, user: UserOut) -> list[ApplicationOut]:
    stmt = select(Application)

    if user.role != "admin":
        # join checklists and assignments to filter by user_id
        stmt = (
            stmt.join(Application.checklists)
            .join(Checklist.assignments)
            .where(ChecklistAssignment.user_id == user.id)
            .distinct()
        )
    else:
        stmt = stmt.where(Application.creator_id == user.id)

    apps = db.scalars(stmt).all()
    print("Apps in app controller", apps)
    return [ApplicationOut.model_validate(app) for app in apps]


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

        for key, val in payload.model_dump(exclude_unset=True).items():
            setattr(app, key, val)
        db.commit()
        db.refresh(app)
        return ApplicationOut.model_validate(app)

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update the app {str(e)}",
        )


def delete_app(app_id: str, db: Session, current_user: UserOut):
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
        db.delete(app)
        db.commit()
        del_app = ApplicationOut.model_validate(app).model_dump()
        del_app["msg"] = "Successfully deleted app"
        return del_app
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete the app {str(e)}",
        )
