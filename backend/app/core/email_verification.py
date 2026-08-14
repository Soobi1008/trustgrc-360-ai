from datetime import (
    datetime,
    timedelta,
    timezone,
)
import hashlib
import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.email_verification_token import (
    EmailVerificationToken,
)

from app.core.config import settings

#EMAIL_VERIFICATION_EXPIRY_MINUTES = 30


def utc_now() -> datetime:
    return datetime.now(
        timezone.utc
    )


def hash_verification_token(
    token: str,
) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


def generate_raw_verification_token() -> str:
    return secrets.token_urlsafe(48)


def invalidate_existing_tokens(
    db: Session,
    user_id: int,
) -> None:
    tokens = db.scalars(
        select(
            EmailVerificationToken
        ).where(
            EmailVerificationToken.user_id
            == user_id,
            EmailVerificationToken.used_at.is_(
                None
            ),
        )
    ).all()

    now = utc_now()

    for token in tokens:
        token.used_at = now


def create_email_verification_token(
    db: Session,
    user_id: int,
) -> str:
    """
    Create a new single-use email verification
    token.

    Returns the raw token once.
    Only its SHA-256 hash is stored in the DB.
    """

    invalidate_existing_tokens(
        db=db,
        user_id=user_id,
    )

    raw_token = (
        generate_raw_verification_token()
    )

    token_hash = (
        hash_verification_token(
            raw_token
        )
    )

    expires_at = (
        utc_now()
        + timedelta(
            minutes=
                settings.EMAIL_VERIFICATION_EXPIRY_MINUTES
        )
    )

    verification_token = (
        EmailVerificationToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            used_at=None,
        )
    )

    db.add(
        verification_token
    )

    db.flush()

    return raw_token


def get_valid_verification_token(
    db: Session,
    raw_token: str,
) -> EmailVerificationToken | None:
    token_hash = (
        hash_verification_token(
            raw_token
        )
    )

    token_record = db.scalar(
        select(
            EmailVerificationToken
        ).where(
            EmailVerificationToken.token_hash
            == token_hash
        )
    )

    if token_record is None:
        return None

    if (
        token_record.used_at
        is not None
    ):
        return None

    expires_at = (
        token_record.expires_at
    )

    if expires_at.tzinfo is None:
        expires_at = (
            expires_at.replace(
                tzinfo=timezone.utc
            )
        )

    if utc_now() > expires_at:
        return None

    return token_record


def consume_verification_token(
    token_record:
        EmailVerificationToken,
) -> None:
    token_record.used_at = (
        utc_now()
    )