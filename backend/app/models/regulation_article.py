from datetime import date, datetime

from sqlalchemy import (
    Date,
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


class RegulationArticle(Base):
    __tablename__ = "regulation_articles"

    __table_args__ = (
        UniqueConstraint(
            "regulation_id",
            "article_number",
            "version",
            name="uq_regulation_article_version",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
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

    article_number: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    title: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    official_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    source_url: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    version: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="current",
    )

    effective_from: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    effective_to: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    last_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    regulation = relationship(
        "Regulation",
    )