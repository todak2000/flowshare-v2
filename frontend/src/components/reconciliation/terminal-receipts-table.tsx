"use client"

import { useState } from "react"
import { TerminalReceipt, PaginationMeta } from "@/types/reconciliation"
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
  ChevronLeftIcon,
  ChevronRightIcon,
  DropletIcon,
  Trash2Icon,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface TerminalReceiptsTableProps {
  receipts: TerminalReceipt[]
  pagination: PaginationMeta
  loading: boolean
  onPageChange: (page: number) => void
  onDelete?: (receiptId: string) => Promise<void>
  userRole?: string
}

export function TerminalReceiptsTable({
  receipts,
  pagination,
  loading,
  onPageChange,
  onDelete,
  userRole,
}: TerminalReceiptsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (receiptId: string) => {
    if (!onDelete || !window.confirm("Are you sure you want to delete this receipt?")) {
      return
    }

    setDeletingId(receiptId)
    try {
      await onDelete(receiptId)
    } catch (error) {
      console.error("Failed to delete receipt:", error)
    } finally {
      setDeletingId(null)
    }
  }

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DropletIcon className="h-5 w-5 text-primary" />
          Terminal Receipts
        </CardTitle>
        <CardDescription>
          Recent terminal volume receipts (showing {pagination.current_page} of{" "}
          {pagination.total_pages} pages)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No terminal receipts found
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt Date</TableHead>
                    <TableHead>Terminal Volume</TableHead>
                    <TableHead>Terminal Name</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Created At</TableHead>
                    {userRole === "coordinator" && onDelete && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">
                        {formatDate(receipt.receipt_date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {formatVolume(receipt.terminal_volume)} bbls
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {receipt.terminal_name || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {receipt.operator_name || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(receipt.created_at)}
                      </TableCell>
                      {userRole === "coordinator" && onDelete && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(receipt.id)}
                            disabled={deletingId === receipt.id}
                          >
                            {deletingId === receipt.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Trash2Icon className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(pagination.current_page - 1) * pagination.page_size + 1} to{" "}
                  {Math.min(
                    pagination.current_page * pagination.page_size,
                    pagination.total_count
                  )}{" "}
                  of {pagination.total_count} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(pagination.current_page - 1)}
                    disabled={!pagination.has_previous || loading}
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(pagination.current_page + 1)}
                    disabled={!pagination.has_next || loading}
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
