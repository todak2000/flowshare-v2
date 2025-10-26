"use client"

import { Reconciliation, ReconciliationStatus } from "@/types/reconciliation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CalculatorIcon,
  EyeIcon,
  FileTextIcon,
  TableIcon,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ReconciliationsTableProps {
  reconciliations: Reconciliation[]
  loading: boolean
  onViewReport: (reconciliation: Reconciliation) => void
  onDownloadPDF: (reconciliationId: string) => void
  onDownloadCSV: (reconciliationId: string) => void
}

export function ReconciliationsTable({
  reconciliations,
  loading,
  onViewReport,
  onDownloadPDF,
  onDownloadCSV,
}: ReconciliationsTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
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

  const getStatusBadge = (status: ReconciliationStatus) => {
    switch (status) {
      case ReconciliationStatus.COMPLETED:
        return <Badge variant="default" className="bg-green-600">Completed</Badge>
      case ReconciliationStatus.PROCESSING:
        return <Badge variant="secondary">Processing</Badge>
      case ReconciliationStatus.PENDING:
        return <Badge variant="outline">Pending</Badge>
      case ReconciliationStatus.FAILED:
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalculatorIcon className="h-5 w-5 text-primary" />
          Reconciliation Runs
        </CardTitle>
        <CardDescription>
          Reconciliation history and reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : reconciliations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No reconciliations found. Submit a terminal receipt to trigger a reconciliation.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Terminal Volume</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Shrinkage</TableHead>
                  <TableHead>Completed At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliations.map((reconciliation) => (
                  <TableRow key={reconciliation.id}>
                    <TableCell className="font-medium">
                      {formatDate(reconciliation.period_start)} -{" "}
                      {formatDate(reconciliation.period_end)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {formatVolume(reconciliation.terminal_volume)} bbls
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(reconciliation.status)}</TableCell>
                    <TableCell>
                      {reconciliation.result ? (
                        <span className="font-mono text-sm">
                          {formatVolume(reconciliation.result.total_allocated_volume)} bbls
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {reconciliation.result ? (
                        <span className="font-mono text-sm text-orange-600">
                          {reconciliation.result.shrinkage_percent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {reconciliation.completed_at ? (
                        formatDate(reconciliation.completed_at)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {reconciliation.status === ReconciliationStatus.COMPLETED && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewReport(reconciliation)}
                              title="View Report"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDownloadPDF(reconciliation.id)}
                              title="Download PDF Report"
                            >
                              <FileTextIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDownloadCSV(reconciliation.id)}
                              title="Download CSV Allocation Table"
                            >
                              <TableIcon className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
