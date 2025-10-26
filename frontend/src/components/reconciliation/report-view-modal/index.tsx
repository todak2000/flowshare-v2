"use client";

import { Reconciliation } from "@/types/reconciliation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileTextIcon,
  TableIcon,
  CalculatorIcon,
  TrendingDownIcon,
  UsersIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatMonth,
  formatVolumeMbbls,
} from "@/lib/utils";
import { ALLOCATION_COLUMNS, KeyValueRow, SummaryCard } from "./components";

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
  if (!reconciliation || !reconciliation.result) return null;

  const { result } = reconciliation;

  // --- Totals calculation ---
  const totals = result.partner_allocations.reduce(
    (acc, a) => ({
      grossVolume: acc.grossVolume + a.gross_volume,
      netVolumeStandard: acc.netVolumeStandard + a.net_volume_standard,
      allocatedVolume: acc.allocatedVolume + a.allocated_volume,
      ownershipPercent: acc.ownershipPercent + a.ownership_percent,
    }),
    { grossVolume: 0, netVolumeStandard: 0, allocatedVolume: 0, ownershipPercent: 0 }
  );

  // --- Summary Cards Data ---
  const summaryCards = [
    {
      icon: CalculatorIcon,
      title: "Terminal Volume",
      value: formatVolumeMbbls(reconciliation.terminal_volume),
      unit: "mbbls",
      bgColor: "bg-primary/5",
    },
    {
      icon: UsersIcon,
      title: "Total Allocated",
      value: formatVolumeMbbls(result.total_allocated_volume),
      unit: "mbbls",
      valueColor: "text-green-700 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      icon: TrendingDownIcon,
      title: "Shrinkage",
      value: result.shrinkage_percent.toFixed(2),
      unit: "%",
      valueColor: "text-orange-700 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      extra: `${formatVolumeMbbls(result.shrinkage_volume)} mbbls`,
    },
  ];

  // --- Summary Details Data ---
  const summaryDetails = [
    { label: "Reconciliation ID", value: `${reconciliation.id.slice(0, 8)}...` },
    { label: "Allocation Model", value: result.allocation_model_used },
    { label: "Total Gross Volume", value: `${formatVolumeMbbls(result.total_gross_volume)} mbbls` },
    { label: "Total Net Standard", value: `${formatVolumeMbbls(result.total_net_volume_standard)} mbbls` },
  ];

 
  // --- Render allocation row cell ---
  const renderAllocationCell = (allocation: any, columnKey: string) => {
    switch (columnKey) {
      case "partner":
        return <span className="font-medium">{allocation.partner_name}</span>;
      case "gross":
        return <span className="font-mono text-sm">{formatVolumeMbbls(allocation.gross_volume)}</span>;
      case "bsw":
        return <span className="font-mono text-sm">{allocation.bsw_percent.toFixed(1)}%</span>;
      case "net":
        return <span className="font-mono text-sm">{formatVolumeMbbls(allocation.net_volume_standard)}</span>;
      case "ownership":
        return <span className="font-mono text-sm">{allocation.ownership_percent.toFixed(1)}%</span>;
      case "allocated":
        return (
          <Badge variant="secondary" className="font-mono">
            {formatVolumeMbbls(allocation.allocated_volume)}
          </Badge>
        );
      default:
        return null;
    }
  };

  // --- Render totals row cell ---
  const renderTotalsCell = (columnKey: string) => {
    switch (columnKey) {
      case "partner":
        return <span className="font-bold">TOTAL</span>;
      case "gross":
        return <span className="font-mono text-sm">{formatVolumeMbbls(totals.grossVolume)}</span>;
      case "bsw":
        return <span className="font-mono text-sm">-</span>;
      case "net":
        return <span className="font-mono text-sm">{formatVolumeMbbls(totals.netVolumeStandard)}</span>;
      case "ownership":
        return <span className="font-mono text-sm">{totals.ownershipPercent.toFixed(1)}%</span>;
      case "allocated":
        return (
          <Badge variant="default" className="font-mono font-bold">
            {formatVolumeMbbls(totals.allocatedVolume)}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <CalculatorIcon className="h-6 w-6 text-primary" />
                Reconciliation Report
              </DialogTitle>
              <DialogDescription className="mt-2">
                Month: {formatMonth(reconciliation.period_start)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summaryCards.map((card, i) => (
              <SummaryCard
                key={i}
                icon={card.icon}
                title={card.title}
                value={card.value}
                unit={card.unit}
                valueColor={card.valueColor}
                bgColor={card.bgColor}
              />
            ))}
          </div>

          <Separator />

          {/* Summary Details */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {summaryDetails.map((item, i) => (
                <KeyValueRow key={i} label={item.label} value={item.value} />
              ))}
            </div>
          </div>

          <Separator />

          {/* Partner Allocations */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Partner Allocations
            </h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {ALLOCATION_COLUMNS.map((col) => (
                      <TableHead
                        key={col.key}
                        className={col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : ""}
                      >
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.partner_allocations.map((allocation) => (
                    <TableRow key={allocation.partner_id}>
                      {ALLOCATION_COLUMNS.map((col) => (
                        <TableCell
                          key={col.key}
                          className={
                            col.align === "center"
                              ? "text-center"
                              : col.align === "right"
                              ? "text-right"
                              : ""
                          }
                        >
                          {renderAllocationCell(allocation, col.key)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="border-t-2 border-primary bg-muted/50 font-bold">
                    {ALLOCATION_COLUMNS.map((col) => (
                      <TableCell
                        key={col.key}
                        className={
                          col.align === "center"
                            ? "text-center"
                            : col.align === "right"
                            ? "text-right"
                            : ""
                        }
                      >
                        {renderTotalsCell(col.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Download Actions */}
          <Separator />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onDownloadPDF(reconciliation.id)}>
              <FileTextIcon className="mr-2 h-4 w-4" />
              Download PDF Report
            </Button>
            <Button variant="default" onClick={() => onDownloadCSV(reconciliation.id)}>
              <TableIcon className="mr-2 h-4 w-4" />
              Download Excel Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}