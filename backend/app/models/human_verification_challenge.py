from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HumanVerificationChallenge(Base):
    __tablename__ = "human_verification_challenges"

    id: Mapped[str] = mapped_column(
        String(100),
        primary_key=True,
    )

    answer_hash: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )