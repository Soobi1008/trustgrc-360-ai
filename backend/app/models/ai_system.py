from datetime import datetime

from sqlalchemy import (
    JSON,
    DateTime,
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


class AISystem(Base):
    __tablename__ = "ai_systems"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    organization_id: Mapped[int] = mapped_column(
        ForeignKey(
            "organizations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    business_owner: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    vendor: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    ai_technologies: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    deployment_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Planned",
    )

    risk_level: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Not Assessed",
    )

    eu_ai_act_category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Not Classified",
    )

    data_classification: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Active",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )

    organization = relationship(
        "Organization",
        back_populates="ai_systems",
    )

    generated_risks = relationship(
        "GeneratedRisk",
        back_populates="ai_system",
        cascade="all, delete-orphan",
    )

    risks = relationship(
        "AIRisk",
        back_populates="ai_system",
        cascade="all, delete-orphan",
    )