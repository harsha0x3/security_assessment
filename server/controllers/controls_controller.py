from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from models.checklist_assignments import ChecklistAssignment
from models.checklists import Checklist
from models.controls import Control
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
from models.user_responses import UserResponse
from .checklist_controller import update_checklist_status


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
                )
            ]
        controls = db.scalars(
            select(Control).where(Control.checklist_id == checklist_id)
        ).all()
        if not controls:
            return [
                ControlOut(
                    checklist_id=checklist_id,
                    id="",
                    control_area="",
                    severity="",
                    control_text="",
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
    checklist_id: str, db: Session, current_user: UserOut
) -> ControlWithResponseOut | list:
    try:
        if current_user.role == "admin":
            # Validate checklist exists
            checklist = db.scalar(select(Checklist).where(Checklist.id == checklist_id))
            if not checklist:
                return []

            stmt = (
                select(Control, UserResponse)
                .outerjoin(UserResponse, and_(UserResponse.control_id == Control.id))
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


# def delete_control
