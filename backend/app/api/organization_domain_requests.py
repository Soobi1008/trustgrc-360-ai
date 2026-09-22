from datetime import (
    datetime,
    timezone,
)

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import require_roles

from app.models.organization_domain import (
    OrganizationDomain,
)

from app.models.organization_domain_request import (
    OrganizationDomainRequest,
)

from app.models.user import User

from app.schemas.auth import (
    OrganizationDomainRequestListItem,
    OrganizationDomainRequestReviewRequest,
    OrganizationDomainRequestReviewResponse,
)


router = APIRouter(
    prefix="/api/v1/organization-domain-requests",
    tags=["Organization Domain Requests"],
)


organization_admin_required = require_roles(
    "organization_admin",
)


@router.get(
    "",
    response_model=list[
        OrganizationDomainRequestListItem
    ],
)
def list_pending_organization_domain_requests(
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        organization_admin_required
    ),
) -> list[
    OrganizationDomainRequest
]:
    if current_user.organization_id is None:
        return []

    requests = db.scalars(
        select(
            OrganizationDomainRequest
        )
        .where(
            OrganizationDomainRequest.organization_id
            == current_user.organization_id,
            OrganizationDomainRequest.status
            == "pending",
        )
        .order_by(
            OrganizationDomainRequest.created_at.asc()
        )
    ).all()

    return list(
        requests
    )


@router.post(
    "/{request_id}/review",
    response_model=
        OrganizationDomainRequestReviewResponse,
)
def review_organization_domain_request(
    request_id: int,
    payload:
        OrganizationDomainRequestReviewRequest,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        organization_admin_required
    ),
) -> OrganizationDomainRequestReviewResponse:
    if current_user.organization_id is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=(
                "Domain request not found."
            ),
        )

    domain_request = db.scalar(
        select(
            OrganizationDomainRequest
        ).where(
            OrganizationDomainRequest.id
            == request_id,
            OrganizationDomainRequest.organization_id
            == current_user.organization_id,
        )
    )

    # Do not reveal whether a request exists
    # in another organisation.
    if domain_request is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=(
                "Domain request not found."
            ),
        )

    if domain_request.status != "pending":
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "This domain request has already "
                "been reviewed."
            ),
        )

    review_notes = (
        payload.review_notes.strip()
        if payload.review_notes
        else None
    )

    if review_notes == "":
        review_notes = None

    if payload.decision == "approved":
        existing_domain = db.scalar(
            select(
                OrganizationDomain
            ).where(
                OrganizationDomain.domain
                == domain_request.domain
            )
        )

        if existing_domain is not None:
            raise HTTPException(
                status_code=
                    status.HTTP_409_CONFLICT,
                detail=(
                    "This domain is already "
                    "associated with an "
                    "organisation."
                ),
            )

        organization_domain = OrganizationDomain(
            organization_id=
                domain_request.organization_id,
            domain=
                domain_request.domain,
            status=
                "verified",
            verified_by_user_id=
                current_user.id,
            verified_at=
                datetime.now(
                    timezone.utc
                ),
        )

        db.add(
            organization_domain
        )

    domain_request.status = (
        payload.decision
    )

    domain_request.review_notes = (
        review_notes
    )

    domain_request.reviewed_by_user_id = (
        current_user.id
    )

    domain_request.reviewed_at = (
        datetime.now(
            timezone.utc
        )
    )

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "This domain is already "
                "associated with an "
                "organisation."
            ),
        ) from exc

    db.refresh(
        domain_request
    )

    if payload.decision == "approved":
        message = (
            "The domain association request "
            "has been approved."
        )
    else:
        message = (
            "The domain association request "
            "has been rejected."
        )

    return OrganizationDomainRequestReviewResponse(
        id=
            domain_request.id,
        status=
            domain_request.status,
        message=
            message,
    )