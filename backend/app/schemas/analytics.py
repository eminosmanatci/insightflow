from pydantic import BaseModel


class KPISummary(BaseModel):
    total_revenue: float
    transaction_count: int
    average_transaction_value: float


class SalesByRegion(BaseModel):
    region: str
    total_revenue: float