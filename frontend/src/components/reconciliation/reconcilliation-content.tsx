"use client";

import { useState } from "react";
import { useReconciliation } from "@/hooks/useReconciliation";
import { useReportDownloader } from "@/hooks/useReportDownloader";
import { Reconciliation } from "@/types/reconciliation";
import { UserProfile } from "@/store/auth-store"; // Make sure to export this type

// Import all the child components

import { TerminalReceiptForm } from "./terminal-receipt-form";
import { TerminalReceiptsTable } from "./terminal-receipts-table";
import { ReconciliationsTable } from "./reconciliations-table";
import { ReportViewModal } from "./report-view-modal";
import { ReconciliationHeader } from "./reconciliation-header";

interface ReconciliationContentProps {
  currentUser: UserProfile;
  tenantId: string;
}

export const ReconciliationContent: React.FC<ReconciliationContentProps> = ({
  currentUser,
  tenantId,
}) => {
  // 1. All domain logic is called here
  const {
    receipts,
    receiptsPagination,
    receiptsLoading,
    reconciliations,
    reconciliationsLoading,
    fetchTerminalReceipts,
    handleSubmitTerminalReceipt,
    handleDeleteReceipt,
    validationError,
    setValidationError,
  } = useReconciliation(tenantId);

  // 2. Download logic is called here
  const { downloadPDF, downloadCSV } = useReportDownloader();

  // 3. UI state is managed here
  const [showReceiptForm, setShowReceiptForm] = useState(false);

  const [selectedReconciliation, setSelectedReconciliation] =
    useState<Reconciliation | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // 4. Wrapper functions live here
  const handleSubmitWrapper = async (data: any) => {
    try {
      await handleSubmitTerminalReceipt(data);
      setShowReceiptForm(false);
      setValidationError(null); // Clear error on success
      return true; // Return success
    } catch (error: any) {
      console.error("Submission failed, form will stay open", error);
      // Error is already set by the hook, no need to set it again
      return false; // Return failure
    }
  };
  
  const handleViewReport = (reconciliation: Reconciliation) => {
    setSelectedReconciliation(reconciliation);
    setReportModalOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <ReconciliationHeader
        userRole={currentUser.role}
        isFormVisible={showReceiptForm}
        onToggleForm={() => setShowReceiptForm(!showReceiptForm)}
      />

      {currentUser.role === "coordinator" && showReceiptForm && (
        <TerminalReceiptForm
          tenantId={tenantId}
          validationError={validationError}
          setValidationError={setValidationError}
          onSubmit={handleSubmitWrapper}
          onCancel={() => setShowReceiptForm(false)}
        />
      )}

      <TerminalReceiptsTable
        receipts={receipts}
        pagination={receiptsPagination}
        loading={receiptsLoading}
        onPageChange={fetchTerminalReceipts}
        onDelete={
          currentUser.role === "coordinator" ? handleDeleteReceipt : undefined
        }
        userRole={currentUser.role}
      />

      <ReconciliationsTable
        reconciliations={reconciliations}
        loading={reconciliationsLoading}
        onViewReport={handleViewReport}
        onDownloadPDF={downloadPDF}
        onDownloadCSV={downloadCSV}
      />

      <ReportViewModal
        reconciliation={selectedReconciliation}
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onDownloadPDF={downloadPDF}
        onDownloadCSV={downloadCSV}
      />
    </div>
  );
};
