"use client"

import * as React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { ProductionStats } from "@/types/production"

interface ProductionPieChartProps {
  stats: ProductionStats[]
  loading?: boolean
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(269.3 90% 65%)',
  'hsl(158.1 80% 70%)',
  'hsl(82.4 85% 75%)',
  'hsl(27.3 85% 68%)',
]

export function ProductionPieChart({ stats, loading = false }: ProductionPieChartProps) {
  const chartData = React.useMemo(() => {
    return stats.map((stat) => ({
      name: stat.partner_name,
      value: stat.percentage,
      volume: stat.total_volume,
      count: stat.entry_count,
    }))
  }, [stats])

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-card p-6">
        <div className="flex items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="ml-3 text-muted-foreground">Loading statistics...</span>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">No statistics available</p>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Percentage: <span className="font-medium text-foreground">{data.value.toFixed(2)}%</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Volume: <span className="font-medium text-foreground">{data.volume.toFixed(2)} bbls</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Entries: <span className="font-medium text-foreground">{data.count}</span>
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    // Only show label if percentage is > 5%
    if (percent < 0.05) return null

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
        style={{ textShadow: '0 0 3px rgba(0,0,0,0.8)' }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Production Distribution</h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{
              color: 'hsl(var(--foreground))',
            }}
            formatter={(value: string, entry: any) => {
              const data = chartData.find(d => d.name === value)
              return `${value} (${data?.value.toFixed(1)}%)`
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <div
            key={stat.partner_id}
            className="rounded-lg border border-border bg-muted/30 p-4"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <h4 className="font-semibold text-foreground">{stat.partner_name}</h4>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-muted-foreground">
                Share: <span className="font-medium text-foreground">{stat.percentage.toFixed(2)}%</span>
              </p>
              <p className="text-muted-foreground">
                Volume: <span className="font-medium text-foreground">{stat.total_volume.toFixed(2)} bbls</span>
              </p>
              <p className="text-muted-foreground">
                Entries: <span className="font-medium text-foreground">{stat.entry_count}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
