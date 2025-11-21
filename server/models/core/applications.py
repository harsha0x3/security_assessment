from sqlalchemy import ForeignKey, String, Text, select, and_
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .user_priorities import UserPriority
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from db.base import Base, BaseMixin


class Application(Base, BaseMixin):
    __tablename__ = "applications"

    name: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    platform: Mapped[str] = mapped_column(String(512), nullable=True)
    region: Mapped[str] = mapped_column(String(100), nullable=True)
    owner_name: Mapped[str] = mapped_column(String(512), nullable=True)
    provider_name: Mapped[str] = mapped_column(String(666), nullable=True)
    infra_host: Mapped[str] = mapped_column(String(512), nullable=True)
    app_tech: Mapped[str] = mapped_column(Text, nullable=True)
    department: Mapped[str] = mapped_column(String(128), nullable=True)
    is_completed: Mapped[bool] = mapped_column(default=False)
    creator_id: Mapped[str] = mapped_column(String(40), ForeignKey("users.id"))
    owner_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("users.id"), nullable=True
    )
    ticket_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("submissions.id"), unique=False, nullable=True
    )
    status: Mapped[str] = mapped_column(String(40), default="pending")
    titan_spoc: Mapped[str] = mapped_column(String(100), nullable=True)
    imitra_ticket_id: Mapped[str] = mapped_column(String(40), nullable=True)
    creator = relationship(
        "User", back_populates="created_applications", foreign_keys=[creator_id]
    )
    owner = relationship(
        "User", back_populates="owned_applications", foreign_keys=[owner_id]
    )
    checklists = relationship("Checklist", back_populates="app")

    def get_priority_for_user(self, user_id: str, db: Session) -> int:
        user_priority = (
            db.query(UserPriority)
            .filter_by(user_id=user_id, target_type="application", target_id=self.id)
            .first()
        )
        return user_priority.priority if user_priority else 2

    def set_priority_for_user(self, user_id: str, db: Session, priority_val: int):
        priority = db.scalar(
            select(UserPriority).where(
                and_(
                    UserPriority.target_type == "application",
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
                target_type="application",
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

    def refresh_completion_status(self):
        """Recalculate is_completed based on checklists."""
        self.is_completed = all(c.is_completed for c in self.checklists)

    def __repr__(self) -> str:
        return f"<app_id={self.id}, app_name={self.name}>"
