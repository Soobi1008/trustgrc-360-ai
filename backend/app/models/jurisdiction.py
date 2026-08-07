from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import Base


class Jurisdiction(Base):
    __tablename__ = "jurisdictions"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    country_id: Mapped[int] = mapped_column(
        ForeignKey(
            "countries.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    code: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    jurisdiction_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="National",
    )

    country = relationship(
        "Country",
        back_populates="jurisdictions",
    )