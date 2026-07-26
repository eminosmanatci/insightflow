import {
  CalendarRange,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';

function DateFilter({
  dateFrom,
  dateTo,
  appliedFilters,
  loading,
  onDateFromChange,
  onDateToChange,
  onApply,
  onClear
}) {
  const hasActiveDateFilter = Boolean(
    appliedFilters.dateFrom ||
      appliedFilters.dateTo
  );

  return (
    <form
      onSubmit={onApply}
      className="mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <SlidersHorizontal size={20} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-slate-950">
                Analiz Dönemi
              </h2>

              {hasActiveDateFilter && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100">
                  Filtre aktif
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Seçilen dönem tüm KPI, grafik ve AI analizine uygulanır.
            </p>

            {hasActiveDateFilter && (
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                <CalendarRange
                  size={14}
                  className="text-blue-500"
                />

                <span>
                  {appliedFilters.dateFrom ||
                    'Başlangıç yok'}
                  {' → '}
                  {appliedFilters.dateTo ||
                    'Bitiş yok'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Başlangıç
            </span>

            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => {
                onDateFromChange(
                  event.target.value
                );
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:w-[168px]"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Bitiş
            </span>

            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => {
                onDateToChange(
                  event.target.value
                );
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:w-[168px]"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <SlidersHorizontal size={16} />
            Uygula
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={
              loading ||
              !hasActiveDateFilter
            }
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            <RotateCcw size={16} />
            Temizle
          </button>
        </div>
      </div>
    </form>
  );
}

export default DateFilter;