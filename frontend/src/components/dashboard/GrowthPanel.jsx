import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  Minus,
  TrendingUp,
} from "lucide-react";

import { formatCurrency } from "../../utils/dashboard";

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
  const positive = numericChange > 0;
  const negative = numericChange < 0;

  const TrendIcon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;

  const colorClasses = positive
    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
    : negative
      ? "bg-red-50 text-red-700 ring-red-100"
      : "bg-slate-100 text-slate-600 ring-slate-200";

  const rateColorClasses =
    growthRate == null
      ? "bg-slate-100 text-slate-600 ring-slate-200"
      : colorClasses;

  return (
    <div className="min-w-[220px] rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>

        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${colorClasses}`}
        >
          <TrendIcon size={16} />
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-2xl font-bold tracking-tight text-slate-950">
          {numericChange > 0 ? "+" : ""}
          {formatChange(numericChange)}
        </p>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${rateColorClasses}`}
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
    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
            <TrendingUp size={21} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">Dönemsel Büyüme</h2>

            <p className="mt-1 text-sm text-slate-500">
              Seçilen dönemi aynı uzunluktaki önceki dönemle karşılaştırın.
            </p>
          </div>
        </div>

        {!hasCompleteDateRange ? (
          <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 ring-1 ring-blue-100">
            <CalendarRange size={18} className="shrink-0" />
            Büyüme analizi için tarih aralığı seçin.
          </div>
        ) : loading ? (
          <div className="flex gap-3">
            <div className="h-24 w-[220px] animate-pulse rounded-xl bg-slate-100" />
            <div className="hidden h-24 w-[220px] animate-pulse rounded-xl bg-slate-100 sm:block" />
          </div>
        ) : !growthData ? (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 ring-1 ring-amber-100">
            Büyüme karşılaştırması oluşturulamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 bg-slate-50/70 px-6 py-3 text-xs text-slate-500">
          <span>
            Önceki dönem:{" "}
            <strong className="font-semibold text-slate-700">
              {growthData.previous_period?.date_from}
              {" – "}
              {growthData.previous_period?.date_to}
            </strong>
          </span>

          <span>
            Mevcut dönem:{" "}
            <strong className="font-semibold text-slate-700">
              {growthData.current_period?.date_from}
              {" – "}
              {growthData.current_period?.date_to}
            </strong>
          </span>
        </div>
      )}
    </section>
  );
}

export default GrowthPanel;
