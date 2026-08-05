from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class AISystemBase(BaseModel):
    organization_id: int
    name: str
    description: str | None = None
    business_owner: str | None = None
    vendor: str | None = None

    ai_technologies: list[str] = Field(
        default_factory=list
    )

    deployment_status: str = "Planned"
    risk_level: str = "Not Assessed"
    eu_ai_act_category: str = "Not Classified"
    data_classification: str | None = None
    status: str = "Active"


class AISystemCreate(AISystemBase):
    pass


class AISystemUpdate(BaseModel):
    organization_id: int | None = None
    name: str | None = None
    description: str | None = None
    business_owner: str | None = None
    vendor: str | None = None
    ai_technologies: list[str] | None = None
    deployment_status: str | None = None
    risk_level: str | None = None
    eu_ai_act_category: str | None = None
    data_classification: str | None = None
    status: str | None = None


class AISystemResponse(AISystemBase):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    created_at: datetime