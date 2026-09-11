from datetime import (
    datetime,
    timedelta,
    timezone,
)
import hashlib
import secrets

from sqlalchemy import (
    select,
    update,
)
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.organization_access_invitation_token import (
    OrganizationAccessInvitationToken,
)


def utc_now() -> datetime:
    return datetime.now(
        timezone.utc
    )


def ensure_aware_utc(
    value: datetime,
) -> datetime:
    if value.tzinfo is None:
        return value.replace(
            tzinfo=timezone.utc
        )

    return value.astimezone(
        timezone.utc
    )


def generate_raw_access_invitation_token() -> str:
    """
    Generate a cryptographically secure
    organisation access invitation token.

    The raw token is sent to the applicant
    but is never stored directly in the database.
    """

    return secrets.token_urlsafe(
        48
    )


def hash_access_invitation_token(
    raw_token: str,
) -> str:
    """
    Hash the raw token before database storage.
    """

    return hashlib.sha256(
        raw_token.encode(
            "utf-8"
        )
    ).hexdigest()


def invalidate_existing_access_invitation_tokens(
    db: Session,
    access_request_id: int,
) -> None:
    """
    Invalidate any previously unused invitation
    tokens for the same access request.

    This ensures only the newest invitation link
    remains valid.
    """

    now = utc_now()

    db.execute(
        update(
            OrganizationAccessInvitationToken
        )
        .where(
            OrganizationAccessInvitationToken
            .access_request_id
            == access_request_id,
            OrganizationAccessInvitationToken
            .used_at
            .is_(None),
        )
        .values(
            used_at=now
        )
    )


def create_access_invitation_token(
    db: Session,
    access_request_id: int,
) -> str:
    """
    Create and store a new access invitation token.

    Returns the raw token so it can be placed
    into the secure onboarding email.
    """

    invalidate_existing_access_invitation_tokens(
        db=db,
        access_request_id=access_request_id,
    )

    raw_token = (
        generate_raw_access_invitation_token()
    )

    token_hash = (
        hash_access_invitation_token(
            raw_token
        )
    )

    expires_at = (
        utc_now()
        + timedelta(
            minutes=
                settings
                .ORGANIZATION_ACCESS_INVITATION_EXPIRY_MINUTES
        )
    )

    token_record = (
        OrganizationAccessInvitationToken(
            access_request_id=
                access_request_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
    )

    db.add(
        token_record
    )

    return raw_token


def get_valid_access_invitation_token(
    db: Session,
    raw_token: str,
) -> OrganizationAccessInvitationToken | None:
    """
    Find a valid, unused and unexpired
    access invitation token.
    """

    token_hash = (
        hash_access_invitation_token(
            raw_token
        )
    )

    token_record = db.scalar(
        select(
            OrganizationAccessInvitationToken
        ).where(
            OrganizationAccessInvitationToken
            .token_hash
            == token_hash
        )
    )

    if token_record is None:
        return None

    if token_record.used_at is not None:
        return None

    expires_at = ensure_aware_utc(
        token_record.expires_at
    )

    if utc_now() > expires_at:
        return None

    return token_record


def consume_access_invitation_token(
    token_record: OrganizationAccessInvitationToken,
) -> None:
    """
    Mark an access invitation token as used.
    """

    token_record.used_at = (
        utc_now()
    )