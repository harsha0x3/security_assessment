import pandas as pd
from db.connection import get_db_conn
from pydantic import BaseModel
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from models.schemas.crud_schemas import UserOut
from models import Application
from sqlalchemy.exc import IntegrityError


class ApplicationCreateDump(BaseModel):
    name: str
    description: str | None = None
    platform: str | None = None
    region: str | None = None
    owner_name: str | None = None
    provider_name: str | None = None
    infra_host: str | None = None
    app_tech: str | None = None
    priority: int = 2
    department: str | None = None
    imitra_ticket_id: str | None = None

    is_completed: bool = False

    titan_spoc: str | None = None
    status: str | None = None


def create_app(
    payload: ApplicationCreateDump,
    db: Session,
    creator: UserOut | None = None,
    owner: UserOut | None = None,
):
    try:
        app = Application(
            **payload.model_dump(exclude={"priority"}),
            creator_id=creator.id
            if creator
            else "c80ebe2b-7cb0-4776-a75c-40efbf93aa02",
            owner_id=owner.id if owner else None,
        )

        db.add(app)
        db.flush()
        # app.set_priority_for_user(user_id=creator.id, db=db, priority_val=2)
        db.commit()
        db.refresh(app)
        # return ApplicationOut(
        #     **app.to_dict(),
        #     priority=2,
        # )
        return "created"

    except IntegrityError as e:
        print(f" error from contoller integrity {str(e)}")
        db.rollback()
        err_msg = str(e.orig)
        if ".name" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="App with the same name already exists",
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate entry to the app detected.",
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f" error from contoller exception {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create application: {str(e)}",
        )


def clean(val):
    """Convert NaN/None to empty string and strip spaces."""
    return "" if pd.isna(val) or val is None else str(val).strip()


def dump_app_data():
    print("IN")
    df = pd.read_excel(
        r"C:\Users\Administrator\Desktop\App Dashboard 2025.xlsx", header=1
    )

    db = next(get_db_conn())  # single DB session

    for _, row in df.iterrows():
        data = row.to_dict()

        app_name = clean(data.get("Application"))
        if not app_name:
            print(" Skipped row (No Application name)")
            continue

        new_app = ApplicationCreateDump(
            name=app_name,
            description=clean(data.get("Use Case")),
            provider_name=clean(data.get("Vendor Company")),
            imitra_ticket_id=clean(data.get("iMitra Ticket No")),
            platform=clean(data.get("Environment")),
            department=clean(data.get("Business/Vertical")),
            status=clean(data.get("IS ASSESSMENT STATUS")),
            titan_spoc=clean(data.get("Titan SPOC")),
            is_completed=clean(data.get("IS ASSESSMENT STATUS")).lower() == "completed",
        )

        try:
            create_app(payload=new_app, db=db)
            print(f" Inserted: {app_name}")

        except Exception as e:
            msg = str(e).lower()
            if "duplicate" in msg or "already exists" in msg or "1062" in msg:
                print(f" Skipped duplicate: {app_name}")
            else:
                print(f" Error inserting {app_name}: {e}")


dump_app_data()

