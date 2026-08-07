from sqlalchemy import (
    ForeignKey,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import Base


class OrganizationDataCategory(Base):
    __tablename__ = "organization_data_categories"

    organization_id: Mapped[int] = mapped_column(
        ForeignKey(
            "organizations.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )

    data_category_id: Mapped[int] = mapped_column(
        ForeignKey(
            "data_categories.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )

    organization = relationship(
        "Organization",
    )

    data_category = relationship(
        "DataCategory",
    )