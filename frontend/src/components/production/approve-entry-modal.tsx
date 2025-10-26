"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

import { ProductionEntry } from "@/types/production";
import {
  ApproveEntryModalProps,
  DISPLAY_FIELDS,
} from "./production-modal-wrapper/component";
import { ProductionModalWrapper } from "./production-modal-wrapper";

export function ApproveEntryModal({
  entry,
  open,
  onClose,
  onApprove,
  onReject,
}: ApproveEntryModalProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = async () => {
    try {
      setProcessing(true);
      await onApprove(entry!.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to approve entry");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setProcessing(true);
      await onReject(entry!.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reject entry");
    } finally {
      setProcessing(false);
    }
  };

  if (!entry) return null;

  return (
    <ProductionModalWrapper
      open={open}
      onOpenChange={onClose}
      title={
        <span className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning" />
          Review Entry Changes
        </span>
      }
      description="A coordinator has updated this production entry"
    >
      <div className="space-y-6">
        {entry.edit_reason && (
          <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
            <p className="text-sm font-semibold mb-2">Reason for Edit:</p>
            <p className="text-sm italic">{entry.edit_reason}</p>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-semibold">Updated Entry Details:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DISPLAY_FIELDS.map(({ key, label, format, condition }) => {
              if (condition && !condition(entry)) return null;
              const value = entry[key as keyof ProductionEntry];
              if (value == null && key !== "pressure") return null;
              return (
                <div key={key} className="space-y-1">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="font-medium">{(format as any)(value)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {entry.edited_at && (
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <p>Edited on {new Date(entry.edited_at).toLocaleString()}</p>
          </div>
        )}

        {error && (
          <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleApprove}
            disabled={processing}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {processing ? "Approving..." : "Approve Changes"}
          </Button>
          <Button
            onClick={handleReject}
            disabled={processing}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="mr-2 h-4 w-4" />
            {processing ? "Rejecting..." : "Reject Changes"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          After approval, this entry will be marked as "Approved" and included
          in reconciliation calculations.
        </p>
      </div>
    </ProductionModalWrapper>
  );
}
