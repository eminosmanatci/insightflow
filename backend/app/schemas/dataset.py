from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DatasetBase(BaseModel):
    name: str


class DatasetResponse(DatasetBase):
    id: int
    status: str
    row_count: int
    organization_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)