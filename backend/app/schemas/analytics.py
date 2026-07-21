from pydantic import BaseModel


class KPISummary(BaseModel):
    total_revenue: float
    transaction_count: int
    average_transaction_value: float


class SalesByRegion(BaseModel):
    region: str
    total_revenue: float


class MonthlyRevenue(BaseModel):
    month: str
    total_revenue: float
    transaction_count: int


class CategoryRevenue(BaseModel):
    category: str
    total_revenue: float
    transaction_count: int


class ProductPerformance(BaseModel):
    product_name: str
    total_revenue: float
    quantity_sold: int


class CustomerRevenue(BaseModel):
    customer_name: str
    total_revenue: float
    transaction_count: int