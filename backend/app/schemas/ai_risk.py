from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class AIRiskBase(BaseModel):
    ai_system_id: int

    title: str = Field(
        min_length=3,
        max_length=255,
    )

    description: str | None = None

    risk_category: str = Field(
        min_length=2,
        max_length=100,
    )

    likelihood: int = Field(
        default=1,
        ge=1,
        le=5,
    )

    impact: int = Field(
        default=1,
        ge=1,
        le=5,
    )

    owner: str | None = None
    treatment_plan: str | None = None

    status: str = "Open"


class AIRiskCreate(AIRiskBase):
    pass


class AIRiskUpdate(BaseModel):
    ai_system_id: int | None = None

    title: str | None = Field(
        default=None,
        min_length=3,
        max_length=255,
    )

    description: str | None = None

    risk_category: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    likelihood: int | None = Field(
        default=None,
        ge=1,
        le=5,
    )

    impact: int | None = Field(
        default=None,
        ge=1,
        le=5,
    )

    owner: str | None = None
    treatment_plan: str | None = None
    status: str | None = None


class AIRiskResponse(AIRiskBase):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    inherent_risk_score: int
    residual_risk_score: int
    created_at: datetime