from sqlalchemy import (
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import Base


class RegulationIndustry(Base):
    __tablename__ = "regulation_industries"

    regulation_id: Mapped[int] = mapped_column(
        ForeignKey(
            "regulations.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )

    industry_id: Mapped[int] = mapped_column(
        ForeignKey(
            "industries.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )

    applicability_level: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Applicable",
    )

    trigger_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    regulation = relationship(
        "Regulation",
    )

    industry = relationship(
        "Industry",
    )