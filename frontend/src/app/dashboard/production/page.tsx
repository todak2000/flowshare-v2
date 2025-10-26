"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Download,
  RefreshCw,
  TrendingUp,
  PieChart as PieChartIcon,
  Edit3,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { ProductionFiltersComponent } from "@/components/production/production-filters";
import { ProductionLineChart } from "@/components/charts/production-line-chart";
import { ProductionPieChart } from "@/components/charts/production-pie-chart";
import { ProductionEntryModal } from "@/components/production/production-entry-modal";
import { EditEntryModal } from "@/components/production/edit-entry-modal";
import { ApproveEntryModal } from "@/components/production/approve-entry-modal";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import {
  ProductionEntry,
  ProductionFilters,
  ProductionStats,
  ProductionEntryStatus,
} from "@/types/production";

export default function ProductionPage() {
  const router = useRouter();
  const { getTenantId, getUserRole, user } = useAuthStore();
  const [entries, setEntries] = React.useState<ProductionEntry[]>([]);
  const [stats, setStats] = React.useState<ProductionStats[]>([]);
  const [partners, setPartners] = React.useState<
    Array<{ id: string; name: string; organization?: string }>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(31); // Monthly partition - 31 days
  const [totalItems, setTotalItems] = React.useState(0);
  const [filters, setFilters] = React.useState<ProductionFilters>(() => {
    // Default to current month
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    };
  });
  const [showCharts, setShowCharts] = React.useState(false);
  const [entryModalOpen, setEntryModalOpen] = React.useState(false);
  const [chartToggles, setChartToggles] = React.useState({
    showGrossVolume: true,
    showTemperature: false, // Default OFF to prioritize volume
    showBSW: false, // Default OFF to prioritize volume
  });
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [approveModalOpen, setApproveModalOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] =
    React.useState<ProductionEntry | null>(null);

  const userRole = getUserRole() || "";

  // Fetch partners list (for coordinators)
  React.useEffect(() => {
    const fetchPartners = async () => {
      if (userRole !== "coordinator") return;

      const tenantId = getTenantId();
      if (!tenantId) {
        console.error("No tenant_id available");
        return;
      }

      try {
        const data = await apiClient.get<
          Array<{
            id: string;
            name: string;
            full_name?: string;
            organization?: string;
          }>
        >(`/api/partners?tenant_id=${tenantId}`);
        // Map partners to include both name and organization for display
        const mappedPartners = data
          .filter((p: any) => p.role === "partner") // Only show partners, not field operators
          .map((p: any) => ({
            id: p.id,
            name: p.full_name || p.name,
            organization: p.organization,
          }));
        setPartners(mappedPartners);
      } catch (error) {
        console.error("Failed to fetch partners:", error);
      }
    };
    fetchPartners();
  }, [userRole, getTenantId]);

  // Fetch production entries
  const fetchEntries = React.useCallback(async () => {
    const tenantId = getTenantId();
    if (!tenantId) {
      console.error("No tenant_id available, redirecting to login");
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenant_id: tenantId,
        page: page.toString(),
        page_size: pageSize.toString(),
        ...(filters.partner_id && { partner_id: filters.partner_id }),
        ...(filters.status && { status: filters.status }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
        ...(filters.min_temperature !== undefined && {
          min_temperature: filters.min_temperature.toString(),
        }),
        ...(filters.max_temperature !== undefined && {
          max_temperature: filters.max_temperature.toString(),
        }),
        ...(filters.min_bsw !== undefined && {
          min_bsw: filters.min_bsw.toString(),
        }),
        ...(filters.max_bsw !== undefined && {
          max_bsw: filters.max_bsw.toString(),
        }),
      });

      const data = await apiClient.get<ProductionEntry[]>(
        `/api/production/entries?${params}`
      );
      setEntries(data);
      // Note: Backend doesn't return total count, so we estimate based on page size
      setTotalItems(
        data.length < pageSize
          ? (page - 1) * pageSize + data.length
          : page * pageSize + 1
      );
    } catch (error: any) {
      console.error("Failed to fetch production entries:", error);
      if (error.response?.status === 401) {
        router.push("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, router, getTenantId]);

  // Fetch statistics
  const fetchStats = React.useCallback(async () => {
    const tenantId = getTenantId();
    if (!tenantId) {
      console.error("No tenant_id available for fetching stats");
      setStatsLoading(false);
      return;
    }

    setStatsLoading(true);
    try {
      const params = new URLSearchParams({
        tenant_id: tenantId,
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      });

      const data = await apiClient.get<ProductionStats[]>(
        `/api/production/stats?${params}`
      );
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch production stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, [filters.start_date, filters.end_date, getTenantId]);

  React.useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFiltersChange = (newFilters: ProductionFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handleRefresh = () => {
    fetchEntries();
    fetchStats();
  };

  const handleEditEntry = (entry: ProductionEntry) => {
    setSelectedEntry(entry);
    setEditModalOpen(true);
  };

  const handleApproveEntry = (entry: ProductionEntry) => {
    setSelectedEntry(entry);
    setApproveModalOpen(true);
  };

  const handleSaveEdit = async (
    entryId: string,
    updates: any,
    editReason: string
  ) => {
    try {
      await apiClient.patch(`/api/production/entries/${entryId}`, {
        ...updates,
        edit_reason: editReason,
      });
      // Refresh entries
      await fetchEntries();
    } catch (error) {
      throw error;
    }
  };

  const handleApprove = async (entryId: string) => {
    try {
      await apiClient.patch(`/api/production/entries/${entryId}`, {
        status: ProductionEntryStatus.APPROVED,
      });
      // Refresh entries
      await fetchEntries();
    } catch (error) {
      throw error;
    }
  };

  const handleReject = async (entryId: string) => {
    try {
      await apiClient.patch(`/api/production/entries/${entryId}`, {
        status: ProductionEntryStatus.REJECTED,
      });
      // Refresh entries
      await fetchEntries();
    } catch (error) {
      throw error;
    }
  };

  // Get filter description for table header
  const getFilterDescription = (): string => {
    if (!filters.start_date && !filters.end_date) {
      return "All Production Entries";
    }

    const now = new Date();
    const startDate = filters.start_date ? new Date(filters.start_date) : null;
    const endDate = filters.end_date ? new Date(filters.end_date) : null;

    // Check if it's current month
    if (
      startDate &&
      endDate &&
      startDate.getMonth() === now.getMonth() &&
      startDate.getFullYear() === now.getFullYear() &&
      startDate.getDate() === 1
    ) {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      if (endDate.getDate() === endOfMonth.getDate()) {
        return "Production Entries for Current Month";
      }
    }

    // Check if it's last 3 months
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    if (
      startDate &&
      endDate &&
      Math.abs(startDate.getTime() - threeMonthsAgo.getTime()) < 86400000
    ) {
      return "Production Entries for the Past 3 Months";
    }

    // Check if it's last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    if (
      startDate &&
      endDate &&
      Math.abs(startDate.getTime() - sixMonthsAgo.getTime()) < 86400000
    ) {
      return "Production Entries for the Past 6 Months";
    }

    // Check if it's last year
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    if (
      startDate &&
      endDate &&
      Math.abs(startDate.getTime() - oneYearAgo.getTime()) < 86400000
    ) {
      return "Production Entries for the Past Year";
    }

    // Custom date range
    if (startDate && endDate) {
      return `Production Entries from ${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} to ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }

    return "Production Entries";
  };

  const getStatusBadge = (status: ProductionEntryStatus) => {
    const styles: Record<ProductionEntryStatus, string> = {
      [ProductionEntryStatus.PENDING]: "bg-yellow-500 text-yellow-50 font-semibold",
      [ProductionEntryStatus.APPROVED]: "bg-green-600 text-green-50 font-semibold",
      [ProductionEntryStatus.PENDING_APPROVAL]: "bg-blue-600 text-blue-50 font-semibold",
      [ProductionEntryStatus.FLAGGED]:
        "bg-orange-600 text-orange-50 font-semibold",
      [ProductionEntryStatus.REJECTED]:
        "bg-red-600 text-red-50 font-semibold",
    };

    const labels: Record<ProductionEntryStatus, string> = {
      [ProductionEntryStatus.PENDING]: "Pending",
      [ProductionEntryStatus.APPROVED]: "Approved",
      [ProductionEntryStatus.PENDING_APPROVAL]: "Pending Approval",
      [ProductionEntryStatus.FLAGGED]: "Flagged",
      [ProductionEntryStatus.REJECTED]: "Rejected",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const columns: Column<ProductionEntry>[] = [
    {
      key: "measurement_date",
      header: "Date",
      sortable: true,
      width: "120px",
      render: (row) =>
        new Date(row.measurement_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      key: "gross_volume",
      header: "Gross Vol. (bbls)",
      sortable: true,
      width: "140px",
      render: (row) => row.gross_volume.toFixed(2),
    },
    {
      key: "net_volume",
      header: "Net Vol. (bbls)",
      sortable: true,
      width: "140px",
      render: (row) =>
        (
          row.gross_volume *
          (1 - row.bsw_percent / 100) *
          row.meter_factor
        ).toFixed(2),
    },
    {
      key: "bsw_percent",
      header: "BSW %",
      sortable: true,
      width: "100px",
      render: (row) => `${row.bsw_percent.toFixed(2)}%`,
    },
    {
      key: "temperature",
      header: "Temp (°F)",
      sortable: true,
      width: "100px",
      render: (row) => row.temperature.toFixed(1),
    },
    {
      key: "api_gravity",
      header: "API Gravity",
      sortable: true,
      width: "110px",
      render: (row) => row.api_gravity.toFixed(2),
    },
    {
      key: "status",
      header: "Status",
      width: "140px",
      render: (row) => getStatusBadge(row.status),
    },
    ...(userRole !== "coordinator"
      ? [
          {
            key: "actions",
            header: "Actions",
            width: "120px",
            render: (row) => (
              <div className="flex gap-2">
                {/* Field operators can edit entries */}
                {userRole === "field_operator" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditEntry(row)}
                    title="Edit Entry"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}

                {/* Partners can approve/reject entries pending approval (after auditor validation) */}
                {userRole === "partner" &&
                  row.status === ProductionEntryStatus.PENDING_APPROVAL && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApproveEntry(row)}
                        title="Approve Changes"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReject(row.id)}
                        title="Reject Changes"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
              </div>
            ),
          } as Column<ProductionEntry>,
        ]
      : []),
  ];

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Production Data
            </h1>
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
              onClick={handleRefresh}
              disabled={loading || statsLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  loading || statsLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCharts(!showCharts)}
            >
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
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
            {userRole === "field_operator" && (
              <Button size="sm" onClick={() => setEntryModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Entry
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Filters */}
          <ProductionFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            showPartnerFilter={userRole === "coordinator"}
            partners={partners}
          />

          {/* Charts */}
          {showCharts && (
            <div className="grid grid-cols-1 ">
              <ProductionLineChart
                data={entries}
                showGrossVolume={chartToggles.showGrossVolume}
                showTemperature={chartToggles.showTemperature}
                showBSW={chartToggles.showBSW}
                onToggleChange={(toggles: {
                  showGrossVolume: boolean;
                  showTemperature: boolean;
                  showBSW: boolean;
                }) => setChartToggles(toggles)}
              />
              <ProductionPieChart stats={stats} loading={statsLoading} />
            </div>
          )}

          {/* Data Table */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {getFilterDescription()}
              </h2>
              {filters.start_date && filters.end_date && (
                <p className="text-sm text-muted-foreground mt-1">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'} found
                </p>
              )}
            </div>
            <DataTable
              data={entries}
              columns={columns}
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              loading={loading}
              emptyMessage="No production entries found. Try adjusting your filters or add a new entry."
            />
          </div>
        </div>
      </div>

      {/* Production Entry Modal */}
      <ProductionEntryModal
        open={entryModalOpen}
        onOpenChange={setEntryModalOpen}
        onSuccess={handleRefresh}
      />

      {/* Edit Entry Modal (Coordinator Only) */}
      <EditEntryModal
        entry={selectedEntry}
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedEntry(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* Approve Entry Modal (Partner Only) */}
      <ApproveEntryModal
        entry={selectedEntry}
        open={approveModalOpen}
        onClose={() => {
          setApproveModalOpen(false);
          setSelectedEntry(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
