from db.base import Base, BaseMixin
from sqlalchemy import Text, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class PreAssessment(Base, BaseMixin):
    __tablename__ = "pre_assessments"

    assessment_type: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)

    sections = relationship("Section", back_populates="pre_assessment")
