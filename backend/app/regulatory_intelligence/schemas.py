from datetime import datetime

from pydantic import BaseModel


class RegulatorySourceCreate(BaseModel):
    regulation_code: str
    regulation_name: str
    authority: str
    jurisdiction_code: str
    jurisdiction_name: str
    official_url: str

    source_type: str = "official_webpage"
    legal_status: str = "active"
    trust_tier: int = 1
    monitoring_enabled: bool = True


class RegulatorySourceResponse(RegulatorySourceCreate):
    id: int
    content_hash: str | None = None
    current_version: str | None = None
    last_checked_at: datetime | None = None
    last_changed_at: datetime | None = None

    model_config = {
        "from_attributes": True
    }


class RegulatoryChangeResponse(BaseModel):
    id: int
    source_id: int

    old_hash: str | None = None
    new_hash: str

    change_type: str
    review_status: str
    impact_status: str

    summary: str | None = None

    detected_at: datetime
    reviewed_at: datetime | None = None

    model_config = {
        "from_attributes": True
    }


class RegulatorySnapshotResponse(BaseModel):
    id: int
    source_id: int
    content_hash: str
    snapshot_type: str
    captured_at: datetime

    model_config = {
        "from_attributes": True
    }