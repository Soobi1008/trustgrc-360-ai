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
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import require_roles
from app.models.organization_access_request import (
    OrganizationAccessRequest,
)
from app.models.user import User

from app.core.config import settings
from app.core.email_service import (
    EmailDeliveryError,
    send_access_invitation_email,
)
from app.core.organization_access_invitation import (
    create_access_invitation_token,
)

from app.schemas.auth import (
    OrganizationAccessRequestListItem,
    OrganizationAccessRequestReviewRequest,
    OrganizationAccessRequestReviewResponse,
)

router = APIRouter(
    prefix="/api/v1/organization-access-requests",
    tags=["Organization Access Requests"],
)


organization_admin_required = require_roles(
    "organization_admin",
)


@router.get(
    "",
    response_model=list[
        OrganizationAccessRequestListItem
    ],
)
def list_pending_organization_access_requests(
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        organization_admin_required
    ),
) -> list[
    OrganizationAccessRequest
]:
    if current_user.organization_id is None:
        return []

    requests = db.scalars(
        select(
            OrganizationAccessRequest
        )
        .where(
            OrganizationAccessRequest.organization_id
            == current_user.organization_id,
            OrganizationAccessRequest.status
            == "pending",
        )
        .order_by(
            OrganizationAccessRequest.created_at.asc()
        )
    ).all()

    return list(
        requests
    )

@router.post(
    "/{request_id}/review",
    response_model=
        OrganizationAccessRequestReviewResponse,
)
def review_organization_access_request(
    request_id: int,
    payload:
        OrganizationAccessRequestReviewRequest,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        organization_admin_required
    ),
) -> OrganizationAccessRequestReviewResponse:
    if current_user.organization_id is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=(
                "Access request not found."
            ),
        )

    access_request = db.scalar(
        select(
            OrganizationAccessRequest
        ).where(
            OrganizationAccessRequest.id
            == request_id,
            OrganizationAccessRequest.organization_id
            == current_user.organization_id,
        )
    )

    # Do not reveal whether a request exists
    # in another organisation.
    if access_request is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=(
                "Access request not found."
            ),
        )

    if access_request.status != "pending":
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "This access request has already "
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

    access_request.status = (
        payload.decision
    )

    access_request.approved_role = (
        payload.approved_role
        if payload.decision == "approved"
        else None
    )

    access_request.review_notes = (
        review_notes
    )

    access_request.reviewed_by_user_id = (
        current_user.id
    )

    access_request.reviewed_at = (
        datetime.now(
            timezone.utc
        )
    )

    raw_invitation_token = None

    if (
        payload.decision == "approved"
        and settings.EMAIL_ENABLED
    ):
        raw_invitation_token = (
            create_access_invitation_token(
                db=db,
                access_request_id=
                    access_request.id,
            )
        )

    db.commit()

    db.refresh(
        access_request
    )

    if payload.decision == "approved":
        if raw_invitation_token is not None:
            try:
                send_access_invitation_email(
                    recipient_email=
                        access_request.email,
                    recipient_name=
                        access_request.full_name,
                    raw_token=
                        raw_invitation_token,
                )
            except EmailDeliveryError as exc:
                raise HTTPException(
                    status_code=
                        status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=(
                        "The access request was approved, "
                        "but the onboarding invitation "
                        "could not be delivered. "
                        "Please resend the invitation."
                    ),
                ) from exc

        message = (
            "The access request has been approved. "
            "Account activation will be completed "
            "through the secure onboarding process."
        )
    else:
        message = (
            "The access request has been rejected."
        )

    return (
        OrganizationAccessRequestReviewResponse(
            id=
                access_request.id,
            status=
                access_request.status,
            message=
                message,
        )
    )