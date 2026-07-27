import { MapPinned } from "lucide-react";
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
import ChartCard, { ChartState } from "./ChartCard";
import ChartTooltip from "./ChartTooltip";

function RegionChart({ data, loading }) {
  return (
    <ChartCard
      icon={MapPinned}
      title="Bölgesel Satış Dağılımı"
      description="Gelirin coğrafi bölgelere göre dağılımı"
      badge={loading ? "Yükleniyor" : `${data.length} bölge`}
      className="h-[420px] lg:col-span-2"
    >
      <ChartState
        loading={loading}
        empty={data.length === 0}
        emptyMessage="Seçilen dönemde bölgesel veri bulunamadı."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -10,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="regionRevenueGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 6"
              vertical={false}
              stroke="#e8eef6"
            />

            <XAxis
              dataKey="region"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#64748b",
                fontSize: 12,
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

            <Tooltip
              content={<ChartTooltip />}
              cursor={{
                fill: "#f8fafc",
              }}
            />

            <Bar
              dataKey="total_revenue"
              fill="url(#regionRevenueGradient)"
              radius={[8, 8, 3, 3]}
              maxBarSize={56}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartState>
    </ChartCard>
  );
}

export default RegionChart;
