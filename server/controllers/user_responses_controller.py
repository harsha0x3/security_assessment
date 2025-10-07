import os
import shutil
from io import BytesIO

import pandas as pd
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from models.core.controls import Control
from models.schemas.crud_schemas import (
    UserOut,
    UserResponseCreate,
    UserResponseCreateBulk,
    UserResponseOut,
    UserResponseUpdate,
)
from .checklist_controller import update_checklist_status
from models.core.user_responses import UserResponse
from models.core.checklists import Checklist

ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
UPLOAD_DIR = os.path.join(ROOT_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


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
            checklist_id=control.checklist_id,
            user_id=current_user.id,
            current_setting=payload.current_setting,
            review_comment=payload.review_comment,
            evidence_path=payload.evidence_path,
        )

        db.add(response)
        db.commit()
        db.refresh(response)

        update_checklist_status(checklist_id=control.checklist_id, db=db)
        return UserResponseOut.model_validate(response)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add the response. {str(e)}",
        )


def save_bulk_responses(
    payload: list[UserResponseCreateBulk],
    checklist_id: str,
    db: Session,
    current_user: UserOut,
):
    try:
        checklist = db.get(Checklist, checklist_id)
        if not checklist:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Checklist doesn't esist for writing responses",
            )
        new_responses = [UserResponse(**res.model_dump()) for res in payload]
        db.add_all(new_responses)
        db.commit()
        for r in new_responses:
            db.refresh(r)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in adding responses, {str(e)}",
        )


def update_user_response(
    payload: UserResponseUpdate, response_id: str, db: Session, current_user: UserOut
) -> UserResponseOut:
    response = db.scalar(select(UserResponse).where(UserResponse.id == response_id))
    if not response:
        raise HTTPException(404, f"Response {response_id} not found")

    if response.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to edit this response",
        )
    try:
        for key, val in payload.model_dump(exclude_unset=True).items():
            setattr(response, key, val)

        db.commit()
        db.refresh(response)
        return UserResponseOut.model_validate(response)

    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to update response: {e}")


def save_uploaded_file(
    file: UploadFile | None, user_id: str, control_id: str
) -> str | None:
    if not file:
        return None

    file_name = f"{user_id}_{control_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    if os.path.exists(file_path):
        os.remove(file_path)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return f"{file_name}"


def isResponded(control_id: str, db: Session):
    try:
        control = db.get(Control, control_id)
        if not control:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Control Not found for adding response from csv {control_id}",
            )

        return True if control.responses else False
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in validating is responded {str(e)}",
        )


def add_responses_from_csv(
    file_content: bytes,
    file_name: str,
    current_user: UserOut,
    checklist_id: str,
    db: Session,
):
    try:
        checklist = db.get(Checklist, checklist_id)
        if not checklist:
            raise HTTPException(404, f"Checklist {checklist_id} not found")

        assigned_user_ids = [a.user_id for a in checklist.assignments]
        if current_user.role != "admin" and current_user.id not in assigned_user_ids:
            raise HTTPException(403, "Not authorized for this checklist")

        df = (
            pd.read_csv(BytesIO(file_content))
            if file_name.endswith(".csv")
            else pd.read_excel(BytesIO(file_content))
        )
        df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

        required = {"control_id", "current_setting", "review_comment"}
        missing = required - set(df.columns)
        if missing:
            raise HTTPException(400, f"Missing columns: {', '.join(missing)}")

        df = df.dropna(subset=["control_id"]).fillna("")
        control_ids_in_checklist = {c.id for c in checklist.controls}

        for c_id in df["control_id"]:
            if c_id not in control_ids_in_checklist:
                raise HTTPException(400, f"Control ID {c_id} not found in checklist")

        new_objs, updated_ids = [], []

        for _, row in df.iterrows():
            if pd.notna(row.get("response_id")):
                updated_ids.append(row["response_id"])
                payload = UserResponseUpdate(
                    current_setting=str(row["current_setting"]),
                    review_comment=str(row["review_comment"]),
                )
                update_user_response(payload, str(row["response_id"]), db, current_user)
            else:
                new_objs.append(
                    UserResponse(
                        control_id=str(row["control_id"]),
                        checklist_id=checklist_id,
                        user_id=current_user.id,
                        current_setting=str(row["current_setting"]),
                        review_comment=str(row["review_comment"]),
                    )
                )

        if new_objs:
            db.bulk_save_objects(new_objs)
            db.commit()

        update_checklist_status(checklist_id=checklist_id, db=db)
        return {"msg": f"Processed {len(df)} rows successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error processing CSV: {e}")
