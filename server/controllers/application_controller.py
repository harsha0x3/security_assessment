from fastapi import HTTPException, status
from sqlalchemy import select, and_, not_, desc, asc
from sqlalchemy.orm import Session
from models.applications import Application
from models.checklist_assignments import ChecklistAssignment
from models.checklists import Checklist
from models.schemas.crud_schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationUpdate,
    UserOut,
)
from models.schemas.params import AppQueryParams


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


def list_apps(
    db: Session, user: UserOut, params: AppQueryParams
) -> list[ApplicationOut]:
    stmt = select(Application).where(Application.is_active)

    if user.role != "admin":
        # join checklists and assignments to filter by user_id
        stmt = (
            stmt.join(Application.checklists)
            .join(Checklist.assignments)
            .where(ChecklistAssignment.user_id == user.id)
        )
    # else:
    # stmt = stmt.where(Application.creator_id == user.id)
    sort_column = getattr(Application, params.sort_by)
    if params.sort_order == "desc":
        sort_column = desc(sort_column)
    else:
        sort_column = asc(sort_column)
    apps = db.scalars(stmt.order_by(sort_column)).all()
    # print("Apps in app controller", apps)
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
        if not app.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"App is in trash {app_id}",
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
            del_app = ApplicationOut.model_validate(app).model_dump()
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
        del_app = ApplicationOut.model_validate(app).model_dump()
        del_app["msg"] = "Successfully trashed app"
        return del_app

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete the app {str(e)}",
        )


def update_app_completion(app_id: str, db: Session):
    try:
        print("Inside app status func")
        result = db.execute(select(Application).where(Application.id == app_id))
        app = result.scalar_one_or_none()

        if not app:
            print("No app")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="App not found"
            )

        checklists = app.checklists
        if not checklists:
            print("No checklist")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No checklists found for this app",
            )

        app_status = all(c.is_completed for c in checklists)

        if app_status != app.is_completed:
            print(
                f"Status change found app_status: {app_status} - app.is_completed: {app.is_completed}"
            )
            app.is_completed = app_status
            db.commit()
            db.refresh(app)

        status_str = "complete" if app.is_completed else "incomplete"

        with open("app_log.txt", "a", encoding="utf-8") as f:
            f.write(f"App {app.name} marked {status_str}")
        print(f"App {app.name} marked {status_str}")

        return {"msg": f"App {app.name} marked {status_str}"}

    except HTTPException:
        raise

    except Exception as e:
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
            ApplicationOut.model_validate(trashed_app) for trashed_app in trashed_apps
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching trashed apps {str(e)}",
        )
