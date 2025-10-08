from sqlalchemy import ForeignKey, String, Text, select, and_
from sqlalchemy.orm import Mapped, mapped_column, relationship, Session
from .user_priorities import UserPriority
from fastapi import HTTPException, status

from db.base import Base, BaseMixin


class Checklist(Base, BaseMixin):
    __tablename__ = "checklists"

    app_id: Mapped[str] = mapped_column(String(40), ForeignKey("applications.id"))
    checklist_type: Mapped[str] = mapped_column(String(512), nullable=False)
    creator_id: Mapped[str] = mapped_column(String(40), ForeignKey("users.id"))
    is_completed: Mapped[bool] = mapped_column(default=False)
    status: Mapped[str] = mapped_column(String(40), default="pending")
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    # ----------------Relationships------------
    app = relationship("Application", back_populates="checklists")
    controls = relationship(
        "Control", back_populates="checklist", cascade="all, delete-orphan"
    )
    responses = relationship(
        "UserResponse", back_populates="checklist", cascade="all, delete-orphan"
    )
    assignments = relationship(
        "ChecklistAssignment", back_populates="checklist", cascade="all, delete-orphan"
    )

    def get_priority_for_user(self, user_id: str, db: Session) -> int:
        user_priority = (
            db.query(UserPriority)
            .filter_by(user_id=user_id, target_type="checklist", target_id=self.id)
            .first()
        )
        return user_priority.priority if user_priority else 2

    def set_priority_for_user(self, user_id: str, db: Session, priority_val: int):
        priority = db.scalar(
            select(UserPriority).where(
                and_(
                    UserPriority.target_type == "checklist",
                    UserPriority.user_id == user_id,
                    UserPriority.target_id == self.id,
                )
            )
        )

        if priority:
            priority.priority = priority_val
        else:
            priority = UserPriority(
                user_id=user_id,
                target_type="checklist",
                target_id=self.id,
                priority=priority_val,
            )
            db.add(priority)
        try:
            db.commit()
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error setting the priority {str(e)}",
            )

    def __repr__(self) -> str:
        return f"<checklist_id={self.id}, checklist_type={self.checklist_type}>"
