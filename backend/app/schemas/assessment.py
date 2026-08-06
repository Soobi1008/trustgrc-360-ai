from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class AssessmentBase(BaseModel):
    organization_id: int
    ai_system_id: int

    assessment_name: str = Field(
        min_length=3,
        max_length=255,
    )

    framework: str = Field(
        min_length=2,
        max_length=100,
    )

    status: str = Field(
        default="Draft",
        min_length=2,
        max_length=50,
    )

    score: int = Field(
        default=0,
        ge=0,
        le=100,
    )

    assessor: str = Field(
        min_length=2,
        max_length=255,
    )


class AssessmentCreate(AssessmentBase):
    pass


class AssessmentUpdate(BaseModel):
    organization_id: int | None = None
    ai_system_id: int | None = None

    assessment_name: str | None = Field(
        default=None,
        min_length=3,
        max_length=255,
    )

    framework: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    status: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    score: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    assessor: str | None = Field(
        default=None,
        min_length=2,
        max_length=255,
    )


class AssessmentResponse(AssessmentBase):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int