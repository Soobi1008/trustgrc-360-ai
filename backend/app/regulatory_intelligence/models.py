from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


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


class RegulatoryChange(Base):
    __tablename__ = "regulatory_changes"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    source_id: Mapped[int] = mapped_column(
        Integer,
        index=True,
    )

    old_hash: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
    )

    new_hash: Mapped[str] = mapped_column(
        String(128),
    )

    change_type: Mapped[str] = mapped_column(
        String(100),
        default="unclassified",
    )

    review_status: Mapped[str] = mapped_column(
        String(50),
        default="pending_review",
    )

    impact_status: Mapped[str] = mapped_column(
        String(50),
        default="not_analysed",
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    detected_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )


class RegulatorySnapshot(Base):
    __tablename__ = "regulatory_snapshots"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    source_id: Mapped[int] = mapped_column(
        Integer,
        index=True,
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

    captured_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )