from db.base import Base, BaseMixin
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship


class UserResponse(Base, BaseMixin):
    __tablename__ = "user_responses"

    control_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("controls.id", index=True)
    )
    user_id: Mapped[str] = mapped_column(String(40), ForeignKey("users.id"), index=True)
    current_setting: Mapped[str] = mapped_column(Text, nullable=True)
    review_comment: Mapped[str] = mapped_column(Text, nullable=True)
    evidence_path: Mapped[str] = mapped_column(Text, nullable=True)

    control = relationship("Control", back_populates="responses")
    user = relationship("User", back_populates="responses")

    def __repr__(self) -> str:
        return f"<response_id={self.id}, control_id={self.control_id}>"
