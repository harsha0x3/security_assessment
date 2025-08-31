from enum import Enum

from pydantic import BaseModel, ConfigDict


class ApplicationCreate(BaseModel):
    name: str
    description: str
    platform: str
    region: str
    owner_name: str
    provider_name: str


class ApplicationOut(BaseModel):
    id: str
    name: str
    description: str
    platform: str
    region: str
    owner_name: str
    provider_name: str

    model_config = ConfigDict(from_attributes=True)


class ApplicationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    platform: str | None = None
    region: str | None = None
    owner_name: str | None = None
    provider_name: str | None = None


class ChecklistCreate(BaseModel):
    checklist_type: str


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    first_name: str
    last_name: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class ChecklistOut(BaseModel):
    id: str
    app_name: str
    checklist_type: str
    assigned_users: list[dict] | None = None

    model_config = ConfigDict(from_attributes=True)


class ChecklistUpdate(BaseModel):
    checklist_type: str


class ControlCreate(BaseModel):
    control_area: str
    severity: str
    control_text: str


class ControlRemove(BaseModel):
    control_id: str


class ControlUpdate(BaseModel):
    control_area: str | None = None
    severity: str | None = None
    control_text: str | None = None


class ControlOut(BaseModel):
    checklist_id: str
    id: str
    control_area: str
    severity: str
    control_text: str

    model_config = ConfigDict(from_attributes=True)


class AssignmentCreate(BaseModel):
    user_ids: list[str]


class AssignmentOut(BaseModel):
    checklist_id: str
    assigned_users: list[UserOut]

    model_config = ConfigDict(from_attributes=True)


class UserResponseCreate(BaseModel):
    current_setting: str
    review_comment: str
    evidence_path: str | None = None


class UserResponseUpdate(BaseModel):
    current_sestting: str | None = None
    review_comment: str | None = None
    evidence_path: str | None = None


class UserResponseOut(BaseModel):
    id: str
    control_id: str
    user_id: str
    current_setting: str
    review_comment: str
    evidence_path: str

    model_config = ConfigDict(from_attributes=True)
