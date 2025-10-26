import { TerminalReceipt, PaginationMeta } from "@/types/reconciliation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Trash2Icon,
} from "lucide-react";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"; // or inline if preferred
import { formatDate, formatVolume } from "@/lib/utils";

// --- Subcomponents ---

export const EmptyState = () => (
  <div className="text-center py-8 text-muted-foreground">
    No terminal receipts found
  </div>
);

export const LoadingState = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const DeleteButton = ({
  receiptId,
  onDelete,
  isDeleting,
}: {
  receiptId: string;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => onDelete(receiptId)}
    disabled={true} // as per your original disabled state
  >
    {isDeleting ? (
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    ) : (
      <Trash2Icon className="h-4 w-4 text-destructive" />
    )}
  </Button>
);

export const ReceiptRow = ({
  receipt,
  userRole,
  onDelete,
  isDeleting,
}: {
  receipt: TerminalReceipt;
  userRole?: string;
  onDelete?: (id: string) => void;
  isDeleting: boolean;
}) => (
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
        <DeleteButton
          receiptId={receipt.id}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      </TableCell>
    )}
  </TableRow>
);

export const PaginationControls = ({
  pagination,
  onPageChange,
  loading,
}: {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  loading: boolean;
}) => {
  if (pagination.total_pages <= 1) return null;

  const startItem = (pagination.current_page - 1) * pagination.page_size + 1;
  const endItem = Math.min(
    pagination.current_page * pagination.page_size,
    pagination.total_count
  );

  // Helper to render a pagination button
  const renderPaginationButton = (direction: "prev" | "next") => {
    const isPrev = direction === "prev";
    const isDisabled =
      (isPrev ? !pagination.has_previous : !pagination.has_next) || loading;
    const page = isPrev
      ? pagination.current_page - 1
      : pagination.current_page + 1;
    const label = isPrev ? "Previous" : "Next";
    const Icon = isPrev ? ChevronLeftIcon : ChevronRightIcon;
    const iconPosition = isPrev ? "mr-1" : "ml-1";

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page)}
        disabled={isDisabled}
      >
        {isPrev && <Icon className={`h-4 w-4 ${iconPosition}`} />}
        {label}
        {!isPrev && <Icon className={`h-4 w-4 ${iconPosition}`} />}
      </Button>
    );
  };

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {pagination.total_count} results
      </div>
      <div className="flex gap-2">
        {renderPaginationButton("prev")}
        {renderPaginationButton("next")}
      </div>
    </div>
  );
};

