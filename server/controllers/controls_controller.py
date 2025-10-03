from fastapi import HTTPException, status
from sqlalchemy import and_, func, select, desc, asc
from sqlalchemy.orm import Session
import pandas as pd
from io import BytesIO, StringIO
from fastapi.responses import StreamingResponse

from models.core.checklist_assignments import ChecklistAssignment
from models.core.checklists import Checklist
from models.core.controls import Control
from models.schemas.crud_schemas import (
    ControlCreate,
    ControlOut,
    ControlRemove,
    ControlUpdate,
    ControlWithResponseOut,
    ControlWithResponseOutNonList,
    TotalsCount,
    UserOut,
)
from models.core.user_responses import UserResponse
from .checklist_controller import update_checklist_status
from models.schemas.params import ControlsResponsesQueryParams


def update_checklist_completion_for_user(checklist_id: str, user: UserOut, db: Session):
    """
    Check if all controls in the checklist have responses for the given user.
    Update checklist.is_completed accordingly.
    """
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
                UserResponse.user_id == user.id,
                UserResponse.control_id.in_(control_ids),
            )
        )
    print(
        f"Responses count, controls count for checklist {checklist_id}: {responses_count} , {len(control_ids)}"
    )
    checklist.is_completed = responses_count == len(control_ids)
    db.commit()  # ensures SQLAlchemy tracks the change
    db.refresh(checklist)  # refresh to get the updated state


def add_controls(control: ControlCreate, checklist_id: str, db: Session) -> ControlOut:
    try:
        checklist = db.scalar(select(Checklist).where(Checklist.id == checklist_id))
        if not checklist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Checklist Not found {checklist_id}",
            )

        new_control = Control(
            checklist_id=checklist.id,
            control_area=control.control_area,
            severity=control.severity,
            control_text=control.control_text,
            description=control.description,
        )

        db.add(new_control)
        db.commit()
        db.refresh(new_control)

        return ControlOut.model_validate(new_control)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add control: {str(e)}",
        )


def remove_controls(control_data: ControlRemove, db: Session):
    try:
        control = db.scalar(
            select(Control).where(Control.id == control_data.control_id)
        )
        if not control:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Checklist Not found {control_data.control_id}",
            )
        db.delete(control)
        db.commit()
        db.refresh(control)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add control: {str(e)}",
        )


def get_control(control_id: str, db: Session):
    try:
        control = db.scalar(select(Control).where(Control.id == control_id))
        if not control:
            # raise HTTPException(
            #     status_code=status.HTTP_404_NOT_FOUND,
            #     detail=f"Controls not found for Id: {control_id}",
            # )
            return ControlOut(
                checklist_id="",
                id="",
                control_area="",
                severity="",
                control_text="",
                description="",
            )
        return control

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get the control {str(e)}",
        )


def get_controls(
    checklist_id: str, db: Session, current_user: UserOut
) -> list[ControlOut]:
    try:
        stmt = select(ChecklistAssignment.user_id).where(
            ChecklistAssignment.checklist_id == checklist_id,
            ChecklistAssignment.user_id == current_user.id,
        )
        user_assigned_list = db.scalars(stmt).first()
        if not user_assigned_list and current_user.role != "admin":
            return [
                ControlOut(
                    checklist_id=checklist_id,
                    id="",
                    control_area="",
                    severity="",
                    control_text="",
                    description="",
                )
            ]
        controls = db.scalars(
            select(Control)
            .where(Control.checklist_id == checklist_id)
            .order_by(desc(Control.created_at))
        ).all()
        if not controls:
            return [
                ControlOut(
                    checklist_id=checklist_id,
                    id="",
                    control_area="",
                    severity="",
                    control_text="",
                    description="",
                )
            ]

        results = [ControlOut.model_validate(control) for control in controls]
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get controls {str(e)}",
        )


def get_controls_with_responses(
    checklist_id: str,
    db: Session,
    current_user: UserOut,
    params: ControlsResponsesQueryParams,
) -> ControlWithResponseOut | list:
    try:
        sort_order = params.sort_order
        filter_table = "controls"
        if filter_table == "controls":
            sort_column = getattr(Control, "created_at")
        elif filter_table == "responses":
            sort_column = getattr(UserResponse, "created_at")
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid filter table param {filter_table}",
            )

        if sort_order == "asc":
            sort_column_by = asc(sort_column)
        else:
            sort_column_by = desc(sort_column)
        if current_user.role == "admin":
            # Validate checklist exists
            checklist = db.scalar(select(Checklist).where(Checklist.id == checklist_id))
            if not checklist:
                return []

            if params.page >= 1:
                stmt = (
                    select(Control, UserResponse)
                    .outerjoin(
                        UserResponse, and_(UserResponse.control_id == Control.id)
                    )
                    .where(Control.checklist_id == checklist_id)
                    .order_by(sort_column_by, asc(Control.control_area))
                    .limit(params.page_size)
                    .offset(params.page * params.page_size - params.page_size)
                )
            else:
                stmt = (
                    select(Control, UserResponse)
                    .outerjoin(
                        UserResponse, and_(UserResponse.control_id == Control.id)
                    )
                    .where(Control.checklist_id == checklist_id)
                    .order_by(sort_column_by)
                )

            results = db.execute(stmt).all()
            total_controls = db.scalar(
                select(func.count(Control.id)).where(
                    Control.checklist_id == checklist_id
                )
            )

            total_responses = db.scalar(
                select(func.count(UserResponse.id)).where(
                    UserResponse.checklist_id == checklist_id
                )
            )

            total_counts = TotalsCount(
                total_responses=total_responses,
                total_controls=total_controls,
            )

            # Validate with Pydantic
            controls_with_responses_non = [
                ControlWithResponseOutNonList(
                    checklist_id=checklist_id,
                    response_id=response.id if response else None,
                    control_id=control.id,
                    control_area=control.control_area,
                    severity=control.severity,
                    control_text=control.control_text,
                    description=control.description,
                    current_setting=response.current_setting if response else None,
                    review_comment=response.review_comment if response else None,
                    evidence_path=response.evidence_path if response else None,
                    response_created_at=response.created_at if response else None,
                    response_updated_at=response.updated_at if response else None,
                    control_created_at=control.created_at if control else None,
                    control_updated_at=control.updated_at if control else None,
                )
                for control, response in results
            ]

            controls_with_responses = ControlWithResponseOut(
                list_controls=controls_with_responses_non,
                total_counts=total_counts,
            )

            update_checklist_status(checklist_id=checklist_id, user=current_user, db=db)
            return controls_with_responses

        # Check assignment
        stmt = select(ChecklistAssignment.user_id).where(
            and_(
                ChecklistAssignment.checklist_id == checklist_id,
                ChecklistAssignment.user_id == current_user.id,
            )
        )
        user_assigned = db.scalar(stmt)
        if not user_assigned:
            return []

        # Join controls with responses for this user
        stmt = (
            select(Control, UserResponse)
            .outerjoin(
                UserResponse,
                and_(
                    UserResponse.control_id == Control.id,
                    UserResponse.user_id == current_user.id,
                ),
            )
            .where(Control.checklist_id == checklist_id)
        )

        results = db.execute(stmt).all()

        total_controls = len(results)
        total_responses = sum(1 for _, response in results if response is not None)

        total_counts = TotalsCount(
            total_responses=total_responses,
            total_controls=total_controls,
        )

        # Validate with Pydantic
        controls_with_responses_non = [
            ControlWithResponseOutNonList(
                checklist_id=checklist_id,
                response_id=response.id if response else None,
                control_id=control.id,
                control_area=control.control_area,
                severity=control.severity,
                control_text=control.control_text,
                description=control.description,
                current_setting=response.current_setting if response else None,
                review_comment=response.review_comment if response else None,
                evidence_path=response.evidence_path if response else None,
                response_created_at=response.created_at if response else None,
                response_updated_at=response.updated_at if response else None,
                control_created_at=control.created_at if control else None,
                control_updated_at=control.updated_at if control else None,
            )
            for control, response in results
        ]

        controls_with_responses = ControlWithResponseOut(
            list_controls=controls_with_responses_non,
            total_counts=total_counts,
        )
        update_checklist_status(checklist_id=checklist_id, user=current_user, db=db)

        return controls_with_responses

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch controls with responses. {str(e)}",
        )


def update_control(payload: ControlUpdate, control_id: str, db: Session):
    try:
        control = get_control(control_id=control_id, db=db)
        for key, val in payload.model_dump(exclude_unset=True).items():
            setattr(control, key, val)

        db.commit()
        db.refresh(control)

        updated_result = ControlOut.model_validate(control).model_dump()
        updated_result["msg"] = "Control Updated successfully"
        return updated_result

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update the control: {str(e)}",
        )


def import_controls(target_checklist_id: str, source_checklist_id: str, db: Session):
    try:
        target_checklist = db.scalar(
            select(Checklist).where(Checklist.id == target_checklist_id)
        )
        if not target_checklist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "msg": "Target Checklist Not found",
                    "data": f"Target Checklist Not found for checklist id {target_checklist_id}",
                },
            )
        source_checklist = db.scalar(
            select(Checklist).where(Checklist.id == source_checklist_id)
        )
        if not source_checklist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "msg": "Source Checklist Not found",
                    "data": f"Source Checklist Not found for checklist id {source_checklist_id}",
                },
            )
        new_controls = [
            Control(
                checklist_id=target_checklist.id,
                control_area=control.control_area,
                severity=control.severity,
                control_text=control.control_text,
                description=control.description,
            )
            for control in source_checklist.controls
        ]
        db.add_all(new_controls)
        db.commit()

        return {"msg": f"Succesfully added {len(new_controls)} Controls."}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import controls {str(e)}",
        )


def add_controls_from_file(
    file_content: bytes, file_name: str, checklist_id: str, db: Session
):
    df = (
        pd.read_csv(BytesIO(file_content))
        if file_name.endswith(".csv")
        else pd.read_excel(BytesIO(file_content))
    )
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

    required_columns = ["control_area", "severity", "control_text", "description"]
    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(missing_cols)}",
        )
    valid_severities = ["low", "medium", "high", "critical"]
    invalid_severities = (
        df.loc[~df["severity"].str.lower().isin(valid_severities), "severity"]
        .dropna()
        .unique()
    )
    if len(invalid_severities) > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid severity values: {', '.join(invalid_severities)}. "
            f"Must be one of: {', '.join(valid_severities)}",
        )

    errors = []
    new_controls = []
    df["control_area"] = df["control_area"].ffill()

    for index, row in df.iterrows():
        control_data = {
            "checklist_id": checklist_id,
            "control_area": str(row["control_area"]).strip(),
            "severity": str(row["severity"]).strip(),
            "control_text": str(row["control_text"]).strip(),
            "description": str(row.get("description", "")).strip()
            if pd.notna(row.get("description"))
            else None,
        }

        if not control_data["control_area"] or not control_data["control_text"]:
            errors.append(f"Row {index}: Control area and control text cannot be empty")
            continue

        new_controls.append(Control(**control_data))

    try:
        db.add_all(new_controls)
        db.commit()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding data from file: {str(e)}",
        )

    return {"msg": f"Added {df.shape[0]} row to the checklist"}


def export_controls_csv(checklist_id: str, db: Session, current_user: UserOut):
    checklist = db.get(Checklist, checklist_id)
    params = ControlsResponsesQueryParams(
        sort_by="created_at", sort_order="desc", page=-1, page_size=100
    )
    data = get_controls_with_responses(
        checklist_id=checklist_id, db=db, current_user=current_user, params=params
    )
    if not data or not data.list_controls:  # type: ignore
        raise HTTPException(status_code=404, detail="No controls found")

    EXCLUDE_COLUMNS = [
        "checklist_id",
        "response_created_at",
        "response_updated_at",
        "control_created_at",
        "control_updated_at",
    ]

    records = [c.model_dump() for c in data.list_controls]

    df = pd.DataFrame(records)
    df = df.drop(columns=[col for col in EXCLUDE_COLUMNS if col in df.columns])
    output = StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={checklist.checklist_type}_controls.csv"
        },
    )
