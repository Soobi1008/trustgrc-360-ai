from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AIAssessment(Base):
    __tablename__ = "ai_assessments"

    id: Mapped[int] = mapped_column(primary_key=True)

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id")
    )

    ai_system_id: Mapped[int] = mapped_column(
        ForeignKey("ai_systems.id")
    )

    assessment_name: Mapped[str] = mapped_column(String(255))

    framework: Mapped[str] = mapped_column(String(100))

    status: Mapped[str] = mapped_column(String(50))

    score: Mapped[int] = mapped_column(default=0)

    assessor: Mapped[str] = mapped_column(String(255))