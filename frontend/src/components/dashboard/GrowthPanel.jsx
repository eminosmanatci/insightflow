import { formatCurrency } from "../../utils/dashboard";

function getTrendClasses(value) {
  if (value == null) {
    return "bg-slate-100 text-slate-600";
  }

  return Number(value) >= 0
    ? "bg-emerald-100 text-emerald-700"
    : "bg-red-100 text-red-700";
}

function formatGrowthRate(value) {
  if (value == null) {
    return "Baz veri yok";
  }

  const numericValue = Number(value);

  return `${numericValue >= 0 ? "+" : ""}${numericValue.toLocaleString(
    "tr-TR",
    {
      maximumFractionDigits: 2,
    },
  )}%`;
}

function GrowthMetric({ label, change, growthRate, formatChange }) {
  const numericChange = Number(change ?? 0);

  return (
    <div className="min-w-[210px] rounded-lg bg-slate-50 px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <div className="mt-2 flex items-end justify-between gap-4">
        <span
          className={`text-2xl font-bold ${
            numericChange >= 0 ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {numericChange >= 0 ? "+" : ""}
          {formatChange(numericChange)}
        </span>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTrendClasses(
            growthRate,
          )}`}
        >
          {formatGrowthRate(growthRate)}
        </span>
      </div>
    </div>
  );
}

function GrowthPanel({ appliedFilters, growthData, loading }) {
  const hasCompleteDateRange = Boolean(
    appliedFilters.dateFrom && appliedFilters.dateTo,
  );

  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Dönemsel Büyüme</h3>

          <p className="mt-1 text-sm text-slate-500">
            Seçilen dönem, aynı uzunluktaki önceki dönemle karşılaştırılır.
          </p>
        </div>

        {!hasCompleteDateRange ? (
          <div className="rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Büyüme analizi için başlangıç ve bitiş tarihi seçin.
          </div>
        ) : loading ? (
          <div className="text-sm text-slate-400">
            Karşılaştırma yükleniyor...
          </div>
        ) : !growthData ? (
          <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Büyüme karşılaştırması oluşturulamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GrowthMetric
              label="Gelir Değişimi"
              change={growthData.revenue_change}
              growthRate={growthData.revenue_growth_rate}
              formatChange={formatCurrency}
            />

            <GrowthMetric
              label="İşlem Değişimi"
              change={growthData.transaction_change}
              growthRate={growthData.transaction_growth_rate}
              formatChange={(value) => value.toLocaleString("tr-TR")}
            />
          </div>
        )}
      </div>

      {growthData && (
        <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          Önceki dönem: {growthData.previous_period?.date_from}
          {" – "}
          {growthData.previous_period?.date_to}
          {" · "}
          Mevcut dönem: {growthData.current_period?.date_from}
          {" – "}
          {growthData.current_period?.date_to}
        </div>
      )}
    </div>
  );
}

export default GrowthPanel;
