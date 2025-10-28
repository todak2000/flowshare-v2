"use client";

import { useRef } from "react";
import { Reconciliation } from "@/types/reconciliation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import {
  FileTextIcon,
  TableIcon,
  PrinterIcon,
  X,
} from "lucide-react";
import { PrintReadyReport } from "./print-ready-report";
import { useAuthStore } from "@/store/auth-store";
import { formatMonth } from "@/lib/utils";

interface ReportViewModalProps {
  reconciliation: Reconciliation | null;
  open: boolean;
  onClose: () => void;
  onDownloadPDF: (reconciliationId: string) => void;
  onDownloadCSV: (reconciliationId: string) => void;
}

export function ReportViewModal({
  reconciliation,
  open,
  onClose,
  onDownloadPDF,
  onDownloadCSV,
}: ReportViewModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  if (!reconciliation || !reconciliation.result) return null;

  const handlePrint = () => {
    // Get the report content
    const reportContent = printRef.current;
    if (!reportContent) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the report');
      return;
    }

    // Get the print styles
    const printStyles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.6;
          color: #000;
          background: white;
          counter-reset: page;
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        /* Print Logo Styles */
        .print-logo-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .print-logo-icon-box {
          width: 2.5rem;
          height: 2.5rem;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .print-logo-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: white;
          stroke-width: 2.5;
        }

        .print-logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .report-page {
          position: relative;
          background: white;
          padding: 1.5cm;
          padding-bottom: 2cm;
          min-height: auto;
          max-height: none;
          page-break-after: auto;
          box-sizing: border-box;
        }

        .report-page:last-child {
          page-break-after: auto;
        }

        /* Front page specific - contained, no overflow */
        .front-page {
          max-height: 27cm;
          overflow: hidden;
          page-break-after: always;
          page-break-inside: avoid;
          padding-bottom: 2cm;
        }

        .front-page-content {
          max-height: 100%;
          overflow: visible;
        }

        /* Content pages can flow across multiple pages */
        .content-page {
          page-break-inside: auto;
          page-break-after: auto;
          max-height: none;
          overflow: visible;
        }

        .analysis-page {
          page-break-inside: auto;
          max-height: none;
          overflow: visible;
        }

        /* Analysis Flow Section - flows naturally */
        .analysis-flow-section {
          background: white;
          padding: 2.5rem;
          padding-top: 2rem;
          padding-bottom: 2rem;
          page-break-before: always;
          page-break-inside: auto;
        }

        .analysis-flow-section .section-title {
          margin-top: 0;
          margin-bottom: 1.5rem;
        }

        .analysis-flow-section .analysis-content {
          margin: 0;
          padding: 1.5rem;
        }

        /* In print */
        @media print {
          .analysis-flow-section {
            padding: 1.5cm;
            padding-bottom: 2cm;
          }

          .analysis-flow-section .analysis-content {
            padding: 1.5rem;
          }
        }

        /* Front Page Styles */
        .front-page {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 2px solid #e2e8f0;
        }

        .front-page-content {
          width: 100%;
          max-width: 600px;
          text-align: center;
        }

        .company-header {
          margin-bottom: 2rem;
        }

        .company-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .company-name {
          font-size: 3.5rem;
          font-weight: 800;
          color: #1e40af;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .company-tagline {
          font-size: 1.125rem;
          color: #64748b;
          margin-top: 0.5rem;
          font-weight: 500;
        }

        .report-title-section {
          margin: 1.5rem 0;
        }

        .report-title-line {
          height: 2px;
          background: linear-gradient(to right, transparent, #2563eb, transparent);
          margin: 1rem 0;
        }

        .report-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: 0.05em;
          margin: 0;
        }

        .report-metadata {
          margin: 1.5rem 0;
          text-align: left;
          background: white;
          padding: 1.25rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }

        .metadata-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .metadata-row:last-child {
          border-bottom: none;
        }

        .metadata-label {
          font-weight: 600;
          color: #475569;
        }

        .metadata-value {
          font-weight: 500;
          color: #0f172a;
          font-family: monospace;
        }

        .status-badge {
          background: #dcfce7;
          color: #166534;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .front-page-footer {
          margin-top: 1.5rem;
        }

        .footer-divider {
          height: 1px;
          background: #cbd5e1;
          margin-bottom: 1rem;
        }

        .confidential-notice {
          font-size: 0.875rem;
          color: #64748b;
          font-style: italic;
        }

        /* Content Page Styles */
        .content-page {
          background: white;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          margin-bottom: 2rem;
          border-bottom: 3px solid #2563eb;
        }

        .header-logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1e40af;
        }

        .header-period {
          font-size: 1rem;
          color: #64748b;
          font-weight: 600;
          font-family: monospace;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .summary-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.25rem;
          display: flex;
          gap: 1rem;
          page-break-inside: avoid;
        }

        .card-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-icon svg {
          width: 20px;
          height: 20px;
        }

        .card-icon.primary {
          background: #dbeafe;
          color: #1e40af;
        }

        .card-icon.success {
          background: #dcfce7;
          color: #166534;
        }

        .card-icon.warning {
          background: #fed7aa;
          color: #9a3412;
        }

        .card-content {
          flex: 1;
        }

        .card-label {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .card-value {
          font-size: 1.75rem;
          font-weight: 700;
          font-family: monospace;
          color: #0f172a;
        }

        .card-value.success-text {
          color: #16a34a;
        }

        .card-value.warning-text {
          color: #ea580c;
        }

        .card-unit {
          font-size: 1rem;
          font-weight: 400;
          margin-left: 0.25rem;
          color: #64748b;
        }

        .card-sublabel {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
          font-family: monospace;
        }

        /* Table Styles */
        .table-container {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
        }

        .report-table thead {
          background: #f1f5f9;
        }

        .table-header {
          padding: 0.75rem 1rem;
          font-weight: 600;
          font-size: 0.875rem;
          color: #0f172a;
          text-transform: uppercase;
          border-bottom: 2px solid #cbd5e1;
        }

        .table-row {
          border-bottom: 1px solid #e2e8f0;
        }

        .table-cell {
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
        }

        .totals-row {
          background: #f1f5f9;
          border-top: 2px solid #2563eb;
          font-weight: 700;
        }

        .page-footer {
          display: block;
          padding-top: 1rem;
          margin-top: 2rem;
          border-top: 1px solid #000;
          font-size: 0.75rem;
          color: #64748b;
          page-break-inside: avoid;
        }

        .page-footer::after {
          counter-increment: page;
          content: "Page " counter(page);
          float: right;
        }

        .footer-left {
          float: left;
        }

        .left { text-align: left; }
        .center { text-align: center; }
        .right { text-align: right; }

        .font-mono { font-family: monospace; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .text-sm { font-size: 0.875rem; }

        /* Analysis Content */
        .analysis-content {
          line-height: 1.7;
          font-size: 0.9375rem;
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .analysis-content h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          page-break-after: avoid;
          color: #0f172a;
        }

        .analysis-content h2:first-child {
          margin-top: 0;
        }

        .analysis-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.75rem;
          page-break-after: avoid;
          color: #1e293b;
        }

        .analysis-content p {
          margin: 0.75rem 0;
          orphans: 2;
          widows: 2;
          color: #334155;
        }

        .analysis-content ul,
        .analysis-content ol {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }

        .analysis-content li {
          margin: 0.5rem 0;
          orphans: 2;
          widows: 2;
          color: #334155;
        }

        .analysis-content strong {
          font-weight: 600;
          color: #0f172a;
        }

        /* Report Section */
        .report-section {
          margin-bottom: 1rem;
        }

        .report-section:last-child {
          margin-bottom: 0;
        }

        /* Analysis section MUST break across pages */
        .analysis-section {
          page-break-inside: auto;
          page-break-after: auto;
        }

        /* Avoid breaks in small elements */
        .summary-cards-grid,
        .summary-card,
        .page-header {
          page-break-inside: avoid;
        }

        /* Tables can break but not rows */
        .table-container {
          page-break-inside: auto;
        }

        .table-row {
          page-break-inside: avoid;
        }
      </style>
    `;

    // Write the content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reconciliation Report - ${formatMonth(reconciliation.period_start)}</title>
          ${printStyles}
        </head>
        <body>
          ${reportContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Don't close automatically - let user close after printing
      }, 250);
    };
  };

  // Get organization name from user
  const organizationName = user?.organization || user?.full_name || "FlowShare";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
        <VisuallyHidden>
          <DialogTitle>
            Reconciliation Report - {formatMonth(reconciliation.period_start)}
          </DialogTitle>
        </VisuallyHidden>

        {/* Sticky Action Bar */}
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 px-6 py-4 border-b print:hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={handlePrint}
                className="gap-2"
                size="sm"
              >
                <PrinterIcon className="h-4 w-4" />
                Print / Save as PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadPDF(reconciliation.id)}
              >
                <FileTextIcon className="h-4 w-4 mr-2" />
                Backend PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadCSV(reconciliation.id)}
              >
                <TableIcon className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-slate-100 print:bg-white print:p-0 print:m-0">
          <div className="p-6 print:p-0 print:m-0">
            <PrintReadyReport
              ref={printRef}
              reconciliation={reconciliation}
              organizationName={organizationName}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
