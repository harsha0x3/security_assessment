from models.controls import Control
from fastapi import HTTPException, status

from models.schemas.crud_schemas import (
    ControlCreate,
    ControlOut,
    ControlRemove,
    ControlUpdate,
)
from models.users import User
from sqlalchemy import select
from models.checklists import Checklist
from sqlalchemy.orm import Session


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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Controls not found for Id: {control_id}",
            )
        return control

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get the control {str(e)}",
        )


def get_controls(checklist_id: str, db: Session) -> list[ControlOut]:
    try:
        controls = db.scalars(
            select(Control).where(Control.checklist_id == checklist_id)
        ).all()
        if not controls:
            print("NOT::")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Controls not found for CId: {checklist_id}",
            )
        results = [ControlOut.model_validate(control) for control in controls]
        return results
    except HTTPException:
        # Re-raise HTTPException so FastAPI can handle it properly
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get controls {str(e)}",
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
