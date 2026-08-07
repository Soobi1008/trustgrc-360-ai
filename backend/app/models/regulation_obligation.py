from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import Base


class RegulationObligation(Base):
    __tablename__ = "regulation_obligations"

    __table_args__ = (
        UniqueConstraint(
            "article_id",
            "obligation_code",
            name="uq_article_obligation_code",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    article_id: Mapped[int] = mapped_column(
        ForeignKey(
            "regulation_articles.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    obligation_code: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    obligation_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    obligation_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Compliance",
    )

    applies_to: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    applicability_condition: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    mandatory: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    risk_level: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Medium",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    article = relationship(
        "RegulationArticle",
    )