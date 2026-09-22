from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    model_validator,
)


ChallengeType = Literal[
    "arithmetic",
    "number_pattern",
    "letter_pattern",
    "shape_pattern",
    "odd_one_out",
]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class HumanChallengeResponse(BaseModel):
    challenge_id: str
    challenge_type: ChallengeType
    question: str

    options: list[str] = Field(
        default_factory=list
    )

    expires_in_seconds: int


class RegistrationRequest(BaseModel):
    organisation_name: str = Field(
        min_length=2,
        max_length=200,
    )

    first_name: str = Field(
        min_length=1,
        max_length=100,
    )

    last_name: str = Field(
        min_length=1,
        max_length=100,
    )

    email: EmailStr

    password: str = Field(
        min_length=12,
        max_length=128,
    )

    challenge_id: str = Field(
        min_length=10,
        max_length=100,
    )

    human_answer: str = Field(
        min_length=1,
        max_length=100,
    )


class RegistrationResponse(BaseModel):
    status: str
    message: str
    organization_id: int
    user_id: int

    # Development/testing only.
    # Remove this when real email delivery is enabled.
    verification_url: str | None = None


class RegistrationEmailCheckRequest(BaseModel):
    email: EmailStr


class RegistrationEmailCheckResponse(BaseModel):
    available: bool
    reason: str

class RegistrationOrganizationCheckRequest(BaseModel):
    organisation_name: str = Field(
        min_length=2,
        max_length=200,
    )


class RegistrationOrganizationCheckResponse(BaseModel):
    available: bool
    reason: str


# ---------------------------------------------------------
# ORGANIZATION DOMAIN REQUEST
# ---------------------------------------------------------


class OrganizationDomainRequestCreate(BaseModel):
    organisation_name: str = Field(
        min_length=2,
        max_length=200,
    )

    first_name: str = Field(
        min_length=1,
        max_length=100,
    )

    last_name: str = Field(
        min_length=1,
        max_length=100,
    )

    email: EmailStr

    challenge_id: str = Field(
        min_length=10,
        max_length=100,
    )

    human_answer: str = Field(
        min_length=1,
        max_length=100,
    )


class OrganizationDomainRequestResponse(BaseModel):
    status: str
    message: str


class OrganizationDomainRequestListItem(BaseModel):
    id: int
    domain: str
    requester_email: EmailStr
    requester_name: str
    status: str
    created_at: datetime


class OrganizationDomainRequestReviewRequest(BaseModel):
    decision: Literal[
        "approved",
        "rejected",
    ]

    review_notes: str | None = Field(
        default=None,
        max_length=2000,
    )


class OrganizationDomainRequestReviewResponse(BaseModel):
    id: int
    status: Literal[
        "approved",
        "rejected",
    ]
    message: str


# ---------------------------------------------------------
# ORGANIZATION ACCESS REQUEST
# ---------------------------------------------------------


class OrganizationAccessRequestCreate(BaseModel):
    first_name: str = Field(
        min_length=1,
        max_length=100,
    )

    last_name: str = Field(
        min_length=1,
        max_length=100,
    )

    email: EmailStr

    challenge_id: str = Field(
        min_length=10,
        max_length=100,
    )

    human_answer: str = Field(
        min_length=1,
        max_length=100,
    )


class OrganizationAccessRequestResponse(BaseModel):
    status: str
    message: str


class OrganizationAccessRequestListItem(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    status: str
    created_at: datetime


OrganizationAccessAssignableRole = Literal[
    "compliance_officer",
    "ai_governance_officer",
    "auditor",
    "executive_viewer",
]


class OrganizationAccessRequestReviewRequest(BaseModel):
    decision: Literal[
        "approved",
        "rejected",
    ]

    approved_role: (
        OrganizationAccessAssignableRole
        | None
    ) = None

    review_notes: str | None = Field(
        default=None,
        max_length=2000,
    )

    @model_validator(
        mode="after"
    )
    def validate_approved_role(
        self,
    ) -> "OrganizationAccessRequestReviewRequest":
        if (
            self.decision == "approved"
            and self.approved_role is None
        ):
            raise ValueError(
                "An approved role is required "
                "when approving an access request."
            )

        if (
            self.decision == "rejected"
            and self.approved_role is not None
        ):
            raise ValueError(
                "An approved role must not be "
                "provided when rejecting an "
                "access request."
            )

        return self


class OrganizationAccessRequestReviewResponse(BaseModel):
    id: int
    status: Literal[
        "approved",
        "rejected",
    ]
    message: str


class OrganizationAccessApprovedInvitationListItem(
    BaseModel
):
    id: int
    email: EmailStr
    full_name: str

    approved_role: (
        OrganizationAccessAssignableRole
    )

    reviewed_at: datetime | None = None

    invitation_status: Literal[
        "pending_acceptance",
        "expired",
        "account_activated",
        "delivery_unavailable",
    ]

    invitation_expires_at: (
        datetime | None
    ) = None


# ---------------------------------------------------------
# EMAIL VERIFICATION
# ---------------------------------------------------------


class VerifyEmailRequest(BaseModel):
    token: str = Field(
        min_length=20,
        max_length=500,
    )


class VerifyEmailResponse(BaseModel):
    status: str
    message: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ResendVerificationResponse(BaseModel):
    status: str
    message: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    status: str
    message: str


class ResetPasswordRequest(BaseModel):
    token: str = Field(
        min_length=20,
        max_length=200,
    )

    new_password: str = Field(
        min_length=12,
        max_length=128,
    )

    confirm_password: str = Field(
        min_length=12,
        max_length=128,
    )


class ResetPasswordResponse(BaseModel):
    status: str
    message: str


class OrganizationAccessOnboardingRequest(
    BaseModel
):
    token: str = Field(
        min_length=20,
        max_length=200,
    )

    new_password: str = Field(
        min_length=12,
        max_length=128,
    )

    confirm_password: str = Field(
        min_length=12,
        max_length=128,
    )


class OrganizationAccessOnboardingResponse(
    BaseModel
):
    status: str
    message: str