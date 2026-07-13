from pydantic import BaseModel
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationResponse(OrganizationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True