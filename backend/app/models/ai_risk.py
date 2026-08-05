from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AIRisk(Base):
    __tablename__ = "ai_risks"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    ai_system_id: Mapped[int] = mapped_column(
        ForeignKey("ai_systems.id"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    risk_category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    likelihood: Mapped[int] = mapped_column(
        Integer,
        default=1,
    )

    impact: Mapped[int] = mapped_column(
        Integer,
        default=1,
    )

    inherent_risk_score: Mapped[int] = mapped_column(
        Integer,
        default=1,
    )

    residual_risk_score: Mapped[int] = mapped_column(
        Integer,
        default=1,
    )

    owner: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    treatment_plan: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="Open",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    ai_system = relationship(
        "AISystem",
        back_populates="risks",
    )