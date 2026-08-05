from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.ai_risk import AIRisk
from app.models.ai_system import AISystem

from app.schemas.ai_risk import (
    AIRiskCreate,
    AIRiskResponse,
)

from app.dependencies.auth import require_roles
from app.models.user import User

platform_admin_required = require_roles(
    "super_admin",
    "platform_admin",
)

router = APIRouter(
    prefix="/api/v1/risks",
    tags=["AI Risks"],
)


@router.get(
    "",
    response_model=list[AIRiskResponse],
)
def list_risks(
    db: Session = Depends(get_db),
):
    statement = (
        select(AIRisk)
        .order_by(AIRisk.created_at.desc())
    )

    return db.scalars(statement).all()


@router.post(
    "",
    response_model=AIRiskResponse,
    status_code=status.HTTP_201_CREATED,
)

def create_risk(
    payload: AIRiskCreate,
    db: Session = Depends(get_db),
    _: User = Depends(platform_admin_required),
):
    
    ai_system = db.get(
        AISystem,
        payload.ai_system_id,
    )

    if ai_system is None:
        raise HTTPException(
            status_code=404,
            detail="AI system not found.",
        )

    inherent_score = (
        payload.likelihood *
        payload.impact
    )

    risk = AIRisk(
        ai_system_id=payload.ai_system_id,
        title=payload.title,
        description=payload.description,
        risk_category=payload.risk_category,
        likelihood=payload.likelihood,
        impact=payload.impact,
        inherent_risk_score=inherent_score,
        residual_risk_score=inherent_score,
        owner=payload.owner,
        treatment_plan=payload.treatment_plan,
        status=payload.status,
    )

    db.add(risk)
    db.commit()
    db.refresh(risk)

    return risk