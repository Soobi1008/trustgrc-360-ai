from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.ai_system import AISystem
from app.models.organization import Organization
from app.schemas.ai_system import AISystemCreate, AISystemResponse


router = APIRouter(
    prefix="/api/v1/ai-systems",
    tags=["AI Inventory"],
)


@router.get(
    "",
    response_model=list[AISystemResponse],
)
def list_ai_systems(
    organization_id: int | None = None,
    db: Session = Depends(get_db),
):
    statement = select(AISystem).order_by(AISystem.id.desc())

    if organization_id is not None:
        statement = statement.where(
            AISystem.organization_id == organization_id
        )

    return db.scalars(statement).all()


@router.post(
    "",
    response_model=AISystemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ai_system(
    payload: AISystemCreate,
    db: Session = Depends(get_db),
):
    organization = db.get(
        Organization,
        payload.organization_id,
    )

    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )

    existing_system = db.scalar(
        select(AISystem).where(
            AISystem.organization_id == payload.organization_id,
            AISystem.name == payload.name,
        )
    )

    if existing_system:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An AI system with this name already exists for the organization.",
        )

    ai_system = AISystem(**payload.model_dump())

    db.add(ai_system)
    db.commit()
    db.refresh(ai_system)

    return ai_system