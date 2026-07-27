import { TrendingUp } from "lucide-react";
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
import ChartCard, { ChartState } from "./ChartCard";
import ChartTooltip from "./ChartTooltip";

function MonthlyRevenueChart({ data, loading }) {
  return (
    <ChartCard
      icon={TrendingUp}
      title="Aylık Gelir Trendi"
      description="Gelirin aylar içindeki değişimi"
      badge={loading ? "Yükleniyor" : `${data.length} dönem`}
      className="h-[380px]"
    >
      <ChartState
        loading={loading}
        empty={data.length === 0}
        emptyMessage="Seçilen dönemde aylık veri bulunamadı."
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 15,
              right: 20,
              left: -5,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="monthlyLineGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 6"
              vertical={false}
              stroke="#e8eef6"
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#64748b",
                fontSize: 11,
              }}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#94a3b8",
                fontSize: 11,
              }}
              tickFormatter={formatCompactCurrency}
            />

            <Tooltip content={<ChartTooltip />} />

            <Line
              type="monotone"
              dataKey="total_revenue"
              stroke="url(#monthlyLineGradient)"
              strokeWidth={3}
              dot={{
                fill: "#2563eb",
                stroke: "#ffffff",
                strokeWidth: 3,
                r: 5,
              }}
              activeDot={{
                fill: "#7c3aed",
                stroke: "#ffffff",
                strokeWidth: 3,
                r: 7,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartState>
    </ChartCard>
  );
}

export default MonthlyRevenueChart;
