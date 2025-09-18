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
    UserResponseOut,
    UserResponseUpdate,
)
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

        checklist = control.checklist
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
            checklist_id=checklist.id,
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
            print("Not Found REsponse")
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
        print(update_data)

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
            print(f"Checklist with ID {checklist_id} not found.")
            return
        assigned_users = [
            assignment.user.to_dict_safe() for assignment in checklist.assignments
        ]

        if current_user.role != "admin" and current_user.id not in [
            u["id"] for u in assigned_users
        ]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You don't have permission {current_user.username}",
            )

        df = (
            pd.read_csv(BytesIO(file_content))
            if file_name.endswith(".csv")
            else pd.read_excel(BytesIO(file_content))
        )
        df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

        required_columns = [
            "control_id",
            "control_area",
            "severity",
            "control_text",
            "description",
            "current_setting",
            "review_comment",
        ]
        missing_cols = [col for col in required_columns if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_cols)}",
            )

        # if df["control_id"].notna().sum() != df["current_setting"].notna().sum():
        #     raise HTTPException(
        #         status_code=status.HTTP_400_BAD_REQUEST,
        #         detail="Mismatch between control_id and current_setting counts",
        #     )

        print("DF HEAD", df.head())

        for idx, row in df.iterrows():
            da = {
                "response_id": row["response_id"],
                "current_setting": str(row["current_setting"]),
                "review_comment": str(row["review_comment"]),
            }
            print(f"DF DATA: \n {da}")
            if pd.notna(row["response_id"]):
                payload = UserResponseUpdate(
                    current_setting=str(row["current_setting"]),
                    review_comment=str(row["review_comment"]),
                )
                print(f"UPDATNG RESPONSE FROM FILE\n{payload.model_dump()}")
                update_user_response(
                    payload=payload,
                    response_id=str(row["response_id"]),
                    db=db,
                    current_user=current_user,
                )

            else:
                payload = UserResponseCreate(
                    current_setting=str(row["current_setting"]),
                    review_comment=str(row["review_comment"]),
                )
                print(f"ADDING RESPONSE FROM FILE\n{payload.model_dump()}")
                add_user_response(
                    payload=payload,
                    control_id=str(row["control_id"]),
                    db=db,
                    current_user=current_user,
                )
        return {"msg": "Added responses successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in adding response from file {str(e)}",
        )
