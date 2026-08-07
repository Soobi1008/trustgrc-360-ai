from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import Base


class AssessmentFinding(Base):
    __tablename__ = "assessment_findings"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    assessment_id: Mapped[int] = mapped_column(
        ForeignKey(
            "ai_assessments.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    ai_system_id: Mapped[int] = mapped_column(
        ForeignKey(
            "ai_systems.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    regulation_id: Mapped[int] = mapped_column(
        ForeignKey(
            "regulations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    article_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "regulation_articles.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    obligation_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "regulation_obligations.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    result: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    confidence: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    severity: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Medium",
    )

    finding: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    evidence_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    gap: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    recommendation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Open",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    regulation = relationship(
        "Regulation",
    )

    article = relationship(
        "RegulationArticle",
    )

    obligation = relationship(
        "RegulationObligation",
    )