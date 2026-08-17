from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    Field,
    field_validator,
)


# =========================================================
# REGULATORY SOURCE SCHEMAS
# =========================================================

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


class RegulatorySourceResponse(
    RegulatorySourceCreate
):
    id: int

    content_hash: str | None = None
    current_version: str | None = None

    last_checked_at: datetime | None = None
    last_changed_at: datetime | None = None

    model_config = {
        "from_attributes": True
    }


# =========================================================
# REGULATORY CHANGE RESPONSE
# =========================================================

class RegulatoryChangeResponse(BaseModel):
    id: int
    source_id: int

    old_hash: str | None = None
    new_hash: str

    # -----------------------------------------------------
    # EVIDENCE / PROVENANCE
    # -----------------------------------------------------

    previous_snapshot_id: int | None = None
    new_snapshot_id: int | None = None

    technical_severity: str | None = None
    difference_ratio: float | None = None

    evidence_status: str

    # -----------------------------------------------------
    # TECHNICAL CHANGE CLASSIFICATION
    # -----------------------------------------------------

    change_type: str

    summary: str | None = None
    detected_at: datetime

    # -----------------------------------------------------
    # REVIEW WORKFLOW
    # -----------------------------------------------------

    review_status: str
    review_decision: str | None = None
    review_notes: str | None = None

    reviewed_by_user_id: int | None = None
    reviewed_at: datetime | None = None

    # -----------------------------------------------------
    # IMPACT ANALYSIS
    # -----------------------------------------------------

    impact_status: str
    impact_level: str | None = None
    impact_summary: str | None = None

    # -----------------------------------------------------
    # PUBLICATION
    # -----------------------------------------------------

    published_at: datetime | None = None

    model_config = {
        "from_attributes": True
    }


# =========================================================
# REGULATORY SNAPSHOT RESPONSE
# =========================================================

class RegulatorySnapshotResponse(BaseModel):
    id: int
    source_id: int

    content_hash: str
    normalized_content: str

    snapshot_type: str

    # -----------------------------------------------------
    # SOURCE PROVENANCE
    # -----------------------------------------------------

    source_url: str | None = None

    retrieval_status: str

    content_type: str | None = None

    authoritative_identifier: str | None = None
    authoritative_version: str | None = None

    retrieved_at: datetime | None = None
    captured_at: datetime

    model_config = {
        "from_attributes": True
    }

# =========================================================
# REGULATORY CHANGE EVIDENCE RESPONSE
# =========================================================

class RegulatoryChangeEvidenceResponse(BaseModel):
    """
    Complete evidence package for a detected
    regulatory change.

    Used by the Regulatory Intelligence review
    interface to present the authoritative source,
    previous snapshot, new snapshot, and technical
    change evidence in one response.
    """

    change: RegulatoryChangeResponse

    source: RegulatorySourceResponse

    previous_snapshot: (
        RegulatorySnapshotResponse | None
    ) = None

    new_snapshot: (
        RegulatorySnapshotResponse | None
    ) = None

    evidence_complete: bool

    evidence_warning: str | None = None


# =========================================================
# REGULATORY CHANGE REVIEW REQUEST
# =========================================================

class RegulatoryChangeReviewRequest(BaseModel):
    review_decision: Literal[
        "confirmed",
        "dismissed",
        "needs_more_information",
    ]

    change_type: Literal[
        "unclassified",
        "editorial",
        "guidance_change",
        "scope_change",
        "obligation_change",
        "enforcement_change",
        "effective_date_change",
        "other",
    ]

    review_notes: str = Field(
        min_length=10,
        max_length=5000,
    )

    @field_validator(
        "review_notes"
    )
    @classmethod
    def validate_review_notes(
        cls,
        value: str,
    ) -> str:
        cleaned = value.strip()

        blocked_values = {
            "string",
            "test",
            "n/a",
            "na",
            "none",
        }

        if (
            cleaned.casefold()
            in blocked_values
        ):
            raise ValueError(
                "Review notes must contain meaningful review information."
            )

        return cleaned


# =========================================================
# REGULATORY IMPACT ANALYSIS REQUEST
# =========================================================

class RegulatoryImpactReviewRequest(BaseModel):
    impact_level: Literal[
        "none",
        "low",
        "moderate",
        "high",
        "critical",
    ]

    impact_summary: str = Field(
        min_length=10,
        max_length=10000,
    )

    @field_validator(
        "impact_summary"
    )
    @classmethod
    def validate_impact_summary(
        cls,
        value: str,
    ) -> str:
        cleaned = value.strip()

        blocked_values = {
            "string",
            "test",
            "n/a",
            "na",
            "none",
        }

        if (
            cleaned.casefold()
            in blocked_values
        ):
            raise ValueError(
                "Impact summary must contain meaningful impact-analysis information."
            )

        return cleaned


# =========================================================
# REGULATORY PUBLICATION RESPONSE
# =========================================================

class RegulatoryPublishResponse(BaseModel):
    id: int

    review_status: str
    review_decision: str | None

    impact_status: str
    impact_level: str | None

    published_at: datetime

    message: str

    model_config = {
        "from_attributes": True
    }