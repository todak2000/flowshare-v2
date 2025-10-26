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
// Assuming ProductionEntry type is defined elsewhere, e.g., in @/types/production
// type ProductionEntry = {
//   measurement_date: string;
//   gross_volume: number;
//   bsw_percent: number;
//   meter_factor: number;
//   temperature: number;
// };
import { Badge } from "@/components/ui/badge"
import { DropletIcon, Thermometer, FlaskConical } from "lucide-react"

interface ProductionLineChartProps {
  data: any[] // Using any[] to be flexible if ProductionEntry type isn't available
  showGrossVolume?: boolean
  showBSW?: boolean
  showTemperature?: boolean
  onToggleChange?: (toggles: { showGrossVolume: boolean; showTemperature: boolean; showBSW: boolean }) => void
}

export function ProductionLineChart({
  data,
  showGrossVolume = true,
  showBSW = true,
  showTemperature = true,
  onToggleChange,
}: ProductionLineChartProps) {
  const handleToggle = (metric: 'showGrossVolume' | 'showTemperature' | 'showBSW') => {
    if (onToggleChange) {
      onToggleChange({
        showGrossVolume: metric === 'showGrossVolume' ? !showGrossVolume : showGrossVolume,
        showTemperature: metric === 'showTemperature' ? !showTemperature : showTemperature,
        showBSW: metric === 'showBSW' ? !showBSW : showBSW,
      })
    }
  }

  // Transform data for chart
  const chartData = React.useMemo(() => {
    console.log('📊 Chart - Raw data received:', data.length, 'entries');

    const transformed = data
      .map((entry, index) => {
        // --- Robust Data Coercion ---
        // Convert all values to numbers, defaulting to null if invalid (NaN)
        const grossVol = Number(entry.gross_volume);
        const bsw = Number(entry.bsw_percent);
        const factor = Number(entry.meter_factor);
        const temp = Number(entry.temperature);

        const validGross = !isNaN(grossVol) && grossVol !== 0 ? grossVol : null;
        const validBsw = !isNaN(bsw) ? bsw : null;
        // Default meter factor to 1 if invalid, as it's a multiplier
        const validFactor = !isNaN(factor) && factor !== 0 ? factor : 1;
        const validTemp = !isNaN(temp) ? temp : null;

        let validNet = null;
        // Only calculate netVolume if inputs are valid
        if (validGross !== null && validBsw !== null && validFactor !== null) {
            validNet = validGross * (1 - validBsw / 100) * validFactor;
        }
        // --- End Robust Data Coercion ---

        const dataPoint = {
          date: new Date(entry.measurement_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          fullDate: new Date(entry.measurement_date).toISOString(),
          grossVolume: validGross,
          netVolume: validNet,
          bsw: validBsw,
          temperature: validTemp,
        };

        if (index < 3) {
          console.log(`📊 Chart data point ${index}:`, dataPoint);
        }

        return dataPoint;
      })
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

    console.log('📊 Chart - Transformed data:', transformed.length, 'points');
    console.log('📊 Chart - Sample volumes:', transformed.slice(0, 3).map(d => ({ date: d.date, gross: d.grossVolume, net: d.netVolume })));

    return transformed;
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-muted-foreground">No production data available for chart. Add production entries to see trends.</p>
      </div>
    )
  }

  // Check if we have volume data
  const hasVolumeData = chartData.some(d => d.grossVolume !== null || d.netVolume !== null);
  if (!hasVolumeData && showGrossVolume) {
    console.warn('⚠️ Chart - No volume data found in entries');
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Production Trends</h3>
        <div className="flex gap-2">
          <Badge
            variant={showGrossVolume ? "default" : "outline"}
            className="cursor-pointer transition-all hover:opacity-80"
            onClick={() => handleToggle('showGrossVolume')}
          >
            <DropletIcon className="mr-1 h-3 w-3" />
            Volume
          </Badge>
          <Badge
            variant={showTemperature ? "default" : "outline"}
            className="cursor-pointer transition-all hover:opacity-80"
            onClick={() => handleToggle('showTemperature')}
          >
            <Thermometer className="mr-1 h-3 w-3" />
            Temperature
          </Badge>
          <Badge
            variant={showBSW ? "default" : "outline"}
            className="cursor-pointer transition-all hover:opacity-80"
            onClick={() => handleToggle('showBSW')}
          >
            <FlaskConical className="mr-1 h-3 w-3" />
            BSW
          </Badge>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 60,
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
              style: { fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' },
            }}
            domain={[0, 'auto']}
            allowDataOverflow={false}
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
            domain={['auto', 'auto']}
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
              // Don't show tooltip for null values
              if (value === null || value === undefined) {
                return null;
              }
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
                stroke="#3b82f6" // Vibrant blue for better visibility
                strokeWidth={3} // Thicker for prominence
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 8 }}
                animationDuration={1000}
                connectNulls={true}
                name="Gross Volume"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="netVolume"
                stroke="#10b981" // Vibrant green for better visibility
                strokeWidth={3} // Thicker for prominence
                dot={{ fill: '#10b981', r: 5 }}
                activeDot={{ r: 8 }}
                animationDuration={1000}
                animationBegin={200}
                connectNulls={true}
                name="Net Volume"
              />
            </>
          )}

          {showBSW && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="bsw"
              stroke="#ffc658" // Changed color
              strokeWidth={2}
              dot={{ fill: '#ffc658', r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={1000}
              animationBegin={400}
              connectNulls={true} // <-- Fix for broken lines
            />
          )}

          {showTemperature && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="temperature"
              stroke="#ff7300" // Changed color
              strokeWidth={2}
              dot={{ fill: '#ff7300', r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={1000}
              animationBegin={600}
              connectNulls={true} // <-- Fix for broken lines
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
