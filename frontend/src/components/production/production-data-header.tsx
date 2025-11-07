import * as React from "react";
import {
  Plus,
  Download,
  RefreshCw,
  TrendingUp,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductionPageHeaderProps {
  userRole: string;
  environment: 'test' | 'production';
  onRefresh: () => void;
  loading: boolean;
  onToggleCharts: () => void;
  showCharts: boolean;
  onExport: () => void;
  onNewEntry: () => void;
  hasTodayEntry: boolean;
}

export const ProductionPageHeader: React.FC<ProductionPageHeaderProps> = ({
  userRole,
  environment,
  onRefresh, 
  loading,
  onToggleCharts,
  showCharts,
  onExport,
  onNewEntry,
  hasTodayEntry,
}) => {
  return (
    <div className="border-b border-border bg-card px-6 py-4">
      <div className="flex md:flex-row flex-col md:items-center justify-between">
        <div className="my-2 w-full">
          <h1 className="text-lg lg:text-2xl font-bold text-foreground">Production Data</h1>
          <p className="text-sm text-muted-foreground">
            {userRole === "coordinator"
              ? "View and manage production data for all partners"
              : "View and manage your production data"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onToggleCharts}>
            {showCharts ? (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Hide Charts
              </>
            ) : (
              <>
                <PieChartIcon className="mr-2 h-4 w-4" />
                Show Charts
              </>
            )}
          </Button>
          {["coordinator", "partner"].includes(userRole) && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
          {userRole === "field_operator" && !hasTodayEntry && environment ==='production' && (
            <Button size="sm" onClick={onNewEntry}>
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          )}
          {userRole === "field_operator" && hasTodayEntry && (
            <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
              ✓ Today's production data already submitted
            </div>
          )}
        </div>
      </div>
    </div>
  );
};