"use client"

import { Reconciliation } from "@/types/reconciliation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  FileTextIcon,
  TableIcon,
  XIcon,
  CalculatorIcon,
  TrendingDownIcon,
  UsersIcon,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ReportViewModalProps {
  reconciliation: Reconciliation | null
  open: boolean
  onClose: () => void
  onDownloadPDF: (reconciliationId: string) => void
  onDownloadCSV: (reconciliationId: string) => void
}

export function ReportViewModal({
  reconciliation,
  open,
  onClose,
  onDownloadPDF,
  onDownloadCSV,
}: ReportViewModalProps) {
  if (!reconciliation || !reconciliation.result) {
    return null
  }

  const { result } = reconciliation

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatVolume = (volume: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(volume)
  }

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
                Period: {formatDate(reconciliation.period_start)} -{" "}
                {formatDate(reconciliation.period_end)}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CalculatorIcon className="h-4 w-4" />
                Terminal Volume
              </div>
              <div className="text-2xl font-bold font-mono">
                {formatVolume(reconciliation.terminal_volume)} <span className="text-sm font-normal">bbls</span>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <UsersIcon className="h-4 w-4" />
                Total Allocated
              </div>
              <div className="text-2xl font-bold font-mono text-green-700 dark:text-green-400">
                {formatVolume(result.total_allocated_volume)} <span className="text-sm font-normal">bbls</span>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingDownIcon className="h-4 w-4" />
                Shrinkage
              </div>
              <div className="text-2xl font-bold font-mono text-orange-700 dark:text-orange-400">
                {result.shrinkage_percent.toFixed(2)} <span className="text-sm font-normal">%</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatVolume(result.shrinkage_volume)} bbls
              </div>
            </div>
          </div>

          <Separator />

          {/* Summary Details */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between p-3 bg-muted/50 rounded">
                <span className="text-muted-foreground">Reconciliation ID:</span>
                <span className="font-mono">{reconciliation.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between p-3 bg-muted/50 rounded">
                <span className="text-muted-foreground">Allocation Model:</span>
                <span className="font-medium">{result.allocation_model_used}</span>
              </div>
              <div className="flex justify-between p-3 bg-muted/50 rounded">
                <span className="text-muted-foreground">Total Gross Volume:</span>
                <span className="font-mono">{formatVolume(result.total_gross_volume)} bbls</span>
              </div>
              <div className="flex justify-between p-3 bg-muted/50 rounded">
                <span className="text-muted-foreground">Total Net Standard:</span>
                <span className="font-mono">{formatVolume(result.total_net_volume_standard)} bbls</span>
              </div>
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
                    <TableHead>Partner</TableHead>
                    <TableHead className="text-right">Gross Volume</TableHead>
                    <TableHead className="text-right">BSW %</TableHead>
                    <TableHead className="text-right">Net Standard</TableHead>
                    <TableHead className="text-right">Ownership %</TableHead>
                    <TableHead className="text-right">Allocated Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.partner_allocations.map((allocation) => (
                    <TableRow key={allocation.partner_id}>
                      <TableCell className="font-medium">
                        {allocation.partner_name}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatVolume(allocation.gross_volume)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {allocation.bsw_percent.toFixed(4)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatVolume(allocation.net_volume_standard)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {allocation.ownership_percent.toFixed(4)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-mono">
                          {formatVolume(allocation.allocated_volume)} bbls
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Download Actions */}
          <Separator />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onDownloadPDF(reconciliation.id)}
            >
              <FileTextIcon className="mr-2 h-4 w-4" />
              Download PDF Report
            </Button>
            <Button
              variant="default"
              onClick={() => onDownloadCSV(reconciliation.id)}
            >
              <TableIcon className="mr-2 h-4 w-4" />
              Download CSV Allocation Table
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
