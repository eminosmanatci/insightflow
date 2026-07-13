from pydantic import BaseModel
from datetime import datetime

class DatasetBase(BaseModel):
    name: str

class DatasetResponse(DatasetBase):
    id: int
    status: str
    row_count: int
    organization_id: int
    created_at: datetime

    class Config:
        from_attributes = True