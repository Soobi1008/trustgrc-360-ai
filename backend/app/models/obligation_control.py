from datetime import datetime

from sqlalchemy import (
    DateTime,
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


class ObligationControl(Base):
    __tablename__ = "obligation_controls"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    obligation_id: Mapped[int] = mapped_column(
        ForeignKey(
            "regulation_obligations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    control_code: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    control_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    control_description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    evidence_required: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    test_method: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    obligation = relationship(
        "RegulationObligation",
    )