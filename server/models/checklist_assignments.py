from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base, BaseMixin


class ChecklistAssignment(Base, BaseMixin):
    __tablename__ = "checklist_assignments"

    checklist_id: Mapped[str] = mapped_column(String(40), ForeignKey("checklists.id"))
    user_id: Mapped[str] = mapped_column(String(40), ForeignKey("users.id"))

    checklist = relationship("Checklist", back_populates="assignments")
    user = relationship("User", back_populates="assignments")

    def __repr__(self) -> str:
        return f"<checklist_id={self.checklist_id}, user={self.user_id}>"
