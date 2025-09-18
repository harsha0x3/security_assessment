from db.base import Base, BaseMixin
from sqlalchemy import Text, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Answer(Base, BaseMixin):
    __tablename__ = "answers"

    submission_id: Mapped[str] = mapped_column(String(40), ForeignKey("submissions.id"))
    question_id: Mapped[str] = mapped_column(String(40), ForeignKey("questions.id"))
    answer_text: Mapped[str] = mapped_column(Text, nullable=True)

    submission = relationship("Submission", back_populates="answers")
    question = relationship("Question")
