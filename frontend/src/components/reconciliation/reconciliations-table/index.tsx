"use client";

import { Reconciliation, ReconciliationStatus } from "@/types/reconciliation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalculatorIcon, EyeIcon, FileTextIcon, TableIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatDate, formatMonth, formatVolume } from "@/lib/utils";
import { ActionButton, StatusBadge, TABLE_COLUMNS } from "./components";
import { PageLoader } from "@/components/layout/PageLoader";

interface ReconciliationsTableProps {
  reconciliations: Reconciliation[];
  loading: boolean;
  onViewReport: (reconciliation: Reconciliation) => void;
  onDownloadPDF: (reconciliationId: string) => void;
  onDownloadCSV: (reconciliationId: string) => void;
}

export function ReconciliationsTable({
  reconciliations,
  loading,
  onViewReport,
  onDownloadPDF,
  onDownloadCSV,
}: ReconciliationsTableProps) {
  // --- Render cell based on column and row ---
  const renderCell = (reconciliation: Reconciliation, columnKey: string) => {
    switch (columnKey) {
      case "month":
        return (
          <span className="font-medium">
            {formatMonth(reconciliation.period_start)}
          </span>
        );

      case "terminal_volume":
        return (
          <Badge variant="secondary" className="font-mono">
            {formatVolume(reconciliation.terminal_volume)} bbls
          </Badge>
        );

      case "status":
        return <StatusBadge status={reconciliation.status} />;

      case "allocated":
        return reconciliation.result ? (
          <span className="font-mono text-sm">
            {formatVolume(reconciliation.result.total_allocated_volume)} bbls
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );

      case "shrinkage":
        return reconciliation.result ? (
          <span className="font-mono text-sm text-orange-600">
            {reconciliation.result.shrinkage_percent.toFixed(2)}%
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );

      case "completed_at":
        return reconciliation.completed_at ? (
          <span className="text-sm text-muted-foreground">
            {formatDate(reconciliation.completed_at)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );

      case "actions":
        return reconciliation.status === ReconciliationStatus.COMPLETED ? (
          <div className="flex justify-end gap-2">
            <ActionButton
              icon={EyeIcon}
              title="View Report"
              onClick={() => onViewReport(reconciliation)}
            />
            <ActionButton
              icon={FileTextIcon}
              title="Download PDF Report"
              onClick={() => onDownloadPDF(reconciliation.id)}
            />
            <ActionButton
              icon={TableIcon}
              title="Download CSV Allocation Table"
              onClick={() => onDownloadCSV(reconciliation.id)}
            />
          </div>
        ) : null;

      default:
        return null;
    }
  };

  if (loading) {
    <PageLoader />;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalculatorIcon className="h-5 w-5 text-primary" />
          Reconciliation Runs
        </CardTitle>
        <CardDescription>Reconciliation history and reports</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : reconciliations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No reconciliations found. Submit a terminal receipt to trigger a
            reconciliation.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {TABLE_COLUMNS.map((col) => (
                    <TableHead
                      key={col.key}
                      className={col.align === "right" ? "text-right" : ""}
                    >
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliations.map((reconciliation) => (
                  <TableRow key={reconciliation.id}>
                    {TABLE_COLUMNS.map((col) => (
                      <TableCell
                        key={col.key}
                        className={col.align === "right" ? "text-right" : ""}
                      >
                        {renderCell(reconciliation, col.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
