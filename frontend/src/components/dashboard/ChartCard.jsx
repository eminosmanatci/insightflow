import { ChartNoAxesCombined } from "lucide-react";

function ChartCard({
  icon: Icon,
  title,
  description,
  badge,
  className = "",
  children,
}) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.05)] ${className}`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-200">
            <Icon size={20} />
          </div>

          <div>
            <h3 className="font-semibold text-slate-950">{title}</h3>

            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
        </div>

        {badge && (
          <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
            {badge}
          </span>
        )}
      </header>

      <div className="min-h-0 flex-1 p-4 pt-3 sm:p-5 sm:pt-4">{children}</div>
    </section>
  );
}

export function ChartState({ loading, empty, emptyMessage, children }) {
  if (loading) {
    return (
      <div className="flex h-full flex-col justify-center gap-4 px-8">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
        <div className="flex flex-1 items-end gap-4 pb-8">
          {[45, 75, 55, 90, 65].map((height, index) => (
            <div
              key={`${height}-${index}`}
              style={{
                height: `${height}%`,
              }}
              className="flex-1 animate-pulse rounded-t-lg bg-slate-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-200">
          <ChartNoAxesCombined size={22} />
        </div>

        <p className="mt-4 text-sm font-medium text-slate-500">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return children;
}

export default ChartCard;
