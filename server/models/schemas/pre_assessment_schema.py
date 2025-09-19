from pydantic import BaseModel, ConfigDict
from enum import Enum
from .crud_schemas import UserOut
from datetime import datetime


class AssessmentType(str, Enum):
    ai = "ai_assessment"
    regular = "regular_assessment"


class AssessmentCreate(BaseModel):
    assessment_type: str
    description: str | None = None


class AssesmentUpdate(BaseModel):
    assessment_type: AssessmentType | None = None
    description: str | None = None


class AssessmentOut(BaseModel):
    id: str
    assessment_type: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class SectionCreate(BaseModel):
    title: str


class SectionUpdate(BaseModel):
    title: str | None = None


class SectionOut(BaseModel):
    id: str
    assessment_id: str
    title: str

    model_config = ConfigDict(from_attributes=True)


class QuestionCreate(BaseModel):
    question_text: str


class QuestionUpdate(BaseModel):
    question_text: str | None = None


class QuestionOut(BaseModel):
    id: str
    question_text: str
    section_id: str

    model_config = ConfigDict(from_attributes=True)


class AnswerCreate(BaseModel):
    question_id: str
    answer_text: str


class AnswerOut(BaseModel):
    question_id: str
    answer_text: str

    model_config = ConfigDict(from_attributes=True)


class SubmissionsOut(BaseModel):
    id: str
    status: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    submitted_user: UserOut | None = None
    assessment: AssessmentOut
    assessed_by: UserOut | None = None


class PreAssessmentEvaluateSchema(BaseModel):
    status: str
    reason: str | None = None
