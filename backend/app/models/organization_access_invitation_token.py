from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    func,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import Base


class OrganizationAccessInvitationToken(Base):
    __tablename__ = (
        "organization_access_invitation_tokens"
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    access_request_id: Mapped[int] = mapped_column(
        ForeignKey(
            "organization_access_requests.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    token_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    used_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    access_request = relationship(
        "OrganizationAccessRequest",
    )