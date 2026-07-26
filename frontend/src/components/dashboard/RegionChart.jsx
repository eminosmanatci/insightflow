import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactCurrency } from "../../utils/dashboard";
import ChartTooltip from "./ChartTooltip";

function RegionChart({ data, loading }) {
  return (
    <div className="flex h-[420px] flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
      <h3 className="mb-6 font-semibold text-slate-800">
        Bölgesel Satış Dağılımı
      </h3>

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Yükleniyor...
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Seçilen dönemde veri bulunamadı.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 0,
                right: 0,
                left: -20,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />

              <XAxis
                dataKey="region"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#64748b",
                  fontSize: 13,
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#94a3b8",
                  fontSize: 12,
                }}
                tickFormatter={formatCompactCurrency}
              />

              <Tooltip
                content={<ChartTooltip />}
                cursor={{
                  fill: "#f8fafc",
                }}
              />

              <Bar
                dataKey="total_revenue"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default RegionChart;
