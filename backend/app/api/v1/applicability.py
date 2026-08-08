from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db

from app.models.organization import Organization
from app.models.ai_system import AISystem

from app.models.jurisdiction import Jurisdiction
from app.models.industry import Industry
from app.models.data_category import DataCategory

from app.models.regulation import Regulation
from app.models.regulation_jurisdiction import RegulationJurisdiction
from app.models.regulation_industry import RegulationIndustry
from app.models.regulation_data_category import RegulationDataCategory

router = APIRouter()

@router.post("/check")
def check_applicability(
    organization_id: int,
    ai_system_id: int,
    db: Session = Depends(get_db),
):
    organization = (
        db.query(Organization)
        .filter(Organization.id == organization_id)
        .first()
    )

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organization not found",
        )

    ai_system = (
        db.query(AISystem)
        .filter(AISystem.id == ai_system_id)
        .first()
    )

    if not ai_system:
        raise HTTPException(
            status_code=404,
            detail="AI System not found",
        )

    applicable_regulations = {}

    # --------------------------------------------------
    # Jurisdiction matching
    # --------------------------------------------------

    if organization.country:

        jurisdiction = (
            db.query(Jurisdiction)
            .filter(
                Jurisdiction.name == organization.country
            )
            .first()
        )

        if jurisdiction:

            matches = (
                db.query(RegulationJurisdiction)
                .filter(
                    RegulationJurisdiction.jurisdiction_id
                    == jurisdiction.id
                )
                .all()
            )

            for match in matches:

                regulation = (
                    db.query(Regulation)
                    .filter(
                        Regulation.id
                        == match.regulation_id
                    )
                    .first()
                )

                applicable_regulations.setdefault(
                    regulation.id,
                    {
                        "id": regulation.id,
                        "name": regulation.name,
                        "matched_by": [],
                    },
                )

                applicable_regulations[
                    regulation.id
                ]["matched_by"].append(
                    f"Jurisdiction: {jurisdiction.name}"
                )

    # --------------------------------------------------
    # Industry matching
    # --------------------------------------------------

    if organization.industry:

        industry = (
            db.query(Industry)
            .filter(
                Industry.name == organization.industry
            )
            .first()
        )

        if industry:

            matches = (
                db.query(RegulationIndustry)
                .filter(
                    RegulationIndustry.industry_id
                    == industry.id
                )
                .all()
            )

            for match in matches:

                regulation = (
                    db.query(Regulation)
                    .filter(
                        Regulation.id
                        == match.regulation_id
                    )
                    .first()
                )

                applicable_regulations.setdefault(
                    regulation.id,
                    {
                        "id": regulation.id,
                        "name": regulation.name,
                        "matched_by": [],
                    },
                )

                applicable_regulations[
                    regulation.id
                ]["matched_by"].append(
                    f"Industry: {industry.name}"
                )

    # --------------------------------------------------
    # Data category matching
    # --------------------------------------------------

    if ai_system.data_classification:

        category = (
            db.query(DataCategory)
            .filter(
                DataCategory.name
                == ai_system.data_classification
            )
            .first()
        )

        if category:

            matches = (
                db.query(RegulationDataCategory)
                .filter(
                    RegulationDataCategory.data_category_id
                    == category.id
                )
                .all()
            )

            for match in matches:

                regulation = (
                    db.query(Regulation)
                    .filter(
                        Regulation.id
                        == match.regulation_id
                    )
                    .first()
                )

                applicable_regulations.setdefault(
                    regulation.id,
                    {
                        "id": regulation.id,
                        "name": regulation.name,
                        "matched_by": [],
                    },
                )

                applicable_regulations[
                    regulation.id
                ]["matched_by"].append(
                    f"Data Category: {category.name}"
                )

    return {
        "organization": organization.name,
        "ai_system": ai_system.name,
        "regulation_count": len(
            applicable_regulations
        ),
        "applicable_regulations": list(
            applicable_regulations.values()
        ),
    }