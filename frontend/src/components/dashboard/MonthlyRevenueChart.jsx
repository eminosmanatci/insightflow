import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactCurrency } from "../../utils/dashboard";
import ChartTooltip from "./ChartTooltip";

function MonthlyRevenueChart({ data, loading }) {
  return (
    <div className="flex h-[380px] flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="font-semibold text-slate-800">Aylık Gelir Trendi</h3>

        <p className="mt-1 text-sm text-slate-500">
          Gelirin aylar içindeki değişimi
        </p>
      </div>

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Yükleniyor...
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Seçilen dönemde aylık veri bulunamadı.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 20,
                left: -10,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#64748b",
                  fontSize: 12,
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

              <Tooltip content={<ChartTooltip />} />

              <Line
                type="monotone"
                dataKey="total_revenue"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{
                  fill: "#2563eb",
                  strokeWidth: 0,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default MonthlyRevenueChart;
