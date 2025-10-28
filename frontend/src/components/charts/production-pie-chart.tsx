"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

import {
  ChartDataItem,
  COLORS,
  CustomLabel,
  CustomTooltip,
  getLegendColor,
  ProductionPieChartProps,
  StatRow,
} from "./components";

// Define types for chart data
export function ProductionPieChart({
  stats,
  loading = false,
}: ProductionPieChartProps) {
  const chartData: ChartDataItem[] = React.useMemo(() => {
    return stats.map((stat) => ({
      name: stat.partner_name,
      value: stat.percentage,
      volume: Number(stat.total_volume),
      count: stat.entry_count,
    }));
  }, [stats]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-card p-6">
        <div className="flex items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="ml-3 text-muted-foreground">
            Loading statistics...
          </span>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground text-center text-xs md:text-base">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Production Distribution
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={120}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ color: `hsl(${getLegendColor()})` }}
            formatter={(value: string) => {
              const item = chartData.find((d) => d.name === value);
              return `${value} (${item ? item.value.toFixed(1) : "0.0"}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary Cards — DRY via mapping */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const volumeInMbbls = (Number(stat.total_volume) / 1000).toFixed(1);
          return (
            <div
              key={stat.partner_id}
              className="rounded-lg border border-border bg-muted/30 p-4"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <h4 className="font-semibold text-foreground">
                  {stat.partner_name}
                </h4>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <StatRow
                  label="Share"
                  value={`${stat.percentage.toFixed(2)}%`}
                />
                <StatRow label="Volume" value={`${volumeInMbbls} mbbls`} />
                <StatRow label="Entries" value={String(stat.entry_count)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
