from db.base import Base, BaseMixin
from sqlalchemy import Text, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Question(Base, BaseMixin):
    __tablename__ = "questions"

    section_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("sections.id"), nullable=False
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)

    section = relationship("Section", back_populates="questions")
