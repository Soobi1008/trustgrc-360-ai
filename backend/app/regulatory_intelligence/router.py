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
from app.models.user import User

from .detector import (
    check_all_sources,
    check_regulatory_source,
)
from .models import (
    RegulatoryChange,
    RegulatorySnapshot,
    RegulatorySource,
)
from .schemas import (
    RegulatoryChangeResponse,
    RegulatoryChangeReviewRequest,
    RegulatoryImpactReviewRequest,
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
    seeding, or monitoring jobs.
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
# HELPERS
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

    if change.published_at is not None:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Published regulatory "
                "intelligence cannot be "
                "reviewed again."
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

    db.commit()
    db.refresh(
        change
    )

    return change


# =========================================================
# IMPACT ANALYSIS
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
    Record impact analysis for a
    confirmed regulatory change.

    Platform administrators only.
    """

    change = (
        get_regulatory_change_or_404(
            db,
            change_id,
        )
    )

    if change.published_at is not None:
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
    Publish a reviewed and impact-analysed
    regulatory change.

    Platform administrators only.
    """

    change = (
        get_regulatory_change_or_404(
            db,
            change_id,
        )
    )

    if change.published_at is not None:
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

    if change.impact_level is None:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "Impact level is required "
                "before publication."
            ),
        )

    change.published_at = (
        datetime.utcnow()
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