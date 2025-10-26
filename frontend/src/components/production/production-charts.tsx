import * as React from "react";
import { ProductionLineChart } from "@/components/charts/production-line-chart";
import { ProductionPieChart } from "@/components/charts/production-pie-chart";
import { ProductionEntry, ProductionStats } from "@/types/production";

interface ProductionChartsProps {
  entries: ProductionEntry[];
  stats: ProductionStats[];
  statsLoading: boolean;
  chartToggles: {
    showGrossVolume: boolean;
    showTemperature: boolean;
    showBSW: boolean;
  };
  onToggleChange: (toggles: {
    showGrossVolume: boolean;
    showTemperature: boolean;
    showBSW: boolean;
  }) => void;
}

export const ProductionCharts: React.FC<ProductionChartsProps> = ({
  entries,
  stats,
  statsLoading,
  chartToggles,
  onToggleChange,
}) => {
  return (
    <div className="shrink-0 grid grid-cols-1">
      <ProductionLineChart
        data={entries}
        showGrossVolume={chartToggles.showGrossVolume}
        showTemperature={chartToggles.showTemperature}
        showBSW={chartToggles.showBSW}
        onToggleChange={onToggleChange}
      />
      <ProductionPieChart stats={stats} loading={statsLoading} />
    </div>
  );
};