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
    name: str
    description: str
    platform: str
    region: str
    owner_name: str
    provider_name: str

    model_config = ConfigDict(from_attributes=True)


class ChecklistCreate(BaseModel):
    app_id: str
    checklist_type: str


class UserOut(BaseModel):
    id: str
    username: str


class ChecklistOut(BaseModel):
    id: str
    app_name: str
    checklist_type: str
    assigned_users: list[dict] | None = None

    model_config = ConfigDict(from_attributes=True)


class ControlCreate(BaseModel):
    checklist_id: str
    control_area: str
    severity: str
    control_text: str


class ControlOut(BaseModel):
    checklist_id: str
    control_area: str
    severity: str
    control_text: str

    model_config = ConfigDict(from_attributes=True)


class AssignmentCreate(BaseModel):
    checklist_id: str
    users: list[UserOut]


class AssignmentOut(BaseModel):
    checklist_id: str
    assigned_users: list[UserOut]

    model_config = ConfigDict(from_attributes=True)
