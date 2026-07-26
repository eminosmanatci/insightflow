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
    <div className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white shadow-lg">
      {tooltipLabel && <p className="font-semibold">{tooltipLabel}</p>}

      <p className="text-blue-300">{formatCurrency(payload[0]?.value)}</p>
    </div>
  );
}

export default ChartTooltip;
