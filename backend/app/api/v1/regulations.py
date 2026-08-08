from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.regulation import Regulation
from app.models.regulation_article import RegulationArticle
from app.models.regulation_obligation import RegulationObligation
from app.models.obligation_control import ObligationControl

from app.schemas.regulation import RegulationResponse

router = APIRouter()


@router.get(
    "/",
    response_model=list[RegulationResponse],
)
def list_regulations(
    db: Session = Depends(get_db),
):
    return (
        db.query(Regulation)
        .order_by(Regulation.short_name)
        .all()
    )


@router.get(
    "/{regulation_id}",
    response_model=RegulationResponse,
)
def get_regulation(
    regulation_id: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(Regulation)
        .filter(
            Regulation.id == regulation_id
        )
        .first()
    )

@router.get("/{regulation_id}/knowledge-pack")
def get_regulation_knowledge_pack(
    regulation_id: int,
    db: Session = Depends(get_db),
):
    regulation = (
        db.query(Regulation)
        .filter(Regulation.id == regulation_id)
        .first()
    )

    if not regulation:
        raise HTTPException(
            status_code=404,
            detail="Regulation not found",
        )

    articles = (
        db.query(RegulationArticle)
        .filter(
            RegulationArticle.regulation_id
            == regulation_id
        )
        .order_by(RegulationArticle.id)
        .all()
    )

    article_results = []

    for article in articles:
        obligations = (
            db.query(RegulationObligation)
            .filter(
                RegulationObligation.article_id
                == article.id
            )
            .order_by(RegulationObligation.id)
            .all()
        )

        obligation_results = []

        for obligation in obligations:
            controls = (
                db.query(ObligationControl)
                .filter(
                    ObligationControl.obligation_id
                    == obligation.id
                )
                .order_by(ObligationControl.id)
                .all()
            )

            control_results = [
                {
                    "id": control.id,
                    "control_code": control.control_code,
                    "control_name": control.control_name,
                    "control_description": (
                        control.control_description
                    ),
                    "evidence_required": (
                        control.evidence_required
                    ),
                    "test_method": control.test_method,
                }
                for control in controls
            ]

            obligation_results.append(
                {
                    "id": obligation.id,
                    "obligation_code": (
                        obligation.obligation_code
                    ),
                    "obligation_text": (
                        obligation.obligation_text
                    ),
                    "obligation_type": (
                        obligation.obligation_type
                    ),
                    "applies_to": obligation.applies_to,
                    "applicability_condition": (
                        obligation.applicability_condition
                    ),
                    "mandatory": obligation.mandatory,
                    "risk_level": obligation.risk_level,
                    "controls": control_results,
                }
            )

        article_results.append(
            {
                "id": article.id,
                "article_number": article.article_number,
                "title": article.title,
                "summary": article.summary,
                "source_url": article.source_url,
                "version": article.version,
                "effective_from": (
                    article.effective_from
                ),
                "effective_to": article.effective_to,
                "obligations": obligation_results,
            }
        )

    return {
        "regulation": {
            "id": regulation.id,
            "name": regulation.name,
            "short_name": regulation.short_name,
            "regulation_type": (
                regulation.regulation_type
            ),
            "summary": regulation.summary,
            "regulatory_authority": (
                regulation.regulatory_authority
            ),
            "official_source_url": (
                regulation.official_source_url
            ),
            "status": regulation.status,
            "extraterritorial": (
                regulation.extraterritorial
            ),
            "mandatory": regulation.mandatory,
        },
        "article_count": len(article_results),
        "articles": article_results,
    }