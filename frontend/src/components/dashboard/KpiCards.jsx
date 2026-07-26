import { formatCurrency } from "../../utils/dashboard";

function KpiCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-medium text-slate-500">{label}</h3>

      <p className="mt-3 text-3xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function KpiCards({ kpis, loading }) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      <KpiCard
        label="Toplam Gelir"
        value={loading ? "..." : formatCurrency(kpis.total_revenue)}
      />

      <KpiCard
        label="Toplam İşlem"
        value={
          loading
            ? "..."
            : Number(kpis.transaction_count ?? 0).toLocaleString("tr-TR")
        }
      />

      <KpiCard
        label="Ort. İşlem Tutarı"
        value={loading ? "..." : formatCurrency(kpis.average_transaction_value)}
      />
    </div>
  );
}

export default KpiCards;
