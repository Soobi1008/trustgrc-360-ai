from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AISystemCreate(BaseModel):
    organization_id: int
    name: str = Field(min_length=2, max_length=200)
    description: str | None = None
    business_owner: str | None = None
    vendor: str | None = None
    model_type: str | None = None
    deployment_status: str = "Planned"
    risk_level: str = "Not Assessed"
    eu_ai_act_category: str = "Not Classified"
    data_classification: str | None = None
    status: str = "Active"


class AISystemResponse(AISystemCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)