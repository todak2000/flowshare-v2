import { useState } from "react";
import { apiClient } from "@/lib/api-client";

type DownloadStatus = "idle" | "downloading" | "error";

export function useReportDownloader() {
  const [pdfStatus, setPdfStatus] = useState<DownloadStatus>("idle");
  const [csvStatus, setCsvStatus] = useState<DownloadStatus>("idle");

  const downloadFile = async (
    url: string,
    filename: string,
    setStatus: (status: DownloadStatus) => void
  ) => {
    setStatus("downloading");
    try {
      const authHeaders = await apiClient.getAuthHeaders();
      const response = await fetch(url, { headers: authHeaders });

      if (!response.ok) throw new Error("File download failed");

      const blob = await response.blob();
      const href = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(href);
      document.body.removeChild(a);
      setStatus("idle");
    } catch (error) {
      console.error("Failed to download file:", error);
      setStatus("error");
    }
  };

  const handleDownloadPDF = (reconciliationId: string) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/reconciliation/${reconciliationId}/export/pdf`;
    downloadFile(url, `reconciliation_${reconciliationId}.pdf`, setPdfStatus);
  };

  const handleDownloadCSV = (reconciliationId: string) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/reconciliation/${reconciliationId}/export/excel`;
    downloadFile(url, `reconciliation_${reconciliationId}.xlsx`, setCsvStatus);
  };

  return {
    downloadPDF: handleDownloadPDF,
    downloadCSV: handleDownloadCSV,
    downloadingPDF: pdfStatus === "downloading",
    downloadingCSV: csvStatus === "downloading",
  };
}