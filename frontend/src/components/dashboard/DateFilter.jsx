function DateFilter({
  dateFrom,
  dateTo,
  appliedFilters,
  loading,
  onDateFromChange,
  onDateToChange,
  onApply,
  onClear,
}) {
  const hasActiveDateFilter = Boolean(
    appliedFilters.dateFrom || appliedFilters.dateTo,
  );

  return (
    <form
      onSubmit={onApply}
      className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-semibold text-slate-800">Tarih Filtresi</h2>

          <p className="mt-1 text-sm text-slate-500">
            Seçilen dönem tüm KPI, grafik ve AI analizine uygulanır.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1 block">Başlangıç</span>

            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => {
                onDateFromChange(event.target.value);
              }}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1 block">Bitiş</span>

            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => {
                onDateToChange(event.target.value);
              }}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            onClick={onClear}
            disabled={loading || !hasActiveDateFilter}
            className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Temizle
          </button>
        </div>
      </div>

      {hasActiveDateFilter && (
        <div className="mt-4 text-xs font-medium text-blue-700">
          Aktif dönem: {appliedFilters.dateFrom || "Başlangıç yok"}
          {" → "}
          {appliedFilters.dateTo || "Bitiş yok"}
        </div>
      )}
    </form>
  );
}

export default DateFilter;
