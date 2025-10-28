"use client"

import { useMemo } from "react"
import { TrendData } from "./useAnalyticsTrends"

export interface ChartData {
  date: string
  fullDate: string
  production: number
  avgBsw: number
}

export const useAggregatedChartData = (trends: TrendData[]): ChartData[] => {
  const chartData = useMemo(() => {
    const aggregated = new Map<string, { production: number; bsw: number; count: number }>()

    trends.forEach((trend) => {
      const existing = aggregated.get(trend.date) || { production: 0, bsw: 0, count: 0 }
      aggregated.set(trend.date, {
        production: existing.production + trend.total_gross_volume,
        bsw: existing.bsw + trend.avg_bsw,
        count: existing.count + 1,
      })
    })

    return Array.from(aggregated.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        fullDate: date,
        production: Number((data.production / 1000).toFixed(1)), // Convert to mbbls
        avgBsw: Number((data.bsw / data.count).toFixed(2)),
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
  }, [trends])

  return chartData
}