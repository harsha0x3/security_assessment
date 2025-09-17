from pydantic import BaseModel, field_validator, Field
from typing import Literal


class AppQueryParams(BaseModel):
    sort_by: str = Field("created_at", description="Field to sort by")
    sort_order: Literal["asc", "desc"] = Field("desc", description="Sort order")
    search: str | None
    search_by: Literal[
        "name", "platform", "region", "owner_name", "provider_name", "department"
    ] = Field("name", description="The field you want to search by")
    page: int
    page_size: int

    @field_validator("sort_by")
    @classmethod
    def validate_sort_by(cls, v: str) -> str:
        valid_fields = {"updated_at", "name", "created_at", "priority"}
        if v not in valid_fields:
            raise ValueError(f"sort_by must be one of {valid_fields}")
        return v


class ChecklistQueryParams(BaseModel):
    sort_by: str = Field("created_at", description="Field to sort by")
    sort_order: Literal["asc", "desc"] = Field("desc", description="Sort order")

    search: str | None
    search_by: Literal["checklist_type", "priority", "is_completed"] = Field(
        "checklist_type", description="The field you want to search by"
    )
    page: int
    page_size: int

    @field_validator("sort_by")
    @classmethod
    def validate_sort_by(cls, v: str) -> str:
        valid_fields = {"updated_at", "checklist_type", "created_at", "priority"}
        if v not in valid_fields:
            raise ValueError(f"sort_by must be one of {valid_fields}")
        return v


class ControlsResponsesQueryParams(BaseModel):
    sort_by: str = Field("created_at", description="Field to sort by")
    sort_order: Literal["asc", "desc"] = Field("desc", description="Sort order")

    page: int
    page_size: int

    @field_validator("sort_by")
    @classmethod
    def validate_sort_by(cls, v: str) -> str:
        valid_fields = {"updated_at", "created_at", "control_area", "control_text"}
        if v not in valid_fields:
            raise ValueError(f"sort_by must be one of {valid_fields}")
        return v
