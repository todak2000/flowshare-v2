import { ProductionStats } from "@/types/production";
import { DropletIcon, Thermometer, FlaskConical } from "lucide-react";

export type ProductionEntry = {
  measurement_date: string;
  gross_volume: number | null;
  bsw_percent: number | null;
  meter_factor: number | null;
  temperature: number | null;
};

export interface ProductionLineChartProps {
  data: ProductionEntry[];
  showGrossVolume?: boolean;
  showBSW?: boolean;
  showTemperature?: boolean;
  onToggleChange?: (toggles: {
    showGrossVolume: boolean;
    showTemperature: boolean;
    showBSW: boolean;
  }) => void;
}

// Metric toggle config
export const METRIC_TOGGLES = [
  {
    id: "showGrossVolume" as const,
    label: "Volume",
    icon: <DropletIcon className="mr-1 h-3 w-3" />,
    variant: (active: boolean) => (active ? "default" : "outline"),
  },
  {
    id: "showTemperature" as const,
    label: "Temperature",
    icon: <Thermometer className="mr-1 h-3 w-3" />,
    variant: (active: boolean) => (active ? "default" : "outline"),
  },
  {
    id: "showBSW" as const,
    label: "BSW",
    icon: <FlaskConical className="mr-1 h-3 w-3" />,
    variant: (active: boolean) => (active ? "default" : "outline"),
  },
];

// Line series config
export const LINE_SERIES = [
  {
    id: "grossVolume",
    yAxisId: "left",
    stroke: "#3b82f6",
    strokeWidth: 3,
    dot: { r: 5 },
    activeDot: { r: 8 },
    animationBegin: 0,
    name: "Gross Volume",
    shouldRender: (toggles: VisibilityToggles) => toggles.showGrossVolume,
  },
  {
    id: "netVolume",
    yAxisId: "left",
    stroke: "#10b981",
    strokeWidth: 3,
    dot: { r: 5 },
    activeDot: { r: 8 },
    animationBegin: 200,
    name: "Net Volume",
    shouldRender: (toggles: VisibilityToggles) => toggles.showGrossVolume,
  },
  {
    id: "bsw",
    yAxisId: "right",
    stroke: "#ffc658",
    strokeWidth: 2,
    dot: { r: 4 },
    activeDot: { r: 6 },
    animationBegin: 400,
    name: "BSW %",
    shouldRender: (toggles: VisibilityToggles) => toggles.showBSW,
  },
  {
    id: "temperature",
    yAxisId: "right",
    stroke: "#ff7300",
    strokeWidth: 2,
    dot: { r: 4 },
    activeDot: { r: 6 },
    animationBegin: 600,
    name: "Temperature °F",
    shouldRender: (toggles: VisibilityToggles) => toggles.showTemperature,
  },
];

export interface VisibilityToggles {
  showGrossVolume: boolean;
  showBSW: boolean;
  showTemperature: boolean;
}

export interface ChartDataItem {
  name: string;
  value: number; // percentage
  volume: number; // total_volume
  count: number;  // entry_count
}

// Color palette
export const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(269.3 90% 65%)",
  "hsl(158.1 80% 70%)",
  "hsl(82.4 85% 75%)",
  "hsl(27.3 85% 68%)",
];

// Helper to get theme-aware foreground color
export const getLegendColor = (): string => {
  if (typeof document === "undefined") return "240 5.9% 90%";
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--foreground")
      .trim()
      .replace("hsl(", "")
      .replace(")", "") || "240 5.9% 90%"
  );
};

// Custom Tooltip Component (type-safe)
export const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload?.length) {
    const data = payload[0].payload as ChartDataItem;
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          Percentage:{" "}
          <span className="font-medium text-foreground">
            {data.value.toFixed(2)}%
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Volume:{" "}
          <span className="font-medium text-foreground">
            {(data.volume / 1000).toFixed(1)} mbbls
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Entries:{" "}
          <span className="font-medium text-foreground">{data.count}</span>
        </p>
      </div>
    );
  }
  return null;
};

// Custom Label Component
export const CustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  if (percent < 0.05) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-sm font-bold"
      style={{
        textShadow: "0 0 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)",
        paintOrder: "stroke fill",
        stroke: "rgba(0,0,0,0.5)",
        strokeWidth: "2px",
      }}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export interface ProductionPieChartProps {
  stats: ProductionStats[];
  loading?: boolean;
}

export const StatRow = ({ label, value }: { label: string; value: string }) => (
  <p className="text-muted-foreground">
    {label}:{" "}
    <span className="font-medium text-foreground">{value}</span>
  </p>
);