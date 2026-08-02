from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr


OrganizationStatus = Literal[
    "active",
    "inactive",
    "suspended",
    "archived",
]


class OrganizationCreate(BaseModel):
    name: str
    legal_name: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    organization_size: Optional[str] = None
    contact_email: Optional[EmailStr] = None


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    legal_name: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    organization_size: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    status: Optional[OrganizationStatus] = None


class OrganizationResponse(BaseModel):
    id: int
    name: str
    legal_name: Optional[str]
    industry: Optional[str]
    country: Optional[str]
    organization_size: Optional[str]
    contact_email: Optional[EmailStr]
    status: str
    created_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }