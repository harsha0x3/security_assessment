from pydantic import BaseModel


class CreatePreAssessDraft(BaseModel):
    responses: dict[str, str] | None = None
