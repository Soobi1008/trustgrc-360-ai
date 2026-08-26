from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    Field,
    field_validator,
)


# =========================================================
# COMMON TYPES
# =========================================================

ReviewDecision = Literal[
    "confirmed",
    "dismissed",
    "needs_more_information",
]


RegulatoryChangeType = Literal[
    "unclassified",
    "editorial",
    "guidance_change",
    "scope_change",
    "obligation_change",
    "enforcement_change",
    "effective_date_change",
    "other",
]


ImpactLevel = Literal[
    "none",
    "low",
    "moderate",
    "high",
    "critical",
]


AnalysisOrigin = Literal[
    "human",
    "ai_assisted",
    "system_generated",
]


AnalysisStatus = Literal[
    "draft",
    "proposed",
    "under_review",
    "validated",
    "published",
    "superseded",
]


ProvisionReviewStatus = Literal[
    "pending_review",
    "reviewed",
    "validated",
    "rejected",
]


# =========================================================
# SHARED VALIDATION
# =========================================================

BLOCKED_PLACEHOLDER_VALUES = {
    "string",
    "test",
    "n/a",
    "na",
    "none",
    "null",
    "-",
}


def clean_meaningful_text(
    value: str,
    field_name: str,
) -> str:
    cleaned = value.strip()

    if (
        cleaned.casefold()
        in BLOCKED_PLACEHOLDER_VALUES
    ):
        raise ValueError(
            f"{field_name} must contain "
            "meaningful information."
        )

    return cleaned


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

    trust_tier: int = Field(
        default=1,
        ge=1,
    )

    monitoring_enabled: bool = True


class RegulatorySourceResponse(
    RegulatorySourceCreate
):
    id: int

    # -----------------------------------------------------
    # CANONICAL REGULATION LINK
    # -----------------------------------------------------

    regulation_id: int | None = None

    # -----------------------------------------------------
    # MONITORING STATE
    # -----------------------------------------------------

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
    # PHASE 1 IMPACT ANALYSIS
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

    Presents authoritative source information,
    previous/new snapshots, provenance metadata
    and technical comparison evidence.
    """

    change: RegulatoryChangeResponse

    source: RegulatorySourceResponse

    previous_snapshot: (
        RegulatorySnapshotResponse
        | None
    ) = None

    new_snapshot: (
        RegulatorySnapshotResponse
        | None
    ) = None

    evidence_complete: bool

    evidence_warning: str | None = None


# =========================================================
# REGULATORY CHANGE REVIEW REQUEST
# =========================================================

class RegulatoryChangeReviewRequest(BaseModel):
    review_decision: ReviewDecision

    change_type: RegulatoryChangeType

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
        return clean_meaningful_text(
            value,
            "Review notes",
        )


# =========================================================
# PHASE 1 REGULATORY IMPACT ANALYSIS REQUEST
# =========================================================

class RegulatoryImpactReviewRequest(BaseModel):
    impact_level: ImpactLevel

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
        return clean_meaningful_text(
            value,
            "Impact summary",
        )


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


# =========================================================
# PHASE 2
# CANONICAL REGULATORY KNOWLEDGE REFERENCES
# =========================================================

class RegulatoryKnowledgeRegulationResponse(
    BaseModel
):
    id: int

    name: str
    short_name: str | None = None

    regulation_type: str

    regulatory_authority: str | None = None
    official_source_url: str | None = None

    status: str

    model_config = {
        "from_attributes": True
    }


class RegulatoryKnowledgeArticleResponse(
    BaseModel
):
    id: int

    regulation_id: int

    article_number: str
    title: str | None = None

    summary: str | None = None
    source_url: str | None = None

    version: str

    effective_from: object | None = None
    effective_to: object | None = None

    model_config = {
        "from_attributes": True
    }


class RegulatoryKnowledgeObligationResponse(
    BaseModel
):
    id: int

    article_id: int

    obligation_code: str
    obligation_text: str

    obligation_type: str

    applies_to: str | None = None
    applicability_condition: str | None = None

    mandatory: bool
    risk_level: str

    model_config = {
        "from_attributes": True
    }


class RegulatoryKnowledgeControlResponse(
    BaseModel
):
    id: int

    obligation_id: int

    control_code: str
    control_name: str

    control_description: str | None = None

    evidence_required: str | None = None
    test_method: str | None = None

    model_config = {
        "from_attributes": True
    }


# =========================================================
# PHASE 2
# REGULATORY CHANGE ANALYSIS CREATE REQUEST
# =========================================================

class RegulatoryChangeAnalysisCreateRequest(
    BaseModel
):
    analysis_origin: AnalysisOrigin = "human"

    analysis_method: str | None = Field(
        default=None,
        max_length=255,
    )

    overall_impact_level: (
        ImpactLevel
        | None
    ) = None

    executive_summary: str | None = Field(
        default=None,
        max_length=15000,
    )

    generated_by_model: str | None = Field(
        default=None,
        max_length=255,
    )

    supersedes_analysis_id: int | None = Field(
        default=None,
        gt=0,
    )

    @field_validator(
        "analysis_method"
    )
    @classmethod
    def validate_analysis_method(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        return cleaned or None

    @field_validator(
        "executive_summary"
    )
    @classmethod
    def validate_executive_summary(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        if not cleaned:
            return None

        return clean_meaningful_text(
            cleaned,
            "Executive summary",
        )

    @field_validator(
        "generated_by_model"
    )
    @classmethod
    def validate_generated_model(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        return cleaned or None


# =========================================================
# PHASE 2
# REGULATORY CHANGE ANALYSIS UPDATE REQUEST
# =========================================================

class RegulatoryChangeAnalysisUpdateRequest(
    BaseModel
):
    analysis_method: str | None = Field(
        default=None,
        max_length=255,
    )

    overall_impact_level: (
        ImpactLevel
        | None
    ) = None

    executive_summary: str | None = Field(
        default=None,
        max_length=15000,
    )

    @field_validator(
        "analysis_method"
    )
    @classmethod
    def validate_analysis_method(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        return cleaned or None

    @field_validator(
        "executive_summary"
    )
    @classmethod
    def validate_executive_summary(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        if not cleaned:
            return None

        return clean_meaningful_text(
            cleaned,
            "Executive summary",
        )


# =========================================================
# PHASE 2
# PROVISION IMPACT CREATE REQUEST
# =========================================================

class RegulatoryProvisionImpactCreateRequest(
    BaseModel
):
    # -----------------------------------------------------
    # CANONICAL KNOWLEDGE REFERENCES
    # -----------------------------------------------------

    regulation_id: int = Field(
        gt=0,
    )

    regulation_article_id: int = Field(
        gt=0,
    )

    regulation_obligation_id: (
        int
        | None
    ) = Field(
        default=None,
        gt=0,
    )

    # -----------------------------------------------------
    # HUMAN-READABLE REFERENCE
    # -----------------------------------------------------

    provision_reference: str = Field(
        min_length=1,
        max_length=255,
    )

    provision_title: str | None = Field(
        default=None,
        max_length=500,
    )

    # -----------------------------------------------------
    # CHANGE CLASSIFICATION
    # -----------------------------------------------------

    change_type: RegulatoryChangeType

    # -----------------------------------------------------
    # REQUIREMENT COMPARISON
    # -----------------------------------------------------

    previous_requirement: str | None = Field(
        default=None,
        max_length=30000,
    )

    current_requirement: str | None = Field(
        default=None,
        max_length=30000,
    )

    change_explanation: str = Field(
        min_length=10,
        max_length=20000,
    )

    # -----------------------------------------------------
    # INTERPRETATION / IMPACT
    # -----------------------------------------------------

    legal_interpretation: str | None = Field(
        default=None,
        max_length=20000,
    )

    operational_impact: str | None = Field(
        default=None,
        max_length=20000,
    )

    recommended_action: str | None = Field(
        default=None,
        max_length=20000,
    )

    impact_level: ImpactLevel

    # -----------------------------------------------------
    # EVIDENCE
    # -----------------------------------------------------

    source_snapshot_id: int | None = Field(
        default=None,
        gt=0,
    )

    source_url: str | None = Field(
        default=None,
        max_length=4000,
    )

    # -----------------------------------------------------
    # VALIDATORS
    # -----------------------------------------------------

    @field_validator(
        "provision_reference"
    )
    @classmethod
    def validate_provision_reference(
        cls,
        value: str,
    ) -> str:
        return clean_meaningful_text(
            value,
            "Provision reference",
        )

    @field_validator(
        "provision_title"
    )
    @classmethod
    def validate_provision_title(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        return cleaned or None

    @field_validator(
        "change_explanation"
    )
    @classmethod
    def validate_change_explanation(
        cls,
        value: str,
    ) -> str:
        return clean_meaningful_text(
            value,
            "Change explanation",
        )

    @field_validator(
        "previous_requirement",
        "current_requirement",
        "legal_interpretation",
        "operational_impact",
        "recommended_action",
        "source_url",
    )
    @classmethod
    def clean_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        if not cleaned:
            return None

        return cleaned


# =========================================================
# PHASE 2
# PROVISION IMPACT UPDATE REQUEST
# =========================================================

class RegulatoryProvisionImpactUpdateRequest(
    BaseModel
):
    provision_reference: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    provision_title: str | None = Field(
        default=None,
        max_length=500,
    )

    change_type: (
        RegulatoryChangeType
        | None
    ) = None

    previous_requirement: str | None = Field(
        default=None,
        max_length=30000,
    )

    current_requirement: str | None = Field(
        default=None,
        max_length=30000,
    )

    change_explanation: str | None = Field(
        default=None,
        min_length=10,
        max_length=20000,
    )

    legal_interpretation: str | None = Field(
        default=None,
        max_length=20000,
    )

    operational_impact: str | None = Field(
        default=None,
        max_length=20000,
    )

    recommended_action: str | None = Field(
        default=None,
        max_length=20000,
    )

    impact_level: (
        ImpactLevel
        | None
    ) = None

    source_snapshot_id: int | None = Field(
        default=None,
        gt=0,
    )

    source_url: str | None = Field(
        default=None,
        max_length=4000,
    )

    @field_validator(
        "provision_reference"
    )
    @classmethod
    def validate_provision_reference(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return clean_meaningful_text(
            value,
            "Provision reference",
        )

    @field_validator(
        "change_explanation"
    )
    @classmethod
    def validate_change_explanation(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return clean_meaningful_text(
            value,
            "Change explanation",
        )

    @field_validator(
        "provision_title",
        "previous_requirement",
        "current_requirement",
        "legal_interpretation",
        "operational_impact",
        "recommended_action",
        "source_url",
    )
    @classmethod
    def clean_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        return cleaned or None


# =========================================================
# PHASE 2
# PROVISION HUMAN REVIEW REQUEST
# =========================================================

class RegulatoryProvisionImpactReviewRequest(
    BaseModel
):
    review_status: Literal[
        "validated",
        "rejected",
    ]

    review_notes: str = Field(
        min_length=10,
        max_length=10000,
    )

    @field_validator(
        "review_notes"
    )
    @classmethod
    def validate_review_notes(
        cls,
        value: str,
    ) -> str:
        return clean_meaningful_text(
            value,
            "Provision review notes",
        )


# =========================================================
# PHASE 2
# ANALYSIS HUMAN VALIDATION REQUEST
# =========================================================

class RegulatoryChangeAnalysisValidationRequest(
    BaseModel
):
    validation_notes: str = Field(
        min_length=10,
        max_length=15000,
    )

    @field_validator(
        "validation_notes"
    )
    @classmethod
    def validate_validation_notes(
        cls,
        value: str,
    ) -> str:
        return clean_meaningful_text(
            value,
            "Validation notes",
        )


# =========================================================
# PHASE 2
# PROVISION IMPACT RESPONSE
# =========================================================

class RegulatoryProvisionImpactResponse(
    BaseModel
):
    id: int
    analysis_id: int

    # -----------------------------------------------------
    # KNOWLEDGE-BASE REFERENCES
    # -----------------------------------------------------

    regulation_id: int | None = None

    regulation_article_id: int | None = None

    regulation_obligation_id: int | None = None

    # -----------------------------------------------------
    # PROVISION
    # -----------------------------------------------------

    provision_reference: str
    provision_title: str | None = None

    change_type: str

    # -----------------------------------------------------
    # REQUIREMENT COMPARISON
    # -----------------------------------------------------

    previous_requirement: str | None = None
    current_requirement: str | None = None

    change_explanation: str | None = None

    # -----------------------------------------------------
    # ANALYSIS
    # -----------------------------------------------------

    legal_interpretation: str | None = None

    operational_impact: str | None = None

    recommended_action: str | None = None

    impact_level: str | None = None

    # -----------------------------------------------------
    # PROVENANCE
    # -----------------------------------------------------

    source_snapshot_id: int | None = None
    source_url: str | None = None

    # -----------------------------------------------------
    # HUMAN REVIEW
    # -----------------------------------------------------

    review_status: str

    review_notes: str | None = None

    reviewed_by_user_id: int | None = None
    reviewed_at: datetime | None = None

    # -----------------------------------------------------
    # AUDIT
    # -----------------------------------------------------

    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


# =========================================================
# PHASE 2
# PROVISION IMPACT DETAIL RESPONSE
# =========================================================

class RegulatoryProvisionImpactDetailResponse(
    BaseModel
):
    impact: RegulatoryProvisionImpactResponse

    regulation: (
        RegulatoryKnowledgeRegulationResponse
        | None
    ) = None

    article: (
        RegulatoryKnowledgeArticleResponse
        | None
    ) = None

    obligation: (
        RegulatoryKnowledgeObligationResponse
        | None
    ) = None

    controls: list[
        RegulatoryKnowledgeControlResponse
    ] = []

    source_snapshot: (
        RegulatorySnapshotResponse
        | None
    ) = None


# =========================================================
# PHASE 2
# CHANGE ANALYSIS RESPONSE
# =========================================================

class RegulatoryChangeAnalysisResponse(
    BaseModel
):
    id: int

    regulatory_change_id: int

    analysis_version: int

    analysis_status: str

    analysis_origin: str

    analysis_method: str | None = None

    overall_impact_level: str | None = None

    executive_summary: str | None = None

    generated_by_model: str | None = None

    generated_at: datetime | None = None

    validated_by_user_id: int | None = None

    validated_at: datetime | None = None

    validation_notes: str | None = None

    supersedes_analysis_id: int | None = None

    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


# =========================================================
# PHASE 2
# COMPLETE ANALYSIS DETAIL RESPONSE
# =========================================================

class RegulatoryChangeAnalysisDetailResponse(
    BaseModel
):
    analysis: RegulatoryChangeAnalysisResponse

    change: RegulatoryChangeResponse

    source: RegulatorySourceResponse

    regulation: (
        RegulatoryKnowledgeRegulationResponse
        | None
    ) = None

    provision_impacts: list[
        RegulatoryProvisionImpactDetailResponse
    ] = []

    provision_count: int = 0

    validated_provision_count: int = 0

    affected_control_count: int = 0


# =========================================================
# PHASE 2
# ANALYSIS LIST RESPONSE
# =========================================================

class RegulatoryChangeAnalysisListResponse(
    BaseModel
):
    change_id: int

    analyses: list[
        RegulatoryChangeAnalysisResponse
    ]

    count: int


# =========================================================
# PHASE 2
# ANALYSIS VALIDATION RESPONSE
# =========================================================

class RegulatoryChangeAnalysisValidationResponse(
    BaseModel
):
    id: int

    analysis_status: str

    validated_by_user_id: int

    validated_at: datetime

    validation_notes: str

    message: str


# =========================================================
# PHASE 2
# ANALYSIS CREATION RESPONSE
# =========================================================

class RegulatoryChangeAnalysisCreateResponse(
    BaseModel
):
    analysis: RegulatoryChangeAnalysisResponse

    message: str


# =========================================================
# PHASE 2
# PROVISION IMPACT CREATION RESPONSE
# =========================================================

class RegulatoryProvisionImpactCreateResponse(
    BaseModel
):
    impact: RegulatoryProvisionImpactResponse

    controls: list[
        RegulatoryKnowledgeControlResponse
    ] = []

    message: str