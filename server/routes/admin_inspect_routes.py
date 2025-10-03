from controllers.admin_inspect import get_subs_n_apps
from fastapi import APIRouter, Depends, HTTPException, status
from models.schemas.crud_schemas import UserOut
from typing import Annotated
from sqlalchemy.orm import Session
from services.auth.deps import get_current_user
from db.connection import get_db_conn

router = APIRouter(prefix="/admin", tags=["AdminInspect"])


@router.get("/submissions-applications")
async def fetch_submissions_and_applications(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    results = get_subs_n_apps(db)
    return results
