// TerminalReceiptsTable.tsx

import { useState } from "react";
import { TerminalReceipt, PaginationMeta } from "@/types/reconciliation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropletIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // or inline if preferred
import { EmptyState, LoadingState, PaginationControls, ReceiptRow } from "./components";
import { PageLoader } from "@/components/layout/PageLoader";

// --- Main Component ---

const tableColumns = [
  { key: "receiptDate", label: "Receipt Date" },
  { key: "terminalVolume", label: "Terminal Volume" },
  { key: "terminalName", label: "Terminal Name" },
  { key: "operator", label: "Operator" },
  { key: "createdAt", label: "Created At" },
];

interface TerminalReceiptsTableProps {
  receipts: TerminalReceipt[];
  pagination: PaginationMeta;
  loading: boolean;
  onPageChange: (page: number) => void;
  onDelete?: (receiptId: string) => Promise<void>;
  userRole?: string;
}

export function TerminalReceiptsTable({
  receipts,
  pagination,
  loading,
  onPageChange,
  onDelete,
  userRole,
}: TerminalReceiptsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (receiptId: string) => {
    if (
      !onDelete ||
      !window.confirm("Are you sure you want to delete this receipt?")
    )
      return;

    setDeletingId(receiptId);
    try {
      await onDelete(receiptId);
    } catch (error) {
      console.error("Failed to delete receipt:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    <PageLoader />
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
          <LoadingState />
        ) : receipts.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableColumns.map((col) => (
                      <TableHead key={col.key}>{col.label}</TableHead>
                    ))}
                    {userRole === "coordinator" && onDelete && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <ReceiptRow
                      key={receipt.id}
                      receipt={receipt}
                      userRole={userRole}
                      onDelete={handleDelete}
                      isDeleting={deletingId === receipt.id}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationControls
              pagination={pagination}
              onPageChange={onPageChange}
              loading={loading}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
