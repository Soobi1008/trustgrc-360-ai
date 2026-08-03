from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    model_validator,
)

PlatformRole = Literal[
    "super_admin",
    "platform_admin",
]

CompanyRole = Literal[
    "organization_admin",
    "compliance_officer",
    "ai_governance_officer",
    "auditor",
    "executive_viewer",
]

UserRole = PlatformRole | CompanyRole


class UserCreate(BaseModel):
    email: EmailStr

    full_name: str = Field(
        min_length=2,
        max_length=255,
    )

    password: str = Field(
        min_length=10,
        max_length=128,
    )

    role: UserRole
    organization_id: int | None = None
    is_active: bool = True

    @model_validator(mode="after")
    def validate_role_membership(self) -> "UserCreate":
        platform_roles = {
            "super_admin",
            "platform_admin",
        }

        if (
            self.role in platform_roles
            and self.organization_id is not None
        ):
            raise ValueError(
                "Platform administrators must not be "
                "assigned to an organization."
            )

        if (
            self.role not in platform_roles
            and self.organization_id is None
        ):
            raise ValueError(
                "Company users must be assigned to an "
                "organization."
            )

        return self


class UserUpdate(BaseModel):
    email: EmailStr | None = None

    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=255,
    )

    password: str | None = Field(
        default=None,
        min_length=10,
        max_length=128,
    )

    role: UserRole | None = None
    organization_id: int | None = None
    is_active: bool | None = None


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    email: EmailStr
    full_name: str
    role: str
    organization_id: int | None
    is_active: bool
    created_at: datetime