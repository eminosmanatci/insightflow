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

function CategoryChart({ data, loading }) {
  return (
    <div className="flex h-[380px] flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="font-semibold text-slate-800">Kategori Performansı</h3>

        <p className="mt-1 text-sm text-slate-500">
          Kategorilerin toplam gelire katkısı
        </p>
      </div>

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Yükleniyor...
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Seçilen dönemde kategori verisi bulunamadı.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 0,
                right: 20,
                left: 20,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#f1f5f9"
              />

              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#94a3b8",
                  fontSize: 12,
                }}
                tickFormatter={formatCompactCurrency}
              />

              <YAxis
                type="category"
                dataKey="category"
                axisLine={false}
                tickLine={false}
                width={90}
                tick={{
                  fill: "#64748b",
                  fontSize: 12,
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
                fill="#6366f1"
                radius={[0, 4, 4, 0]}
                barSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default CategoryChart;
