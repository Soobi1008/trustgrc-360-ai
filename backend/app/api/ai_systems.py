from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import require_roles
from app.models.ai_system import AISystem
from app.models.organization import Organization
from app.models.user import User
from app.schemas.ai_system import (
    AISystemCreate,
    AISystemResponse,
    AISystemUpdate,
)

router = APIRouter(
    prefix="/api/v1/ai-systems",
    tags=["AI Inventory"],
)

platform_admin_required = require_roles(
    "super_admin",
    "platform_admin",
)


def get_ai_system_or_404(
    ai_system_id: int,
    db: Session,
) -> AISystem:
    ai_system = db.get(
        AISystem,
        ai_system_id,
    )

    if ai_system is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI system not found.",
        )

    return ai_system


def get_active_organization_or_404(
    organization_id: int,
    db: Session,
) -> Organization:
    organization = db.get(
        Organization,
        organization_id,
    )

    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )

    if organization.status.lower().strip() != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "AI systems can only be assigned to an "
                "active organization."
            ),
        )

    return organization


def ensure_unique_name(
    *,
    organization_id: int,
    name: str,
    db: Session,
    exclude_ai_system_id: int | None = None,
) -> None:
    statement = select(AISystem).where(
        AISystem.organization_id == organization_id,
        AISystem.name == name,
    )

    if exclude_ai_system_id is not None:
        statement = statement.where(
            AISystem.id != exclude_ai_system_id
        )

    existing_system = db.scalar(statement)

    if existing_system is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "An AI system with this name already "
                "exists for the organization."
            ),
        )


@router.get(
    "",
    response_model=list[AISystemResponse],
)
def list_ai_systems(
    organization_id: int | None = Query(
        default=None
    ),
    db: Session = Depends(get_db),
    _: User = Depends(platform_admin_required),
) -> list[AISystem]:
    statement = select(AISystem).order_by(
        AISystem.created_at.desc()
    )

    if organization_id is not None:
        statement = statement.where(
            AISystem.organization_id == organization_id
        )

    return list(
        db.scalars(statement).all()
    )


@router.post(
    "",
    response_model=AISystemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ai_system(
    payload: AISystemCreate,
    db: Session = Depends(get_db),
    _: User = Depends(platform_admin_required),
) -> AISystem:
    get_active_organization_or_404(
        organization_id=payload.organization_id,
        db=db,
    )

    normalized_name = payload.name.strip()

    if not normalized_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="AI system name cannot be empty.",
        )

    ensure_unique_name(
        organization_id=payload.organization_id,
        name=normalized_name,
        db=db,
    )

    ai_system = AISystem(
        **payload.model_dump(),
    )

    ai_system.name = normalized_name

    db.add(ai_system)
    db.commit()
    db.refresh(ai_system)

    return ai_system


@router.get(
    "/{ai_system_id}",
    response_model=AISystemResponse,
)
def get_ai_system(
    ai_system_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(platform_admin_required),
) -> AISystem:
    return get_ai_system_or_404(
        ai_system_id=ai_system_id,
        db=db,
    )


@router.put(
    "/{ai_system_id}",
    response_model=AISystemResponse,
)
def update_ai_system(
    ai_system_id: int,
    payload: AISystemUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(platform_admin_required),
) -> AISystem:
    ai_system = get_ai_system_or_404(
        ai_system_id=ai_system_id,
        db=db,
    )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    effective_organization_id = (
        update_data["organization_id"]
        if "organization_id" in update_data
        else ai_system.organization_id
    )

    get_active_organization_or_404(
        organization_id=effective_organization_id,
        db=db,
    )

    effective_name = update_data.get(
        "name",
        ai_system.name,
    )

    normalized_name = effective_name.strip()

    if not normalized_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="AI system name cannot be empty.",
        )

    ensure_unique_name(
        organization_id=effective_organization_id,
        name=normalized_name,
        db=db,
        exclude_ai_system_id=ai_system_id,
    )

    update_data["name"] = normalized_name

    for field, value in update_data.items():
        setattr(ai_system, field, value)

    db.commit()
    db.refresh(ai_system)

    return ai_system