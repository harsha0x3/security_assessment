# from fastapi import HTTPException, status
# from sqlalchemy.orm import Session
# from models.controls import Control
# from models.user_responses import UserResponse
# from models.users import User
# from models.checklist_assignments import ControlAssignment
# from models.schemas import ResponseCreate, ResponseOut


# def submit_responses(
#     payload: list[ResponseCreate], db: Session, current_user: User
# ) -> list[ResponseOut]:
#     created_responses = []
#     for item in payload:
#         # Check assignment exists
#         assignment = (
#             db.query(ControlAssignment)
#             .filter_by(checklist_id=item.checklist_id, user_id=current_user.id)
#             .first()
#         )
#         if not assignment:
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="User not assigned to this checklist",
#             )

#         # Check control exists
#         control = db.query(Control).get(item.control_id)
#         if not control:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND, detail="Control not found"
#             )

#         response = UserResponse(
#             control_id=item.control_id,
#             user_id=current_user.id,
#             current_setting=item.current_setting,
#             review_comment=item.review_comment,
#             evidence_path=item.evidence_path,
#         )
#         db.add(response)
#         created_responses.append(response)
#     db.commit()
#     for r in created_responses:
#         db.refresh(r)
#     return [ResponseOut.from_orm(r) for r in created_responses]
