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
from app.models.assessment import AIAssessment
from app.models.organization import Organization
from app.models.user import User
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentResponse,
    AssessmentUpdate,
)

router = APIRouter(
    prefix="/api/v1/assessments",
    tags=["Assessments"],
)

platform_admin_required = require_roles(
    "super_admin",
    "platform_admin",
)


@router.get(
    "",
    response_model=list[AssessmentResponse],
)
def list_assessments(
    organization_id: int | None = Query(
        default=None
    ),
    ai_system_id: int | None = Query(
        default=None
    ),
    framework: str | None = Query(
        default=None
    ),
    assessment_status: str | None = Query(
        default=None,
        alias="status",
    ),
    db: Session = Depends(get_db),
    _: User = Depends(platform_admin_required),
) -> list[AIAssessment]:
    statement = select(
        AIAssessment
    ).order_by(
        AIAssessment.id.desc()
    )

    if organization_id is not None:
        statement = statement.where(
            AIAssessment.organization_id
            == organization_id
        )

    if ai_system_id is not None:
        statement = statement.where(
            AIAssessment.ai_system_id
            == ai_system_id
        )

    if framework:
        statement = statement.where(
            AIAssessment.framework
            == framework.strip()
        )

    if assessment_status:
        statement = statement.where(
            AIAssessment.status
            == assessment_status.strip()
        )

    return list(
        db.scalars(statement).all()
    )


@router.post(
    "",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_assessment(
    payload: AssessmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(platform_admin_required),
) -> AIAssessment:
    organization = db.get(
        Organization,
        payload.organization_id,
    )

    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )

    ai_system = db.get(
        AISystem,
        payload.ai_system_id,
    )

    if ai_system is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI system not found.",
        )

    if (
        ai_system.organization_id
        != payload.organization_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "The selected AI system does not "
                "belong to the selected organization."
            ),
        )

    assessment = AIAssessment(
        organization_id=payload.organization_id,
        ai_system_id=payload.ai_system_id,
        assessment_name=(
            payload.assessment_name.strip()
        ),
        framework=payload.framework.strip(),
        status=payload.status.strip(),
        score=payload.score,
        assessor=payload.assessor.strip(),
    )

    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return assessment


@router.get(
    "/{assessment_id}",
    response_model=AssessmentResponse,
)
def get_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(platform_admin_required),
) -> AIAssessment:
    assessment = db.get(
        AIAssessment,
        assessment_id,
    )

    if assessment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found.",
        )

    return assessment


@router.put(
    "/{assessment_id}",
    response_model=AssessmentResponse,
)
def update_assessment(
    assessment_id: int,
    payload: AssessmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(platform_admin_required),
) -> AIAssessment:
    assessment = db.get(
        AIAssessment,
        assessment_id,
    )

    if assessment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found.",
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    proposed_organization_id = update_data.get(
        "organization_id",
        assessment.organization_id,
    )

    proposed_ai_system_id = update_data.get(
        "ai_system_id",
        assessment.ai_system_id,
    )

    organization = db.get(
        Organization,
        proposed_organization_id,
    )

    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )

    ai_system = db.get(
        AISystem,
        proposed_ai_system_id,
    )

    if ai_system is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI system not found.",
        )

    if (
        ai_system.organization_id
        != proposed_organization_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "The selected AI system does not "
                "belong to the selected organization."
            ),
        )

    for field, value in update_data.items():
        if isinstance(value, str):
            value = value.strip()

        setattr(
            assessment,
            field,
            value,
        )

    db.commit()
    db.refresh(assessment)

    return assessment


@router.delete(
    "/{assessment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(platform_admin_required),
) -> None:
    assessment = db.get(
        AIAssessment,
        assessment_id,
    )

    if assessment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found.",
        )

    db.delete(assessment)
    db.commit()