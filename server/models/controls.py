from db.base import Base, BaseMixin
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Control(Base, BaseMixin):
    __tablename__ = "controls"

    checklist_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("checklists.id"), index=True
    )
    control_area: Mapped[str] = mapped_column(String(36), nullable=False)
    severity: Mapped[str] = mapped_column(String(10), nullable=False)
    control_text: Mapped[str] = mapped_column(Text, nullable=False)

    # ----------------Relationships--------------------
    checklist = relationship("Checklist", back_populates="controls")
    responses = relationship(
        "UserResponse", back_populates="control", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<control_id={self.id}, checklist_id={self.checklist_id}, control_area={self.control_area}>"
