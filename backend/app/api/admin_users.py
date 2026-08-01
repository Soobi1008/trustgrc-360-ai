from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import get_db
from app.dependencies.auth import require_roles
from app.models.organization import Organization
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserResponse,
)

router = APIRouter(
    prefix="/api/v1/admin/users",
    tags=["Admin Users"],
)

platform_admin_required = require_roles(
    "super_admin",
    "platform_admin",
)


@router.get(
    "",
    response_model=list[UserResponse],
)
def list_users(
    organization_id: int | None = Query(
        default=None
    ),
    db: Session = Depends(get_db),
    _: User = Depends(platform_admin_required),
) -> list[User]:
    statement = select(User).order_by(
        User.created_at.desc()
    )

    if organization_id is not None:
        statement = statement.where(
            User.organization_id == organization_id
        )

    return list(
        db.scalars(statement).all()
    )


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        platform_admin_required
    ),
) -> User:
    normalized_email = str(
        payload.email
    ).strip().lower()

    existing_user = db.scalar(
        select(User).where(
            User.email == normalized_email
        )
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A user with this email address "
                "already exists."
            ),
        )

    if payload.organization_id is not None:
        organization = db.get(
            Organization,
            payload.organization_id,
        )

        if organization is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found.",
            )

        if organization.status.lower() != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Users cannot be assigned to an "
                    "inactive organization."
                ),
            )

    if (
        payload.role == "super_admin"
        and current_admin.role != "super_admin"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only a super administrator can create "
                "another super administrator."
            ),
        )

    user = User(
        email=normalized_email,
        full_name=payload.full_name.strip(),
        password_hash=hash_password(
            payload.password
        ),
        role=payload.role,
        organization_id=payload.organization_id,
        is_active=payload.is_active,
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)

    except IntegrityError as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create the user.",
        ) from error

    return user