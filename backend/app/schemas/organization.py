from pydantic import BaseModel, EmailStr
from typing import Optional


class OrganizationCreate(BaseModel):
    name: str
    legal_name: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    organization_size: Optional[str] = None
    contact_email: Optional[EmailStr] = None


class OrganizationResponse(BaseModel):
    id: int
    name: str
    legal_name: Optional[str]
    industry: Optional[str]
    country: Optional[str]
    organization_size: Optional[str]
    contact_email: Optional[EmailStr]
    status: str

    model_config = {
        "from_attributes": True
    }