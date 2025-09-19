from typing import Annotated, Literal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Path,
    status,
    UploadFile,
    File,
    Query,
)
from sqlalchemy.orm import Session

from controllers.controls_controller import (
    add_controls,
    get_controls,
    get_controls_with_responses,
    remove_controls,
    update_control,
    import_controls,
    add_controls_from_file,
    export_controls_csv,
)
from db.connection import get_db_conn
from models.schemas.crud_schemas import (
    ControlCreate,
    ControlOut,
    ControlRemove,
    ControlUpdate,
    ControlWithResponseOut,
    UserOut,
    ImportControlsRequest,
)
from services.auth.deps import get_current_user
from models import Checklist
from models.schemas.params import ControlsResponsesQueryParams

router = APIRouter(tags=["controls"])


@router.post("/checklists/{checklist_id}/control")
async def create_control(
    payload: Annotated[ControlCreate, "Data for creating a control"],
    checklist_id: Annotated[str, Path(title="Checklist Id")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
) -> Annotated[ControlOut, "Function to create a control and output it"]:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have the permission. {current_user.username}",
        )
    return add_controls(payload, checklist_id=checklist_id, db=db)


@router.get("/checklists/{checklist_id}/controls")
async def fetch_controls(
    checklist_id: Annotated[str, Path(title="Checklist Id")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
) -> Annotated[list[ControlOut], "Function to create a control and output it"]:
    # return {"msg":"Hello" }

    return get_controls(checklist_id=checklist_id, db=db, current_user=current_user)


@router.get("/checklists/{checklist_id}/controls-responses")
async def fetch_controls_with_responses(
    checklist_id: Annotated[str, Path(title="Checklist Id")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    sort_by: Annotated[str, Query()] = "created_at",
    sort_order: Annotated[Literal["asc", "desc"], Query()] = "desc",
    page: Annotated[int, Query()] = 1,
    page_size: Annotated[int, Query()] = 10,
) -> Annotated[
    ControlWithResponseOut | list, "Function to create a control and output it"
]:
    params = ControlsResponsesQueryParams(
        sort_by=sort_by, sort_order=sort_order, page=page, page_size=page_size
    )
    return get_controls_with_responses(
        checklist_id=checklist_id, db=db, current_user=current_user, params=params
    )


@router.patch("/control/{control_id}")
async def patch_control(
    payload: Annotated[ControlUpdate, ""],
    control_id: Annotated[str, Path(title="Checklist Id")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have the permission. {current_user.username}",
        )
    return update_control(payload, control_id, db)


@router.delete("/control/{control_id}")
async def delete_control(
    control_id: Annotated[str, Path(title="Checklist Id")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have the permission. {current_user.username}",
        )
    payload = ControlRemove(control_id=control_id)
    return remove_controls(payload, db)


@router.post("/controls/import")
async def importing_controls(
    request: Annotated[ImportControlsRequest, ""],
    db: Annotated[Session, Depends(get_db_conn), ""],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have the permission. {current_user.username}",
        )
    return import_controls(
        target_checklist_id=request.target_checklist_id,
        source_checklist_id=request.source_checklist_id,
        db=db,
    )


@router.post("/checklists/{checklist_id}/controls/upload")
async def upload_controls_file(
    checklist_id: Annotated[
        str,
        Path(...),
    ],
    input_file: Annotated[UploadFile, File(...)],
    db: Annotated[Session, Depends(get_db_conn), ""],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have the permission. {current_user.username}",
        )

    if not input_file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please Upload the file",
        )
    checklist = db.get(Checklist, checklist_id)
    if not checklist:
        print(f"Checklist with ID {checklist_id} not found.")
        return
    try:
        content = await input_file.read()
        if input_file.filename is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file must have a filename",
            )
        result = add_controls_from_file(content, input_file.filename, checklist_id, db)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.get("/checklists/{checklist_id}/controls-responses/export")
async def export_conrols_as_csv(
    checklist_id: Annotated[str, Path(title="Checklist Id")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    return export_controls_csv(
        checklist_id=checklist_id, db=db, current_user=current_user
    )
