// components/StatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import { ReconciliationStatus } from "@/types/reconciliation";
import { Button, ButtonProps } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface ActionButtonProps extends ButtonProps {
  icon: LucideIcon;
  title: string;
}
export const StatusBadge = ({ status }: { status: ReconciliationStatus }) => {
  switch (status) {
    case ReconciliationStatus.COMPLETED:
      return <Badge variant="default" className="bg-green-600">Completed</Badge>;
    case ReconciliationStatus.PROCESSING:
      return <Badge variant="secondary">Processing</Badge>;
    case ReconciliationStatus.PENDING:
      return <Badge variant="outline">Pending</Badge>;
    case ReconciliationStatus.FAILED:
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};


// components/ActionButton.tsx
export const ActionButton = ({ icon: Icon, title, ...props }: ActionButtonProps) => (
  <Button variant="ghost" size="sm" title={title} {...props}>
    <Icon className="h-4 w-4" />
  </Button>
);

export const TABLE_COLUMNS = [
  { key: "month", label: "Month" },
  { key: "terminal_volume", label: "Terminal Volume" },
  { key: "status", label: "Status" },
  { key: "allocated", label: "Allocated" },
  { key: "shrinkage", label: "Shrinkage" },
  { key: "completed_at", label: "Completed At" },
  { key: "actions", label: "Actions", align: "right" as const },
];