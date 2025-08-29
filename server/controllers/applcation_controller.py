from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from models.applications import Application
from models.users import User
from models.schemas.crud_schemas import ApplicationCreate, ApplicationOut


def create_application(
    payload: ApplicationCreate, db: Session, creator: User
) -> ApplicationOut:
    try:
        app = Application(**payload.dict(), creator_id=creator.id)
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


def list_applications(db: Session, user: User) -> list[ApplicationOut]:
    stmt = select(Application)
    if user.role != "admin":
        stmt = stmt.where(Application.creator_id == user.id)

    apps = db.scalars(stmt).all()
    return [ApplicationOut.from_orm(app) for app in apps]
