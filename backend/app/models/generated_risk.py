from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class GeneratedRisk(Base):
    __tablename__ = "generated_risks"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    ai_system_id: Mapped[int] = mapped_column(
        ForeignKey("ai_systems.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    reason_generated: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    likelihood: Mapped[str] = mapped_column(
        String(50),
        default="Medium",
        nullable=False,
    )

    impact: Mapped[str] = mapped_column(
        String(50),
        default="Medium",
        nullable=False,
    )

    risk_score: Mapped[int] = mapped_column(
        Integer,
        default=9,
        nullable=False,
    )

    recommended_control: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    regulation: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    generation_source: Mapped[str] = mapped_column(
        String(100),
        default="TrustGRC Rules Engine",
        nullable=False,
    )

    review_status: Mapped[str] = mapped_column(
        String(50),
        default="Suggested",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    ai_system = relationship(
        "AISystem",
        back_populates="generated_risks",
    )