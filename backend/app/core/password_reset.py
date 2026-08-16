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
from app.models.password_reset_token import (
    PasswordResetToken,
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


def generate_raw_password_reset_token() -> str:
    """
    Generate a cryptographically secure
    password-reset token.

    The raw token is sent to the user but
    is never stored directly in the database.
    """

    return secrets.token_urlsafe(
        48
    )


def hash_password_reset_token(
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


def invalidate_existing_reset_tokens(
    db: Session,
    user_id: int,
) -> None:
    """
    Invalidate any previously unused reset
    tokens for the same user.

    This ensures only the newest reset link
    remains valid.
    """

    now = utc_now()

    db.execute(
        update(
            PasswordResetToken
        )
        .where(
            PasswordResetToken.user_id
            == user_id,
            PasswordResetToken.used_at
            .is_(None),
        )
        .values(
            used_at=now
        )
    )


def create_password_reset_token(
    db: Session,
    user_id: int,
) -> str:
    """
    Create and store a new password-reset token.

    Returns the raw token so it can be placed
    into the password-reset email.
    """

    invalidate_existing_reset_tokens(
        db=db,
        user_id=user_id,
    )

    raw_token = (
        generate_raw_password_reset_token()
    )

    token_hash = (
        hash_password_reset_token(
            raw_token
        )
    )

    expires_at = (
        utc_now()
        + timedelta(
            minutes=
                settings
                .PASSWORD_RESET_EXPIRY_MINUTES
        )
    )

    token_record = (
        PasswordResetToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
    )

    db.add(
        token_record
    )

    return raw_token


def get_valid_password_reset_token(
    db: Session,
    raw_token: str,
) -> PasswordResetToken | None:
    """
    Find a valid, unused and unexpired
    password-reset token.
    """

    token_hash = (
        hash_password_reset_token(
            raw_token
        )
    )

    token_record = db.scalar(
        select(
            PasswordResetToken
        ).where(
            PasswordResetToken.token_hash
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


def consume_password_reset_token(
    token_record: PasswordResetToken,
) -> None:
    """
    Mark a password-reset token as used.
    """

    token_record.used_at = (
        utc_now()
    )