from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.intelligence.risk_engine import generate_risks
from app.models.ai_system import AISystem
from app.models.generated_risk import GeneratedRisk
from app.schemas.generated_risk import (
    GeneratedRiskResponse,
    GeneratedRiskReview,
)

router = APIRouter(
    prefix="/api/v1",
    tags=["TrustGRC Intelligence Layer"],
)


@router.post(
    "/ai-systems/{ai_system_id}/generate-risks",
    response_model=list[GeneratedRiskResponse],
)
def generate_ai_system_risks(
    ai_system_id: int,
    db: Session = Depends(get_db),
):
    ai_system = (
        db.query(AISystem)
        .filter(AISystem.id == ai_system_id)
        .first()
    )

    if ai_system is None:
        raise HTTPException(
            status_code=404,
            detail="AI system not found.",
        )

    suggested_risks = generate_risks(ai_system)

    created_risks: list[GeneratedRisk] = []

    for risk in suggested_risks:
        existing_risk = (
            db.query(GeneratedRisk)
            .filter(
                GeneratedRisk.ai_system_id == ai_system_id,
                GeneratedRisk.title == risk["title"],
            )
            .first()
        )

        if existing_risk:
            created_risks.append(existing_risk)
            continue

        generated_risk = GeneratedRisk(
            ai_system_id=ai_system_id,
            title=risk["title"],
            category=risk["category"],
            description=risk["description"],
            reason_generated=risk["reason_generated"],
            likelihood=risk["likelihood"],
            impact=risk["impact"],
            risk_score=risk["risk_score"],
            recommended_control=risk["control"],
            regulation=risk.get("regulation"),
            generation_source="TrustGRC Rules Engine",
            review_status="Suggested",
        )

        db.add(generated_risk)
        created_risks.append(generated_risk)

    db.commit()

    for generated_risk in created_risks:
        db.refresh(generated_risk)

    return created_risks


@router.get(
    "/ai-systems/{ai_system_id}/generated-risks",
    response_model=list[GeneratedRiskResponse],
)
def get_ai_system_generated_risks(
    ai_system_id: int,
    db: Session = Depends(get_db),
):
    ai_system = (
        db.query(AISystem)
        .filter(AISystem.id == ai_system_id)
        .first()
    )

    if ai_system is None:
        raise HTTPException(
            status_code=404,
            detail="AI system not found.",
        )

    return (
        db.query(GeneratedRisk)
        .filter(GeneratedRisk.ai_system_id == ai_system_id)
        .order_by(GeneratedRisk.created_at.desc())
        .all()
    )


@router.patch(
    "/generated-risks/{risk_id}/review",
    response_model=GeneratedRiskResponse,
)
def review_generated_risk(
    risk_id: int,
    review: GeneratedRiskReview,
    db: Session = Depends(get_db),
):
    allowed_statuses = {
        "Suggested",
        "Approved",
        "Rejected",
        "Needs Information",
    }

    if review.review_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid review status. Use Suggested, Approved, "
                "Rejected or Needs Information."
            ),
        )

    risk = (
        db.query(GeneratedRisk)
        .filter(GeneratedRisk.id == risk_id)
        .first()
    )

    if risk is None:
        raise HTTPException(
            status_code=404,
            detail="Generated risk not found.",
        )

    risk.review_status = review.review_status

    db.commit()
    db.refresh(risk)

    return risk