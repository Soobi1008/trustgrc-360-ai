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
    UserStatusUpdate,
    UserUpdate,
)

router = APIRouter(
    prefix="/api/v1/admin/users",
    tags=["Admin Users"],
)

platform_admin_required = require_roles(
    "super_admin",
    "platform_admin",
)

PLATFORM_ROLES = {
    "super_admin",
    "platform_admin",
}


def get_user_or_404(
    user_id: int,
    db: Session,
) -> User:
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return user


def validate_role_and_organization(
    *,
    role: str,
    organization_id: int | None,
    db: Session,
) -> None:
    if role in PLATFORM_ROLES:
        if organization_id is not None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Platform administrators must not be "
                    "assigned to an organization."
                ),
            )

        return

    if organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Company users must be assigned to an "
                "organization."
            ),
        )

    organization = db.get(
        Organization,
        organization_id,
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
                "Users can only be assigned to an active "
                "organization."
            ),
        )


def protect_super_admin(
    *,
    target_role: str,
    current_admin: User,
) -> None:
    if (
        target_role == "super_admin"
        and current_admin.role != "super_admin"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only a super administrator can manage "
                "another super administrator."
            ),
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

    protect_super_admin(
        target_role=payload.role,
        current_admin=current_admin,
    )

    validate_role_and_organization(
        role=payload.role,
        organization_id=payload.organization_id,
        db=db,
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


@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        platform_admin_required
    ),
) -> User:
    user = get_user_or_404(
        user_id=user_id,
        db=db,
    )

    protect_super_admin(
        target_role=user.role,
        current_admin=current_admin,
    )

    return user


@router.put(
    "/{user_id}",
    response_model=UserResponse,
)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        platform_admin_required
    ),
) -> User:
    user = get_user_or_404(
        user_id=user_id,
        db=db,
    )

    protect_super_admin(
        target_role=user.role,
        current_admin=current_admin,
    )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    effective_role = update_data.get(
        "role",
        user.role,
    )

    effective_organization_id = (
        update_data["organization_id"]
        if "organization_id" in update_data
        else user.organization_id
    )

    protect_super_admin(
        target_role=effective_role,
        current_admin=current_admin,
    )

    validate_role_and_organization(
        role=effective_role,
        organization_id=effective_organization_id,
        db=db,
    )

    if "email" in update_data:
        normalized_email = str(
            update_data["email"]
        ).strip().lower()

        duplicate_user = db.scalar(
            select(User).where(
                User.email == normalized_email,
                User.id != user_id,
            )
        )

        if duplicate_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Another user already uses this "
                    "email address."
                ),
            )

        user.email = normalized_email

    if "full_name" in update_data:
        full_name = update_data[
            "full_name"
        ].strip()

        if not full_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Full name cannot be empty.",
            )

        user.full_name = full_name

    if "password" in update_data:
        user.password_hash = hash_password(
            update_data["password"]
        )

    if "role" in update_data:
        user.role = update_data["role"]

    if "organization_id" in update_data:
        user.organization_id = update_data[
            "organization_id"
        ]

    if "is_active" in update_data:
        if (
            user.id == current_admin.id
            and update_data["is_active"] is False
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "You cannot disable your own "
                    "administrator account."
                ),
            )

        user.is_active = update_data[
            "is_active"
        ]

    try:
        db.commit()
        db.refresh(user)

    except IntegrityError as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to update the user.",
        ) from error

    return user


@router.patch(
    "/{user_id}/status",
    response_model=UserResponse,
)
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        platform_admin_required
    ),
) -> User:
    user = get_user_or_404(
        user_id=user_id,
        db=db,
    )

    protect_super_admin(
        target_role=user.role,
        current_admin=current_admin,
    )

    if (
        user.id == current_admin.id
        and payload.is_active is False
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "You cannot disable your own "
                "administrator account."
            ),
        )

    user.is_active = payload.is_active

    db.commit()
    db.refresh(user)

    return user