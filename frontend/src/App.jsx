import React, {
  useEffect,
  useRef,
  useState
} from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Link,
  useNavigate
} from 'react-router-dom';

import api from './api';


const EMPTY_KPIS = {
  total_revenue: 0,
  transaction_count: 0,
  average_transaction_value: 0
};


function buildDateParams(filters) {
  const params = {};

  if (filters.dateFrom) {
    params.date_from = filters.dateFrom;
  }

  if (filters.dateTo) {
    params.date_to = filters.dateTo;
  }

  return params;
}


function App() {
  const [kpis, setKpis] = useState(EMPTY_KPIS);
  const [regionData, setRegionData] = useState([]);
  const [aiInsight, setAiInsight] = useState('');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: '',
    dateTo: ''
  });

  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);
  const [error, setError] = useState(null);

  const lastAiRequestKey = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        const params = buildDateParams(
          appliedFilters
        );

        const [kpiResponse, regionResponse] =
          await Promise.all([
            api.get(
              '/analytics/kpis',
              { params }
            ),
            api.get(
              '/analytics/regions',
              { params }
            )
          ]);

        if (cancelled) {
          return;
        }

        setKpis({
          total_revenue: Number(
            kpiResponse.data.total_revenue ?? 0
        ),
        transaction_count: Number(
          kpiResponse.data.transaction_count ?? 0
        ),
        average_transaction_value: Number(
          kpiResponse.data
            .average_transaction_value ?? 0
        )
     });
        setRegionData(regionResponse.data);
        setError(null);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        console.error(
          'Dashboard verileri alınamadı:',
          requestError
        );
        setError(
          requestError.response?.data?.detail
          || 'Dashboard verileri yüklenemedi.'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [appliedFilters]);

  useEffect(() => {
    let cancelled = false;

    const requestKey = JSON.stringify(
      appliedFilters
    );

    if (
      lastAiRequestKey.current === requestKey
    ) {
      return undefined;
    }

    lastAiRequestKey.current = requestKey;

    const fetchAiInsight = async () => {
      setAiLoading(true);

      try {
        const params = buildDateParams(
          appliedFilters
        );

        const response = await api.get(
          '/ai/analyze',
          { params }
        );

        if (!cancelled) {
          setAiInsight(
            response.data.ai_insight
          );
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        console.error(
          'AI analizi alınamadı:',
          requestError
        );
        setAiInsight(
          'Yapay zeka analiz motoruna şu anda ulaşılamıyor.'
        );
      } finally {
        if (!cancelled) {
          setAiLoading(false);
        }
      }
    };

    fetchAiInsight();

    return () => {
      cancelled = true;
    };
  }, [appliedFilters]);

  const handleApplyFilters = (event) => {
    event.preventDefault();

    if (
      dateFrom
      && dateTo
      && dateFrom > dateTo
    ) {
      setError(
        'Başlangıç tarihi bitiş tarihinden sonra olamaz.'
      );
      return;
    }

    setError(null);
    setAppliedFilters({
      dateFrom,
      dateTo
    });
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setError(null);
    setAppliedFilters({
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const CustomTooltip = ({
    active,
    payload,
    label
  }) => {
    if (
      !active
      || !payload
      || payload.length === 0
    ) {
      return null;
    }

    return (
      <div className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white shadow-lg">
        <p className="font-semibold">
          {label}
        </p>
        <p className="text-blue-300">
          {`₺${Number(payload
            [0].value ?? 0
          ).toLocaleString('tr-TR')}`}
        </p>
      </div>
    );
  };

  const hasActiveDateFilter = (
    appliedFilters.dateFrom
    || appliedFilters.dateTo
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <div className="text-xl font-extrabold tracking-tight text-blue-700">
            Insight
            <span className="text-slate-800">
              Flow
            </span>
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

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <h1 className="text-lg font-semibold text-slate-800">
            Genel Bakış
          </h1>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-slate-500 md:block">
              Yönetici Paneli
            </span>

            <button
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

        <main className="flex-1 overflow-y-auto p-8">
          <form
            onSubmit={handleApplyFilters}
            className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-semibold text-slate-800">
                  Tarih Filtresi
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Seçilen dönem tüm KPI, grafik ve AI analizine uygulanır.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block">
                    Başlangıç
                  </span>
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(event) => {
                      setDateFrom(
                        event.target.value
                      );
                    }}
                    className="rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block">
                    Bitiş
                  </span>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(event) => {
                      setDateTo(
                        event.target.value
                      );
                    }}
                    className="rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Uygula
                </button>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={
                    loading
                    || !hasActiveDateFilter
                  }
                  className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Temizle
                </button>
              </div>
            </div>

            {hasActiveDateFilter && (
              <div className="mt-4 text-xs font-medium text-blue-700">
                Aktif dönem:{' '}
                {appliedFilters.dateFrom || 'Başlangıç yok'}
                {' → '}
                {appliedFilters.dateTo || 'Bitiş yok'}
              </div>
            )}
          </form>

          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500">
                Toplam Gelir
              </h3>
              <p className="mt-3 text-3xl font-bold text-slate-800">
                {loading
                  ? '...'
                  : `₺${Number(
                    kpis.total_revenue ?? 0
                  ).toLocaleString('tr-TR')}`}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500">
                Toplam İşlem
              </h3>
              <p className="mt-3 text-3xl font-bold text-slate-800">
                {loading
                  ? '...'
                  : Number(
                    kpis.transaction_count ?? 0
                  ).toLocaleString('tr-TR')}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500">
                Ort. İşlem Tutarı
              </h3>
              <p className="mt-3 text-3xl font-bold text-slate-800">
                {loading
                  ? '...'
                  : `₺${Number(
                    kpis.average_transaction_value ?? 0
                  ).toLocaleString('tr-TR')}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex h-[420px] flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h3 className="mb-6 font-semibold text-slate-800">
                Bölgesel Satış Dağılımı
              </h3>

              <div className="h-full w-full flex-1">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Yükleniyor...
                  </div>
                ) : regionData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Seçilen dönemde veri bulunamadı.
                  </div>
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={regionData}
                      margin={{
                        top: 0,
                        right: 0,
                        left: -20,
                        bottom: 0
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
                          fill: '#64748b',
                          fontSize: 13
                        }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: '#94a3b8',
                          fontSize: 12
                        }}
                        tickFormatter={(value) =>
                          `₺${value / 1000}k`
                        }
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{
                          fill: '#f8fafc'
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
        </main>
      </div>
    </div>
  );
}


export default App;