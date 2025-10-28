"use client";

import * as React from "react";
import { Calendar, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductionFilters, ProductionEntryStatus } from "@/types/production";
import { formatLocalDate } from "@/lib/utils";
import { DATE_PRESETS, FILTER_FIELDS, FilterField, ProductionFiltersProps } from "./components";



export function ProductionFiltersComponent({
  filters,
  onFiltersChange,
  showPartnerFilter = false,
  partners = [],
}: ProductionFiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [activePreset, setActivePreset] = React.useState<string | null>("current_month");

  const handleFilterChange = (key: keyof ProductionFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
    setActivePreset(null);
  };

  const clearFilters = () => {
    onFiltersChange({});
    setActivePreset(null);
  };

  const setDatePreset = (preset: string) => {
    const now = new Date();
    let startDate: Date;

    switch (preset) {
      case "last_6_months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case "last_year":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case "last_3_months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "current_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        return;
    }

    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    onFiltersChange({
      start_date: formatLocalDate(startDate),
      end_date: formatLocalDate(endDate),
    });
    setActivePreset(preset);
  };

  const setMonthPreset = (monthOffset: number) => {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    onFiltersChange({
      start_date: formatLocalDate(startDate),
      end_date: formatLocalDate(endDate),
    });
    setActivePreset(`month_${monthOffset}`);
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== "").length;

  return (
    <div className="rounded-lg md:border border-border bg-card md:p-4 space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
              <X className="mr-1 h-3 w-3" />
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-2 text-xs"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </div>

      {/* Date Presets */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map((preset:Record<string, any>) => (
            <Button
              key={preset.key}
              variant={activePreset === preset.key ? "default" : "outline"}
              size="sm"
              onClick={() => setDatePreset(preset.key)}
              className="h-8 text-xs"
            >
              {preset?.icon && <Calendar className="mr-1 h-3 w-3" />}
              {preset.label}
            </Button>
          ))}
        

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Or</span>
          <select
            onChange={(e) => setMonthPreset(parseInt(e.target.value))}
            value={activePreset?.startsWith("month_") ? activePreset.replace("month_", "") : ""}
            className="h-8 rounded-md border border-input bg-background px-3 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select Month</option>
            {Array.from({ length: 12 }, (_, i) => {
              const offset = -i;
              const date = new Date(new Date().getFullYear(), new Date().getMonth() + offset, 1);
              return (
                <option key={offset} value={offset}>
                  {date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </option>
              );
            })}
          </select>
        </div>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FILTER_FIELDS.map((field) => (
            <FilterField
              key={field.key}
              field={field}
              value={filters[field.key as keyof ProductionFilters]}
              onChange={handleFilterChange}
              showPartnerFilter={showPartnerFilter}
              partners={partners}
            />
          ))}
        </div>
      )}
    </div>
  );
}