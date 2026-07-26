import { useEffect, useState } from "react";
import ChartTooltip from "./components/dashboard/ChartTooltip";
import DateFilter from "./components/dashboard/DateFilter";
import GrowthPanel from "./components/dashboard/GrowthPanel";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Link, useNavigate } from "react-router-dom";

import api from "./api";

import KpiCards from "./components/dashboard/KpiCards";
import {
  EMPTY_KPIS,
  buildDateParams,
  formatCompactCurrency,
} from "./utils/dashboard";

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
            <div className="flex h-[420px] flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h3 className="mb-6 font-semibold text-slate-800">
                Bölgesel Satış Dağılımı
              </h3>

              <div className="min-h-0 flex-1">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Yükleniyor...
                  </div>
                ) : regionData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Seçilen dönemde veri bulunamadı.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={regionData}
                      margin={{
                        top: 0,
                        right: 0,
                        left: -20,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />

                      <XAxis
                        dataKey="region"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#64748b",
                          fontSize: 13,
                        }}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 12,
                        }}
                        tickFormatter={formatCompactCurrency}
                      />

                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{
                          fill: "#f8fafc",
                        }}
                      />

                      <Bar
                        dataKey="total_revenue"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        barSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="relative flex h-[420px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />

              <h3 className="mb-4 font-semibold text-slate-800">
                ✨ AI İçgörüleri
              </h3>

              <div className="custom-scrollbar flex-1 overflow-y-auto whitespace-pre-wrap rounded-md border border-slate-100 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
                {aiLoading ? (
                  <div className="flex animate-pulse flex-col gap-3">
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                    <div className="h-4 w-full rounded bg-slate-200" />
                    <div className="h-4 w-5/6 rounded bg-slate-200" />
                  </div>
                ) : (
                  aiInsight
                )}
              </div>
            </div>
          </div>

          {/* Aylık + kategori grid */}
          {/* Bu bölüm main elementi kapanmadan önce yer alır. */}
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="flex h-[380px] flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="font-semibold text-slate-800">
                  Aylık Gelir Trendi
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Gelirin aylar içindeki değişimi
                </p>
              </div>

              <div className="min-h-0 flex-1">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Yükleniyor...
                  </div>
                ) : monthlyData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Seçilen dönemde aylık veri bulunamadı.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyData}
                      margin={{
                        top: 10,
                        right: 20,
                        left: -10,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />

                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#64748b",
                          fontSize: 12,
                        }}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 12,
                        }}
                        tickFormatter={formatCompactCurrency}
                      />

                      <Tooltip content={<ChartTooltip />} />

                      <Line
                        type="monotone"
                        dataKey="total_revenue"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{
                          fill: "#2563eb",
                          strokeWidth: 0,
                          r: 4,
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="flex h-[380px] flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="font-semibold text-slate-800">
                  Kategori Performansı
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Kategorilerin toplam gelire katkısı
                </p>
              </div>

              <div className="min-h-0 flex-1">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Yükleniyor...
                  </div>
                ) : categoryData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Seçilen dönemde kategori verisi bulunamadı.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryData}
                      layout="vertical"
                      margin={{
                        top: 0,
                        right: 20,
                        left: 20,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#f1f5f9"
                      />

                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 12,
                        }}
                        tickFormatter={formatCompactCurrency}
                      />

                      <YAxis
                        type="category"
                        dataKey="category"
                        width={100}
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#64748b",
                          fontSize: 12,
                        }}
                      />

                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{
                          fill: "#f8fafc",
                        }}
                      />

                      <Bar
                        dataKey="total_revenue"
                        fill="#6366f1"
                        radius={[0, 4, 4, 0]}
                        barSize={26}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Ürün ve müşteri performansı */}
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="font-semibold text-slate-800">
                  En Çok Gelir Getiren Ürünler
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Seçilen dönemdeki ilk 5 ürün
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Ürün</th>
                      <th className="px-6 py-3 text-right font-medium">Adet</th>
                      <th className="px-6 py-3 text-right font-medium">
                        Gelir
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-8 text-center text-slate-400"
                        >
                          Yükleniyor...
                        </td>
                      </tr>
                    ) : productData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-8 text-center text-slate-400"
                        >
                          Seçilen dönemde ürün verisi bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      productData.map((product, index) => (
                        <tr
                          key={`${product.product_name}-${index}`}
                          className="text-slate-700"
                        >
                          <td className="max-w-[240px] truncate px-6 py-4 font-medium text-slate-800">
                            {product.product_name}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {Number(product.quantity_sold ?? 0).toLocaleString(
                              "tr-TR",
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold">
                            {Number(product.total_revenue ?? 0).toLocaleString(
                              "tr-TR",
                              {
                                style: "currency",
                                currency: "TRY",
                                maximumFractionDigits: 2,
                              },
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="font-semibold text-slate-800">
                  En Değerli Müşteriler
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Seçilen dönemde en yüksek gelir sağlayan ilk 5 müşteri
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Müşteri</th>
                      <th className="px-6 py-3 text-right font-medium">
                        İşlem
                      </th>
                      <th className="px-6 py-3 text-right font-medium">
                        Gelir
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-8 text-center text-slate-400"
                        >
                          Yükleniyor...
                        </td>
                      </tr>
                    ) : customerData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-8 text-center text-slate-400"
                        >
                          Seçilen dönemde müşteri verisi bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      customerData.map((customer, index) => (
                        <tr
                          key={`${customer.customer_name}-${index}`}
                          className="text-slate-700"
                        >
                          <td className="max-w-[240px] truncate px-6 py-4 font-medium text-slate-800">
                            {customer.customer_name}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {Number(
                              customer.transaction_count ?? 0,
                            ).toLocaleString("tr-TR")}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold">
                            {Number(customer.total_revenue ?? 0).toLocaleString(
                              "tr-TR",
                              {
                                style: "currency",
                                currency: "TRY",
                                maximumFractionDigits: 2,
                              },
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
