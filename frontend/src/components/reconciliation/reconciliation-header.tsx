import React from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

interface ReconciliationHeaderProps {
  userRole: string;
  isFormVisible: boolean;
  onToggleForm: () => void;
}

export const ReconciliationHeader: React.FC<ReconciliationHeaderProps> = ({
  userRole,
  isFormVisible,
  onToggleForm,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Reconciliation</h1>
        <p className="text-muted-foreground">
          Manage terminal receipts and view reconciliation reports
        </p>
      </div>
      {userRole === "coordinator" && (
        <Button onClick={onToggleForm}>
          <PlusIcon className="mr-2 h-4 w-4" />
          {isFormVisible ? "Hide Form" : "Add Terminal Receipt"}
        </Button>
      )}
    </div>
  );
};