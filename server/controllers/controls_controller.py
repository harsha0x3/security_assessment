from models.controls import Control
from fastapi import HTTPException, status

from models.schemas.crud_schemas import ControlCreate, ControlOut
from models.users import User
from sqlalchemy import select
from models.checklists import Checklist
from sqlalchemy.orm import Session


def add_controls(control: ControlCreate, db: Session) -> ControlOut:
    try:
        checklist = db.scalar(
            select(Checklist).where(Checklist.id == control.checklist_id)
        )
        if not checklist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Checklist Not found {control.checklist_id}",
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


def remove_controls(checklist_id: str, control_id: str, db: Session):
    try:
        checklist = db.scalar(select(Checklist).where(Checklist.id == checklist_id))
        if not checklist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Checklist Not found {checklist_id}",
            )

        control = db.scalar(select(Control).where(Control.id == control_id))
        db.delete(control)
        db.commit
        db.refresh(control)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add control: {str(e)}",
        )
