from pydantic import BaseModel, ConfigDict
from datetime import datetime


class DraftAnsItem(BaseModel):
    question_id: str | None = None
    answer_text: str | None = None


class CreatePreAssessDraft(BaseModel):
    responses: list[DraftAnsItem]


class PreAssessDraftOut(BaseModel):
    assessment_id: str
    user_id: str
    responses: list[DraftAnsItem]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
