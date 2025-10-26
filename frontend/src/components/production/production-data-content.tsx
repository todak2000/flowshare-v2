"use client";

import * as React from "react";
import {
  Edit3,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Column } from "@/components/ui/data-table";
import { useAuthStore, UserProfile } from "@/store/auth-store";
import { useProductionData } from "@/hooks/useProductionData";
import {
  ProductionEntry,
  ProductionEntryStatus,
} from "@/types/production";

// Import all our new components and the existing ones

import { ProductionFiltersComponent } from "./production-filters";

import { ProductionEntryModal } from "./production-entry-modal";
import { EditEntryModal } from "./edit-entry-modal";
import { ApproveEntryModal } from "./approve-entry-modal";
import { ProductionPageHeader } from "./production-data-header";
import { ProductionCharts } from "./production-charts";
import { ProductionDataTableWrapper } from "./production-table-wrapper";

// Helper function for status badges (moved from page)
const getStatusBadge = (status: ProductionEntryStatus) => {
  const styles: Record<ProductionEntryStatus, string> = {
    [ProductionEntryStatus.PENDING]: "bg-yellow-500 text-yellow-50 font-semibold",
    [ProductionEntryStatus.APPROVED]: "bg-green-600 text-green-50 font-semibold",
    [ProductionEntryStatus.PENDING_APPROVAL]: "bg-blue-600 text-blue-50 font-semibold",
    [ProductionEntryStatus.FLAGGED]: "bg-orange-600 text-orange-50 font-semibold",
    [ProductionEntryStatus.REJECTED]: "bg-red-600 text-red-50 font-semibold",
  };
  const labels: Record<ProductionEntryStatus, string> = {
      [ProductionEntryStatus.PENDING]: "",
      [ProductionEntryStatus.APPROVED]: "",
      [ProductionEntryStatus.FLAGGED]: "",
      [ProductionEntryStatus.PENDING_APPROVAL]: "",
      [ProductionEntryStatus.REJECTED]: ""
  };
  return <span className={`... ${styles[status]}`}>{labels[status]}</span>;
};

interface ProductionDataContentProps {
  user: UserProfile;
}

export const ProductionDataContent: React.FC<ProductionDataContentProps> = ({ user }) => {
  // 1. Call the logic hook
  const {
    entries,
    stats,
    partners,
    loading,
    statsLoading,
    page,
    pageSize,
    totalItems,
    setPage,
    filters,
    handleFiltersChange,
    hasTodayEntry,
    handleRefresh,
    handleSaveEdit,
    handleApprove,
    handleReject,
  } = useProductionData(user);

  const userRole = user.role;

  // 2. Manage UI-only state
  const [showCharts, setShowCharts] = React.useState(false);
  const [chartToggles, setChartToggles] = React.useState({
    showGrossVolume: true,
    showTemperature: false,
    showBSW: false,
  });
  const [entryModalOpen, setEntryModalOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [approveModalOpen, setApproveModalOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<ProductionEntry | null>(null);

  // 3. Define UI-specific handlers (modal openers)
  const handleEditEntry = (entry: ProductionEntry) => {
    setSelectedEntry(entry);
    setEditModalOpen(true);
  };

  const handleApproveEntry = (entry: ProductionEntry) => {
    setSelectedEntry(entry);
    setApproveModalOpen(true);
  };

  const handleExport = () => {
    // Your export logic here
    console.log("Exporting data...");
  };
  
  // 4. Define columns (UI logic)
  const columns = React.useMemo<Column<ProductionEntry>[]>(() => [
    {
      key: "measurement_date",
      header: "Date",
      // ... (your render logic)
    },
    ...(userRole === "coordinator"
      ? [
          {
            key: "partner_name",
            header: "Partner Name",
            render: (row: ProductionEntry) => {
              const partner = partners.find((p) => p.id === row.partner_id);
              return <span>{partner?.organization || partner?.name || "..."}</span>;
            },
          } as Column<ProductionEntry>,
        ]
      : []),
    { key: "gross_volume", header: "Gross Vol. (mbbls)", /* ... */ },
    { key: "net_volume", header: "Net Vol. (mbbls)", /* ... */ },
    { key: "bsw_percent", header: "BSW %", /* ... */ },
    { key: "temperature", header: "Temp (°F)", /* ... */ },
    { key: "api_gravity", header: "API Gravity", /* ... */ },
    {
      key: "status",
      header: "Status",
      render: (row) => getStatusBadge(row.status),
    },
    ...(userRole !== "coordinator"
      ? [
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                {userRole === "field_operator" && (
                  <Button variant="ghost" size="sm" onClick={() => handleEditEntry(row)} /* ... */>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
                {userRole === "partner" && row.status === ProductionEntryStatus.PENDING_APPROVAL && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => handleApproveEntry(row)} /* ... */>
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleReject(row.id)} /* ... */>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ),
          } as Column<ProductionEntry>,
        ]
      : []),
  ], [userRole, partners, handleReject]); // Dependencies for columns

  // 5. Render the UI
  return (
    <div className="flex h-screen flex-col bg-background">
      <ProductionPageHeader
        userRole={userRole}
        onRefresh={handleRefresh}
        loading={loading || statsLoading}
        onToggleCharts={() => setShowCharts(!showCharts)}
        showCharts={showCharts}
        onExport={handleExport}
        onNewEntry={() => setEntryModalOpen(true)}
        hasTodayEntry={hasTodayEntry}
      />

      <div className="flex-1 p-6 flex flex-col">
        <div className="mx-auto max-w-7xl w-full flex flex-col gap-6 h-full">
          <div className="shrink-0">
            <ProductionFiltersComponent
              filters={filters}
              onFiltersChange={handleFiltersChange}
              showPartnerFilter={userRole === "coordinator"}
              partners={partners}
            />
          </div>

          {showCharts && (
            <ProductionCharts
              entries={entries}
              stats={stats}
              statsLoading={statsLoading}
              chartToggles={chartToggles}
              onToggleChange={setChartToggles}
            />
          )}

          <ProductionDataTableWrapper
            entries={entries}
            columns={columns}
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            loading={loading}
            filters={filters}
          />
        </div>
      </div>

      {/* --- Modals --- */}
      <ProductionEntryModal
        open={entryModalOpen}
        onOpenChange={setEntryModalOpen}
        onSuccess={handleRefresh}
      />
      <EditEntryModal
        entry={selectedEntry}
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedEntry(null);
        }}
        onSave={handleSaveEdit}
      />
      <ApproveEntryModal
        entry={selectedEntry}
        open={approveModalOpen} // Fixed: was hardcoded to `true`
        onClose={() => {
          setApproveModalOpen(false);
          setSelectedEntry(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};