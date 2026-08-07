from sqlalchemy import (
    ForeignKey,
    String,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import Base


class OrganizationJurisdiction(Base):
    __tablename__ = "organization_jurisdictions"

    organization_id: Mapped[int] = mapped_column(
        ForeignKey(
            "organizations.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )

    jurisdiction_id: Mapped[int] = mapped_column(
        ForeignKey(
            "jurisdictions.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )

    relationship_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Customer",
    )

    organization = relationship(
        "Organization",
    )

    jurisdiction = relationship(
        "Jurisdiction",
    )