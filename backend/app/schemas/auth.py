from typing import Literal

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
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