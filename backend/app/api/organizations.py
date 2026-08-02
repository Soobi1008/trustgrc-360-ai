from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.organization import Organization
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
)

router = APIRouter(
    prefix="/api/v1/organizations",
    tags=["Organizations"],
)


@router.post(
    "",
    response_model=OrganizationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_organization(
    organization_data: OrganizationCreate,
    db: Session = Depends(get_db),
):
    existing_organization = db.scalar(
        select(Organization).where(
            Organization.name == organization_data.name
        )
    )

    if existing_organization:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An organization with this name already exists.",
        )

    organization = Organization(
        **organization_data.model_dump()
    )

    db.add(organization)
    db.commit()
    db.refresh(organization)

    return organization


@router.get(
    "",
    response_model=list[OrganizationResponse],
)
def list_organizations(
    db: Session = Depends(get_db),
):
    organizations = db.scalars(
        select(Organization).order_by(
            Organization.created_at.desc()
        )
    ).all()

    return organizations


@router.get(
    "/{organization_id}",
    response_model=OrganizationResponse,
)
def get_organization(
    organization_id: int,
    db: Session = Depends(get_db),
):
    organization = db.get(
        Organization,
        organization_id,
    )

    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )

    return organization


@router.put(
    "/{organization_id}",
    response_model=OrganizationResponse,
)
def update_organization(
    organization_id: int,
    organization_data: OrganizationUpdate,
    db: Session = Depends(get_db),
):
    organization = db.get(
        Organization,
        organization_id,
    )

    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )

    update_data = organization_data.model_dump(
        exclude_unset=True
    )

    if "name" in update_data:
        new_name = update_data["name"]

        if not new_name or not new_name.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Organization name cannot be empty.",
            )

        duplicate_organization = db.scalar(
            select(Organization).where(
                Organization.name == new_name,
                Organization.id != organization_id,
            )
        )

        if duplicate_organization:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another organization already uses this name.",
            )

        update_data["name"] = new_name.strip()

    for field, value in update_data.items():
        setattr(organization, field, value)

    db.commit()
    db.refresh(organization)

    return organization