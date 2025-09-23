from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base, BaseMixin


class Submission(Base, BaseMixin):
    __tablename__ = "submissions"

    user_id: Mapped[str] = mapped_column(String(40), ForeignKey("users.id"))
    assessment_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("pre_assessments.id")
    )

    status: Mapped[str] = mapped_column(String(40), default="pending")
    assessed_by: Mapped[str] = mapped_column(
        String(40), ForeignKey("users.id"), nullable=True
    )

    pre_assessment = relationship("PreAssessment")
    answers = relationship("Answer", back_populates="submission")
    submitted_user = relationship(
        "User", back_populates="pre_assessment_submissions", foreign_keys=[user_id]
    )
    assessed_person = relationship(
        "User", back_populates="assessed_submissions", foreign_keys=[assessed_by]
    )
