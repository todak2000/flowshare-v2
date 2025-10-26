import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import {
  Reconciliation,
  TerminalReceipt,
  PaginatedTerminalReceipts,
} from "@/types/reconciliation";

const DEFAULT_PAGINATION = {
  current_page: 1,
  page_size: 5,
  total_count: 0,
  total_pages: 0,
  has_next: false,
  has_previous: false,
};

export function useReconciliation(tenantId: string | null) {
  // State for receipts
  const [receipts, setReceipts] = useState<TerminalReceipt[]>([]);
  const [receiptsPagination, setReceiptsPagination] = useState(DEFAULT_PAGINATION);
  const [receiptsLoading, setReceiptsLoading] = useState(false);

  // State for reconciliations
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [reconciliationsLoading, setReconciliationsLoading] = useState(false);

  // --- DATA FETCHING ---

  const fetchTerminalReceipts = useCallback(async (page: number) => {
    if (!tenantId) return;
    try {
      setReceiptsLoading(true);
      const data = await apiClient.get<PaginatedTerminalReceipts>(
        `/api/terminal-receipts?tenant_id=${tenantId}&page=${page}&page_size=5`
      );
      setReceipts(data.data);
      setReceiptsPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch terminal receipts:", error);
    } finally {
      setReceiptsLoading(false);
    }
  }, [tenantId]);

  const fetchReconciliations = useCallback(async () => {
    if (!tenantId) return;
    try {
      setReconciliationsLoading(true);
      const data = await apiClient.get<Reconciliation[]>(
        `/api/reconciliation?tenant_id=${tenantId}&limit=50`
      );
      setReconciliations(data);
    } catch (error) {
      console.error("Failed to fetch reconciliations:", error);
    } finally {
      setReconciliationsLoading(false);
    }
  }, [tenantId]);

  // Initial load effect
  useEffect(() => {
    if (tenantId) {
      fetchTerminalReceipts(1);
      fetchReconciliations();
    }
  }, [tenantId, fetchTerminalReceipts, fetchReconciliations]);

  // --- ACTIONS ---

  const handleSubmitTerminalReceipt = async (data: any) => {
    try {
      await apiClient.post("/api/terminal-receipts", data);
      await fetchTerminalReceipts(1); // Refresh receipts
      
      // Refresh reconciliations after a delay (as in original)
      setTimeout(fetchReconciliations, 1000); 
    } catch (error) {
      console.error("Failed to submit terminal receipt:", error);
      throw error; // Re-throw for the form to catch
    }
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    try {
      await apiClient.delete(`/api/terminal-receipts/${receiptId}`);
      // Refresh the *current* page of receipts
      await fetchTerminalReceipts(receiptsPagination.current_page);
    } catch (error) {
      console.error("Failed to delete receipt:", error);
      throw error;
    }
  };

  return {
    receipts,
    receiptsPagination,
    receiptsLoading,
    reconciliations,
    reconciliationsLoading,
    fetchTerminalReceipts, // For pagination
    handleSubmitTerminalReceipt,
    handleDeleteReceipt,
  };
}