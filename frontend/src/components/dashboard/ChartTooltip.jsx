import { formatCurrency } from "../../utils/dashboard";

function ChartTooltip({ active, payload, label }) {
  if (!active || !Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  const tooltipLabel =
    label ??
    payload[0]?.payload?.month ??
    payload[0]?.payload?.region ??
    payload[0]?.payload?.category ??
    "";

  return (
    <div className="min-w-[150px] rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur">
      {tooltipLabel && (
        <p className="text-xs font-medium text-slate-400">{tooltipLabel}</p>
      )}

      <div className="mt-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />

        <p className="text-sm font-bold">{formatCurrency(payload[0]?.value)}</p>
      </div>
    </div>
  );
}

export default ChartTooltip;
