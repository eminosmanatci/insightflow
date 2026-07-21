from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DatasetBase(BaseModel):
    name: str


class DatasetResponse(DatasetBase):
    id: int
    status: str
    row_count: int
    total_rows: int
    valid_rows: int
    invalid_rows: int
    error_message: Optional[str] = None
    organization_id: int
    created_at: datetime
    processed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)