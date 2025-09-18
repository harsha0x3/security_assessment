from db.base import Base, BaseMixin
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Section(Base, BaseMixin):
    __tablename__ = "sections"

    assessment_id: Mapped[str] = mapped_column(
        String(40),
        ForeignKey("pre_assessments.id"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)

    pre_assessment = relationship("PreAssessment", back_populates="sections")
    questions = relationship("Question", back_populates="section")
