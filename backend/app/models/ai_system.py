from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class AISystem(Base):
    __tablename__ = "ai_systems"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"),
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

    model_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    deployment_status: Mapped[str] = mapped_column(
        String(50),
        default="Planned",
        nullable=False,
    )

    risk_level: Mapped[str] = mapped_column(
        String(50),
        default="Not Assessed",
        nullable=False,
    )

    eu_ai_act_category: Mapped[str] = mapped_column(
        String(100),
        default="Not Classified",
        nullable=False,
    )

    data_classification: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="Active",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    generated_risks = relationship(
    "GeneratedRisk",
    back_populates="ai_system",
    cascade="all, delete-orphan",
)