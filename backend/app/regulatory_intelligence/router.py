from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.db.session import get_db

from app.dependencies.auth import (
    get_current_user,
)

from app.models.obligation_control import (
    ObligationControl,
)
from app.models.regulation import (
    Regulation,
)
from app.models.regulation_article import (
    RegulationArticle,
)
from app.models.regulation_obligation import (
    RegulationObligation,
)
from app.models.user import User

from .detector import (
    check_all_sources,
    check_regulatory_source,
)

from .models import (
    RegulatoryChange,
    RegulatoryChangeAnalysis,
    RegulatoryChangeProvisionImpact,
    RegulatoryChangeProvisionReview,
    RegulatorySnapshot,
    RegulatorySource,
)

from .schemas import (
    RegulatoryChangeAnalysisCreateRequest,
    RegulatoryChangeAnalysisCreateResponse,
    RegulatoryChangeAnalysisDetailResponse,
    RegulatoryChangeAnalysisListResponse,
    RegulatoryChangeAnalysisResponse,
    RegulatoryChangeAnalysisUpdateRequest,
    RegulatoryChangeAnalysisValidationRequest,
    RegulatoryChangeAnalysisValidationResponse,
    RegulatoryChangeEvidenceResponse,
    RegulatoryChangeResponse,
    RegulatoryChangeReviewRequest,
    RegulatoryImpactReviewRequest,
    RegulatoryKnowledgeArticleResponse,
    RegulatoryKnowledgeControlResponse,
    RegulatoryKnowledgeObligationResponse,
    RegulatoryKnowledgeRegulationResponse,
    RegulatoryProvisionImpactCreateRequest,
    RegulatoryProvisionImpactCreateResponse,
    RegulatoryProvisionImpactDetailResponse,
    RegulatoryProvisionImpactResponse,
    RegulatoryProvisionReviewHistoryResponse,
    RegulatoryProvisionImpactReviewRequest,
    RegulatoryProvisionImpactUpdateRequest,
    RegulatoryPublishResponse,
    RegulatorySnapshotResponse,
    RegulatorySourceResponse,
)

from .sources import (
    seed_regulatory_sources,
)


# =========================================================
# ROLE DEFINITIONS
# =========================================================

PLATFORM_ROLES = {
    "super_admin",
    "platform_admin",
}


# =========================================================
# PHASE 2 CONSTANTS
# =========================================================

ANALYSIS_LOCKED_STATUSES = {
    "validated",
    "published",
    "superseded",
}


IMPACT_LEVEL_RANK = {
    "none": 0,
    "low": 1,
    "moderate": 2,
    "high": 3,
    "critical": 4,
}


# =========================================================
# ROLE DEPENDENCIES
# =========================================================

def require_platform_admin(
    current_user: User = Depends(
        get_current_user
    ),
) -> User:
    """
    Require a TrustGRC platform-level
    administrator.

    Company / tenant users must not be
    able to trigger global regulatory
    ingestion, review, publication,
    seeding, monitoring, or structured
    regulatory-analysis workflows.
    """

    if (
        not current_user.is_active
        or current_user.role
        not in PLATFORM_ROLES
    ):
        raise HTTPException(
            status_code=
                status.HTTP_403_FORBIDDEN,
            detail=(
                "Platform administrator "
                "access is required."
            ),
        )

    return current_user


# =========================================================
# PHASE 1 HELPERS
# =========================================================

def get_regulatory_change_or_404(
    db: Session,
    change_id: int,
) -> RegulatoryChange:
    change = (
        db.query(
            RegulatoryChange
        )
        .filter(
            RegulatoryChange.id
            == change_id
        )
        .first()
    )

    if change is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=(
                "Regulatory change "
                "not found."
            ),
        )

    return change


# =========================================================
# PHASE 2 HELPERS
# =========================================================

def get_change_source_or_409(
    db: Session,
    change: RegulatoryChange,
) -> RegulatorySource:
    source = (
        db.query(
            RegulatorySource
        )
        .filter(
            RegulatorySource.id
            == change.source_id
        )
        .first()
    )

    if source is None:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "The regulatory source associated "
                "with this change no longer exists."
            ),
        )

    return source


def get_regulatory_analysis_or_404(
    db: Session,
    change_id: int,
    analysis_id: int,
) -> RegulatoryChangeAnalysis:
    analysis = (
        db.query(
            RegulatoryChangeAnalysis
        )
        .filter(
            RegulatoryChangeAnalysis.id
            == analysis_id,

            RegulatoryChangeAnalysis
            .regulatory_change_id
            == change_id,
        )
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=(
                "Regulatory change analysis "
                "not found."
            ),
        )

    return analysis


def get_provision_impact_or_404(
    db: Session,
    analysis_id: int,
    impact_id: int,
) -> RegulatoryChangeProvisionImpact:
    impact = (
        db.query(
            RegulatoryChangeProvisionImpact
        )
        .filter(
            RegulatoryChangeProvisionImpact.id
            == impact_id,

            RegulatoryChangeProvisionImpact
            .analysis_id
            == analysis_id,
        )
        .first()
    )

    if impact is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=(
                "Regulatory provision impact "
                "not found."
            ),
        )

    return impact


def require_analysis_editable(
    analysis: RegulatoryChangeAnalysis,
) -> None:
    """
    Prevent silent alteration of a validated,
    published or superseded analysis.
    """

    if (
        analysis.analysis_status
        in ANALYSIS_LOCKED_STATUSES
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "This structured regulatory "
                "analysis is locked. Validated, "
                "published, or superseded analyses "
                "cannot be modified. Create a new "
                "analysis version instead."
            ),
        )


def get_controls_for_obligation(
    db: Session,
    obligation_id: int | None,
) -> list[ObligationControl]:
    if obligation_id is None:
        return []

    return (
        db.query(
            ObligationControl
        )
        .filter(
            ObligationControl.obligation_id
            == obligation_id
        )
        .order_by(
            ObligationControl.control_code,
            ObligationControl.id,
        )
        .all()
    )


def validate_regulatory_hierarchy(
    db: Session,
    source: RegulatorySource,
    regulation_id: int,
    article_id: int,
    obligation_id: int | None,
) -> tuple[
    Regulation,
    RegulationArticle,
    RegulationObligation | None,
]:
    """
    Validate:

    RegulatorySource
        -> Regulation
        -> Article / Provision
        -> Obligation

    This prevents cross-regulation mappings such
    as an EU AI Act source being linked to a GDPR
    Article or obligation.
    """

    if source.regulation_id is None:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "This Regulatory Intelligence "
                "source is not yet linked to a "
                "canonical TrustGRC regulation."
            ),
        )

    if (
        source.regulation_id
        != regulation_id
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "The selected regulation does not "
                "match the canonical regulation "
                "linked to this Regulatory "
                "Intelligence source."
            ),
        )

    regulation = (
        db.query(
            Regulation
        )
        .filter(
            Regulation.id
            == regulation_id
        )
        .first()
    )

    if regulation is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=(
                "Canonical regulation "
                "not found."
            ),
        )

    article = (
        db.query(
            RegulationArticle
        )
        .filter(
            RegulationArticle.id
            == article_id
        )
        .first()
    )

    if article is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=(
                "Regulatory Article / provision "
                "not found."
            ),
        )

    if (
        article.regulation_id
        != regulation_id
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "The selected Article / provision "
                "does not belong to the selected "
                "regulation."
            ),
        )

    obligation = None

    if obligation_id is not None:
        obligation = (
            db.query(
                RegulationObligation
            )
            .filter(
                RegulationObligation.id
                == obligation_id
            )
            .first()
        )

        if obligation is None:
            raise HTTPException(
                status_code=
                    status.HTTP_404_NOT_FOUND,
                detail=(
                    "Regulatory obligation "
                    "not found."
                ),
            )

        if (
            obligation.article_id
            != article_id
        ):
            raise HTTPException(
                status_code=
                    status.HTTP_409_CONFLICT,
                detail=(
                    "The selected obligation does "
                    "not belong to the selected "
                    "Article / provision."
                ),
            )

    return (
        regulation,
        article,
        obligation,
    )


def validate_source_snapshot(
    db: Session,
    change: RegulatoryChange,
    snapshot_id: int | None,
) -> RegulatorySnapshot | None:
    if snapshot_id is None:
        return None

    snapshot = (
        db.query(
            RegulatorySnapshot
        )
        .filter(
            RegulatorySnapshot.id
            == snapshot_id
        )
        .first()
    )

    if snapshot is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=(
                "Regulatory source snapshot "
                "not found."
            ),
        )

    if (
        snapshot.source_id
        != change.source_id
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "The selected snapshot does not "
                "belong to the regulatory source "
                "associated with this change."
            ),
        )

    return snapshot


def calculate_overall_impact_level(
    impacts: list[
        RegulatoryChangeProvisionImpact
    ],
) -> str | None:
    """
    Derive the overall impact level from the
    highest provision-level impact.
    """

    available = [
        impact.impact_level
        for impact in impacts
        if impact.impact_level
        in IMPACT_LEVEL_RANK
    ]

    if not available:
        return None

    return max(
        available,
        key=lambda value:
            IMPACT_LEVEL_RANK[
                value
            ],
    )


def build_provision_impact_detail(
    db: Session,
    impact:
        RegulatoryChangeProvisionImpact,
) -> RegulatoryProvisionImpactDetailResponse:
    regulation = None
    article = None
    obligation = None
    snapshot = None

    if impact.regulation_id is not None:
        regulation = (
            db.query(
                Regulation
            )
            .filter(
                Regulation.id
                == impact.regulation_id
            )
            .first()
        )

    if (
        impact.regulation_article_id
        is not None
    ):
        article = (
            db.query(
                RegulationArticle
            )
            .filter(
                RegulationArticle.id
                == impact.regulation_article_id
            )
            .first()
        )

    if (
        impact.regulation_obligation_id
        is not None
    ):
        obligation = (
            db.query(
                RegulationObligation
            )
            .filter(
                RegulationObligation.id
                == impact
                .regulation_obligation_id
            )
            .first()
        )

    if (
        impact.source_snapshot_id
        is not None
    ):
        snapshot = (
            db.query(
                RegulatorySnapshot
            )
            .filter(
                RegulatorySnapshot.id
                == impact.source_snapshot_id
            )
            .first()
        )

    controls = (
        get_controls_for_obligation(
            db,
            impact.regulation_obligation_id,
        )
    )

    return (
        RegulatoryProvisionImpactDetailResponse(
            impact=(
                RegulatoryProvisionImpactResponse
                .model_validate(
                    impact
                )
            ),


            review_history=[
            RegulatoryProvisionReviewHistoryResponse
            .model_validate(
                history_entry
            )
            for history_entry
            in impact.review_history
        ],


            regulation=(
                RegulatoryKnowledgeRegulationResponse
                .model_validate(
                    regulation
                )
                if regulation
                is not None
                else None
            ),

            article=(
                RegulatoryKnowledgeArticleResponse
                .model_validate(
                    article
                )
                if article
                is not None
                else None
            ),

            obligation=(
                RegulatoryKnowledgeObligationResponse
                .model_validate(
                    obligation
                )
                if obligation
                is not None
                else None
            ),

            controls=[
                RegulatoryKnowledgeControlResponse
                .model_validate(
                    control
                )
                for control
                in controls
            ],

            source_snapshot=(
                RegulatorySnapshotResponse
                .model_validate(
                    snapshot
                )
                if snapshot
                is not None
                else None
            ),
        )
    )


def build_analysis_detail(
    db: Session,
    change: RegulatoryChange,
    analysis: RegulatoryChangeAnalysis,
) -> RegulatoryChangeAnalysisDetailResponse:
    source = (
        get_change_source_or_409(
            db,
            change,
        )
    )

    regulation = None

    if source.regulation_id is not None:
        regulation = (
            db.query(
                Regulation
            )
            .filter(
                Regulation.id
                == source.regulation_id
            )
            .first()
        )

    impacts = (
        db.query(
            RegulatoryChangeProvisionImpact
        )
        .filter(
            RegulatoryChangeProvisionImpact
            .analysis_id
            == analysis.id
        )
        .order_by(
            RegulatoryChangeProvisionImpact.id
        )
        .all()
    )

    detail_impacts = [
        build_provision_impact_detail(
            db,
            impact,
        )
        for impact
        in impacts
    ]

    validated_count = sum(
        1
        for impact in impacts
        if impact.review_status
        == "validated"
    )

    control_ids: set[int] = set()

    for impact in impacts:
        controls = (
            get_controls_for_obligation(
                db,
                impact
                .regulation_obligation_id,
            )
        )

        for control in controls:
            control_ids.add(
                control.id
            )

    return (
        RegulatoryChangeAnalysisDetailResponse(
            analysis=(
                RegulatoryChangeAnalysisResponse
                .model_validate(
                    analysis
                )
            ),

            change=(
                RegulatoryChangeResponse
                .model_validate(
                    change
                )
            ),

            source=(
                RegulatorySourceResponse
                .model_validate(
                    source
                )
            ),

            regulation=(
                RegulatoryKnowledgeRegulationResponse
                .model_validate(
                    regulation
                )
                if regulation
                is not None
                else None
            ),

            provision_impacts=(
                detail_impacts
            ),

            provision_count=(
                len(
                    impacts
                )
            ),

            validated_provision_count=(
                validated_count
            ),

            affected_control_count=(
                len(
                    control_ids
                )
            ),
        )
    )


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix=
        "/api/v1/regulatory-intelligence",
    tags=[
        "Regulatory Intelligence"
    ],
)


# =========================================================
# PLATFORM ADMINISTRATION
# =========================================================

@router.post(
    "/seed",
)
def seed_sources(
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_platform_admin
    ),
):
    """
    Seed the authoritative regulatory
    source registry.

    Platform administrators only.
    """

    created = (
        seed_regulatory_sources(
            db
        )
    )

    return {
        "message": (
            "Regulatory source registry "
            "seeded."
        ),
        "created": created,
    }


# =========================================================
# SOURCE REGISTRY
# =========================================================

@router.get(
    "/sources",
    response_model=
        list[
            RegulatorySourceResponse
        ],
)
def list_sources(
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    List monitored regulatory sources.

    Available to authenticated users.
    """

    return (
        db.query(
            RegulatorySource
        )
        .order_by(
            RegulatorySource
            .jurisdiction_name,

            RegulatorySource
            .regulation_name,
        )
        .all()
    )


# =========================================================
# JURISDICTIONS
# =========================================================

@router.get(
    "/jurisdictions",
)
def list_jurisdictions(
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    List jurisdictions represented by
    active Regulatory Intelligence sources.

    Available to authenticated users.
    """

    sources = (
        db.query(
            RegulatorySource
        )
        .filter(
            RegulatorySource
            .monitoring_enabled
            .is_(True)
        )
        .all()
    )

    jurisdictions: dict[
        str,
        dict,
    ] = {}

    for source in sources:
        code = (
            source
            .jurisdiction_code
        )

        if code not in jurisdictions:
            jurisdictions[
                code
            ] = {
                "code":
                    code,

                "name":
                    source
                    .jurisdiction_name,

                "regulations":
                    0,
            }

        jurisdictions[
            code
        ][
            "regulations"
        ] += 1

    return sorted(
        jurisdictions.values(),
        key=lambda item:
            item["name"],
    )


# =========================================================
# CHECK SINGLE SOURCE
# =========================================================

@router.post(
    "/sources/{source_id}/check",
)
async def check_source(
    source_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_platform_admin
    ),
):
    """
    Run authoritative monitoring for a
    single regulatory source.

    Platform administrators only.
    """

    source = (
        db.query(
            RegulatorySource
        )
        .filter(
            RegulatorySource.id
            == source_id
        )
        .first()
    )

    if source is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=(
                "Regulatory source "
                "not found."
            ),
        )

    return (
        await
        check_regulatory_source(
            db,
            source,
        )
    )


# =========================================================
# CHECK ALL SOURCES
# =========================================================

@router.post(
    "/check-all",
)
async def check_sources(
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_platform_admin
    ),
):
    """
    Run authoritative monitoring against
    every enabled regulatory source.

    Platform administrators only.
    """

    return (
        await
        check_all_sources(
            db
        )
    )


# =========================================================
# REGULATORY CHANGES
# =========================================================

@router.get(
    "/changes",
    response_model=
        list[
            RegulatoryChangeResponse
        ],
)
def list_changes(
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    List detected Regulatory Intelligence
    change candidates.

    Available to authenticated users.
    """

    return (
        db.query(
            RegulatoryChange
        )
        .order_by(
            RegulatoryChange
            .detected_at
            .desc(),

            RegulatoryChange
            .id
            .desc(),
        )
        .all()
    )


# =========================================================
# REGULATORY CHANGE EVIDENCE
# =========================================================

@router.get(
    "/changes/{change_id}/evidence",
    response_model=
        RegulatoryChangeEvidenceResponse,
)
def get_regulatory_change_evidence(
    change_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_platform_admin
    ),
) -> RegulatoryChangeEvidenceResponse:
    """
    Retrieve the complete evidence package for a
    detected regulatory-change candidate.

    Includes:
    - regulatory source
    - previous authoritative snapshot
    - new authoritative snapshot
    - provenance metadata
    - technical comparison evidence

    Platform administrators only.
    """

    change = (
        get_regulatory_change_or_404(
            db,
            change_id,
        )
    )

    source = (
        get_change_source_or_409(
            db,
            change,
        )
    )

    previous_snapshot = None

    if (
        change.previous_snapshot_id
        is not None
    ):
        previous_snapshot = (
            db.query(
                RegulatorySnapshot
            )
            .filter(
                RegulatorySnapshot.id
                == change.previous_snapshot_id
            )
            .first()
        )

    new_snapshot = None

    if (
        change.new_snapshot_id
        is not None
    ):
        new_snapshot = (
            db.query(
                RegulatorySnapshot
            )
            .filter(
                RegulatorySnapshot.id
                == change.new_snapshot_id
            )
            .first()
        )

    evidence_complete = (
        change.evidence_status
        == "captured"
        and previous_snapshot
        is not None
        and new_snapshot
        is not None
        and bool(
            previous_snapshot.source_url
        )
        and bool(
            new_snapshot.source_url
        )
        and (
            previous_snapshot.retrieval_status
            == "ok"
        )
        and (
            new_snapshot.retrieval_status
            == "ok"
        )
    )

    evidence_warning = None

    if not evidence_complete:
        if (
            change.evidence_status
            == "legacy_partial"
        ):
            evidence_warning = (
                "This regulatory change predates "
                "full provenance tracking. Some "
                "historical evidence is unavailable."
            )

        elif (
            change.previous_snapshot_id
            is None
            or change.new_snapshot_id
            is None
        ):
            evidence_warning = (
                "Snapshot linkage is incomplete for "
                "this regulatory change."
            )

        elif (
            previous_snapshot is None
            or new_snapshot is None
        ):
            evidence_warning = (
                "One or more linked regulatory "
                "snapshots could not be located."
            )

        else:
            evidence_warning = (
                "The evidence package is incomplete "
                "or contains unverified provenance."
            )

    return RegulatoryChangeEvidenceResponse(
        change=change,
        source=source,

        previous_snapshot=(
            previous_snapshot
        ),

        new_snapshot=(
            new_snapshot
        ),

        evidence_complete=(
            evidence_complete
        ),

        evidence_warning=(
            evidence_warning
        ),
    )


# =========================================================
# REVIEW REGULATORY CHANGE
# =========================================================

@router.patch(
    "/changes/{change_id}/review",
    response_model=
        RegulatoryChangeResponse,
)
def review_regulatory_change(
    change_id: int,
    payload:
        RegulatoryChangeReviewRequest,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_platform_admin
    ),
) -> RegulatoryChange:
    """
    Review a detected regulatory-change
    candidate.

    Platform administrators only.
    """

    change = (
        get_regulatory_change_or_404(
            db,
            change_id,
        )
    )

    if (
        change.published_at
        is not None
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Published regulatory "
                "intelligence cannot be "
                "reviewed again."
            ),
        )

    if (
        change.impact_status
        == "analysed"
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "The regulatory review cannot "
                "be changed after impact analysis "
                "has been completed. A controlled "
                "reopen workflow is required."
            ),
        )

    change.change_type = (
        payload.change_type
    )

    change.review_decision = (
        payload.review_decision
    )

    change.review_notes = (
        payload.review_notes
    )

    change.reviewed_by_user_id = (
        current_user.id
    )

    change.reviewed_at = (
        datetime.utcnow()
    )

    change.review_status = (
        "reviewed"
    )

    if (
        payload.review_decision
        == "confirmed"
    ):
        change.impact_status = (
            "analysis_required"
        )

        change.impact_level = (
            None
        )

        change.impact_summary = (
            None
        )

    elif (
        payload.review_decision
        == "dismissed"
    ):
        change.impact_status = (
            "not_applicable"
        )

        change.impact_level = (
            "none"
        )

        change.impact_summary = (
            "The detected change was "
            "dismissed during regulatory "
            "review."
        )

    elif (
        payload.review_decision
        == "needs_more_information"
    ):
        change.review_status = (
            "in_review"
        )

        change.impact_status = (
            "not_analysed"
        )

        change.impact_level = (
            None
        )

        change.impact_summary = (
            None
        )

    db.commit()

    db.refresh(
        change
    )

    return change


# =========================================================
# PHASE 1 IMPACT ANALYSIS
# =========================================================

@router.patch(
    "/changes/{change_id}/impact",
    response_model=
        RegulatoryChangeResponse,
)
def review_regulatory_impact(
    change_id: int,
    payload:
        RegulatoryImpactReviewRequest,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_platform_admin
    ),
) -> RegulatoryChange:
    """
    Record Phase 1 impact analysis for a
    confirmed regulatory change.

    This endpoint remains for backward
    compatibility while Phase 2 structured
    analysis is introduced.

    Platform administrators only.
    """

    change = (
        get_regulatory_change_or_404(
            db,
            change_id,
        )
    )

    if (
        change.published_at
        is not None
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Published regulatory "
                "intelligence cannot be "
                "modified."
            ),
        )

    if (
        change.review_decision
        != "confirmed"
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Impact analysis can only "
                "be recorded after the "
                "regulatory change has "
                "been confirmed."
            ),
        )

    if (
        change.review_status
        != "reviewed"
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Impact analysis requires "
                "a completed regulatory review."
            ),
        )

    change.impact_status = (
        "analysed"
    )

    change.impact_level = (
        payload.impact_level
    )

    change.impact_summary = (
        payload.impact_summary
    )

    db.commit()

    db.refresh(
        change
    )

    return change


# =========================================================
# PHASE 2 - LIST STRUCTURED ANALYSES
# =========================================================

@router.get(
    "/changes/{change_id}/analyses",
    response_model=
        RegulatoryChangeAnalysisListResponse,
)
def list_regulatory_change_analyses(
    change_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_platform_admin
    ),
) -> RegulatoryChangeAnalysisListResponse:
    """
    List all structured analysis versions for
    one regulatory change.
    """

    get_regulatory_change_or_404(
        db,
        change_id,
    )

    analyses = (
        db.query(
            RegulatoryChangeAnalysis
        )
        .filter(
            RegulatoryChangeAnalysis
            .regulatory_change_id
            == change_id
        )
        .order_by(
            RegulatoryChangeAnalysis
            .analysis_version
            .desc(),

            RegulatoryChangeAnalysis.id
            .desc(),
        )
        .all()
    )

    return (
        RegulatoryChangeAnalysisListResponse(
            change_id=
                change_id,

            analyses=[
                RegulatoryChangeAnalysisResponse
                .model_validate(
                    analysis
                )
                for analysis
                in analyses
            ],

            count=
                len(
                    analyses
                ),
        )
    )


# =========================================================
# PHASE 2 - CREATE STRUCTURED ANALYSIS
# =========================================================

@router.post(
    "/changes/{change_id}/analyses",
    response_model=
        RegulatoryChangeAnalysisCreateResponse,
    status_code=
        status.HTTP_201_CREATED,
)
def create_regulatory_change_analysis(
    change_id: int,
    payload:
        RegulatoryChangeAnalysisCreateRequest,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_platform_admin
    ),
) -> RegulatoryChangeAnalysisCreateResponse:
    """
    Create a new versioned structured analysis
    for a confirmed regulatory change.
    """

    change = (
        get_regulatory_change_or_404(
            db,
            change_id,
        )
    )

    if (
        change.published_at
        is not None
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "A new structured analysis cannot "
                "be created for already-published "
                "regulatory intelligence."
            ),
        )

    if (
        change.review_status
        != "reviewed"
        or change.review_decision
        != "confirmed"
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Structured analysis requires a "
                "completed and confirmed regulatory "
                "review."
            ),
        )

    source = (
        get_change_source_or_409(
            db,
            change,
        )
    )

    if (
        source.regulation_id
        is None
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Structured Article / provision "
                "analysis is unavailable because "
                "this source has not yet been mapped "
                "to a canonical TrustGRC regulation."
            ),
        )

    existing = (
        db.query(
            RegulatoryChangeAnalysis
        )
        .filter(
            RegulatoryChangeAnalysis
            .regulatory_change_id
            == change_id
        )
        .order_by(
            RegulatoryChangeAnalysis
            .analysis_version
            .desc()
        )
        .all()
    )

    latest = (
        existing[0]
        if existing
        else None
    )


    if (
        latest is not None
        and latest.analysis_status
        != "validated"
    ):
        
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "A new structured analysis version "
                "can only be created after the latest "
                "analysis version has been fully "
                "validated."
            ),
        )

    if (
        latest is not None
        and payload.supersedes_analysis_id
        != latest.id
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "A new structured analysis version "
                "must supersede the latest validated "
                "analysis version."
            ),
        )


    if (
        latest is None
        and payload.supersedes_analysis_id
        is not None
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "There is no previous analysis "
                "version to supersede."
            ),
        )

    supersedes = None

    if (
        payload.supersedes_analysis_id
        is not None
    ):
        supersedes = (
            db.query(
                RegulatoryChangeAnalysis
            )
            .filter(
                RegulatoryChangeAnalysis.id
                == payload
                .supersedes_analysis_id,

                RegulatoryChangeAnalysis
                .regulatory_change_id
                == change_id,
            )
            .first()
        )

        if supersedes is None:
            raise HTTPException(
                status_code=
                    status.HTTP_409_CONFLICT,
                detail=(
                    "The analysis selected for "
                    "supersession does not belong "
                    "to this regulatory change."
                ),
            )

    elif latest is not None:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "This change already has a "
                "structured analysis. Creating "
                "another version requires "
                "supersedes_analysis_id."
            ),
        )

    next_version = (
        (
            latest.analysis_version
            + 1
        )
        if latest
        is not None
        else 1
    )

    if (
        payload.analysis_origin
        in {
            "ai_assisted",
            "system_generated",
        }
        and not payload.generated_by_model
    ):
        raise HTTPException(
            status_code=
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "generated_by_model is required "
                "for AI-assisted or system-generated "
                "regulatory analysis."
            ),
        )

    if (
        payload.analysis_origin
        == "human"
        and payload.generated_by_model
        is not None
    ):
        raise HTTPException(
            status_code=
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "generated_by_model must not be "
                "provided for a purely human "
                "analysis."
            ),
        )

    initial_status = (
        "draft"
        if payload.analysis_origin
        == "human"
        else "proposed"
    )

    analysis = (
        RegulatoryChangeAnalysis(
            regulatory_change_id=
                change.id,

            analysis_version=
                next_version,

            analysis_status=
                initial_status,

            analysis_origin=
                payload.analysis_origin,

            analysis_method=
                payload.analysis_method,

            overall_impact_level=(
                payload.overall_impact_level
                if payload
                .overall_impact_level
                is not None
                else change.impact_level
            ),

            executive_summary=(
                payload.executive_summary
                if payload
                .executive_summary
                is not None
                else change.impact_summary
            ),

            generated_by_model=
                payload.generated_by_model,

            generated_at=(
                datetime.utcnow()
                if payload.analysis_origin
                != "human"
                else None
            ),

            supersedes_analysis_id=(
                payload.supersedes_analysis_id
            ),
        )
    )

    db.add(
        analysis
    )

    db.commit()

    db.refresh(
        analysis
    )

    return (
        RegulatoryChangeAnalysisCreateResponse(
            analysis=(
                RegulatoryChangeAnalysisResponse
                .model_validate(
                    analysis
                )
            ),

            message=(
                "Structured regulatory analysis "
                f"version {analysis.analysis_version} "
                "created successfully."
            ),
        )
    )


# =========================================================
# PHASE 2 - GET ANALYSIS DETAIL
# =========================================================

@router.get(
    (
        "/changes/{change_id}/analyses/"
        "{analysis_id}"
    ),
    response_model=
        RegulatoryChangeAnalysisDetailResponse,
)
def get_regulatory_change_analysis(
    change_id: int,
    analysis_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_platform_admin
    ),
) -> RegulatoryChangeAnalysisDetailResponse:
    """
    Retrieve one complete structured regulatory
    analysis including affected provisions,
    obligations, controls, and source evidence.
    """

    change = (
        get_regulatory_change_or_404(
            db,
            change_id,
        )
    )

    analysis = (
        get_regulatory_analysis_or_404(
            db,
            change_id,
            analysis_id,
        )
    )

    return (
        build_analysis_detail(
            db,
            change,
            analysis,
        )
    )


# =========================================================
# PHASE 2 - UPDATE ANALYSIS DRAFT
# =========================================================

@router.patch(
    (
        "/changes/{change_id}/analyses/"
        "{analysis_id}"
    ),
    response_model=
        RegulatoryChangeAnalysisResponse,
)
def update_regulatory_change_analysis(
    change_id: int,
    analysis_id: int,
    payload:
        RegulatoryChangeAnalysisUpdateRequest,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_platform_admin
    ),
) -> RegulatoryChangeAnalysis:
    """
    Update an editable structured-analysis
    version.

    Validated, published and superseded
    versions are immutable.
    """

    change = (
        get_regulatory_change_or_404(
            db,
            change_id,
        )
    )

    if (
        change.published_at
        is not None
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Structured analysis cannot be "
                "modified after the regulatory "
                "change has been published."
            ),
        )

    analysis = (
        get_regulatory_analysis_or_404(
            db,
            change_id,
            analysis_id,
        )
    )

    require_analysis_editable(
        analysis
    )

    updates = (
        payload.model_dump(
            exclude_unset=True
        )
    )

    for (
        field_name,
        field_value,
    ) in updates.items():
        setattr(
            analysis,
            field_name,
            field_value,
        )

    analysis.updated_at = (
        datetime.utcnow()
    )

    db.commit()

    db.refresh(
        analysis
    )

    return analysis


# =========================================================
# PHASE 2 - ADD PROVISION IMPACT
# =========================================================

@router.post(
    (
        "/changes/{change_id}/analyses/"
        "{analysis_id}/provision-impacts"
    ),
    response_model=
        RegulatoryProvisionImpactCreateResponse,
    status_code=
        status.HTTP_201_CREATED,
)
def create_regulatory_provision_impact(
    change_id: int,
    analysis_id: int,
    payload:
        RegulatoryProvisionImpactCreateRequest,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_platform_admin
    ),
) -> RegulatoryProvisionImpactCreateResponse:
    """
    Add one affected Article / section / clause /
    rule / provision to a structured analysis.

    The canonical Regulation -> Article ->
    Obligation hierarchy is validated before
    the mapping is accepted.
    """

    change = (
        get_regulatory_change_or_404(
            db,
            change_id,
        )
    )

    if (
        change.published_at
        is not None
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Provision impacts cannot be added "
                "after publication."
            ),
        )

    analysis = (
        get_regulatory_analysis_or_404(
            db,
            change_id,
            analysis_id,
        )
    )

    require_analysis_editable(
        analysis
    )

    source = (
        get_change_source_or_409(
            db,
            change,
        )
    )

    (
        regulation,
        article,
        obligation,
    ) = validate_regulatory_hierarchy(
        db,
        source,
        payload.regulation_id,
        payload.regulation_article_id,
        payload.regulation_obligation_id,
    )

    snapshot_id = (
        payload.source_snapshot_id
    )

    if (
        snapshot_id is None
        and change.new_snapshot_id
        is not None
    ):
        snapshot_id = (
            change.new_snapshot_id
        )

    snapshot = (
        validate_source_snapshot(
            db,
            change,
            snapshot_id,
        )
    )

    duplicate = (
        db.query(
            RegulatoryChangeProvisionImpact
        )
        .filter(
            RegulatoryChangeProvisionImpact
            .analysis_id
            == analysis.id,

            RegulatoryChangeProvisionImpact
            .regulation_article_id
            == article.id,

            RegulatoryChangeProvisionImpact
            .regulation_obligation_id
            == (
                obligation.id
                if obligation
                is not None
                else None
            ),

            RegulatoryChangeProvisionImpact
            .provision_reference
            == payload.provision_reference,
        )
        .first()
    )

    if duplicate is not None:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "This Article / provision mapping "
                "already exists in the structured "
                "analysis."
            ),
        )

    source_url = (
        payload.source_url
    )

    if (
        source_url is None
        and snapshot is not None
        and snapshot.source_url
    ):
        source_url = (
            snapshot.source_url
        )

    if (
        source_url is None
        and article.source_url
    ):
        source_url = (
            article.source_url
        )

    if source_url is None:
        source_url = (
            source.official_url
        )

    current_requirement = (
        payload.current_requirement
    )

    if (
        current_requirement is None
        and obligation is not None
    ):
        current_requirement = (
            obligation.obligation_text
        )

    impact = (
        RegulatoryChangeProvisionImpact(
            analysis_id=
                analysis.id,

            regulation_id=
                regulation.id,

            regulation_article_id=
                article.id,

            regulation_obligation_id=(
                obligation.id
                if obligation
                is not None
                else None
            ),

            provision_reference=
                payload.provision_reference,

            provision_title=(
                payload.provision_title
                if payload.provision_title
                is not None
                else article.title
            ),

            change_type=
                payload.change_type,

            previous_requirement=
                payload.previous_requirement,

            current_requirement=
                current_requirement,

            change_explanation=
                payload.change_explanation,

            legal_interpretation=
                payload.legal_interpretation,

            operational_impact=
                payload.operational_impact,

            compliance_governance_impact=
                payload.compliance_governance_impact,

            evidence_documentation=
                payload.evidence_documentation,

            recommended_action=
                payload.recommended_action,

            impact_level=
                payload.impact_level,

            source_snapshot_id=(
                snapshot.id
                if snapshot
                is not None
                else None
            ),

            source_url=
                source_url,

            review_status=
                "pending_review",
        )
    )

    db.add(
        impact
    )

    analysis.updated_at = (
        datetime.utcnow()
    )

    db.commit()

    db.refresh(
        impact
    )

    controls = (
        get_controls_for_obligation(
            db,
            impact
            .regulation_obligation_id,
        )
    )

    return (
        RegulatoryProvisionImpactCreateResponse(
            impact=(
                RegulatoryProvisionImpactResponse
                .model_validate(
                    impact
                )
            ),

            controls=[
                RegulatoryKnowledgeControlResponse
                .model_validate(
                    control
                )
                for control
                in controls
            ],

            message=(
                "Regulatory provision impact "
                "added successfully."
            ),
        )
    )


# =========================================================
# PHASE 2 - UPDATE PROVISION IMPACT
# =========================================================

@router.patch(
    (
        "/changes/{change_id}/analyses/"
        "{analysis_id}/provision-impacts/"
        "{impact_id}"
    ),
    response_model=
        RegulatoryProvisionImpactResponse,
)
def update_regulatory_provision_impact(
    change_id: int,
    analysis_id: int,
    impact_id: int,
    payload:
        RegulatoryProvisionImpactUpdateRequest,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_platform_admin
    ),
) -> RegulatoryChangeProvisionImpact:
    """
    Update an editable provision-impact record.

    Canonical Regulation / Article / Obligation
    identity is deliberately not editable through
    this endpoint. A wrong canonical mapping should
    be replaced rather than silently rewritten.
    """

    change = (
        get_regulatory_change_or_404(
            db,
            change_id,
        )
    )

    if (
        change.published_at
        is not None
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Provision impacts cannot be "
                "modified after publication."
            ),
        )

    analysis = (
        get_regulatory_analysis_or_404(
            db,
            change_id,
            analysis_id,
        )
    )

    require_analysis_editable(
        analysis
    )

    impact = (
        get_provision_impact_or_404(
            db,
            analysis_id,
            impact_id,
        )
    )

    updates = (
        payload.model_dump(
            exclude_unset=True
        )
    )

    if (
        "source_snapshot_id"
        in updates
    ):
        snapshot = (
            validate_source_snapshot(
                db,
                change,
                updates[
                    "source_snapshot_id"
                ],
            )
        )

        updates[
            "source_snapshot_id"
        ] = (
            snapshot.id
            if snapshot
            is not None
            else None
        )

    for (
        field_name,
        field_value,
    ) in updates.items():
        setattr(
            impact,
            field_name,
            field_value,
        )

    impact.review_status = (
        "pending_review"
    )

    impact.reviewed_by_user_id = (
        None
    )

    impact.reviewed_at = (
        None
    )

    impact.updated_at = (
        datetime.utcnow()
    )

    analysis.updated_at = (
        datetime.utcnow()
    )

    db.commit()

    db.refresh(
        impact
    )

    return impact


# =========================================================
# PHASE 2 - REVIEW PROVISION IMPACT
# =========================================================

@router.patch(
    (
        "/changes/{change_id}/analyses/"
        "{analysis_id}/provisions/"
        "{impact_id}/review"
    ),
    response_model=
        RegulatoryProvisionImpactResponse,
)
def review_regulatory_provision_impact(
    change_id: int,
    analysis_id: int,
    impact_id: int,
    payload:
        RegulatoryProvisionImpactReviewRequest,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_platform_admin
    ),
) -> RegulatoryChangeProvisionImpact:
    """
    Human-review an individual structured
    regulatory provision impact.

    A provision impact may be validated or
    rejected only while its parent analysis
    remains editable.
    """

    change = (
        get_regulatory_change_or_404(
            db,
            change_id,
        )
    )

    if (
        change.published_at
        is not None
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Provision impacts cannot be "
                "reviewed after the regulatory "
                "change has been published."
            ),
        )

    analysis = (
        get_regulatory_analysis_or_404(
            db,
            change_id,
            analysis_id,
        )
    )

    require_analysis_editable(
        analysis
    )

    impact = (
        get_provision_impact_or_404(
            db,
            analysis_id,
            impact_id,
        )
    )

    review_time = (
        datetime.utcnow()
    )


    review_history_entry = (
    RegulatoryChangeProvisionReview(
        provision_impact_id=
            impact.id,

        review_status=
            payload.review_status,

        review_notes=
            payload.review_notes,

        reviewed_by_user_id=
            current_user.id,

        reviewed_at=
            review_time,

        created_at=
            review_time,
    )
    )

    db.add(
        review_history_entry
    )


    impact.review_status = (
        payload.review_status
    )

    impact.review_notes = (
        payload.review_notes
    )

    impact.reviewed_by_user_id = (
        current_user.id
    )

    impact.reviewed_at = (
        review_time
    )

    impact.updated_at = (
        review_time
    )

    analysis.updated_at = (
        review_time
    )

    db.commit()

    db.refresh(
        impact
    )

    return impact


# =========================================================
# PHASE 2 - VALIDATE STRUCTURED ANALYSIS
# =========================================================

@router.post(
    (
        "/changes/{change_id}/analyses/"
        "{analysis_id}/validate"
    ),
    response_model=
        RegulatoryChangeAnalysisValidationResponse,
)
def validate_regulatory_change_analysis(
    change_id: int,
    analysis_id: int,
    payload:
        RegulatoryChangeAnalysisValidationRequest,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_platform_admin
    ),
) -> RegulatoryChangeAnalysisValidationResponse:
    """
    Human-validate a complete structured
    regulatory analysis.

    Validation:
    - requires at least one provision impact
    - locks the analysis
    - validates its provision-impact records
    - derives overall impact where necessary
    - synchronises the Phase 1 dashboard fields
    """

    change = (
        get_regulatory_change_or_404(
            db,
            change_id,
        )
    )

    if (
        change.published_at
        is not None
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Structured analysis cannot be "
                "validated after the regulatory "
                "change has already been published."
            ),
        )

    if (
        change.review_status
        != "reviewed"
        or change.review_decision
        != "confirmed"
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Structured analysis validation "
                "requires a confirmed regulatory "
                "review."
            ),
        )

    analysis = (
        get_regulatory_analysis_or_404(
            db,
            change_id,
            analysis_id,
        )
    )

    require_analysis_editable(
        analysis
    )

    impacts = (
        db.query(
            RegulatoryChangeProvisionImpact
        )
        .filter(
            RegulatoryChangeProvisionImpact
            .analysis_id
            == analysis.id
        )
        .order_by(
            RegulatoryChangeProvisionImpact.id
        )
        .all()
    )

    if not impacts:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "At least one Article / provision "
                "impact is required before the "
                "structured analysis can be "
                "validated."
            ),
        )

    overall_impact = (
        analysis.overall_impact_level
    )

    if overall_impact is None:
        overall_impact = (
            calculate_overall_impact_level(
                impacts
            )
        )

    if overall_impact is None:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "An overall impact level could "
                "not be determined."
            ),
        )

    if (
        analysis.executive_summary
        is None
        or len(
            analysis.executive_summary.strip()
        ) < 10
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "A meaningful executive summary "
                "is required before structured "
                "analysis validation."
            ),
        )

    # -----------------------------------------------------
    # PROVISION-LEVEL HUMAN REVIEW GATE
    # -----------------------------------------------------
    #
    # Every provision impact must complete its own human
    # review before the parent structured analysis can be
    # validated. Analysis validation must never silently
    # validate child provision-impact records.
    # -----------------------------------------------------

    pending_impacts = [
        impact
        for impact in impacts
        if impact.review_status
        != "validated"
    ]

    if pending_impacts:
        pending_ids = [
            str(impact.id)
            for impact in pending_impacts
        ]

        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "All provision impacts must be "
                "individually human-validated before "
                "the structured analysis can be "
                "validated. Provision impact IDs "
                "requiring review: "
                + ", ".join(
                    pending_ids
                )
                + "."
            ),
        )

    validation_time = (
        datetime.utcnow()
    )

    analysis.overall_impact_level = (
        overall_impact
    )

    analysis.analysis_status = (
        "validated"
    )

    analysis.validated_by_user_id = (
        current_user.id
    )

    analysis.validated_at = (
        validation_time
    )

    analysis.validation_notes = (
        payload.validation_notes
    )

    analysis.updated_at = (
        validation_time
    )

    # -----------------------------------------------------
    # SUPERSESSION
    # -----------------------------------------------------

    if (
        analysis.supersedes_analysis_id
        is not None
    ):
        previous_analysis = (
            db.query(
                RegulatoryChangeAnalysis
            )
            .filter(
                RegulatoryChangeAnalysis.id
                == analysis
                .supersedes_analysis_id,

                RegulatoryChangeAnalysis
                .regulatory_change_id
                == change.id,
            )
            .first()
        )

        if previous_analysis is not None:
            previous_analysis.analysis_status = (
                "superseded"
            )

            previous_analysis.updated_at = (
                validation_time
            )

    # -----------------------------------------------------
    # PHASE 1 COMPATIBILITY / DASHBOARD SYNCHRONISATION
    # -----------------------------------------------------

    change.impact_status = (
        "analysed"
    )

    change.impact_level = (
        overall_impact
    )

    change.impact_summary = (
        analysis.executive_summary
    )

    db.commit()

    db.refresh(
        analysis
    )

    return (
        RegulatoryChangeAnalysisValidationResponse(
            id=
                analysis.id,

            analysis_status=
                analysis.analysis_status,

            validated_by_user_id=
                current_user.id,

            validated_at=
                analysis.validated_at,

            validation_notes=
                analysis.validation_notes,

            message=(
                "Structured regulatory analysis "
                "validated successfully."
            ),
        )
    )


# =========================================================
# PUBLISH REGULATORY INTELLIGENCE
# =========================================================

@router.post(
    "/changes/{change_id}/publish",
    response_model=
        RegulatoryPublishResponse,
)
def publish_regulatory_change(
    change_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_platform_admin
    ),
) -> RegulatoryPublishResponse:
    """
    Publish reviewed and impact-analysed
    regulatory intelligence.

    Where the Regulatory Intelligence source has
    a canonical Regulation mapping, a validated
    Phase 2 structured analysis is also required.
    """

    change = (
        get_regulatory_change_or_404(
            db,
            change_id,
        )
    )

    if (
        change.published_at
        is not None
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "This regulatory change "
                "has already been published."
            ),
        )

    if (
        change.review_status
        != "reviewed"
        or change.review_decision
        != "confirmed"
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "A regulatory change must "
                "be reviewed and confirmed "
                "before publication."
            ),
        )

    if (
        change.impact_status
        != "analysed"
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Impact analysis must be "
                "completed before publication."
            ),
        )

    if (
        change.impact_level
        is None
    ):
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Impact level is required "
                "before publication."
            ),
        )

    source = (
        get_change_source_or_409(
            db,
            change,
        )
    )

    # -----------------------------------------------------
    # PHASE 2 PUBLICATION GATE
    # -----------------------------------------------------
    #
    # Canonically mapped regulations must complete
    # the structured Article / provision analysis
    # before publication.
    #
    # Unmapped legacy sources temporarily continue
    # to use the Phase 1 workflow.
    # -----------------------------------------------------
    
    latest_analysis = None

    if (
        source.regulation_id
        is not None
    ):
        latest_analysis = (
            db.query(
                RegulatoryChangeAnalysis
            )
            .filter(
                RegulatoryChangeAnalysis
                .regulatory_change_id
                == change.id,
            )
            .order_by(
                RegulatoryChangeAnalysis
                .analysis_version
                .desc()
            )
            .first()
        )

        if (
            latest_analysis is None
            or latest_analysis
                .analysis_status
                != "validated"
        ):
            raise HTTPException(
                status_code=
                    status.HTTP_409_CONFLICT,
                detail=(
                    "This regulatory source is "
                    "mapped to the canonical "
                    "Regulatory Library. The latest "
                    "structured Article / provision "
                    "analysis version must be "
                    "validated before publication."
                ),
            )

    publication_time = (
        datetime.utcnow()
    )

    change.published_at = (
        publication_time
    )

    change.published_by_user_id = (
        current_user.id
    )

    # -----------------------------------------------------
    # MARK LATEST VALIDATED STRUCTURED ANALYSIS AS PUBLISHED
    # -----------------------------------------------------

    if (
        latest_analysis
        is not None
    ):
        latest_analysis.analysis_status = (
            "published"
        )

        latest_analysis.updated_at = (
            publication_time
        )

    db.commit()

    db.refresh(
        change
    )

    return RegulatoryPublishResponse(
        id=
            change.id,

        review_status=
            change.review_status,

        review_decision=
            change.review_decision,

        impact_status=
            change.impact_status,

        impact_level=
            change.impact_level,

        published_by_user_id=
            current_user.id,

        published_by_name=
            current_user.full_name,

        published_at=
            change.published_at,

        message=(
            "Regulatory intelligence "
            "published successfully."
        ),
    )


# =========================================================
# REGULATORY SNAPSHOTS
# =========================================================

@router.get(
    "/snapshots",
    response_model=
        list[
            RegulatorySnapshotResponse
        ],
)
def list_snapshots(
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    List stored regulatory snapshots.

    Available to authenticated users.
    """

    return (
        db.query(
            RegulatorySnapshot
        )
        .order_by(
            RegulatorySnapshot
            .captured_at
            .desc(),

            RegulatorySnapshot
            .id
            .desc(),
        )
        .all()
    )


# =========================================================
# SOURCE SNAPSHOT HISTORY
# =========================================================

@router.get(
    "/sources/{source_id}/snapshots",
    response_model=
        list[
            RegulatorySnapshotResponse
        ],
)
def list_source_snapshots(
    source_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Retrieve historical snapshots for a
    specific regulatory source.

    Available to authenticated users.
    """

    source = (
        db.query(
            RegulatorySource
        )
        .filter(
            RegulatorySource.id
            == source_id
        )
        .first()
    )

    if (
        source
        is None
    ):
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=(
                "Regulatory source "
                "not found."
            ),
        )

    return (
        db.query(
            RegulatorySnapshot
        )
        .filter(
            RegulatorySnapshot
            .source_id
            == source_id
        )
        .order_by(
            RegulatorySnapshot
            .captured_at
            .desc(),

            RegulatorySnapshot
            .id
            .desc(),
        )
        .all()
    )