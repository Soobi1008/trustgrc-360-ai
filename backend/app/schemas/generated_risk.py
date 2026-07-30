from datetime import datetime

from pydantic import BaseModel, ConfigDict


class GeneratedRiskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ai_system_id: int
    title: str
    category: str
    description: str
    reason_generated: str | None
    likelihood: str
    impact: str
    risk_score: int
    recommended_control: str
    regulation: str | None
    generation_source: str
    review_status: str
    created_at: datetime


class GeneratedRiskReview(BaseModel):
    review_status: str