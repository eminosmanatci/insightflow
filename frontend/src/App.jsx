import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AiInsightPanel from "./components/dashboard/AiInsightPanel";
import CategoryChart from "./components/dashboard/CategoryChart";
import CustomerTable from "./components/dashboard/CustomerTable";
import DateFilter from "./components/dashboard/DateFilter";
import GrowthPanel from "./components/dashboard/GrowthPanel";
import KpiCards from "./components/dashboard/KpiCards";
import MonthlyRevenueChart from "./components/dashboard/MonthlyRevenueChart";
import ProductTable from "./components/dashboard/ProductTable";
import RegionChart from "./components/dashboard/RegionChart";

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

  const navigate = useNavigate();

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <div className="text-xl font-extrabold tracking-tight text-blue-700">
            Insight
            <span className="text-slate-800">Flow</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 p-4">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-md bg-blue-50 px-3 py-2 font-medium text-blue-700"
          >
            Dashboard
          </Link>

          <Link
            to="/datasets"
            className="flex items-center gap-3 rounded-md px-3 py-2 font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Veri Setleri
          </Link>
        </nav>
      </aside>

      <div className="min-h-0 min-w-0 flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
          <h1 className="text-lg font-semibold text-slate-800">Genel Bakış</h1>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-slate-500 md:block">
              Yönetici Paneli
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
            >
              Çıkış
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white shadow-sm">
              E
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
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
        </main>
      </div>
    </div>
  );
}

export default App;
