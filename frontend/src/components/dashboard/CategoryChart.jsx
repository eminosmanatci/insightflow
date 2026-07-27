import { Layers3 } from "lucide-react";
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

function CategoryChart({ data, loading }) {
  return (
    <ChartCard
      icon={Layers3}
      title="Kategori Performansı"
      description="Kategorilerin toplam gelire katkısı"
      badge={loading ? "Yükleniyor" : `${data.length} kategori`}
      className="h-[380px]"
    >
      <ChartState
        loading={loading}
        empty={data.length === 0}
        emptyMessage="Seçilen dönemde kategori verisi bulunamadı."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 5,
              right: 15,
              left: 10,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="categoryRevenueGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 6"
              horizontal={false}
              stroke="#e8eef6"
            />

            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#94a3b8",
                fontSize: 11,
              }}
              tickFormatter={formatCompactCurrency}
            />

            <YAxis
              type="category"
              dataKey="category"
              axisLine={false}
              tickLine={false}
              width={95}
              tick={{
                fill: "#64748b",
                fontSize: 11,
              }}
            />

            <Tooltip
              content={<ChartTooltip />}
              cursor={{
                fill: "#f8fafc",
              }}
            />

            <Bar
              dataKey="total_revenue"
              fill="url(#categoryRevenueGradient)"
              radius={[0, 8, 8, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartState>
    </ChartCard>
  );
}

export default CategoryChart;
