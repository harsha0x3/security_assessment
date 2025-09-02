from models.controls import Control
from fastapi import HTTPException, status

from models.schemas.crud_schemas import (
    ControlCreate,
    ControlOut,
    ControlRemove,
    ControlUpdate,
    UserOut,
    ControlWithResponseOut,
)
from sqlalchemy import select, and_
from models.checklists import Checklist
from sqlalchemy.orm import Session
from models.checklist_assignments import ChecklistAssignment
from models.user_responses import UserResponse


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
) -> list[ControlWithResponseOut]:
    try:
        # Check assignment
        stmt = select(ChecklistAssignment.user_id).where(
            and_(
                ChecklistAssignment.checklist_id == checklist_id,
                ChecklistAssignment.user_id == current_user.id,
            )
        )
        user_assigned = db.scalar(stmt)
        if not user_assigned and current_user.role != "admin":
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

        # Validate with Pydantic
        controls_with_responses = [
            ControlWithResponseOut(
                checklist_id=checklist_id,
                response_id=response.id if response else None,
                control_id=control.id,
                control_area=control.control_area,
                severity=control.severity,
                control_text=control.control_text,
                current_setting=response.current_setting if response else None,
                review_comment=response.review_comment if response else None,
                evidence_path=response.evidence_path if response else None,
            )
            for control, response in results
        ]

        return controls_with_responses

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch controls with responses. {str(e)}",
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch controls with responses. {str(e)}",
        )


def update_control(payload: ControlUpdate, control_id: str, db: Session):
    try:
        control = get_control(control_id=control_id, db=db)
        for key, val in payload.model_dump(exclude_none=True, exclude_unset=True):
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
