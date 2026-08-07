from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import Base


class Country(Base):
    __tablename__ = "countries"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True,
    )

    iso2_code: Mapped[str] = mapped_column(
        String(2),
        unique=True,
        nullable=False,
        index=True,
    )

    iso3_code: Mapped[str] = mapped_column(
        String(3),
        unique=True,
        nullable=False,
        index=True,
    )

    continent_id: Mapped[int] = mapped_column(
        ForeignKey("continents.id"),
        nullable=False,
        index=True,
    )

    continent = relationship(
        "Continent",
        back_populates="countries",
    )

    jurisdictions = relationship(
        "Jurisdiction",
        back_populates="country",
    )