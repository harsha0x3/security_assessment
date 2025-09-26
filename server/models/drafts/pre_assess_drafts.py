from sqlalchemy import ForeignKey, String, JSON
from sqlalchemy.orm import Mapped, mapped_column
from typing import Any

from db.base import Base, BaseMixin


class PreAssessmentResDraft(Base, BaseMixin):
    __tablename__ = "pre_assessment_res_drafts"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )
    assessment_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pre_assessments.id"), nullable=False
    )
    responses: Mapped[Any] = mapped_column(JSON, nullable=True)
