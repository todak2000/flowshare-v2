import { forwardRef } from "react";
import { Reconciliation } from "@/types/reconciliation";
import {
  cleanHtmlString,
  formatMonth,
  formatVolumeMbbls,
  formatVolumeMMbbls,
} from "@/lib/utils";
import { ALLOCATION_COLUMNS } from "./components";
import "./print-styles.css";

// Print-friendly static logo component (no router, no interactivity, pure CSS)
const PrintLogo = () => (
  <div className="print-logo-container">
    <div className="print-logo-wrapper">
      <div className="print-logo-icon-box">
        <svg
          className="print-logo-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
      </div>
    </div>
    <span className="print-logo-text">FlowShare</span>
  </div>
);

interface PrintReadyReportProps {
  reconciliation: Reconciliation;
  organizationName?: string;
}

export const PrintReadyReport = forwardRef<
  HTMLDivElement,
  PrintReadyReportProps
>(({ reconciliation, organizationName = "FlowShare" }, ref) => {
  if (!reconciliation || !reconciliation.result) return null;

  const { result } = reconciliation;

  // Client-side shrinkage calculation fallback
  const actualShrinkageVolume =
    result.shrinkage_volume === 0
      ? result.total_gross_volume - result.total_allocated_volume
      : result.shrinkage_volume;

  const actualShrinkagePercent =
    result.shrinkage_percent === 0 && result.total_gross_volume > 0
      ? (actualShrinkageVolume / result.total_gross_volume) * 100
      : result.shrinkage_percent;

  // Calculate totals
  const totals = result.partner_allocations.reduce(
    (acc, a) => {
      const partnerShrinkage = a.gross_volume - a.allocated_volume;
      return {
        grossVolume: acc.grossVolume + a.gross_volume,
        allocatedVolume: acc.allocatedVolume + a.allocated_volume,
        shrinkageVolume: acc.shrinkageVolume + partnerShrinkage,
        ownershipPercent: acc.ownershipPercent + a.ownership_percent,
      };
    },
    {
      grossVolume: 0,
      allocatedVolume: 0,
      shrinkageVolume: 0,
      ownershipPercent: 0,
    }
  );

  const renderAllocationCell = (allocation: any, columnKey: string) => {
    switch (columnKey) {
      case "partner":
        return <span className="font-medium">{allocation.partner_name}</span>;
      case "gross":
        return (
          <span className="font-mono text-sm">
            {formatVolumeMbbls(allocation.gross_volume)}
          </span>
        );
      case "bsw":
        return (
          <span className="font-mono text-sm">
            {allocation.bsw_percent.toFixed(1)}%
          </span>
        );
      case "ownership":
        return (
          <span className="font-mono text-sm">
            {allocation.ownership_percent.toFixed(1)}%
          </span>
        );
      case "allocated":
        return (
          <span className="font-mono text-sm font-semibold">
            {formatVolumeMbbls(allocation.allocated_volume)}
          </span>
        );
      case "shrinkage":
        const partnerShrinkage =
          allocation.gross_volume - allocation.allocated_volume;
        return (
          <span className="font-mono text-sm">
            {formatVolumeMbbls(partnerShrinkage)}
          </span>
        );
      default:
        return null;
    }
  };

  const renderTotalsCell = (columnKey: string) => {
    switch (columnKey) {
      case "partner":
        return <span className="font-bold">TOTAL</span>;
      case "gross":
        return (
          <span className="font-mono text-sm">
            {formatVolumeMbbls(totals.grossVolume)}
          </span>
        );
      case "bsw":
        return <span className="font-mono text-sm">-</span>;
      case "ownership":
        return (
          <span className="font-mono text-sm">
            {totals.ownershipPercent.toFixed(1)}%
          </span>
        );
      case "allocated":
        return (
          <span className="font-mono text-sm font-bold">
            {formatVolumeMbbls(totals.allocatedVolume)}
          </span>
        );
      case "shrinkage":
        return (
          <span className="font-mono text-sm font-bold">
            {formatVolumeMbbls(totals.shrinkageVolume)}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={ref} className="print-report">
      {/* Front Page */}
      <div className="report-page front-page">
        <div className="front-page-content">
          {/* Logo and Company Name */}
          <div className="company-header">
            <div className="company-logo">
              <PrintLogo />
            </div>

            <p className="company-tagline">
              Oil & Gas Production Reconciliation Platform
            </p>
          </div>

          {/* Report Title */}
          <div className="report-title-section">
            <div className="report-title-line"></div>
            <p className="company-tagline">
              {organizationName}
            </p>
            <h2 className="report-title">RECONCILIATION REPORT</h2>
            <div className="report-title-line"></div>
          </div>

          {/* Report Metadata */}
          <div className="report-metadata">
            <div className="metadata-row">
              <span className="metadata-label">Report Period:</span>
              <span className="metadata-value">
                {formatMonth(reconciliation.period_start)}
              </span>
            </div>
            <div className="metadata-row">
              <span className="metadata-label">Report ID:</span>
              <span className="metadata-value">
                {reconciliation.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="metadata-row">
              <span className="metadata-label">Generated Date:</span>
              <span className="metadata-value">
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="metadata-row">
              <span className="metadata-label">Status:</span>
              <span className="metadata-value status-badge">
                {reconciliation.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="front-page-footer">
            <div className="footer-divider"></div>
            <p className="confidential-notice">
              CONFIDENTIAL - This report contains proprietary information
            </p>
          </div>
        </div>
      </div>

      {/* Main Report Content */}
      <div className="report-page content-page">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-left">
            <PrintLogo />
          </div>
          <div className="header-right">
            <span className="header-period">
              {formatMonth(reconciliation.period_start)}
            </span>
          </div>
        </div>

        {/* Summary Statistics */}
        <section className="report-section">
          <h2 className="section-title">Production Summary</h2>
          <div className="summary-cards-grid">
            <div className="summary-card">
              <div className="card-icon primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <div className="card-content">
                <div className="card-label">Total Gross Volume</div>
                <div className="card-value">
                  {formatVolumeMMbbls(result.total_gross_volume)}
                  <span className="card-unit">mmbbls</span>
                </div>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon success">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="card-content">
                <div className="card-label">Total Allocated</div>
                <div className="card-value success-text">
                  {formatVolumeMMbbls(result.total_allocated_volume)}
                  <span className="card-unit">mmbbls</span>
                </div>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon warning">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <div className="card-content">
                <div className="card-label">Shrinkage</div>
                <div className="card-value warning-text">
                  {actualShrinkagePercent.toFixed(2)}
                  <span className="card-unit">%</span>
                </div>
                <div className="card-sublabel">
                  {formatVolumeMMbbls(actualShrinkageVolume)} mmbbls
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Allocations Table */}
        <section className="report-section">
          <h2 className="section-title">Partner Allocations</h2>
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  {ALLOCATION_COLUMNS.map((col) => (
                    <th key={col.key} className={`table-header ${col.align}`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.partner_allocations.map((allocation) => (
                  <tr key={allocation.partner_id} className="table-row">
                    {ALLOCATION_COLUMNS.map((col) => (
                      <td key={col.key} className={`table-cell ${col.align}`}>
                        {renderAllocationCell(allocation, col.key)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="table-row totals-row">
                  {ALLOCATION_COLUMNS.map((col) => (
                    <td key={col.key} className={`table-cell ${col.align}`}>
                      {renderTotalsCell(col.key)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Page Footer */}
        <div className="page-footer">
          <div className="footer-left">FlowShare Reconciliation Report</div>
        </div>
      </div>

      {/* AI Analysis Section (if exists) - Flows across multiple pages naturally */}
      {reconciliation.ai_analysis && (
        <div className="analysis-flow-section">
          <h2 className="section-title">Comprehensive Analysis</h2>
          <div
            className="analysis-content"
            dangerouslySetInnerHTML={{
              __html: cleanHtmlString(reconciliation.ai_analysis),
            }}
          />
        </div>
      )}
    </div>
  );
});

PrintReadyReport.displayName = "PrintReadyReport";
