from models.controls import Control
from models.user_responses import UserResponse
from models.schemas.crud_schemas import (
    UserResponseCreate,
    UserResponseOut,
    UserResponseUpdate,
    UserOut,
)
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from fastapi import HTTPException, status


def add_user_response(
    payload: UserResponseCreate, control_id: str, db: Session, current_user: UserOut
):
    try:
        # Fetch the control
        control = db.get(Control, control_id)
        if not control:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Control not found {control_id}",
            )

        # Prevent duplicate response
        existing = db.scalar(
            select(UserResponse).where(
                and_(
                    UserResponse.control_id == control_id,
                    UserResponse.user_id == current_user.id,
                )
            )
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted a response for this control",
            )

        # Create response
        response = UserResponse(
            control_id=control_id,
            user_id=current_user.id,
            current_setting=payload.current_setting,
            review_comment=payload.review_comment,
            evidence_path=payload.evidence_path,
        )

        db.add(response)
        db.commit()
        db.refresh(response)

        # Update checklist completion for this user
        # update_checklist_completion_for_user(control.checklist_id, current_user.id, db)
        # db.commit()  # commit the checklist update

        return UserResponseOut.model_validate(response)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add the response. {str(e)}",
        )


def update_user_response(
    payload: UserResponseUpdate, response_id: str, db: Session, current_user: UserOut
) -> UserResponseOut:
    try:
        response = db.scalar(select(UserResponse).where(UserResponse.id == response_id))
        if not response:
            return UserResponseOut(
                id=response_id,
                control_id="",
                user_id="",
                current_setting="",
                review_comment="",
                evidence_path="",
            )

        if response.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not allowed to edit this response",
            )
        update_data = payload.model_dump(exclude_unset=True)

        for key, val in update_data.items():
            setattr(response, key, val)

        db.commit()
        db.refresh(response)

        return UserResponseOut.model_validate(response)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update the response. {str(e)}",
        )
