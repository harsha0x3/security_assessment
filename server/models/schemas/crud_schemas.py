from datetime import datetime
from zoneinfo import ZoneInfo

from pydantic import BaseModel, ConfigDict


class AllUsersOut(BaseModel):
    username: str
    first_name: str | None
    last_name: str | None
    role: str
    mfa_secret: str | None
    mfa_recovery_codes: str | None


class ApplicationCreate(BaseModel):
    name: str
    description: str
    platform: str
    region: str
    owner_name: str
    provider_name: str
    infra_host: str | None = None
    app_tech: str | None = None


class ApplicationOut(BaseModel):
    id: str
    name: str
    description: str
    platform: str
    region: str
    owner_name: str
    provider_name: str
    infra_host: str | None = None
    app_tech: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    # Automatically convert UTC -> Asia/Kolkata

    model_config = ConfigDict(from_attributes=True)


class ApplicationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    platform: str | None = None
    region: str | None = None
    owner_name: str | None = None
    provider_name: str | None = None
    infra_host: str | None = None
    app_tech: str | None = None


class ChecklistCreate(BaseModel):
    checklist_type: str


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    first_name: str
    last_name: str
    role: str

    created_at: datetime | None = None
    updated_at: datetime | None = None

    # Automatically convert UTC -> Asia/Kolkata

    model_config = ConfigDict(from_attributes=True)


class ChecklistOut(BaseModel):
    id: str
    app_name: str
    checklist_type: str
    assigned_users: list[dict] | None = None
    is_completed: bool

    created_at: datetime | None = None
    updated_at: datetime | None = None

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

    created_at: datetime | None = None
    updated_at: datetime | None = None

    # Automatically convert UTC -> Asia/Kolkata

    model_config = ConfigDict(from_attributes=True)


class AssignmentCreate(BaseModel):
    user_ids: list[str]


class AssignmentOut(BaseModel):
    checklist_id: str
    assigned_users: list[UserOut]

    created_at: datetime | None = None
    updated_at: datetime | None = None

    # Automatically convert UTC -> Asia/Kolkata

    model_config = ConfigDict(from_attributes=True)


class UserResponseCreate(BaseModel):
    current_setting: str
    review_comment: str
    evidence_path: str | None = None


class UserResponseUpdate(BaseModel):
    current_setting: str | None = None
    review_comment: str | None = None
    evidence_path: str | None = None


class UserResponseOut(BaseModel):
    id: str
    control_id: str
    user_id: str
    current_setting: str
    review_comment: str
    evidence_path: str | None = None

    created_at: datetime | None = None
    updated_at: datetime | None = None

    # Automatically convert UTC -> Asia/Kolkata

    model_config = ConfigDict(from_attributes=True)


class TotalsCount(BaseModel):
    total_responses: int | None = None
    total_controls: int | None = None


class ControlWithResponseOutNonList(BaseModel):
    checklist_id: str
    response_id: str | None = None
    control_id: str
    control_area: str
    severity: str
    control_text: str
    current_setting: str | None = None
    review_comment: str | None = None
    evidence_path: str | None = None

    control_created_at: datetime | None = None
    control_updated_at: datetime | None = None
    response_created_at: datetime | None = None
    response_updated_at: datetime | None = None

    def convert_to_local(self, dt: datetime) -> str:
        if dt.tzinfo is None:
            # make naive UTC aware
            dt = dt.replace(tzinfo=ZoneInfo("UTC"))
        local_dt = dt.astimezone(ZoneInfo("Asia/Kolkata"))
        return local_dt.isoformat()


class ControlWithResponseOut(BaseModel):
    list_controls: list[ControlWithResponseOutNonList] = []
    total_counts: TotalsCount


class ControlsWithChecklist(BaseModel):
    model_config = ConfigDict(from_attributes=True)
