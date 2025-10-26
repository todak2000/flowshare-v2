import * as React from "react";
import { apiClient } from "@/lib/api-client";
import { UserProfile } from "@/store/auth-store";
import {
  ProductionEntry,
  ProductionFilters,
  ProductionStats,
  ProductionEntryStatus,
} from "@/types/production";

// --- Helper to format date ---
const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Hook Definition ---
export function useProductionData(user: UserProfile) {
  // --- Data State ---
  const [entries, setEntries] = React.useState<ProductionEntry[]>([]);
  const [stats, setStats] = React.useState<ProductionStats[]>([]);
  const [partners, setPartners] = React.useState<Array<{ id: string; name: string; organization?: string }>>([]);
  
  // --- Loading State ---
  const [loading, setLoading] = React.useState(true);
  const [statsLoading, setStatsLoading] = React.useState(true);

  // --- Pagination State (respecting your component) ---
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(31); // Your 31-day default
  const [totalItems, setTotalItems] = React.useState(0);

  // --- Filter State ---
  const [filters, setFilters] = React.useState<ProductionFilters>(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start_date: formatLocalDate(startDate),
      end_date: formatLocalDate(endDate),
    };
  });

  // --- Derived State ---
  const [hasTodayEntry, setHasTodayEntry] = React.useState(false);

  const tenantId = user.tenant_ids[0];
  const userRole = user.role;

  // --- Data Fetching Functions ---

  const fetchPartners = React.useCallback(async () => {
    if (userRole !== "coordinator" || !tenantId) return;
    try {
      const data = await apiClient.get<any[]>(`/api/partners?tenant_id=${tenantId}`);
      const mappedPartners = data
        .filter((p) => p.role === "partner")
        .map((p) => ({
          id: p.id,
          name: p.full_name || p.name,
          organization: p.organization,
        }));
      setPartners(mappedPartners);
    } catch (error) {
      console.error("Failed to fetch partners:", error);
    }
  }, [userRole, tenantId]);

  const fetchEntries = React.useCallback(async () => {
    if (!tenantId) return;
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
        // ... (add other filters like min/max temp if needed) ...
      });

      const data = await apiClient.get<{
        entries: ProductionEntry[];
        total: number;
        page: number;
        page_size: number;
      }>(`/api/production/entries?${params}`);

      setEntries(data.entries);
      setTotalItems(data.total);

      // Check for today's entry
      if (userRole === "field_operator" && user.partner_id) {
        const todayStr = formatLocalDate(new Date());
        const todayEntry = data.entries.find(entry => {
          const entryDate = new Date(entry.measurement_date);
          const entryDateStr = formatLocalDate(entryDate);
          return entryDateStr === todayStr && entry.partner_id === user.partner_id;
        });
        setHasTodayEntry(!!todayEntry);
      }
    } catch (error) {
      console.error("Failed to fetch production entries:", error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, tenantId, userRole, user.partner_id]);

  const fetchStats = React.useCallback(async () => {
    if (!tenantId) return;
    setStatsLoading(true);
    try {
      const params = new URLSearchParams({
        tenant_id: tenantId,
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      });
      const data = await apiClient.get<ProductionStats[]>(`/api/production/stats?${params}`);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch production stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, [filters.start_date, filters.end_date, tenantId]);

  // --- Effects to trigger fetching ---
  React.useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  React.useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // --- Action Handlers ---

  const handleFiltersChange = (newFilters: ProductionFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset page on filter change
  };

  const handleRefresh = () => {
    fetchEntries();
    fetchStats();
  };

  const handleSaveEdit = async (entryId: string, updates: any, editReason: string) => {
    await apiClient.patch(`/api/production/entries/${entryId}`, {
      ...updates,
      edit_reason: editReason,
    });
    await fetchEntries(); // Refresh
  };

  const handleApprove = async (entryId: string) => {
    await apiClient.patch(`/api/production/entries/${entryId}`, {
      status: ProductionEntryStatus.APPROVED,
    });
    await fetchEntries(); // Refresh
  };

  const handleReject = async (entryId: string) => {
    await apiClient.patch(`/api/production/entries/${entryId}`, {
      status: ProductionEntryStatus.REJECTED,
    });
    await fetchEntries(); // Refresh
  };

  // --- Return all state and handlers ---
  return {
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
  };
}