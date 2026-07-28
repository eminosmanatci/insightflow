from datetime import date
from typing import Optional

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


class PeriodMetrics(BaseModel):
    date_from: date
    date_to: date
    total_revenue: float
    transaction_count: int


class GrowthComparison(BaseModel):
    current_period: PeriodMetrics
    previous_period: PeriodMetrics
    revenue_change: float
    revenue_growth_rate: Optional[float]
    transaction_change: int
    transaction_growth_rate: Optional[float]


class InsightFilters(BaseModel):
    date_from: Optional[date]
    date_to: Optional[date]


class InsightDataSnapshot(BaseModel):
    kpis: KPISummary
    regions: list[SalesByRegion]


class InsightResponse(BaseModel):
    organization: str
    filters: InsightFilters
    data_snapshot: InsightDataSnapshot
    ai_insight: str