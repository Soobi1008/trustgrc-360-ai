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

from app.models.organization_access_invitation_token import (
    OrganizationAccessInvitationToken,
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
    OrganizationAccessApprovedInvitationListItem,
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


@router.get(
    "/approved",
    response_model=list[
        OrganizationAccessApprovedInvitationListItem
    ],
)
def list_approved_organization_access_invitations(
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        organization_admin_required
    ),
) -> list[
    OrganizationAccessApprovedInvitationListItem
]:
    if current_user.organization_id is None:
        return []

    approved_requests = db.scalars(
        select(
            OrganizationAccessRequest
        )
        .where(
            OrganizationAccessRequest.organization_id
            == current_user.organization_id,
            OrganizationAccessRequest.status
            == "approved",
        )
        .order_by(
            OrganizationAccessRequest.reviewed_at.desc()
        )
    ).all()

    results: list[
        OrganizationAccessApprovedInvitationListItem
    ] = []

    now = datetime.now(
        timezone.utc
    )

    for access_request in approved_requests:
        existing_user = db.scalar(
            select(
                User
            ).where(
                User.email
                == access_request.email
            )
        )

        latest_token = db.scalar(
            select(
                OrganizationAccessInvitationToken
            )
            .where(
                OrganizationAccessInvitationToken
                .access_request_id
                == access_request.id
            )
            .order_by(
                OrganizationAccessInvitationToken
                .created_at.desc()
            )
            .limit(1)
        )

        invitation_status = (
            "delivery_unavailable"
        )

        invitation_expires_at = None

        if existing_user is not None:
            invitation_status = (
                "account_activated"
            )
        elif latest_token is not None:
            invitation_expires_at = (
                latest_token.expires_at
            )

            expires_at = (
                latest_token.expires_at
            )

            if expires_at.tzinfo is None:
                expires_at = (
                    expires_at.replace(
                        tzinfo=timezone.utc
                    )
                )

            if (
                latest_token.used_at is None
                and now <= expires_at
            ):
                invitation_status = (
                    "pending_acceptance"
                )
            else:
                invitation_status = (
                    "expired"
                )

        if access_request.approved_role is None:
            continue

        results.append(
            OrganizationAccessApprovedInvitationListItem(
                id=
                    access_request.id,
                email=
                    access_request.email,
                full_name=
                    access_request.full_name,
                approved_role=
                    access_request.approved_role,
                reviewed_at=
                    access_request.reviewed_at,
                invitation_status=
                    invitation_status,
                invitation_expires_at=
                    invitation_expires_at,
            )
        )

    return results


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


@router.post(
    "/{request_id}/resend-invitation",
    response_model=
        OrganizationAccessRequestReviewResponse,
)
def resend_organization_access_invitation(
    request_id: int,
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

    if access_request.status != "approved":
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "An invitation can only be resent "
                "for an approved access request."
            ),
        )

    existing_user = db.scalar(
        select(
            User
        ).where(
            User.email
            == access_request.email
        )
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "An account already exists for "
                "this email address."
            ),
        )

    if not settings.EMAIL_ENABLED:
        raise HTTPException(
            status_code=
                status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Email delivery is not enabled."
            ),
        )

    raw_invitation_token = (
        create_access_invitation_token(
            db=db,
            access_request_id=
                access_request.id,
        )
    )

    # Commit the new token before attempting
    # delivery. The token helper invalidates
    # previous unused invitation tokens.
    db.commit()

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
                "A new invitation was created, "
                "but the onboarding invitation "
                "could not be delivered. "
                "Please try again."
            ),
        ) from exc

    return (
        OrganizationAccessRequestReviewResponse(
            id=
                access_request.id,
            status=
                access_request.status,
            message=(
                "A new onboarding invitation "
                "has been sent successfully."
            ),
        )
    )