from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import Base
from app.models.user import User


class RegulatorySource(Base):
    __tablename__ = "regulatory_sources"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
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

    content_hash: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
    )

    current_version: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    last_checked_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    last_changed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
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

    old_hash: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
    )

    new_hash: Mapped[str] = mapped_column(
        String(128),
    )

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

    evidence_status: Mapped[str] = mapped_column(
        String(50),
        default="captured",
        index=True,
    )


    # -----------------------------------------------------
    # TECHNICAL CHANGE CLASSIFICATION
    # -----------------------------------------------------

    change_type: Mapped[str] = mapped_column(
        String(100),
        default="unclassified",
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # -----------------------------------------------------
    # REVIEW WORKFLOW
    # -----------------------------------------------------

    review_status: Mapped[str] = mapped_column(
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
    # IMPACT ANALYSIS
    # -----------------------------------------------------

    impact_status: Mapped[str] = mapped_column(
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

    detected_at: Mapped[datetime] = mapped_column(
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

    content_hash: Mapped[str] = mapped_column(
        String(128),
        index=True,
    )

    normalized_content: Mapped[str] = mapped_column(
        Text,
    )

    snapshot_type: Mapped[str] = mapped_column(
        String(50),
        default="monitoring",
    )


    source_url: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    retrieval_status: Mapped[str] = mapped_column(
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

    retrieved_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )


    captured_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )

    source: Mapped[
        "RegulatorySource"
    ] = relationship(
        "RegulatorySource",
        back_populates="snapshots",
    )