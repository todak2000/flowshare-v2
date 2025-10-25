"use client"

import * as React from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ProductionEntry } from "@/types/production"

interface ProductionLineChartProps {
  data: ProductionEntry[]
  showGrossVolume?: boolean
  showBSW?: boolean
  showTemperature?: boolean
}

export function ProductionLineChart({
  data,
  showGrossVolume = true,
  showBSW = true,
  showTemperature = true,
}: ProductionLineChartProps) {
  // Transform data for chart
  const chartData = React.useMemo(() => {
    return data
      .map((entry) => ({
        date: new Date(entry.measurement_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        fullDate: new Date(entry.measurement_date).toISOString(),
        grossVolume: entry.gross_volume,
        netVolume: entry.gross_volume * (1 - entry.bsw_percent / 100) * entry.meter_factor,
        bsw: entry.bsw_percent,
        temperature: entry.temperature,
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-muted-foreground">No production data available for chart</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Production Trends</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            yAxisId="left"
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            label={{
              value: 'Volume (bbls)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: 'hsl(var(--muted-foreground))' },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            label={{
              value: 'BSW % / Temp °F',
              angle: 90,
              position: 'insideRight',
              style: { fill: 'hsl(var(--muted-foreground))' },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
            formatter={(value: number, name: string) => {
              const formatValue = typeof value === 'number' ? value.toFixed(2) : value
              const labels: Record<string, string> = {
                grossVolume: 'Gross Volume',
                netVolume: 'Net Volume',
                bsw: 'BSW %',
                temperature: 'Temperature °F',
              }
              return [formatValue, labels[name] || name]
            }}
          />
          <Legend
            wrapperStyle={{
              color: 'hsl(var(--foreground))',
            }}
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                grossVolume: 'Gross Volume',
                netVolume: 'Net Volume',
                bsw: 'BSW %',
                temperature: 'Temperature °F',
              }
              return labels[value] || value
            }}
          />

          {showGrossVolume && (
            <>
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="grossVolume"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={1000}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="netVolume"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--success))', r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={1000}
                animationBegin={200}
              />
            </>
          )}

          {showBSW && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="bsw"
              stroke="hsl(var(--warning))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--warning))', r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={1000}
              animationBegin={400}
            />
          )}

          {showTemperature && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="temperature"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--destructive))', r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={1000}
              animationBegin={600}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
