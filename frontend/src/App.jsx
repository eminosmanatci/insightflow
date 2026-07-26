import { useEffect, useState } from "react";
import DateFilter from "./components/dashboard/DateFilter";
import GrowthPanel from "./components/dashboard/GrowthPanel";
import AiInsightPanel from "./components/dashboard/AiInsightPanel";
import RegionChart from "./components/dashboard/RegionChart";
import CategoryChart from "./components/dashboard/CategoryChart";
import MonthlyRevenueChart from "./components/dashboard/MonthlyRevenueChart";
import CustomerTable from "./components/dashboard/CustomerTable";
import ProductTable from "./components/dashboard/ProductTable";

import { Link, useNavigate } from "react-router-dom";

import api from "./api";

import KpiCards from "./components/dashboard/KpiCards";
import { EMPTY_KPIS, buildDateParams } from "./utils/dashboard";

function App() {
  const [kpis, setKpis] = useState(EMPTY_KPIS);
  const [regionData, setRegionData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [aiInsight, setAiInsight] = useState("");
  const [growthData, setGrowthData] = useState(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: "",
    dateTo: "",
  });

  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        const params = buildDateParams(appliedFilters);

        const hasCompleteDateRange =
          Boolean(appliedFilters.dateFrom) && Boolean(appliedFilters.dateTo);

        const growthRequest = hasCompleteDateRange
          ? api.get("/analytics/growth", {
              params,
              signal: controller.signal,
            })
          : Promise.resolve({
              data: null,
            });

        const [
          kpiResponse,
          regionResponse,
          monthlyResponse,
          categoryResponse,
          productResponse,
          customerResponse,
          growthResponse,
        ] = await Promise.all([
          api.get("/analytics/kpis", {
            params,
            signal: controller.signal,
          }),
          api.get("/analytics/regions", {
            params,
            signal: controller.signal,
          }),
          api.get("/analytics/monthly", {
            params,
            signal: controller.signal,
          }),
          api.get("/analytics/categories", {
            params,
            signal: controller.signal,
          }),
          api.get("/analytics/products", {
            params: {
              ...params,
              limit: 5,
            },
            signal: controller.signal,
          }),
          api.get("/analytics/customers", {
            params: {
              ...params,
              limit: 5,
            },
            signal: controller.signal,
          }),
          growthRequest,
        ]);

        setKpis({
          total_revenue: Number(kpiResponse.data?.total_revenue ?? 0),
          transaction_count: Number(kpiResponse.data?.transaction_count ?? 0),
          average_transaction_value: Number(
            kpiResponse.data?.average_transaction_value ?? 0,
          ),
        });

        setRegionData(
          Array.isArray(regionResponse.data) ? regionResponse.data : [],
        );

        setMonthlyData(
          Array.isArray(monthlyResponse.data) ? monthlyResponse.data : [],
        );

        setCategoryData(
          Array.isArray(categoryResponse.data) ? categoryResponse.data : [],
        );

        setProductData(
          Array.isArray(productResponse.data) ? productResponse.data : [],
        );

        setCustomerData(
          Array.isArray(customerResponse.data) ? customerResponse.data : [],
        );

        setGrowthData(growthResponse.data ?? null);

        setError(null);
      } catch (requestError) {
        if (
          requestError.code === "ERR_CANCELED" ||
          requestError.name === "CanceledError" ||
          controller.signal.aborted
        ) {
          return;
        }

        console.error("Dashboard verileri alınamadı:", requestError);

        setError(
          requestError.response?.data?.detail ||
            "Dashboard verileri yüklenemedi.",
        );

        setKpis(EMPTY_KPIS);
        setRegionData([]);
        setMonthlyData([]);
        setCategoryData([]);
        setProductData([]);
        setCustomerData([]);
        setGrowthData(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      controller.abort();
    };
  }, [appliedFilters]);

  useEffect(() => {
    let isActive = true;

    const fetchAiInsight = async () => {
      setAiLoading(true);

      try {
        const params = buildDateParams(appliedFilters);

        const response = await api.get("/ai/analyze", {
          params,
        });

        if (isActive) {
          setAiInsight(
            response.data?.ai_insight ||
              "Bu dönem için AI içgörüsü bulunamadı.",
          );
        }
      } catch (requestError) {
        if (!isActive) {
          return;
        }

        console.error("AI analizi alınamadı:", requestError);

        setAiInsight("Yapay zeka analiz motoruna şu anda ulaşılamıyor.");
      } finally {
        if (isActive) {
          setAiLoading(false);
        }
      }
    };

    fetchAiInsight();

    return () => {
      isActive = false;
    };
  }, [appliedFilters]);

  const handleApplyFilters = (event) => {
    event.preventDefault();

    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError("Başlangıç tarihi bitiş tarihinden sonra olamaz.");

      return;
    }

    setError(null);

    setAppliedFilters({
      dateFrom,
      dateTo,
    });
  };

  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setError(null);

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

      <div className="min-w-0 min-h-0 flex flex-1 flex-col overflow-hidden">
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
