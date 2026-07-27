import {
  CheckCircle2,
  CircleX,
  Database,
  FileWarning,
  LoaderCircle,
  Trash2,
} from "lucide-react";

const STATUS_CONFIG = {
  completed: {
    label: "Tamamlandı",
    icon: CheckCircle2,
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  processing: {
    label: "İşleniyor",
    icon: LoaderCircle,
    classes: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  failed: {
    label: "Hatalı",
    icon: CircleX,
    classes: "bg-red-50 text-red-700 ring-red-100",
  },
};

function DatasetStatus({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.failed;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${config.classes}`}
    >
      <Icon
        size={13}
        className={status === "processing" ? "animate-spin" : ""}
      />

      {config.label}
    </span>
  );
}

function ProcessingReport({ dataset }) {
  if (dataset.status === "processing") {
    return (
      <div className="min-w-[150px]">
        <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
          <LoaderCircle size={14} className="animate-spin" />
          Doğrulanıyor...
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-50">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-500" />
        </div>
      </div>
    );
  }

  const total = Number(dataset.total_rows ?? 0);
  const valid = Number(dataset.valid_rows ?? 0);
  const invalid = Number(dataset.invalid_rows ?? 0);
  const validRate = total > 0 ? Math.round((valid / total) * 100) : 0;

  return (
    <div className="min-w-[170px]">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Veri kalitesi</span>

        <span className="font-bold text-slate-800">%{validRate}</span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          style={{
            width: `${validRate}%`,
          }}
          className={`h-full rounded-full ${
            invalid > 0 ? "bg-amber-400" : "bg-emerald-500"
          }`}
        />
      </div>

      <div className="mt-2 flex gap-3 text-[11px]">
        <span className="text-slate-500">
          Toplam <strong className="text-slate-700">{total}</strong>
        </span>

        <span className="text-emerald-600">
          Geçerli <strong>{valid}</strong>
        </span>

        <span className={invalid > 0 ? "text-red-600" : "text-slate-400"}>
          Hatalı <strong>{invalid}</strong>
        </span>
      </div>
    </div>
  );
}

function DatasetHistory({ datasets, loading, onDelete }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
            <Database size={21} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">Veri Seti Geçmişi</h2>

            <p className="mt-1 text-xs text-slate-500">
              Yükleme, doğrulama ve işleme sonuçlarını takip edin.
            </p>
          </div>
        </div>

        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
          {loading ? "Yükleniyor" : `${datasets.length} veri seti`}
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] uppercase tracking-[0.12em] text-slate-400">
            <tr>
              <th className="px-6 py-3 font-semibold">Dosya</th>
              <th className="px-6 py-3 font-semibold">Durum</th>
              <th className="px-6 py-3 font-semibold">İşlem Raporu</th>
              <th className="px-6 py-3 font-semibold">Yükleme Tarihi</th>
              <th className="px-6 py-3 text-right font-semibold">İşlem</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [0, 1, 2].map((item) => (
                <tr key={item}>
                  <td colSpan={5} className="px-6 py-5">
                    <div className="h-10 animate-pulse rounded-xl bg-slate-50" />
                  </td>
                </tr>
              ))
            ) : datasets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-200">
                    <Database size={24} />
                  </div>

                  <p className="mt-4 font-semibold text-slate-600">
                    Henüz veri seti yüklenmedi
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    İlk CSV dosyanızı yukarıdaki alandan yükleyin.
                  </p>
                </td>
              </tr>
            ) : (
              datasets.map((dataset) => (
                <tr
                  key={dataset.id}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                        <Database size={17} />
                      </div>

                      <div>
                        <p className="max-w-[260px] truncate font-semibold text-slate-900">
                          {dataset.name}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          Dataset #{dataset.id}
                        </p>

                        {dataset.error_message && (
                          <div className="mt-3 flex max-w-sm gap-2 rounded-lg bg-red-50 p-2.5 text-xs leading-5 text-red-700 ring-1 ring-red-100">
                            <FileWarning
                              size={15}
                              className="mt-0.5 shrink-0"
                            />

                            {dataset.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <DatasetStatus status={dataset.status} />
                  </td>

                  <td className="px-6 py-5">
                    <ProcessingReport dataset={dataset} />
                  </td>

                  <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-500">
                    {new Date(dataset.created_at).toLocaleString("tr-TR")}
                  </td>

                  <td className="px-6 py-5 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(dataset.id);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Veri setini sil"
                      aria-label={`${dataset.name} veri setini sil`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default DatasetHistory;
