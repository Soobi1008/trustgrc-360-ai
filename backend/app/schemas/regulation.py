from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class RegulationBase(BaseModel):
    name: str
    short_name: str | None = None
    regulation_type: str
    summary: str | None = None
    regulatory_authority: str | None = None
    official_source_url: str | None = None
    effective_date: date | None = None
    status: str
    extraterritorial: bool
    mandatory: bool


class RegulationResponse(RegulationBase):
    id: int
    last_verified_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)