from db.base import Base, BaseMixin
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Checklist(Base, BaseMixin):
    __tablename__ = "checklists"

    app_id: Mapped[str] = mapped_column(String(40), ForeignKey("applications.id"))
    checklist_type: Mapped[str] = mapped_column(String(25), nullable=False)
    creator_id: Mapped[str] = mapped_column(String(40), ForeignKey("users.id"))
    is_completed: Mapped[bool] = mapped_column(default=False)

    # ----------------Relationships------------
    app = relationship("Application", back_populates="checklists")
    controls = relationship(
        "Control", back_populates="checklist", cascade="all, delete-orphan"
    )
    assignments = relationship("ChecklistAssignment", back_populates="checklist")

    def __repr__(self) -> str:
        return f"<checklist_id={self.id}, checklist_type={self.checklist_type}>"
