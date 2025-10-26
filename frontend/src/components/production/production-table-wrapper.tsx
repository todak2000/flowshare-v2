import * as React from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { ProductionEntry, ProductionFilters } from "@/types/production";

// Helper function
const getFilterDescription = (filters: ProductionFilters): string => {
  // ... (Your exact getFilterDescription logic) ...
  if (!filters.start_date && !filters.end_date) {
    return "All Production Entries";
  }
  const startDate = filters.start_date ? new Date(filters.start_date) : null;
  const endDate = filters.end_date ? new Date(filters.end_date) : null;
  if (startDate && endDate) {
    return `Production Entries from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
  }
  return "Production Entries";
};

interface ProductionDataTableWrapperProps {
  entries: ProductionEntry[];
  columns: Column<ProductionEntry>[];
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  filters: ProductionFilters;
}

export const ProductionDataTableWrapper: React.FC<
  ProductionDataTableWrapperProps
> = ({
  entries,
  columns,
  page,
  pageSize,
  totalItems,
  onPageChange,
  loading,
  filters,
}) => {
  return (
    <div className="flex-1 rounded-lg border border-border bg-card p-6 flex flex-col">
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-semibold text-foreground">
          {getFilterDescription(filters)}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {totalItems} {totalItems === 1 ? 'entry' : 'entries'} found
        </p>
      </div>
      <div className="flex-1">
        <DataTable
          data={entries}
          columns={columns}
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange}
          loading={loading}
          emptyMessage="No production entries found. Try adjusting your filters or add a new entry."
        />
      </div>
    </div>
  );
};