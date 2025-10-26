"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  LINE_SERIES,
  METRIC_TOGGLES,
  ProductionLineChartProps,
} from "./components";

// Define proper type (replace `any`)

export function ProductionLineChart({
  data,
  showGrossVolume = true,
  showBSW = true,
  showTemperature = true,
  onToggleChange,
}: ProductionLineChartProps) {
  const handleToggle = (
    metric: "showGrossVolume" | "showTemperature" | "showBSW"
  ) => {
    if (onToggleChange) {
      onToggleChange({
        showGrossVolume:
          metric === "showGrossVolume" ? !showGrossVolume : showGrossVolume,
        showTemperature:
          metric === "showTemperature" ? !showTemperature : showTemperature,
        showBSW: metric === "showBSW" ? !showBSW : showBSW,
      });
    }
  };

  // Safer theme color getter (avoids runtime errors)
  const getCSSVar = (name: string): string => {
    if (typeof document === "undefined") return "240 5.9% 90%";
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim()
        .replace("hsl(", "")
        .replace(")", "") || "240 5.9% 90%"
    );
  };

  const chartData = React.useMemo(() => {
    return data
      .map((entry) => {
        const grossVol = Number(entry.gross_volume);
        const bsw = Number(entry.bsw_percent);
        const factor = Number(entry.meter_factor);
        const temp = Number(entry.temperature);

        const validGross = !isNaN(grossVol) && grossVol > 0 ? grossVol : null;
        const validBsw = !isNaN(bsw) ? bsw : null;
        const validFactor = !isNaN(factor) && factor > 0 ? factor : 1;
        const validTemp = !isNaN(temp) ? temp : null;

        let validNet = null;
        if (validGross !== null && validBsw !== null) {
          validNet = validGross * (1 - validBsw / 100) * validFactor;
        }

        return {
          date: new Date(entry.measurement_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          fullDate: new Date(entry.measurement_date).toISOString(),
          grossVolume:
            validGross !== null ? Number((validGross / 1000).toFixed(1)) : null,
          netVolume:
            validNet !== null ? Number((validNet / 1000).toFixed(1)) : null,
          bsw: validBsw,
          temperature: validTemp,
        };
      })
      .sort(
        (a, b) =>
          new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
      );
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-muted-foreground">
          No production data available for chart. Add production entries to see
          trends.
        </p>
      </div>
    );
  }
  const toggles = { showGrossVolume, showBSW, showTemperature };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Production Trends
        </h3>
        <div className="flex gap-2">
          {METRIC_TOGGLES.map((toggle) => (
            <Badge
              key={toggle.id}
              variant={toggle.variant(toggles[toggle.id])}
              className="cursor-pointer transition-all hover:opacity-80"
              onClick={() => handleToggle(toggle.id)}
            >
              {toggle.icon}
              {toggle.label}
            </Badge>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={`hsl(${getCSSVar("--border")})`}
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: `hsl(${getCSSVar("--foreground")})`, fontSize: 12 }}
            stroke={`hsl(${getCSSVar("--foreground")})`}
            strokeOpacity={0.5}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: `hsl(${getCSSVar("--foreground")})`, fontSize: 12 }}
            stroke={`hsl(${getCSSVar("--foreground")})`}
            strokeOpacity={0.5}
            label={{
              value: "Volume (mbbls)",
              angle: -90,
              position: "insideLeft",
              style: {
                fill: `hsl(${getCSSVar("--foreground")})`,
                fontWeight: "600",
                fontSize: 13,
              },
            }}
            domain={[0, "auto"]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: `hsl(${getCSSVar("--foreground")})`, fontSize: 12 }}
            stroke={`hsl(${getCSSVar("--foreground")})`}
            strokeOpacity={0.5}
            label={{
              value: "BSW % / Temp °F",
              angle: 90,
              position: "insideRight",
              style: {
                fill: `hsl(${getCSSVar("--foreground")})`,
                fontWeight: "600",
                fontSize: 13,
              },
            }}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
            formatter={(value: number, name: string) => {
              if (value == null) return null;
              if (["Gross Volume", "Net Volume"].includes(name)) {
                return [`${value.toFixed(1)} mbbls`, name];
              }
              if (name === "BSW %") return [`${value.toFixed(1)}%`, name];
              if (name === "Temperature °F")
                return [`${value.toFixed(1)}°F`, name];
              return [value.toString(), name];
            }}
          />
          <Legend
            wrapperStyle={{
              color: `hsl(${getCSSVar("--foreground")})`,
              paddingTop: "10px",
            }}
            iconType="line"
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                grossVolume: "Gross Volume",
                netVolume: "Net Volume",
                bsw: "BSW %",
                temperature: "Temperature °F",
              };
              return labels[value] || value;
            }}
          />

          {/* Dynamically render lines */}
          {LINE_SERIES.map((series) => {
            if (!series.shouldRender(toggles)) return null;
            return (
              <Line
                key={series.id}
                yAxisId={series.yAxisId}
                type="monotone"
                dataKey={series.id}
                stroke={series.stroke}
                strokeWidth={series.strokeWidth}
                dot={{ fill: series.stroke, r: series.dot.r }}
                activeDot={{ r: series.activeDot.r }}
                animationDuration={1000}
                animationBegin={series.animationBegin}
                connectNulls={true}
                name={series.name}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
