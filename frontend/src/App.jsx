import { useState } from "react";

import AiInsightPanel from "./components/dashboard/AiInsightPanel";
import CategoryChart from "./components/dashboard/CategoryChart";
import CustomerTable from "./components/dashboard/CustomerTable";
import DateFilter from "./components/dashboard/DateFilter";
import GrowthPanel from "./components/dashboard/GrowthPanel";
import KpiCards from "./components/dashboard/KpiCards";
import MonthlyRevenueChart from "./components/dashboard/MonthlyRevenueChart";
import ProductTable from "./components/dashboard/ProductTable";
import RegionChart from "./components/dashboard/RegionChart";
import AppShell from "./components/layout/AppShell";

import useDashboardData from "./hooks/useDashboardData";

function App() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: "",
    dateTo: "",
  });

  const {
    kpis,
    regionData,
    monthlyData,
    categoryData,
    productData,
    customerData,
    growthData,
    aiInsight,
    loading,
    aiLoading,
    error: dashboardError,
  } = useDashboardData(appliedFilters);

  const [filterError, setFilterError] = useState(null);

  const error = filterError || dashboardError;

  const handleApplyFilters = (event) => {
    event.preventDefault();

    if (dateFrom && dateTo && dateFrom > dateTo) {
      setFilterError("Başlangıç tarihi bitiş tarihinden sonra olamaz.");

      return;
    }

    setFilterError(null);

    setAppliedFilters({
      dateFrom,
      dateTo,
    });
  };

  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setFilterError(null);

    setAppliedFilters({
      dateFrom: "",
      dateTo: "",
    });
  };

  return (
    <AppShell
      title="Genel Bakış"
      description="Satış performansınızı ve önemli iş sinyallerini izleyin."
    >
      {/* Tarih filtresi */}
      <DateFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        appliedFilters={appliedFilters}
        loading={loading}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Dönemsel büyüme karşılaştırması */}
      <GrowthPanel
        appliedFilters={appliedFilters}
        growthData={growthData}
        loading={loading}
      />

      {/* KPI kartları */}
      <KpiCards kpis={kpis} loading={loading} />

      {/* Bölge + AI grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RegionChart data={regionData} loading={loading} />

        <AiInsightPanel insight={aiInsight} loading={aiLoading} />
      </div>

      {/* Aylık + kategori grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <MonthlyRevenueChart data={monthlyData} loading={loading} />

        <CategoryChart data={categoryData} loading={loading} />
      </div>

      {/* Ürün ve müşteri performansı */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ProductTable data={productData} loading={loading} />

        <CustomerTable data={customerData} loading={loading} />
      </div>
    </AppShell>
  );
}

export default App;
