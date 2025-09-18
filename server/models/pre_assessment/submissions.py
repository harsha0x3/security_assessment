from db.base import Base, BaseMixin
from sqlalchemy import Text, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Submission(Base, BaseMixin):
    __tablename__ = "submissions"

    user_id: Mapped[str] = mapped_column(String(40), ForeignKey("users.id"))
    assessment_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("pre_assessments.id")
    )

    status: Mapped[str] = mapped_column(String(40), default="pending")

    user = relationship("User", back_populates="pre_assessment_submissions")
    pre_assessment = relationship("PreAssessment")
    answers = relationship("Answer", back_populates="submission")
