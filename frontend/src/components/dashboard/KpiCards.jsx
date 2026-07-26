import {
  Activity,
  CircleDollarSign,
  ReceiptText,
  WalletCards,
} from "lucide-react";

import { formatCurrency } from "../../utils/dashboard";

const KPI_DEFINITIONS = [
  {
    key: "revenue",
    label: "Toplam Gelir",
    description: "Seçili dönemin toplam cirosu",
    icon: CircleDollarSign,
    iconClass: "bg-blue-50 text-blue-600 ring-blue-100",
    glowClass: "bg-blue-500/10",
    accentClass: "from-blue-500 to-cyan-400",
    getValue: (kpis) => formatCurrency(kpis.total_revenue),
  },
  {
    key: "transactions",
    label: "Toplam İşlem",
    description: "Kaydedilen satış hareketleri",
    icon: ReceiptText,
    iconClass: "bg-violet-50 text-violet-600 ring-violet-100",
    glowClass: "bg-violet-500/10",
    accentClass: "from-violet-500 to-fuchsia-400",
    getValue: (kpis) =>
      Number(kpis.transaction_count ?? 0).toLocaleString("tr-TR"),
  },
  {
    key: "average",
    label: "Ort. İşlem Tutarı",
    description: "İşlem başına ortalama gelir",
    icon: WalletCards,
    iconClass: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    glowClass: "bg-emerald-500/10",
    accentClass: "from-emerald-500 to-teal-400",
    getValue: (kpis) => formatCurrency(kpis.average_transaction_value),
  },
];

function KpiCard({ definition, kpis, loading }) {
  const Icon = definition.icon;

  return (
    <article className="group relative min-h-[168px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${definition.accentClass}`}
      />

      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-2xl transition duration-300 group-hover:scale-125 ${definition.glowClass}`}
      />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-600">
              {definition.label}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {definition.description}
            </p>
          </div>

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${definition.iconClass}`}
          >
            <Icon size={21} />
          </div>
        </div>

        <div className="mt-auto pt-5">
          {loading ? (
            <div className="h-9 w-36 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p className="text-3xl font-bold tracking-tight text-slate-950">
              {definition.getValue(kpis)}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-400">
            <Activity size={13} className="text-emerald-500" />
            Güncel analitik veri
          </div>
        </div>
      </div>
    </article>
  );
}

function KpiCards({ kpis, loading }) {
  return (
    <section className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
      {KPI_DEFINITIONS.map((definition) => (
        <KpiCard
          key={definition.key}
          definition={definition}
          kpis={kpis}
          loading={loading}
        />
      ))}
    </section>
  );
}

export default KpiCards;
