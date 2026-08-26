from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import Base

from app.models.regulation import Regulation
from app.models.regulation_article import (
    RegulationArticle,
)
from app.models.regulation_obligation import (
    RegulationObligation,
)
from app.models.user import User


# =========================================================
# REGULATORY SOURCE
# =========================================================

class RegulatorySource(Base):
    __tablename__ = "regulatory_sources"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # -----------------------------------------------------
    # CANONICAL KNOWLEDGE-BASE LINK
    # -----------------------------------------------------

    regulation_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "regulations.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    regulation_code: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
    )

    regulation_name: Mapped[str] = mapped_column(
        String(255),
    )

    authority: Mapped[str] = mapped_column(
        String(255),
    )

    jurisdiction_code: Mapped[str] = mapped_column(
        String(50),
        index=True,
    )

    jurisdiction_name: Mapped[str] = mapped_column(
        String(255),
    )

    official_url: Mapped[str] = mapped_column(
        Text,
    )

    source_type: Mapped[str] = mapped_column(
        String(50),
        default="official_webpage",
    )

    legal_status: Mapped[str] = mapped_column(
        String(50),
        default="active",
    )

    trust_tier: Mapped[int] = mapped_column(
        Integer,
        default=1,
    )

    monitoring_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    content_hash: Mapped[
        str | None
    ] = mapped_column(
        String(128),
        nullable=True,
    )

    current_version: Mapped[
        str | None
    ] = mapped_column(
        String(50),
        nullable=True,
    )

    last_checked_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime,
        nullable=True,
    )

    last_changed_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # -----------------------------------------------------
    # RELATIONSHIPS
    # -----------------------------------------------------

    regulation: Mapped[
        "Regulation | None"
    ] = relationship(
        "Regulation",
        foreign_keys=[
            regulation_id
        ],
    )

    snapshots: Mapped[
        list["RegulatorySnapshot"]
    ] = relationship(
        "RegulatorySnapshot",
        back_populates="source",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    changes: Mapped[
        list["RegulatoryChange"]
    ] = relationship(
        "RegulatoryChange",
        back_populates="source",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


# =========================================================
# REGULATORY CHANGE
# =========================================================

class RegulatoryChange(Base):
    __tablename__ = "regulatory_changes"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    source_id: Mapped[int] = mapped_column(
        ForeignKey(
            "regulatory_sources.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    old_hash: Mapped[
        str | None
    ] = mapped_column(
        String(128),
        nullable=True,
    )

    new_hash: Mapped[str] = mapped_column(
        String(128),
    )

    # -----------------------------------------------------
    # SNAPSHOT / PROVENANCE LINKAGE
    # -----------------------------------------------------

    previous_snapshot_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "regulatory_snapshots.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    new_snapshot_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "regulatory_snapshots.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    technical_severity: Mapped[
        str | None
    ] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    difference_ratio: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    evidence_status: Mapped[
        str
    ] = mapped_column(
        String(50),
        default="captured",
        index=True,
    )

    # -----------------------------------------------------
    # TECHNICAL CHANGE CLASSIFICATION
    # -----------------------------------------------------

    change_type: Mapped[
        str
    ] = mapped_column(
        String(100),
        default="unclassified",
    )

    summary: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    # -----------------------------------------------------
    # HUMAN REVIEW WORKFLOW
    # -----------------------------------------------------

    review_status: Mapped[
        str
    ] = mapped_column(
        String(50),
        default="pending_review",
        index=True,
    )

    review_decision: Mapped[
        str | None
    ] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    review_notes: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    reviewed_by_user_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    reviewed_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime,
        nullable=True,
    )

    # -----------------------------------------------------
    # PHASE 1 IMPACT ANALYSIS
    #
    # Retained for backward compatibility.
    # Phase 2 structured analysis is stored in
    # RegulatoryChangeAnalysis.
    # -----------------------------------------------------

    impact_status: Mapped[
        str
    ] = mapped_column(
        String(50),
        default="not_analysed",
        index=True,
    )

    impact_level: Mapped[
        str | None
    ] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    impact_summary: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    # -----------------------------------------------------
    # PUBLICATION / LIFECYCLE
    # -----------------------------------------------------

    published_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime,
        nullable=True,
    )

    detected_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )

    # -----------------------------------------------------
    # RELATIONSHIPS
    # -----------------------------------------------------

    source: Mapped[
        "RegulatorySource"
    ] = relationship(
        "RegulatorySource",
        back_populates="changes",
    )

    reviewed_by: Mapped[
        "User | None"
    ] = relationship(
        "User",
        foreign_keys=[
            reviewed_by_user_id
        ],
    )

    analyses: Mapped[
        list[
            "RegulatoryChangeAnalysis"
        ]
    ] = relationship(
        "RegulatoryChangeAnalysis",
        back_populates="regulatory_change",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by=(
            "RegulatoryChangeAnalysis."
            "analysis_version"
        ),
    )


# =========================================================
# REGULATORY SNAPSHOT
# =========================================================

class RegulatorySnapshot(Base):
    __tablename__ = "regulatory_snapshots"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    source_id: Mapped[int] = mapped_column(
        ForeignKey(
            "regulatory_sources.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    content_hash: Mapped[
        str
    ] = mapped_column(
        String(128),
        index=True,
    )

    normalized_content: Mapped[
        str
    ] = mapped_column(
        Text,
    )

    snapshot_type: Mapped[
        str
    ] = mapped_column(
        String(50),
        default="monitoring",
    )

    # -----------------------------------------------------
    # SOURCE PROVENANCE
    # -----------------------------------------------------

    source_url: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    retrieval_status: Mapped[
        str
    ] = mapped_column(
        String(50),
        default="ok",
        index=True,
    )

    content_type: Mapped[
        str | None
    ] = mapped_column(
        String(255),
        nullable=True,
    )

    authoritative_identifier: Mapped[
        str | None
    ] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    authoritative_version: Mapped[
        str | None
    ] = mapped_column(
        String(100),
        nullable=True,
    )

    retrieved_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )

    captured_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )

    # -----------------------------------------------------
    # RELATIONSHIPS
    # -----------------------------------------------------

    source: Mapped[
        "RegulatorySource"
    ] = relationship(
        "RegulatorySource",
        back_populates="snapshots",
    )


# =========================================================
# PHASE 2 - REGULATORY CHANGE ANALYSIS
# =========================================================

class RegulatoryChangeAnalysis(Base):
    """
    Versioned structured analysis package for a
    confirmed regulatory change.

    This model separates detailed regulatory
    interpretation from the Phase 1 free-text
    impact fields on RegulatoryChange.

    Published / validated analyses can later be
    retained as immutable historical versions.
    """

    __tablename__ = (
        "regulatory_change_analyses"
    )

    __table_args__ = (
        UniqueConstraint(
            "regulatory_change_id",
            "analysis_version",
            name=(
                "uq_regulatory_change_"
                "analysis_version"
            ),
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    regulatory_change_id: Mapped[
        int
    ] = mapped_column(
        ForeignKey(
            "regulatory_changes.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # -----------------------------------------------------
    # VERSION / LIFECYCLE
    # -----------------------------------------------------

    analysis_version: Mapped[
        int
    ] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    analysis_status: Mapped[
        str
    ] = mapped_column(
        String(50),
        nullable=False,
        default="draft",
        index=True,
    )

    # Expected values may include:
    #
    # draft
    # proposed
    # under_review
    # validated
    # published
    # superseded

    # -----------------------------------------------------
    # ANALYSIS ORIGIN / METHOD
    # -----------------------------------------------------

    analysis_origin: Mapped[
        str
    ] = mapped_column(
        String(50),
        nullable=False,
        default="human",
        index=True,
    )

    # Expected values may include:
    #
    # human
    # ai_assisted
    # system_generated

    analysis_method: Mapped[
        str | None
    ] = mapped_column(
        String(255),
        nullable=True,
    )

    # -----------------------------------------------------
    # OVERALL IMPACT
    # -----------------------------------------------------

    overall_impact_level: Mapped[
        str | None
    ] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    executive_summary: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    # -----------------------------------------------------
    # AI / SYSTEM GENERATION PROVENANCE
    # -----------------------------------------------------

    generated_by_model: Mapped[
        str | None
    ] = mapped_column(
        String(255),
        nullable=True,
    )

    generated_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime,
        nullable=True,
    )

    # -----------------------------------------------------
    # HUMAN VALIDATION
    # -----------------------------------------------------

    validated_by_user_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    validated_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime,
        nullable=True,
    )

    validation_notes: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    # -----------------------------------------------------
    # VERSION SUPERSESSION
    # -----------------------------------------------------

    supersedes_analysis_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "regulatory_change_analyses.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    # -----------------------------------------------------
    # AUDIT TIMESTAMPS
    # -----------------------------------------------------

    created_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    updated_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # -----------------------------------------------------
    # RELATIONSHIPS
    # -----------------------------------------------------

    regulatory_change: Mapped[
        "RegulatoryChange"
    ] = relationship(
        "RegulatoryChange",
        back_populates="analyses",
    )

    validated_by: Mapped[
        "User | None"
    ] = relationship(
        "User",
        foreign_keys=[
            validated_by_user_id
        ],
    )

    supersedes_analysis: Mapped[
        "RegulatoryChangeAnalysis | None"
    ] = relationship(
        "RegulatoryChangeAnalysis",
        remote_side=[
            id
        ],
        foreign_keys=[
            supersedes_analysis_id
        ],
    )

    provision_impacts: Mapped[
        list[
            "RegulatoryChangeProvisionImpact"
        ]
    ] = relationship(
        "RegulatoryChangeProvisionImpact",
        back_populates="analysis",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by=(
            "RegulatoryChangeProvisionImpact.id"
        ),
    )


# =========================================================
# PHASE 2 - PROVISION / ARTICLE IMPACT
# =========================================================

class RegulatoryChangeProvisionImpact(Base):
    """
    Structured Article / Section / Rule-level
    regulatory impact record.

    Connects authoritative Regulatory Intelligence
    evidence to the canonical TrustGRC regulation,
    article and obligation knowledge model.
    """

    __tablename__ = (
        "regulatory_change_provision_impacts"
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    analysis_id: Mapped[
        int
    ] = mapped_column(
        ForeignKey(
            "regulatory_change_analyses.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # -----------------------------------------------------
    # CANONICAL REGULATORY KNOWLEDGE LINKS
    # -----------------------------------------------------

    regulation_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "regulations.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    regulation_article_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "regulation_articles.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    regulation_obligation_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "regulation_obligations.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    # -----------------------------------------------------
    # HUMAN-READABLE PROVISION REFERENCE
    #
    # Retained even when relational links exist so that
    # a published audit record remains understandable.
    # -----------------------------------------------------

    provision_reference: Mapped[
        str
    ] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    provision_title: Mapped[
        str | None
    ] = mapped_column(
        String(500),
        nullable=True,
    )

    # -----------------------------------------------------
    # CHANGE CLASSIFICATION
    # -----------------------------------------------------

    change_type: Mapped[
        str
    ] = mapped_column(
        String(100),
        nullable=False,
        default="unclassified",
        index=True,
    )

    # -----------------------------------------------------
    # REQUIREMENT COMPARISON
    # -----------------------------------------------------

    previous_requirement: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    current_requirement: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    change_explanation: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    # -----------------------------------------------------
    # REGULATORY / ORGANISATIONAL INTERPRETATION
    # -----------------------------------------------------

    legal_interpretation: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    operational_impact: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    recommended_action: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    impact_level: Mapped[
        str | None
    ] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    # -----------------------------------------------------
    # AUTHORITATIVE EVIDENCE
    # -----------------------------------------------------

    source_snapshot_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "regulatory_snapshots.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    source_url: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    # -----------------------------------------------------
    # HUMAN REVIEW
    # -----------------------------------------------------

    review_status: Mapped[
        str
    ] = mapped_column(
        String(50),
        nullable=False,
        default="pending_review",
        index=True,
    )

    review_notes: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    reviewed_by_user_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    reviewed_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime,
        nullable=True,
    )

    # -----------------------------------------------------
    # AUDIT TIMESTAMPS
    # -----------------------------------------------------

    created_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    updated_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # -----------------------------------------------------
    # RELATIONSHIPS
    # -----------------------------------------------------

    analysis: Mapped[
        "RegulatoryChangeAnalysis"
    ] = relationship(
        "RegulatoryChangeAnalysis",
        back_populates="provision_impacts",
    )

    regulation: Mapped[
        "Regulation | None"
    ] = relationship(
        "Regulation",
        foreign_keys=[
            regulation_id
        ],
    )

    regulation_article: Mapped[
        "RegulationArticle | None"
    ] = relationship(
        "RegulationArticle",
        foreign_keys=[
            regulation_article_id
        ],
    )

    regulation_obligation: Mapped[
        "RegulationObligation | None"
    ] = relationship(
        "RegulationObligation",
        foreign_keys=[
            regulation_obligation_id
        ],
    )

    source_snapshot: Mapped[
        "RegulatorySnapshot | None"
    ] = relationship(
        "RegulatorySnapshot",
        foreign_keys=[
            source_snapshot_id
        ],
    )

    reviewed_by: Mapped[
        "User | None"
    ] = relationship(
        "User",
        foreign_keys=[
            reviewed_by_user_id
        ],
    )