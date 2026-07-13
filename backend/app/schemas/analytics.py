from pydantic import BaseModel

class KPISummary(BaseModel):
    total_revenue: float
    total_sales_count: int
    average_order_value: float

class SalesByRegion(BaseModel):
    region: str
    total_revenue: float