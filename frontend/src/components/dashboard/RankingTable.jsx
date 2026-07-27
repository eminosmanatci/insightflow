import { ArrowUpRight, Trophy } from "lucide-react";

function RankBadge({ rank }) {
  const topThree = rank <= 3;

  return (
    <span
      className={[
        "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ring-1",
        topThree
          ? "bg-amber-50 text-amber-700 ring-amber-100"
          : "bg-slate-50 text-slate-500 ring-slate-200",
      ].join(" ")}
    >
      {topThree ? <Trophy size={14} /> : rank}
    </span>
  );
}

function RankingTable({
  icon: Icon,
  title,
  description,
  columns,
  rows,
  loading,
  emptyMessage,
  getRowKey,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
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

        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
          {loading ? "Yükleniyor" : `${rows.length} kayıt`}
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] uppercase tracking-[0.12em] text-slate-400">
            <tr>
              <th className="w-16 px-5 py-3 font-semibold sm:px-6">Sıra</th>

              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-3 font-semibold sm:px-6 ${
                    column.align === "right" ? "text-right" : ""
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [0, 1, 2].map((item) => (
                <tr key={item}>
                  <td colSpan={columns.length + 1} className="px-6 py-4">
                    <div className="h-8 animate-pulse rounded-lg bg-slate-50" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-6 py-12 text-center"
                >
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-200">
                    <Trophy size={19} />
                  </div>

                  <p className="mt-3 text-sm font-medium text-slate-400">
                    {emptyMessage}
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className="group transition hover:bg-slate-50/80"
                >
                  <td className="px-5 py-4 sm:px-6">
                    <RankBadge rank={index + 1} />
                  </td>

                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-5 py-4 sm:px-6 ${
                        column.align === "right" ? "text-right" : ""
                      } ${
                        column.emphasize
                          ? "font-bold text-slate-950"
                          : "text-slate-600"
                      } ${
                        column.primary
                          ? "max-w-[240px] truncate font-semibold text-slate-900"
                          : ""
                      }`}
                    >
                      <span
                        className={
                          column.emphasize
                            ? "inline-flex items-center gap-1.5"
                            : ""
                        }
                      >
                        {column.render(row)}

                        {column.emphasize && (
                          <ArrowUpRight
                            size={14}
                            className="text-emerald-500"
                          />
                        )}
                      </span>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default RankingTable;
